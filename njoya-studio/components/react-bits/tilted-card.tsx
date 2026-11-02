"use client";

/**
 * Adapted from React Bits Tilted Card by David Haz.
 * https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/Components/TiltedCard/TiltedCard.tsx
 * Copyright (c) 2026 David Haz. See ./LICENSE.md.
 * Retains the upstream spring integrator and pointer-normalized tilt, with
 * native link children, smaller movement, and no flip/tooltip/device sensors.
 */
import type { ReactNode } from "react";

import { useEffect, useRef } from "react";

export type TiltedCardEntry = "pending" | "animate" | "instant";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// Spring integrator from React Bits Tilted Card.
const step = (
  state: Record<string, number>,
  key: string,
  target: number,
  omega: number,
  zeta: number,
  dt: number,
) => {
  const velocity = `v${key}`;
  const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = dt / steps;

  for (let index = 0; index < steps; index++) {
    state[velocity] +=
      (omega * omega * (target - state[key]) -
        2 * zeta * omega * state[velocity]) *
      h;
    state[key] += state[velocity] * h;
  }
  const settled =
    Math.abs(target - state[key]) < 0.001 && Math.abs(state[velocity]) < 0.01;

  if (settled) {
    state[key] = target;
    state[velocity] = 0;
  }

  return !settled;
};

export default function TiltedCard({
  children,
  className = "",
  introDelay = 0,
  rotateAmplitude = 4,
  scaleOnHover = 1.015,
  entry = "animate",
}: {
  children: ReactNode;
  className?: string;
  introDelay?: number;
  rotateAmplitude?: number;
  scaleOnHover?: number;
  entry?: TiltedCardEntry;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const body = bodyRef.current;
    const shadow = shadowRef.current;

    if (entry === "pending" || !root || !body || !shadow) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const keyboardEntry =
      document.activeElement instanceof HTMLElement &&
      document.activeElement.matches(
        "a[href]:focus-visible, button:focus-visible, input:focus-visible",
      );
    const amplitude = clamp(rotateAmplitude, 0, 8);
    const state: Record<string, number> = {
      rx: 0,
      vrx: 0,
      ry: 0,
      vry: 0,
      lift: 0,
      vlift: 0,
    };
    const pointer = { nx: 0, ny: 0, inside: false };
    let frame = 0;
    let last = 0;
    let visible = true;
    let keyboardFocus = false;
    let entered = false;
    let entrance: Animation | null = null;

    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      for (const key of Object.keys(state)) state[key] = 0;
      body.style.transform = "";
      shadow.style.transform = "";
      shadow.style.opacity = "0";
      root.removeAttribute("data-active");
    };
    const tick = (now: number) => {
      frame = 0;
      if (reducedMotion.matches || keyboardFocus) {
        reset();

        return;
      }
      const dt = clamp((now - last) / 1000 || 0, 0, 0.05);

      last = now;
      const active = pointer.inside && finePointer.matches;
      const inputX = active ? pointer.nx : 0;
      const inputY = active ? pointer.ny : 0;
      let busy = false;

      busy = step(state, "rx", -inputY * amplitude, 16, 1, dt) || busy;
      busy = step(state, "ry", inputX * amplitude, 16, 1, dt) || busy;
      busy = step(state, "lift", active ? 1 : 0, 16, 1, dt) || busy;
      const scale = 1 + (scaleOnHover - 1) * state.lift;

      body.style.transform = `translate3d(0, ${(-3 * state.lift).toFixed(2)}px, 0) rotateX(${state.rx.toFixed(3)}deg) rotateY(${state.ry.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
      shadow.style.transform = `translate3d(${(-state.ry * 1.5).toFixed(2)}px, ${(12 + 8 * state.lift).toFixed(2)}px, 0) scale(0.94)`;
      shadow.style.opacity = (state.lift * 0.35).toFixed(3);
      root.toggleAttribute("data-active", active || state.lift > 0.01);
      if (busy && visible) frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (frame || !visible || reducedMotion.matches || keyboardFocus) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const reveal = (instant = false) => {
      if (entered) return;
      entered = true;
      if (
        instant ||
        entry === "instant" ||
        keyboardEntry ||
        reducedMotion.matches
      )
        return;
      entrance = root.animate(
        [
          { opacity: 0, transform: "translateY(18px) scale(0.985)" },
          { opacity: 1, transform: "none" },
        ],
        {
          duration: 420,
          delay: introDelay,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "backwards",
        },
      );
    };
    const onMove = (event: PointerEvent) => {
      if (
        !finePointer.matches ||
        event.pointerType === "touch" ||
        reducedMotion.matches ||
        keyboardFocus
      )
        return;
      const rect = root.getBoundingClientRect();

      pointer.inside = true;
      pointer.nx = clamp(
        (event.clientX - rect.left - rect.width / 2) /
          Math.max(1, rect.width / 2),
        -1,
        1,
      );
      pointer.ny = clamp(
        (event.clientY - rect.top - rect.height / 2) /
          Math.max(1, rect.height / 2),
        -1,
        1,
      );
      wake();
    };
    const onLeave = () => {
      pointer.inside = false;
      wake();
    };
    const onFocus = (event: FocusEvent) => {
      if (
        !(event.target instanceof HTMLElement) ||
        !event.target.matches(":focus-visible")
      )
        return;
      keyboardFocus = true;
      reveal(true);
      entrance?.cancel();
      reset();
    };
    const onBlur = () => {
      keyboardFocus = false;
      pointer.inside = false;
      reset();
    };
    const onPreferenceChange = () => {
      if (reducedMotion.matches || !finePointer.matches) {
        entrance?.cancel();
        pointer.inside = false;
        reset();
      }
    };
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible) {
          reveal();
          wake();
        } else {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      },
      { threshold: 0.01 },
    );

    root.addEventListener("pointerenter", onMove, { passive: true });
    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("focusin", onFocus);
    root.addEventListener("focusout", onBlur);
    reducedMotion.addEventListener("change", onPreferenceChange);
    finePointer.addEventListener("change", onPreferenceChange);
    observer.observe(root);

    return () => {
      observer.disconnect();
      entrance?.cancel();
      reset();
      root.removeEventListener("pointerenter", onMove);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("focusin", onFocus);
      root.removeEventListener("focusout", onBlur);
      reducedMotion.removeEventListener("change", onPreferenceChange);
      finePointer.removeEventListener("change", onPreferenceChange);
    };
  }, [introDelay, rotateAmplitude, scaleOnHover, entry]);

  return (
    <div ref={rootRef} className={`tilted-card ${className}`}>
      <span
        ref={shadowRef}
        aria-hidden="true"
        className="tilted-card__shadow"
      />
      <div ref={bodyRef} className="tilted-card__body">
        {children}
      </div>
    </div>
  );
}
