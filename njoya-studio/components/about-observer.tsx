"use client";

import type { ObserverCharacterHandle } from "./observer-character";
import type {
  ObserverAnimation,
  ObserverRoute,
  ObserverRouteSegment,
} from "@/lib/observer-route";

import { useCallback, useEffect, useRef } from "react";

import ObserverCharacter from "./observer-character";
import styles from "./about-observer.module.css";

import { assetPath } from "@/lib/asset-path";
import { buildObserverRoute, sampleObserverRoute } from "@/lib/observer-route";

const SHEETS: Record<ObserverAnimation, string> = {
  down: "/media/motion/observer-walk-down.webp",
  left: "/media/motion/observer-walk-left.webp",
  right: "/media/motion/observer-walk-right.webp",
  jump: "/media/motion/observer-jump.webp",
};
const FOOT = 184 / 192;
const JUMP_DURATION = 760;
const clamp = (value: number, low: number, high: number) =>
  Math.max(low, Math.min(high, value));

/** Real walking and jump frames follow the page's rails and divider crossings. */
export default function AboutObserver() {
  const rootRef = useRef<HTMLSpanElement>(null);
  const sheetRef = useRef<HTMLSpanElement>(null);
  const characterRef = useRef<ObserverCharacterHandle>(null);
  const readyRef = useRef(false);
  const syncRef = useRef<(() => void) | null>(null);
  const onReady = useCallback((ready: boolean) => {
    readyRef.current = ready;
    syncRef.current?.();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const sheet = sheetRef.current;
    const page = root?.closest<HTMLElement>(".about-page");
    const content = page?.querySelector<HTMLElement>(".about-content");
    const introduction = page?.querySelector<HTMLElement>(".studio-biography");

    if (!root || !sheet || !page || !content || !introduction) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compact = window.matchMedia("(max-width: 767px)");
    let disposed = false;
    let assetsReady = false;
    let assetFailed = false;
    let frame: number | undefined;
    let route: ObserverRoute;
    let width = 96;
    let height = 144;
    let pageLeft = 0;
    let pageTop = 0;
    let pageBottom = 0;
    let topEdge = 0;
    let bottomEdge = window.innerHeight;
    let viewportWidth = window.innerWidth;
    let currentScroll = window.scrollY;
    let targetScroll = window.scrollY;
    let lastTime = 0;
    let gait = 0;
    let blinkPlaying = false;
    let lastAnimation: ObserverAnimation | undefined;
    let lastSpriteFrame = -1;
    let lastSegment = "";
    let jump:
      | { segment: ObserverRouteSegment; sign: number; started: number }
      | undefined;
    let consumedJump:
      | { segment: ObserverRouteSegment; landing: number }
      | undefined;
    const images: HTMLImageElement[] = [];

    const stopFrame = () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      frame = undefined;
      lastTime = 0;
      root.style.removeProperty("will-change");
    };
    const blink = (playing: boolean) => {
      const next = playing && readyRef.current;

      if (next === blinkPlaying) return;
      blinkPlaying = next;
      if (next) characterRef.current?.play();
      else characterRef.current?.pause();
    };
    const setMode = (mode: "idle" | "sprite") => {
      root.dataset.mode = mode;
      blink(mode === "idle" && !document.hidden && !motion.matches);
    };
    const drawSprite = (animation: ObserverAnimation, index: number) => {
      if (animation !== lastAnimation) {
        sheet.style.backgroundImage = `url("${assetPath(SHEETS[animation])}")`;
        lastAnimation = animation;
      }
      if (index !== lastSpriteFrame) {
        sheet.style.transform = `translate3d(${-index * 12.5}%, 0, 0)`;
        lastSpriteFrame = index;
      }
      setMode("sprite");
    };
    const pageVisible = () =>
      pageBottom > window.scrollY + topEdge &&
      pageTop < window.scrollY + bottomEdge;
    const drawPosition = (x: number, y: number, lift = 0, fixed = true) => {
      const foot = height * FOOT;
      const center = clamp(x, width / 2 + 6, window.innerWidth - width / 2 - 6);
      const screenFoot = fixed
        ? clamp(
            y - window.scrollY,
            topEdge + foot + lift,
            bottomEdge - height + foot,
          )
        : y - pageTop;
      root.dataset.static = String(!fixed);
      root.style.transform = `translate3d(${center - width / 2 - (fixed ? 0 : pageLeft)}px, ${screenFoot - foot - lift}px, 0)`;
    };
    const drawStill = () => {
      const point = route.start;
      const inView =
        point.y - window.scrollY > topEdge &&
        point.y - height - window.scrollY < bottomEdge;

      root.dataset.hidden = String(document.hidden || !pageVisible());
      drawPosition(point.x, point.y, 0, false);
      setMode("idle");
      blink(!motion.matches && inView && !document.hidden);
    };
    const measureViewport = () => {
      const header = document.querySelector<HTMLElement>(".studio-header");
      const navigation =
        document.querySelector<HTMLElement>(".studio-navigation");
      const navigationBounds = navigation?.getBoundingClientRect();

      topEdge = Math.max(0, header?.getBoundingClientRect().bottom ?? 0) + 8;
      bottomEdge = Math.min(
        window.innerHeight - 8,
        navigationBounds?.height && navigationBounds.top > topEdge
          ? navigationBounds.top - 8
          : window.innerHeight - 8,
      );
    };
    const measure = () => {
      const scroll = window.scrollY;
      const pageBounds = page.getBoundingClientRect();
      const contentBounds = content.getBoundingClientRect();
      const introBounds = introduction.getBoundingClientRect();
      const copyBounds = introduction
        .querySelector<HTMLElement>(".biography-copy")
        ?.getBoundingClientRect();
      const newsletter = page.querySelector<HTMLElement>(".newsletter-section");
      const gap = compact.matches ? 10 : 20;

      viewportWidth = window.innerWidth;
      width = root.offsetWidth;
      height = root.offsetHeight;
      pageLeft = pageBounds.left;
      pageTop = pageBounds.top + scroll;
      pageBottom = pageBounds.bottom + scroll;
      measureViewport();
      route = buildObserverRoute({
        startY: copyBounds
          ? copyBounds.top + scroll + Math.min(copyBounds.height, height * FOOT)
          : introBounds.top + scroll + height * FOOT,
        endY: newsletter
          ? newsletter.getBoundingClientRect().bottom + scroll - 8
          : pageBottom - 16,
        dividerYs: Array.from(
          page.querySelectorAll<HTMLElement>(".about-gradient-divider"),
          (divider) => {
            const bounds = divider.getBoundingClientRect();

            return bounds.top + scroll + bounds.height / 2;
          },
        ),
        leftX: contentBounds.left - gap - width / 2,
        rightX: contentBounds.right + gap + width / 2,
        viewportHeight: Math.max(1, bottomEdge - topEdge),
        maxScroll: Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight,
        ),
      });
    };
    const crossedJump = (before: number, after: number) => {
      const sign = Math.sign(after - before);

      return route.segments.find((segment) => {
        if (segment.animation !== "jump") return false;
        const entry = sign > 0 ? segment.startScroll : segment.endScroll;

        return sign > 0
          ? before <= entry && after > entry
          : sign < 0 && before >= entry && after < entry;
      });
    };
    const destination = () => {
      if (consumedJump) {
        const { segment, landing } = consumedJump;

        if (
          targetScroll >= segment.startScroll &&
          targetScroll <= segment.endScroll
        )
          return landing;
        consumedJump = undefined;
      }
      return targetScroll;
    };
    const tick = (time: number) => {
      frame = undefined;
      if (disposed || document.hidden || motion.matches || !pageVisible()) {
        sync();
        return;
      }

      const dt = Math.min(64, time - (lastTime || time - 16));
      const before = currentScroll;

      lastTime = time;
      if (!jump) {
        currentScroll +=
          (destination() - currentScroll) * (1 - Math.exp(-dt / 85));
        if (Math.abs(destination() - currentScroll) < 0.2)
          currentScroll = destination();
      }
      const sample = sampleObserverRoute(currentScroll, route);
      const crossed = !jump && crossedJump(before, currentScroll);
      const entered =
        !jump && sample.animation === "jump" && lastSegment !== sample.segmentId
          ? route.segments[sample.segmentIndex]
          : undefined;

      if (crossed || entered) {
        const segment = crossed || entered!;
        const sign = Math.sign(currentScroll - before) || 1;

        jump = { segment, sign, started: time };
        currentScroll = sign > 0 ? segment.startScroll : segment.endScroll;
      }
      if (jump) {
        const progress = clamp((time - jump.started) / JUMP_DURATION, 0, 1);
        const from = jump.sign > 0 ? jump.segment.from : jump.segment.to;
        const to = jump.sign > 0 ? jump.segment.to : jump.segment.from;

        drawPosition(
          from.x + (to.x - from.x) * progress,
          from.y + (to.y - from.y) * progress,
          Math.sin(Math.PI * progress) * height * 0.24,
        );
        drawSprite("jump", Math.min(7, Math.floor(progress * 8)));
        lastSegment = jump.segment.id;
        if (progress === 1) {
          currentScroll =
            jump.sign > 0 ? jump.segment.endScroll : jump.segment.startScroll;
          consumedJump = { segment: jump.segment, landing: currentScroll };
          jump = undefined;
        }
      } else {
        const moving = Math.abs(currentScroll - before) > 0.01;

        drawPosition(sample.x, sample.y);
        if (moving) {
          const reverse = currentScroll < before;
          const animation = reverse
            ? sample.direction === "left"
              ? "right"
              : sample.direction === "right"
                ? "left"
                : "down"
            : sample.direction;

          gait += (dt / 1000) * 12 * (reverse && animation === "down" ? -1 : 1);
          drawSprite(animation, ((Math.floor(gait) % 8) + 8) % 8);
        } else setMode("idle");
        lastSegment = sample.segmentId;
      }
      root.dataset.hidden = "false";
      if (jump || Math.abs(destination() - currentScroll) > 0.2) {
        root.style.willChange = "transform";
        frame = window.requestAnimationFrame(tick);
      } else {
        setMode("idle");
        stopFrame();
      }
    };
    const sync = () => {
      if (disposed || !route) return;
      if (document.hidden || !pageVisible()) {
        stopFrame();
        root.dataset.hidden = "true";
        blink(false);
        return;
      }
      if (motion.matches || !assetsReady || assetFailed) {
        stopFrame();
        jump = undefined;
        consumedJump = undefined;
        drawStill();
        return;
      }
      if (frame === undefined) frame = window.requestAnimationFrame(tick);
    };
    const onScroll = () => {
      targetScroll = window.scrollY;
      sync();
    };
    const onResize = () => {
      stopFrame();
      jump = undefined;
      consumedJump = undefined;
      measure();
      targetScroll = window.scrollY;
      currentScroll = targetScroll;
      sync();
    };
    const onViewportResize = () => {
      if (window.innerWidth !== viewportWidth) {
        onResize();
        return;
      }
      // Phone browser chrome changes viewport height while scrolling. Keep
      // the content route and active gesture, and only refresh its bounds.
      measureViewport();
      sync();
    };
    const onLoad = () => {
      assetsReady = images.every(
        (image) => image.complete && image.naturalWidth,
      );
      sync();
    };
    const onError = () => {
      assetFailed = true;
      sync();
    };

    syncRef.current = sync;
    measure();
    for (const path of Object.values(SHEETS)) {
      const image = new Image();

      images.push(image);
      image.addEventListener("load", onLoad);
      image.addEventListener("error", onError);
      image.src = assetPath(path);
    }
    const resizeObserver = new ResizeObserver(onResize);

    resizeObserver.observe(content);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onViewportResize, { passive: true });
    motion.addEventListener("change", onResize);
    document.addEventListener("visibilitychange", sync);
    void document.fonts.ready.then(() => {
      if (!disposed) onResize();
    });
    sync();

    return () => {
      disposed = true;
      syncRef.current = null;
      stopFrame();
      blink(false);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onViewportResize);
      motion.removeEventListener("change", onResize);
      document.removeEventListener("visibilitychange", sync);
      for (const image of images) {
        image.removeEventListener("load", onLoad);
        image.removeEventListener("error", onError);
      }
    };
  }, []);

  return (
    <span
      ref={rootRef}
      aria-hidden="true"
      className={styles.performer}
      data-hidden="true"
      data-mode="idle"
    >
      <span className={styles.sheet}>
        <span ref={sheetRef} className={styles.strip} />
      </span>
      <span className={styles.idle}>
        <ObserverCharacter
          ref={characterRef}
          behavior="idle"
          onReady={onReady}
        />
      </span>
    </span>
  );
}
