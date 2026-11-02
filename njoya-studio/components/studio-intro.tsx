"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { assetPath } from "@/lib/asset-path";

type IntroPhase = "loading" | "entering" | "holding" | "leaving" | "done";

export default function StudioIntro({
  onReveal,
}: {
  onReveal: (animated: boolean) => void;
}) {
  const [phase, setPhase] = useState<IntroPhase>("loading");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dismissed = phase === "done";
  const dismiss = useCallback(
    (animated: boolean) => {
      onReveal(animated);
      setPhase(animated ? "leaving" : "done");
    },
    [onReveal],
  );

  useEffect(() => {
    if (dismissed) {
      document.documentElement.dataset.njoyaIntro = "skip";

      return;
    }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (document.documentElement.dataset.njoyaIntro === "skip") {
      dismiss(false);

      return;
    }

    document.documentElement.dataset.njoyaIntro = "show";
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    dialog?.showModal();
    dialog?.focus({ preventScroll: true });
    const fallback = window.setTimeout(() => dismiss(false), 10000);
    const onMotionChange = () => {
      if (reducedMotion.matches)
        setPhase((current) => (current === "entering" ? "holding" : current));
    };

    reducedMotion.addEventListener("change", onMotionChange);

    return () => {
      window.clearTimeout(fallback);
      reducedMotion.removeEventListener("change", onMotionChange);
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, [dismissed, dismiss]);

  useEffect(() => {
    if (phase !== "entering") return;
    const timer = window.setTimeout(() => setPhase("holding"), 1100);

    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "holding") return;
    const timer = window.setTimeout(
      () =>
        dismiss(!window.matchMedia("(prefers-reduced-motion: reduce)").matches),
      1000,
    );

    return () => window.clearTimeout(timer);
  }, [phase, dismiss]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = window.setTimeout(() => setPhase("done"), 900);

    return () => window.clearTimeout(timer);
  }, [phase]);

  if (dismissed) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-busy={phase === "loading"}
      aria-label="Njoya Studios introduction"
      className="intro-overlay"
      data-phase={phase}
      tabIndex={-1}
      onAnimationEnd={(event) => {
        if (phase === "leaving" && event.target === event.currentTarget)
          setPhase("done");
      }}
      onCancel={(event) => {
        event.preventDefault();
        dismiss(false);
      }}
    >
      <div
        className="intro-visual"
        onAnimationEnd={() =>
          setPhase((current) => (current === "entering" ? "holding" : current))
        }
      >
        <Image
          priority
          unoptimized
          alt="Njoya Studios — colourful sculptural artwork and studio wordmark"
          draggable={false}
          height={1000}
          src={assetPath("/media/brand/njoya-intro.webp")}
          width={1573}
          onError={() => dismiss(false)}
          onLoad={() =>
            setPhase((current) =>
              current === "loading"
                ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? "holding"
                  : "entering"
                : current,
            )
          }
        />
      </div>
      <p className="intro-caption">We build worlds</p>
    </dialog>
  );
}
