"use client";

import type {
  TransitionCharacter,
  TransitionDestination,
} from "@/lib/page-transition";
import type { ReactNode } from "react";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import PageTransitionScene from "./page-transition-scene";

import { assetPath } from "@/lib/asset-path";
import { transitionSprites } from "@/lib/page-transition";

type NavigationOptions = {
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean | null;
};
type Phase = "playing" | "waiting" | "leaving";
type Journey = {
  id: number;
  destination: TransitionDestination;
  options: NavigationOptions;
  sourcePath: string;
  phase: Phase;
  navigated: boolean;
  arrived: boolean;
  previousFocus: HTMLElement | null;
};
type Scene = {
  id: number;
  character: TransitionCharacter;
  label: string;
  phase: Phase;
};
const PageTransitionContext = createContext<{
  prepare: (character: TransitionCharacter) => void;
  navigate: (
    destination: TransitionDestination,
    options: NavigationOptions,
  ) => boolean;
} | null>(null);

export const usePageTransition = () => useContext(PageTransitionContext);

/** Persists across routes so the drawn sequence survives the page swap. */
export default function PageTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const content = useRef<HTMLDivElement>(null);
  const active = useRef<Journey | null>(null);
  const ready = useRef(new Set<TransitionCharacter>());
  const loading = useRef(new Map<TransitionCharacter, Promise<void>>());
  const timers = useRef(new Set<number>());
  const serial = useRef(0);
  const [scene, setScene] = useState<Scene | null>(null);

  const later = useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, delay);

    timers.current.add(timer);
  }, []);

  const finish = useCallback((focusDestination = true) => {
    const journey = active.current;

    active.current = null;
    timers.current.forEach(window.clearTimeout);
    timers.current.clear();
    content.current?.removeAttribute("inert");
    setScene(null);
    if (focusDestination && journey?.arrived) {
      const hash = window.location.hash;
      let target: HTMLElement | null = null;

      try {
        target = hash
          ? document.getElementById(decodeURIComponent(hash.slice(1)))
          : null;
      } catch {
        /* A malformed fragment still gets the page's normal focus target. */
      }
      (target ?? document.getElementById("main-content"))?.focus({
        preventScroll: true,
      });
    } else if (journey?.previousFocus?.isConnected) {
      journey.previousFocus.focus({ preventScroll: true });
    }
  }, []);

  const reveal = useCallback(() => {
    const journey = active.current;

    if (!journey || journey.phase === "leaving") return;
    journey.phase = "leaving";
    setScene((value) => value && { ...value, phase: "leaving" });
    // CSS callbacks may be lost when a tab is hidden or motion settings change.
    later(() => finish(), 500);
  }, [finish, later]);

  const prepare = useCallback((character: TransitionCharacter) => {
    if (
      loading.current.has(character) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const promise = Promise.all(
      transitionSprites[character].map(async (src) => {
        const image = new window.Image();

        image.src = assetPath(src);
        await image.decode();
      }),
    )
      .then(() => {
        ready.current.add(character);
      })
      .catch(() => {
        // A missing/undecodable sprite must never interfere with a normal Link.
        loading.current.delete(character);
      });

    loading.current.set(character, promise);
  }, []);

  const navigate = useCallback(
    (destination: TransitionDestination, options: NavigationOptions) => {
      if (active.current) return true;
      if (
        document.hidden ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return false;
      if (!ready.current.has(destination.character)) {
        prepare(destination.character);
        return false;
      }
      const journey: Journey = {
        id: ++serial.current,
        destination,
        options,
        sourcePath: pathname,
        phase: "playing",
        navigated: false,
        arrived: false,
        previousFocus:
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null,
      };

      active.current = journey;
      content.current?.setAttribute("inert", "");
      setScene({ id: journey.id, ...destination, phase: "playing" });
      if (options.prefetch !== false) router.prefetch(destination.href);
      // A cancelled route or interrupted scene always gives the page back.
      later(() => finish(), 1500);
      return true;
    },
    [finish, later, pathname, prepare, router],
  );

  const commitNavigation = useCallback(() => {
    const journey = active.current;

    if (!journey || journey.navigated) return;
    journey.navigated = true;
    journey.phase = "waiting";
    setScene((value) => value && { ...value, phase: "waiting" });
    // Finish the blur promptly, including when the next page is still loading.
    later(reveal, 40);
    startTransition(() => {
      const navigateRoute = journey.options.replace
        ? router.replace
        : router.push;

      navigateRoute(journey.destination.href, {
        scroll: journey.options.scroll ?? true,
      });
    });
  }, [later, reveal, router]);

  useEffect(() => {
    const journey = active.current;

    // A previous slow request may resolve during this character's action.
    // Keep the latest explicit click; history cancellation is handled below.
    if (!journey?.navigated || pathname === journey.sourcePath) return;
    journey.arrived = true;
  }, [pathname]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      (Object.keys(transitionSprites) as TransitionCharacter[]).forEach(
        prepare,
      );
    }, 150);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const skip = () => {
      if (!active.current) return;
      if (!active.current.navigated) commitNavigation();
      finish(false);
    };
    const visibility = () => {
      if (document.hidden) skip();
    };
    const historyChanged = () => finish(false);
    const motionChanged = () => {
      if (motion.matches) skip();
      else
        (Object.keys(transitionSprites) as TransitionCharacter[]).forEach(
          prepare,
        );
    };

    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", motionChanged);
    window.addEventListener("popstate", historyChanged);
    return () => {
      window.clearTimeout(timer);
      timers.current.forEach(window.clearTimeout);
      content.current?.removeAttribute("inert");
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", motionChanged);
      window.removeEventListener("popstate", historyChanged);
    };
  }, [commitNavigation, finish, prepare]);

  const context = useMemo(() => ({ prepare, navigate }), [navigate, prepare]);

  return (
    <PageTransitionContext.Provider value={context}>
      <div
        ref={content}
        aria-busy={scene ? true : undefined}
        style={{ display: "contents" }}
      >
        {children}
      </div>
      {scene && (
        <PageTransitionScene
          key={scene.id}
          character={scene.character}
          label={scene.label}
          phase={scene.phase}
          onComplete={finish}
          onNavigate={commitNavigation}
        />
      )}
    </PageTransitionContext.Provider>
  );
}
