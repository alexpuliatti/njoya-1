"use client";

import Image from "next/image";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import gsap from "gsap";

import styles from "./observer-character.module.css";

import { assetPath } from "@/lib/asset-path";

export type ObserverCharacterHandle = {
  play: () => void;
  reset: () => void;
  restart: () => void;
  pause: () => void;
  progress: (value: number) => void;
  timeScale: (value: number) => void;
};

type Props = {
  autoPlay?: boolean;
  className?: string;
  revealFrom?: "left" | "right";
  onComplete?: () => void;
  onReady?: (ready: boolean) => void;
  onPlayingChange?: (playing: boolean) => void;
  onProgress?: (progress: number) => void;
};

const ObserverCharacter = forwardRef<ObserverCharacterHandle, Props>(
  function ObserverCharacter(
    {
      autoPlay = false,
      className = "",
      revealFrom = "right",
      onComplete,
      onReady,
      onPlayingChange,
      onProgress,
    },
    ref,
  ) {
    const rootRef = useRef<HTMLSpanElement>(null);
    const timelineRef = useRef<gsap.core.Timeline | null>(null);
    const playRef = useRef<((restart: boolean) => void) | null>(null);
    const wanted = useRef(autoPlay);
    const speed = useRef(1);
    const callbacks = useRef({
      onComplete,
      onReady,
      onPlayingChange,
      onProgress,
    });

    callbacks.current = { onComplete, onReady, onPlayingChange, onProgress };

    useImperativeHandle(
      ref,
      () => ({
        reset: () => {
          wanted.current = false;
          timelineRef.current?.pause(0, true);
          if (rootRef.current) {
            rootRef.current.style.opacity = "0";
            rootRef.current.dataset.active = "false";
          }
          callbacks.current.onPlayingChange?.(false);
        },
        play: () => {
          wanted.current = true;
          playRef.current?.(false);
        },
        restart: () => {
          wanted.current = true;
          playRef.current?.(true);
        },
        pause: () => {
          wanted.current = false;
          timelineRef.current?.pause();
          callbacks.current.onPlayingChange?.(false);
        },
        progress: (value) => {
          wanted.current = false;
          timelineRef.current
            ?.pause()
            .progress(Math.max(0, Math.min(1, value)));
          callbacks.current.onPlayingChange?.(false);
        },
        timeScale: (value) => {
          speed.current = value;
          timelineRef.current?.timeScale(value);
        },
      }),
      [],
    );

    useEffect(() => {
      const root = rootRef.current;

      if (!root) return;

      const lids = root.querySelector<HTMLElement>("[data-observer-lids]")!;
      const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
      const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const direction = revealFrom === "left" ? -1 : 1;
      let disposed = false;

      const showStill = () => {
        timelineRef.current?.kill();
        timelineRef.current = null;
        root.style.opacity = "0";
        root.dataset.active = "false";
        callbacks.current.onPlayingChange?.(false);
      };
      const play = (restart = true) => {
        if (!timelineRef.current || motion.matches) return;
        if (document.hidden) {
          if (restart) timelineRef.current.pause(0, true);
          root.style.opacity = "0";
          return;
        }
        root.dataset.active = "true";
        const timeline = timelineRef.current.timeScale(speed.current);
        if (restart || timeline.progress() >= 1) timeline.restart();
        else timeline.play();
        callbacks.current.onPlayingChange?.(true);
      };
      const prepare = () => {
        if (
          disposed ||
          !images.every((image) => image.complete && image.naturalWidth)
        )
          return;
        if (motion.matches) {
          showStill();
          callbacks.current.onReady?.(true);
          return;
        }
        if (timelineRef.current) return;

        const timeline = gsap.timeline({
          paused: true,
          onUpdate: () => callbacks.current.onProgress?.(timeline.progress()),
          onComplete: () => {
            wanted.current = false;
            root.dataset.active = "false";
            callbacks.current.onPlayingChange?.(false);
            callbacks.current.onComplete?.();
          },
        });

        timelineRef.current = timeline;
        timeline
          .fromTo(
            root,
            {
              xPercent: direction * 90,
              yPercent: 5,
              rotation: direction * -5,
              opacity: 0,
            },
            {
              xPercent: 0,
              yPercent: 0,
              rotation: 0,
              opacity: 1,
              duration: 0.95,
              ease: "power2.inOut",
            },
            0,
          )
          .fromTo(
            lids,
            { opacity: 0 },
            { opacity: 1, duration: 0.08, ease: "none" },
            1.55,
          )
          .to(lids, { opacity: 0, duration: 0.15, ease: "power1.inOut" }, 1.78)
          .to(
            root,
            { rotation: direction * 2.5, duration: 0.45, ease: "power2.inOut" },
            2.05,
          )
          .to(
            root,
            { rotation: direction * -1, duration: 0.4, ease: "power2.inOut" },
            2.6,
          )
          .to(
            root,
            {
              xPercent: direction * 90,
              yPercent: 5,
              rotation: direction * -4,
              opacity: 0,
              duration: 0.85,
              ease: "power2.inOut",
            },
            3.25,
          );
        callbacks.current.onReady?.(true);
        if (wanted.current) play();
      };
      const onError = () => {
        showStill();
        callbacks.current.onReady?.(false);
      };
      const onMotionChange = () => {
        if (motion.matches) showStill();
        else prepare();
      };
      const onVisibilityChange = () => {
        const timeline = timelineRef.current;

        if (!timeline) return;
        if (document.hidden && timeline.isActive()) {
          timeline.pause();
          callbacks.current.onPlayingChange?.(false);
        } else if (
          !document.hidden &&
          wanted.current &&
          timeline.progress() < 1
        ) {
          timeline.play();
          callbacks.current.onPlayingChange?.(true);
        }
      };

      playRef.current = play;
      for (const image of images) {
        image.addEventListener("load", prepare);
        image.addEventListener("error", onError);
      }
      motion.addEventListener("change", onMotionChange);
      document.addEventListener("visibilitychange", onVisibilityChange);
      if (images.some((image) => image.complete && !image.naturalWidth))
        onError();
      else prepare();

      return () => {
        disposed = true;
        timelineRef.current?.kill();
        timelineRef.current = null;
        playRef.current = null;
        for (const image of images) {
          image.removeEventListener("load", prepare);
          image.removeEventListener("error", onError);
        }
        motion.removeEventListener("change", onMotionChange);
        document.removeEventListener("visibilitychange", onVisibilityChange);
      };
    }, [revealFrom]);

    return (
      <span
        ref={rootRef}
        aria-hidden="true"
        className={`${styles.character} ${className}`}
      >
        <Image
          unoptimized
          alt=""
          className={styles.image}
          draggable={false}
          height={768}
          loading="eager"
          src={assetPath("/media/motion/observer.webp")}
          width={768}
        />
        <span className={styles.lids} data-observer-lids="">
          <Image
            unoptimized
            alt=""
            className={`${styles.image} ${styles.leftEye}`}
            draggable={false}
            height={768}
            loading="eager"
            src={assetPath("/media/motion/observer-blink.webp")}
            width={768}
          />
          <Image
            unoptimized
            alt=""
            className={`${styles.image} ${styles.rightEye}`}
            draggable={false}
            height={768}
            loading="eager"
            src={assetPath("/media/motion/observer-blink.webp")}
            width={768}
          />
        </span>
      </span>
    );
  },
);

export default ObserverCharacter;
