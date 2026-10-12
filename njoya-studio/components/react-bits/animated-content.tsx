"use client";

/**
 * Adapted from React Bits Animated Content by David Haz.
 * https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/Animations/AnimatedContent/AnimatedContent.tsx
 * Copyright (c) 2026 David Haz. See ./LICENSE.md.
 * Retains the GSAP context and from/to reveal. IntersectionObserver replaces
 * ScrollTrigger for a single entrance; content stays available without JS.
 */
import type { ReactNode } from "react";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function AnimatedContent({
  children,
  className,
  distance = 14,
  duration = 0.5,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element || !("IntersectionObserver" in window)) return;
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      let revealed = false;
      const tween = gsap.fromTo(
        element,
        { y: distance, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration,
          ease: "power3.out",
          paused: true,
          clearProps: "transform,opacity",
        },
      );
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting || revealed) return;
          revealed = true;
          tween.play();
          observer.disconnect();
        },
        { threshold: 0.1 },
      );
      const revealOnFocus = () => {
        revealed = true;
        tween.progress(1);
        observer.disconnect();
      };

      observer.observe(element);
      element.addEventListener("focusin", revealOnFocus);

      return () => {
        observer.disconnect();
        element.removeEventListener("focusin", revealOnFocus);
      };
    }, element);

    return () => media.revert();
  }, [distance, duration]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
