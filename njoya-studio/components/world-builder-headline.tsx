"use client";

import type { ReactNode } from "react";

import Image from "next/image";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import styles from "./world-builder-headline.module.css";

import { assetPath } from "@/lib/asset-path";

const CHARACTER = "/media/motion/world-builder.webp";
const PHASES = [
  "Find a grip",
  "A little effort",
  "One more pull",
  "In its place",
];

/** An image cutout rig and live type, sharing a single, reversible timeline. */
export default function WorldBuilderHeadline({
  controls = false,
  playWhen = true,
  worlds,
  onStart,
  onComplete,
}: {
  controls?: boolean;
  playWhen?: boolean;
  worlds?: ReactNode;
  onStart?: () => void;
  onComplete?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const phaseRef = useRef<HTMLOutputElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const letter = root.querySelector<HTMLElement>("[data-builder-letter]")!;
    const actor = root.querySelector<HTMLElement>("[data-builder-actor]")!;
    const upperBody = root.querySelector<HTMLElement>(
      "[data-builder-upper-body]",
    )!;
    const torso = root.querySelector<HTMLElement>("[data-builder-torso]")!;
    const head = root.querySelector<HTMLElement>("[data-builder-head]")!;
    const legs = root.querySelector<HTMLElement>("[data-builder-legs]")!;
    const rope = root.querySelector<SVGPathElement>("[data-builder-rope]")!;
    const shadow = root.querySelector<HTMLElement>("[data-builder-shadow]")!;
    const image = root.querySelector<HTMLImageElement>("[data-builder-image]")!;
    const scene = root.querySelector<HTMLElement>("[data-builder-scene]")!;
    const platform = root.querySelector<HTMLElement>(
      "[data-builder-platform]",
    )!;
    const baseline = root.querySelector<HTMLElement>(
      "[data-builder-baseline]",
    )!;
    const textMeasure = document.createElement("canvas").getContext("2d");
    const waitsForIntro = !!root.closest(".portfolio-stage");
    let disposed = false;
    let started = false;
    let imageReady = false;
    let imageFailed = false;
    let fallbackTimer: number | undefined;
    let currentPhase = -1;
    const initialPose = {
      letterX: -0.62,
      letterY: 0.035,
      letterRotation: -8,
      actorX: 0.4,
      actorY: 0,
      lean: 0,
      crouch: 0,
      head: 0,
      feet: 0,
      standing: 0,
      rope: 0,
      slack: 0.12,
      opacity: 0,
    };
    const pose = { ...initialPose };
    let actorTop = -0.55;
    let actorScale = 1.2;
    let actorWidth = 1.75 * actorScale;
    let actorHeight = 1.48 * actorScale;
    let platformX = 0;
    let platformTop = 1.2;
    let letterLeft = 0;
    let letterTop = 0;
    let letterWidth = 0.96;
    let letterHeight = 1.04;
    const measure = () => {
      const font = window.getComputedStyle(letter);
      const fontSize = parseFloat(font.fontSize);

      actorScale = parseFloat(
        window.getComputedStyle(root).getPropertyValue("--actor-scale"),
      );
      actorWidth = actor.offsetWidth / fontSize;
      actorHeight = actor.offsetHeight / fontSize;
      const previousTransform = letter.style.transform;

      letter.style.removeProperty("transform");
      const sceneBounds = scene.getBoundingClientRect();
      const letterBounds = letter.getBoundingClientRect();

      letterLeft = (letterBounds.left - sceneBounds.left) / fontSize;
      letterTop = (letterBounds.top - sceneBounds.top) / fontSize;
      letter.style.transform = previousTransform;
      if (textMeasure)
        textMeasure.font = `${font.fontStyle} ${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
      const capHeight =
        textMeasure?.measureText("BUILD").actualBoundingBoxAscent ??
        fontSize * 0.73;

      // BUILD can share a row with WE on mobile. Its own text baseline and
      // ink height give us the actual letter tops in either arrangement.
      platformX =
        (platform.getBoundingClientRect().left - sceneBounds.left) / fontSize;
      platformTop =
        (baseline.getBoundingClientRect().top - sceneBounds.top - capHeight) /
        fontSize;
      actorTop = platformTop - actorHeight * 0.96;
      actor.style.top = `${actorTop}em`;
      shadow.style.top = `${platformTop + 0.01}em`;
      letterWidth = letter.offsetWidth / fontSize;
      letterHeight = letter.offsetHeight / fontSize;
    };

    const draw = () => {
      const actorX = platformX + pose.actorX;
      const actorY = pose.actorY * actorScale;

      letter.style.transform = `translate(${pose.letterX}em, ${pose.letterY}em) rotate(${pose.letterRotation}deg)`;
      actor.style.transform = `translate(${actorX}em, ${actorY}em) rotate(${pose.lean}deg)`;
      actor.style.opacity = String(pose.opacity);
      // Straighten from the hips while both soles stay anchored to BUILD.
      upperBody.style.transform = `skewX(${-8 * pose.standing}deg) scaleY(${1 + 0.08 * pose.standing})`;
      torso.style.transform = `scaleY(${1 - pose.crouch * 0.035})`;
      head.style.transform = `translateY(${pose.crouch * 1.5}%) rotate(${pose.head}deg)`;
      legs.style.transform = `skewX(${pose.feet}deg)`;
      shadow.style.transform = `translateX(${actorX + actorWidth * 0.29}em) scaleX(${1 + pose.crouch * 0.12})`;
      shadow.style.opacity = String(pose.opacity * 0.22);

      // SVG coordinates are hundredths of an em. The endpoint follows the
      // gripping hand analytically, avoiding a layout read on every frame.
      const radians = (pose.lean * Math.PI) / 180;
      const pivotX = actorWidth * 0.81;
      const pivotY = actorHeight * 0.96;
      const handX = 0.18 * actorScale;
      const handY =
        actorHeight * 0.76 +
        (0.75 * actorScale - actorHeight * 0.76) * (1 - pose.crouch * 0.035);
      const endX =
        actorX +
        pivotX +
        (handX - pivotX) * Math.cos(radians) -
        (handY - pivotY) * Math.sin(radians);
      const endY =
        actorTop +
        actorY +
        pivotY +
        (handX - pivotX) * Math.sin(radians) +
        (handY - pivotY) * Math.cos(radians);
      const letterRadians = (pose.letterRotation * Math.PI) / 180;
      const originX = letterWidth * 0.5;
      const originY = letterHeight * 0.85;
      const startX =
        letterLeft +
        pose.letterX +
        originX +
        (0.16 - originX) * Math.cos(letterRadians) -
        (0.18 - originY) * Math.sin(letterRadians);
      const startY =
        letterTop +
        pose.letterY +
        originY +
        (0.16 - originX) * Math.sin(letterRadians) +
        (0.18 - originY) * Math.cos(letterRadians);

      rope.setAttribute(
        "d",
        `M ${startX * 100} ${startY * 100} Q ${((startX + endX) / 2) * 100} ${((startY + endY) / 2 + pose.slack) * 100} ${endX * 100} ${endY * 100}`,
      );
      rope.style.opacity = String(pose.rope);

      const timeline = timelineRef.current;

      if (timeline && controls) {
        if (rangeRef.current) {
          const progress = String(timeline.progress() * 100);

          rangeRef.current.value = progress;
          rangeRef.current.setAttribute("aria-valuenow", progress);
        }
        const time = timeline.time();
        const phase = time < 1.1 ? 0 : time < 2.3 ? 1 : time < 3.5 ? 2 : 3;

        if (phase !== currentPhase && phaseRef.current) {
          currentPhase = phase;
          phaseRef.current.textContent = PHASES[phase];
        }
      }
    };

    const showStill = (message: string) => {
      timelineRef.current?.kill();
      timelineRef.current = null;
      letter.style.removeProperty("transform");
      actor.style.opacity = "0";
      rope.style.opacity = "0";
      shadow.style.opacity = "0";
      root.dataset.enhanced = "false";
      setPlaying(false);
      if (rangeRef.current) {
        rangeRef.current.value = "100";
        rangeRef.current.setAttribute("aria-valuenow", "100");
      }
      if (phaseRef.current) phaseRef.current.textContent = message;
    };

    const start = () => {
      if (disposed) return;
      setReducedMotion(motion.matches);
      if (motion.matches) {
        showStill("Still composition · reduced motion");
        return;
      }
      if (
        started ||
        !playWhen ||
        document.hidden ||
        (waitsForIntro &&
          document.documentElement.dataset.njoyaIntro !== "skip")
      )
        return;

      if (imageFailed) {
        started = true;
        // Let all media-query change events reset the cast before advancing.
        window.clearTimeout(fallbackTimer);
        fallbackTimer = window.setTimeout(() => {
          if (disposed || motion.matches) return;
          if (document.hidden) {
            started = false;
            return;
          }
          onStart?.();
          onComplete?.();
        }, 0);
        return;
      }
      if (!imageReady) return;

      started = true;
      Object.assign(pose, initialPose);
      currentPhase = -1;
      measure();
      root.dataset.enhanced = "true";
      const timeline = gsap.timeline({
        paused: true,
        onUpdate: draw,
        onComplete: () => {
          setPlaying(false);
          onComplete?.();
        },
      });

      timelineRef.current = timeline;
      timeline
        .to(pose, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0)
        .to(
          pose,
          {
            lean: -3,
            head: -5,
            crouch: 0.7,
            duration: 0.45,
            ease: "power2.inOut",
          },
          0.35,
        )
        .to(pose, { rope: 0.8, slack: 0.015, duration: 0.3 }, 0.6)
        .to(
          pose,
          {
            lean: 5,
            head: 3,
            crouch: 1,
            feet: -5,
            duration: 0.4,
            ease: "power2.inOut",
          },
          0.85,
        )
        .to(
          pose,
          {
            letterX: -0.28,
            letterRotation: -4,
            actorX: 0.74,
            actorY: -0.025,
            duration: 0.85,
            ease: "power2.inOut",
          },
          1.1,
        )
        .to(
          pose,
          {
            lean: 0,
            head: -2,
            crouch: 0.3,
            feet: 4,
            actorY: 0,
            duration: 0.3,
            ease: "power2.out",
          },
          1.95,
        )
        .to(
          pose,
          {
            lean: 6,
            head: 4,
            crouch: 1,
            feet: -4,
            duration: 0.3,
            ease: "power2.inOut",
          },
          2.3,
        )
        .to(
          pose,
          {
            letterX: 0,
            letterY: 0,
            letterRotation: 0,
            actorX: 1.06,
            duration: 0.9,
            ease: "power2.inOut",
          },
          2.5,
        )
        .to(
          pose,
          {
            lean: 0,
            head: 0,
            crouch: 0,
            feet: 0,
            duration: 0.4,
            ease: "power2.out",
          },
          3.4,
        )
        .to(pose, { slack: 0.22, rope: 0, duration: 0.35 }, 3.5)
        .to(
          pose,
          { standing: 1, duration: 0.6, ease: "power2.inOut" },
          3.85,
        );

      draw();
      setReady(true);
      setPlaying(true);
      onStart?.();
      timeline.play();
    };

    const onImageReady = () => {
      if (!image.naturalWidth || disposed) return;
      imageReady = true;
      imageFailed = false;
      start();
    };
    const onMotionChange = () => {
      setReducedMotion(motion.matches);
      if (motion.matches) showStill("Still composition · reduced motion");
      else {
        started = false;
        start();
      }
    };
    const onImageError = () => {
      imageReady = false;
      imageFailed = true;
      started = false;
      setReady(false);
      showStill("Animation unavailable");
      start();
    };
    const onResize = () => {
      if (!timelineRef.current) return;
      measure();
      draw();
    };
    const onVisibilityChange = () => {
      if (!document.hidden && !timelineRef.current) {
        start();
        return;
      }
      if (document.hidden && timelineRef.current?.isActive()) {
        timelineRef.current.pause();
        setPlaying(false);
      } else if (!document.hidden && !controls && timelineRef.current) {
        const timeline = timelineRef.current;

        if (timeline.progress() < 1) {
          timeline.play();
          setPlaying(true);
        }
      }
    };
    const observer = new MutationObserver(start);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-njoya-intro"],
    });
    image.addEventListener("load", onImageReady);
    image.addEventListener("error", onImageError);
    motion.addEventListener("change", onMotionChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("resize", onResize, { passive: true });
    if (image.complete) {
      if (image.naturalWidth) onImageReady();
      else onImageError();
    }
    void document.fonts.ready.then(() => {
      if (!disposed) onResize();
    });

    return () => {
      disposed = true;
      window.clearTimeout(fallbackTimer);
      observer.disconnect();
      image.removeEventListener("load", onImageReady);
      image.removeEventListener("error", onImageError);
      motion.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", onResize);
      timelineRef.current?.kill();
      timelineRef.current = null;
      letter.style.removeProperty("transform");
      delete root.dataset.enhanced;
    };
  }, [controls, onComplete, onStart, playWhen]);

  const replay = () => {
    const timeline = timelineRef.current;

    if (!timeline || reducedMotion) return;
    timeline.restart();
    setPlaying(true);
  };

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-layout={controls ? "study" : "home"}
    >
      <h1 aria-label="We build worlds" className={styles.heading}>
        <span
          aria-hidden="true"
          className={`${styles.line} ${styles.firstLine}`}
        >
          <span className={styles.letter} data-builder-letter="">
            W
          </span>
          <span className={styles.letter}>E</span>{" "}
          <span
            aria-hidden="true"
            className={styles.scene}
            data-builder-scene=""
          >
            <svg className={styles.rope} viewBox="0 0 400 100">
              <path
                data-builder-rope=""
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="0.9"
              />
            </svg>
            <span className={styles.shadow} data-builder-shadow="" />
            <span className={styles.actor} data-builder-actor="">
              <span
                className={`${styles.layer} ${styles.legs}`}
                data-builder-legs=""
              >
                <Image
                  unoptimized
                  alt=""
                  className={styles.image}
                  draggable={false}
                  height={650}
                  src={assetPath(CHARACTER)}
                  width={768}
                />
              </span>
              <span
                className={`${styles.layer} ${styles.upperBody}`}
                data-builder-upper-body=""
              >
                <span
                  className={`${styles.layer} ${styles.torso}`}
                  data-builder-torso=""
                >
                  <Image
                    unoptimized
                    alt=""
                    className={styles.image}
                    data-builder-image=""
                    draggable={false}
                    height={650}
                    loading="eager"
                    src={assetPath(CHARACTER)}
                    width={768}
                  />
                </span>
                <span
                  className={`${styles.layer} ${styles.head}`}
                  data-builder-head=""
                >
                  <Image
                    unoptimized
                    alt=""
                    className={styles.image}
                    draggable={false}
                    height={650}
                    src={assetPath(CHARACTER)}
                    width={768}
                  />
                </span>
              </span>
            </span>
          </span>
        </span>
        <span
          aria-hidden="true"
          className={styles.line}
          data-builder-platform=""
        >
          BUILD
          <span className={styles.baseline} data-builder-baseline="" />{" "}
        </span>
        {worlds ?? (
          <span aria-hidden="true" className={styles.line}>
            WORLDS
          </span>
        )}
      </h1>

      {controls && (
        <div aria-label="Animation controls" className={styles.controls}>
          <div className={styles.controlRow}>
            <button
              aria-label={playing ? "Pause animation" : "Play animation"}
              className={styles.iconButton}
              disabled={!ready || reducedMotion}
              type="button"
              onClick={() => {
                const timeline = timelineRef.current;

                if (!timeline) return;
                if (playing) timeline.pause();
                else if (timeline.progress() >= 1) timeline.restart();
                else timeline.play();
                setPlaying(!playing);
              }}
            >
              {playing ? (
                <Pause aria-hidden="true" size={14} />
              ) : (
                <Play aria-hidden="true" size={14} />
              )}
            </button>
            <button
              className={styles.replay}
              disabled={!ready || reducedMotion}
              type="button"
              onClick={replay}
            >
              <RotateCcw aria-hidden="true" size={13} /> Replay
            </button>
            <output ref={phaseRef} aria-live="polite" className={styles.phase}>
              {reducedMotion
                ? "Still composition · reduced motion"
                : "Find a grip"}
            </output>
          </div>
          <input
            ref={rangeRef}
            aria-label="Animation progress"
            className={styles.progress}
            defaultValue="0"
            disabled={!ready || reducedMotion}
            max="100"
            min="0"
            step="0.1"
            type="range"
            onChange={(event) => {
              timelineRef.current
                ?.pause()
                .progress(Number(event.target.value) / 100);
              setPlaying(false);
            }}
          />
          <label className={styles.speed}>
            Playback
            <select
              aria-label="Playback speed"
              defaultValue="1"
              disabled={!ready || reducedMotion}
              onChange={(event) =>
                timelineRef.current?.timeScale(Number(event.target.value))
              }
            >
              <option value="0.5">0.5×</option>
              <option value="1">1×</option>
              <option value="1.5">1.5×</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
