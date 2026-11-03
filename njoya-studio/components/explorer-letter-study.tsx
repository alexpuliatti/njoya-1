"use client";

import Image from "next/image";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import styles from "./explorer-letter-study.module.css";

import { assetPath } from "@/lib/asset-path";

const INITIAL_POSE = {
  x: 2.15,
  rotation: 360,
  lean: 0,
  step: 0,
  squash: 1,
  retreat: 0,
  actorOpacity: 0,
  ghostOpacity: 0.2,
};

const PHASES = [
  "Find a little momentum",
  "Keep it rolling",
  "Steady, steady",
  "A world takes shape",
];

export default function ExplorerLetterStudy() {
  const rootRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const phaseRef = useRef<HTMLOutputElement>(null);
  const speedRef = useRef(1);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const world = root.querySelector<HTMLElement>("[data-explorer-world]")!;
    const letter = root.querySelector<HTMLElement>("[data-explorer-letter]")!;
    const actor = root.querySelector<HTMLElement>("[data-explorer-actor]")!;
    const image = root.querySelector<HTMLImageElement>(
      "[data-explorer-image]",
    )!;
    const baseline = root.querySelector<HTMLElement>(
      "[data-explorer-baseline]",
    )!;
    const shadow = root.querySelector<HTMLElement>("[data-explorer-shadow]")!;
    const ghosts = root.querySelectorAll<HTMLElement>("[data-explorer-ghost]");
    const pose = { ...INITIAL_POSE };
    let disposed = false;
    let imageReady = false;
    let phase = -1;
    let goalX = 0.9;
    let floor = 0.92;
    let letterWidth = 0.8;
    let actorWidth = 1.5;
    let actorHeight = 1.2;

    const measure = () => {
      const fontSize = parseFloat(window.getComputedStyle(letter).fontSize);
      const previousTransform = letter.style.transform;

      letter.style.removeProperty("transform");
      const worldBounds = world.getBoundingClientRect();

      goalX =
        (letter.getBoundingClientRect().left - worldBounds.left) / fontSize;
      floor =
        (baseline.getBoundingClientRect().top - worldBounds.top) / fontSize;
      letterWidth = letter.offsetWidth / fontSize;
      actorWidth = actor.offsetWidth / fontSize;
      actorHeight = actor.offsetHeight / fontSize;
      letter.style.transform = previousTransform;
      shadow.style.top = `${floor + 0.01}em`;
    };

    const draw = () => {
      const bump = -Math.abs(Math.sin((pose.rotation * Math.PI) / 180)) * 0.025;
      const actorX =
        goalX + pose.x + letterWidth * 0.88 - actorWidth * 0.07 + pose.retreat;
      const actorY = floor - actorHeight * 0.986 + pose.step;

      letter.style.transform = `translate(${pose.x}em, ${bump}em) rotate(${pose.rotation}deg)`;
      actor.style.transform = `translate(${actorX}em, ${actorY}em) rotate(${pose.lean}deg) scaleY(${pose.squash})`;
      actor.style.opacity = String(pose.actorOpacity);
      shadow.style.transform = `translateX(${goalX + pose.x + letterWidth * 0.2}em)`;
      shadow.style.opacity = String(pose.actorOpacity * 0.16);
      ghosts.forEach((ghost) => {
        ghost.style.opacity = String(pose.ghostOpacity);
      });

      const time = timelineRef.current?.time() ?? 0;
      const nextPhase = time < 1.7 ? 0 : time < 3.1 ? 1 : time < 3.6 ? 2 : 3;

      if (nextPhase !== phase && phaseRef.current) {
        phase = nextPhase;
        phaseRef.current.textContent = PHASES[nextPhase];
      }
    };

    const showStill = (message: string) => {
      timelineRef.current?.kill();
      timelineRef.current = null;
      root.dataset.enhanced = "false";
      letter.style.removeProperty("transform");
      actor.style.opacity = "0";
      shadow.style.opacity = "0";
      ghosts.forEach((ghost) => ghost.style.removeProperty("opacity"));
      if (phaseRef.current) phaseRef.current.textContent = message;
      setPlaying(false);
    };

    const start = () => {
      if (disposed || !imageReady) return;
      setReducedMotion(motion.matches);
      if (motion.matches) {
        showStill("Still composition · reduced motion");

        return;
      }

      timelineRef.current?.kill();
      Object.assign(pose, INITIAL_POSE);
      phase = -1;
      measure();
      root.dataset.enhanced = "true";
      const timeline = gsap.timeline({
        paused: true,
        onUpdate: draw,
        onComplete: () => {
          root.dataset.enhanced = "false";
          setPlaying(false);
        },
      });

      timelineRef.current = timeline;
      timeline
        .to(pose, { actorOpacity: 1, duration: 0.3, ease: "power2.out" }, 0)
        .to(
          pose,
          { lean: -4, squash: 0.98, duration: 0.3, ease: "power2.inOut" },
          0.3,
        )
        .to(
          pose,
          {
            x: 1.2,
            rotation: 200,
            step: -0.025,
            duration: 1,
            ease: "power2.inOut",
          },
          0.6,
        )
        .to(
          pose,
          { lean: 0, squash: 1, step: 0, duration: 0.25, ease: "power2.out" },
          1.6,
        )
        .to(
          pose,
          { lean: -3, squash: 0.98, duration: 0.25, ease: "power2.inOut" },
          1.85,
        )
        .to(pose, { x: 0, rotation: 0, duration: 1.1, ease: "power2.inOut" }, 2)
        .to(
          pose,
          { x: -0.025, rotation: -5, duration: 0.13, ease: "power2.out" },
          3.1,
        )
        .to(
          pose,
          { x: 0, rotation: 0, duration: 0.3, ease: "power2.inOut" },
          3.23,
        )
        .to(pose, { ghostOpacity: 1, duration: 0.3, ease: "power2.out" }, 3.25)
        .to(
          pose,
          { lean: 0, squash: 1, duration: 0.3, ease: "power2.out" },
          3.5,
        )
        .to(
          pose,
          {
            retreat: 0.28,
            step: -0.06,
            lean: 3,
            duration: 0.25,
            ease: "power2.out",
          },
          3.85,
        )
        .to(
          pose,
          { retreat: 0.9, step: 0, duration: 0.65, ease: "power2.inOut" },
          4.1,
        )
        .to(
          pose,
          { actorOpacity: 0, duration: 0.4, ease: "power2.inOut" },
          4.55,
        );

      draw();
      setReady(true);
      setPlaying(true);
      timeline.timeScale(speedRef.current).play();
    };

    const onLoad = () => {
      if (!image.naturalWidth || disposed) return;
      imageReady = true;
      start();
    };
    const onError = () => {
      imageReady = false;
      setReady(false);
      showStill("Animation unavailable");
    };
    const onMotionChange = () => {
      setReducedMotion(motion.matches);
      if (motion.matches) showStill("Still composition · reduced motion");
      else start();
    };
    const onResize = () => {
      if (!timelineRef.current) return;
      measure();
      draw();
    };
    const onVisibilityChange = () => {
      if (document.hidden && timelineRef.current?.isActive()) {
        timelineRef.current.pause();
        setPlaying(false);
      }
    };

    image.addEventListener("load", onLoad);
    image.addEventListener("error", onError);
    motion.addEventListener("change", onMotionChange);
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    if (image.complete) {
      if (image.naturalWidth) onLoad();
      else onError();
    }
    void document.fonts.ready.then(() => {
      if (!disposed) onResize();
    });

    return () => {
      disposed = true;
      timelineRef.current?.kill();
      timelineRef.current = null;
      image.removeEventListener("load", onLoad);
      image.removeEventListener("error", onError);
      motion.removeEventListener("change", onMotionChange);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      letter.style.removeProperty("transform");
      ghosts.forEach((ghost) => ghost.style.removeProperty("opacity"));
      actor.style.opacity = "0";
      shadow.style.opacity = "0";
      delete root.dataset.enhanced;
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.root}>
      <h1 aria-label="We build worlds" className={styles.heading}>
        <span aria-hidden="true" className={styles.line}>
          WE{" "}
        </span>
        <span aria-hidden="true" className={styles.line}>
          BUILD{" "}
        </span>
        <span
          aria-hidden="true"
          className={`${styles.line} ${styles.worlds}`}
          data-explorer-world=""
        >
          <span className={styles.ghost} data-explorer-ghost="">
            W
          </span>
          <span className={styles.letter} data-explorer-letter="">
            O
          </span>
          <span className={styles.ghost} data-explorer-ghost="">
            RLDS
          </span>
          <span className={styles.baseline} data-explorer-baseline="" />
          <span className={styles.shadow} data-explorer-shadow="" />
          <span className={styles.actor} data-explorer-actor="">
            <Image
              unoptimized
              alt=""
              className={styles.image}
              data-explorer-image=""
              draggable={false}
              height={615}
              loading="eager"
              src={assetPath("/media/motion/explorer.webp")}
              width={768}
            />
          </span>
        </span>
      </h1>

      <div aria-label="Animation controls" className={styles.controls}>
        <div className={styles.buttons}>
          <button
            aria-label={playing ? "Pause animation" : "Play animation"}
            className={styles.playButton}
            disabled={!ready || reducedMotion}
            type="button"
            onClick={() => {
              const timeline = timelineRef.current;

              if (!timeline) return;
              if (playing) timeline.pause();
              else {
                if (rootRef.current) rootRef.current.dataset.enhanced = "true";
                if (timeline.progress() >= 1) timeline.restart();
                else timeline.play();
              }
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
            className={styles.textButton}
            disabled={!ready || reducedMotion}
            type="button"
            onClick={() => {
              if (rootRef.current) rootRef.current.dataset.enhanced = "true";
              timelineRef.current?.restart();
              setPlaying(true);
            }}
          >
            <RotateCcw aria-hidden="true" size={13} /> Replay
          </button>
          <button
            aria-pressed={slow}
            className={styles.speedButton}
            disabled={!ready || reducedMotion}
            type="button"
            onClick={() => {
              const next = !slow;

              speedRef.current = next ? 0.5 : 1;
              timelineRef.current?.timeScale(speedRef.current);
              setSlow(next);
            }}
          >
            0.5×
          </button>
        </div>
        <output ref={phaseRef} aria-live="polite" className={styles.phase}>
          {reducedMotion ? "Still composition · reduced motion" : PHASES[0]}
        </output>
      </div>
    </div>
  );
}
