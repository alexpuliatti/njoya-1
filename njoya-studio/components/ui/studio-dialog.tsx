"use client";

import type {
  DialogHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  RefObject,
} from "react";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

import { StudioCloseButton } from "./studio-button";

type MorphSource = { image: HTMLImageElement; instant?: boolean };
type DialogContextValue = {
  close: (instant?: boolean) => void;
  panelRef: RefObject<HTMLDivElement>;
  heroRef: RefObject<HTMLDivElement>;
};
const DialogContext = createContext<DialogContextValue | null>(null);
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function useDialog() {
  const context = useContext(DialogContext);

  if (!context)
    throw new Error("StudioDialog parts need a StudioDialog parent.");

  return context;
}

/** Native modality and focus handling, with an optional shared-image transition. */
export function StudioDialog({
  children,
  onClose,
  source,
  instant = false,
  initialFocusRef,
  className = "",
  ...props
}: Omit<DialogHTMLAttributes<HTMLDialogElement>, "onClose"> & {
  children: ReactNode;
  onClose: () => void;
  source?: MorphSource;
  instant?: boolean;
  initialFocusRef?: RefObject<HTMLElement>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<(instant?: boolean) => void>(() => undefined);
  const onCloseRef = useRef(onClose);
  const sourceRef = useRef(source);
  const focusRef = useRef(initialFocusRef);
  const instantRef = useRef(instant);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;

    if (!dialog || !panel) return;
    const source = sourceRef.current;
    const hero = heroRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const previousVisibility = source?.image.style.visibility ?? "";
    const previousHeroVisibility = hero?.style.visibility ?? "";
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    let closing = false;
    let disposed = false;
    let proxy: HTMLDivElement | null = null;
    let outsidePointerDown = false;
    const onPointerDown = (event: PointerEvent) => {
      outsidePointerDown = event.target === dialog;
    };
    const onBackdropClick = (event: MouseEvent) => {
      if (outsidePointerDown && event.target === dialog) closeRef.current();
    };
    const play = (
      element: HTMLElement,
      frames: Keyframe[],
      duration: number,
    ) => {
      const animation = element.animate(frames, {
        duration,
        easing: EASE,
        fill: "both",
      });

      animations.add(animation);

      return animation.finished.catch(() => undefined);
    };
    const stop = () => {
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    };
    const makeProxy = (from: DOMRect, to: DOMRect, returning: boolean) => {
      if (!source || !hero) return Promise.resolve();
      proxy?.remove();
      proxy = document.createElement("div");
      const image = source.image.cloneNode() as HTMLImageElement;

      image.removeAttribute("id");
      image.removeAttribute("srcset");
      image.src = source.image.currentSrc || source.image.src;
      image.alt = "";
      image.style.cssText =
        "width:100%;height:100%;object-fit:cover;object-position:top;display:block";
      proxy.className = "studio-morph-proxy";
      proxy.setAttribute("aria-hidden", "true");
      Object.assign(proxy.style, {
        width: `${to.width}px`,
        height: `${to.height}px`,
      });
      proxy.append(image);
      dialog.append(proxy);
      const fromRadius = getComputedStyle(
        returning ? hero : source.image,
      ).borderRadius;
      const toRadius = getComputedStyle(
        returning ? source.image : hero,
      ).borderRadius;

      return play(
        proxy,
        [
          {
            transform: `translate(${from.left}px, ${from.top}px) scale(${from.width / to.width}, ${from.height / to.height})`,
            borderRadius: fromRadius,
          },
          {
            transform: `translate(${to.left}px, ${to.top}px) scale(1, 1)`,
            borderRadius: toRadius,
          },
        ],
        returning ? 300 : 420,
      );
    };

    document.body.style.overflow = "hidden";
    dialog.addEventListener("pointerdown", onPointerDown);
    dialog.addEventListener("click", onBackdropClick);
    dialog.showModal();
    (
      focusRef.current?.current ??
      panel.querySelector<HTMLElement>("button, a[href], input")
    )?.focus({ preventScroll: true });
    const instant = instantRef.current || source?.instant || motion.matches;
    const target = hero?.getBoundingClientRect();

    if (!instant) {
      void play(
        panel,
        [
          { opacity: 0, transform: "translateY(10px) scale(0.99)" },
          { opacity: 1, transform: "none" },
        ],
        260,
      );
      if (source && hero && target) {
        const from = source.image.getBoundingClientRect();

        source.image.style.visibility = "hidden";
        hero.style.visibility = "hidden";
        void makeProxy(from, target, false).then(async () => {
          const image = hero.querySelector("img");

          if (image && !image.complete)
            await image.decode().catch(() => undefined);
          if (disposed || closing) return;
          hero.style.visibility = previousHeroVisibility;
          proxy?.remove();
          proxy = null;
        });
      }
    }

    closeRef.current = async (immediate = false) => {
      if (closing) return;
      closing = true;
      const from =
        proxy?.getBoundingClientRect() ?? hero?.getBoundingClientRect();
      const opacity = getComputedStyle(panel).opacity;

      stop();
      dialog.dataset.closing = "true";
      if (instant || immediate || motion.matches) {
        onCloseRef.current();

        return;
      }
      const to = source?.image.isConnected
        ? source.image.getBoundingClientRect()
        : null;
      const canReturn =
        from &&
        to &&
        from.bottom > 0 &&
        from.top < window.innerHeight &&
        to.width > 0 &&
        to.bottom > 0 &&
        to.top < window.innerHeight;
      const fade = play(panel, [{ opacity }, { opacity: 0 }], 180);

      if (canReturn && hero) {
        hero.style.visibility = "hidden";
        await makeProxy(from, to, true);
      } else await fade;
      if (!disposed) onCloseRef.current();
    };

    return () => {
      disposed = true;
      stop();
      proxy?.remove();
      if (source) source.image.style.visibility = previousVisibility;
      if (hero) hero.style.visibility = previousHeroVisibility;
      dialog.close();
      dialog.removeEventListener("pointerdown", onPointerDown);
      dialog.removeEventListener("click", onBackdropClick);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, []);

  const close = useCallback((instant = false) => closeRef.current(instant), []);

  return (
    <DialogContext.Provider value={{ close, panelRef, heroRef }}>
      <dialog
        {...props}
        ref={dialogRef}
        className={`studio-dialog ${className}`}
        onCancel={(event) => {
          event.preventDefault();
          close(true);
        }}
      >
        {children}
      </dialog>
    </DialogContext.Provider>
  );
}

export function StudioDialogPanel({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { panelRef } = useDialog();

  return (
    <div
      {...props}
      ref={panelRef}
      className={`studio-dialog-panel ${className}`}
    />
  );
}

export function StudioDialogHero({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { heroRef } = useDialog();

  return (
    <div
      {...props}
      ref={heroRef}
      className={`studio-dialog-hero ${className}`}
    />
  );
}

export function StudioDialogClose({
  label = "Close dialog",
}: {
  label?: string;
}) {
  const { close } = useDialog();

  return (
    <StudioCloseButton
      label={label}
      onClick={(event) => close(event.detail === 0)}
    />
  );
}
