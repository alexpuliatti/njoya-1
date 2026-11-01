"use client";

import { useEffect, useRef } from "react";

import { GradientDivider } from "./gradient-components/gradient-divider";
import styles from "./lab-walking-divider.module.css";

import { assetPath } from "@/lib/asset-path";

/** A visible-only walking loop along a Lab project's existing divider. */
export default function LabWalkingDivider({
  direction = "right",
}: {
  direction?: "left" | "right";
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const performerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const performer = performerRef.current;

    if (!root || !performer) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const panel = root.closest<HTMLElement>(".studio-dialog-panel");
    const image = new window.Image();
    let disposed = false;
    let loaded = false;
    let inView = false;
    let progress = 0;
    let duration = 1;
    let travel: Animation | null = null;

    const stopTravel = () => {
      if (!travel) return;
      const time = Number(travel.currentTime);

      if (Number.isFinite(time)) progress = (((time / duration) % 1) + 1) % 1;
      travel.cancel();
      travel = null;
    };
    const sync = () => {
      if (disposed) return;
      root.dataset.ready = String(loaded);
      if (motion.matches) {
        travel?.pause();
        root.dataset.state = "still";
        return;
      }
      const walking = loaded && inView && !document.hidden && !!travel;

      root.dataset.state = walking ? "walking" : "paused";
      if (walking) travel?.play();
      else travel?.pause();
    };
    const measure = () => {
      if (disposed) return;
      stopTravel();
      const width = root.clientWidth;
      const characterWidth = performer.offsetWidth;
      const from = direction === "right" ? -characterWidth : width;
      const to = direction === "right" ? width : -characterWidth;
      const distance = width + characterWidth;

      performer.style.transform = `translate3d(${from + (to - from) * progress}px, 0, 0)`;
      if (motion.matches) {
        const stillX =
          direction === "right" ? 0 : Math.max(0, width - characterWidth);

        performer.style.transform = `translate3d(${stillX}px, 0, 0)`;
      }
      if (!loaded || motion.matches || !width) {
        sync();
        return;
      }
      duration = (distance / 90) * 1000;
      travel = performer.animate(
        [
          { transform: `translate3d(${from}px, 0, 0)` },
          { transform: `translate3d(${to}px, 0, 0)` },
        ],
        { duration, easing: "linear", fill: "both", iterations: Infinity },
      );
      travel.pause();
      travel.currentTime = progress * duration;
      sync();
    };
    const visibility = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { root: panel, rootMargin: "-76px 0px -8px 0px", threshold: 0 },
    );
    const resize = new ResizeObserver(measure);

    visibility.observe(root);
    resize.observe(root);
    resize.observe(performer);
    motion.addEventListener("change", measure);
    document.addEventListener("visibilitychange", sync);
    image.src = assetPath(`/media/motion/observer-walk-${direction}.webp`);
    void image
      .decode()
      .then(() => {
        if (disposed) return;
        loaded = true;
        measure();
      })
      .catch(() => {
        // The gradient remains useful even if the optional sprite cannot load.
        if (!disposed) root.dataset.ready = "false";
      });
    measure();

    return () => {
      disposed = true;
      stopTravel();
      visibility.disconnect();
      resize.disconnect();
      motion.removeEventListener("change", measure);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [direction]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={styles.rail}
      data-direction={direction}
      data-ready="false"
      data-state="paused"
    >
      <GradientDivider animation="none" thickness="3px" />
      <span ref={performerRef} className={styles.performer}>
        <span className={styles.window}>
          <span
            className={styles.frames}
            style={{
              backgroundImage: `url("${assetPath(`/media/motion/observer-walk-${direction}.webp`)}")`,
            }}
          />
        </span>
      </span>
    </div>
  );
}
