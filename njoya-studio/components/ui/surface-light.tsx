"use client";

import { useEffect, useRef } from "react";

/** A quiet pointer highlight. Its parent keeps its own semantics and layout. */
export default function SurfaceLight() {
  const lightRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const light = lightRef.current;
    const surface = light?.parentElement;
    const eligible = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );

    if (!light || !surface) return;
    let frame = 0;
    let x = 0;
    let y = 0;
    const move = (event: PointerEvent) => {
      if (!eligible.matches) return;
      const bounds = surface.getBoundingClientRect();

      x = event.clientX - bounds.left;
      y = event.clientY - bounds.top;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        light.style.transform = `translate3d(${x - 180}px, ${y - 180}px, 0)`;
        frame = 0;
      });
    };

    surface.addEventListener("pointermove", move, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      surface.removeEventListener("pointermove", move);
    };
  }, []);

  return <span ref={lightRef} aria-hidden="true" className="surface-light" />;
}
