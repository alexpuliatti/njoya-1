"use client";

import Image from "next/image";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import gsap from "gsap";

import styles from "./rolling-world.module.css";

import { assetPath } from "@/lib/asset-path";

const INITIAL_POSE = {
  x: 2.15,
  rotation: 360,
  lean: 0,
  step: 0,
  squash: 1,
  retreat: 0,
  actorOpacity: 0,
  letterOpacity: 0,
  slotOpacity: 0.2,
  ghostOpacity: 0.2,
};

const PHASES = [
  "Find a little momentum",
  "Keep it rolling",
  "Steady, steady",
  "A world takes shape",
];

export type RollingWorldHandle = {
  reset(): void;
  restart(): void;
  play(): void;
  pause(): void;
  progress(value: number): void;
  timeScale(value: number): void;
};

export type RollingWorldState = {
  ready: boolean;
  playing: boolean;
  reducedMotion: boolean;
  phase: string;
};

type Props = {
  autoPlay?: boolean;
  className?: string;
  onComplete?: () => void;
  onStateChange?: (state: RollingWorldState) => void;
};

/** A reusable word line: study controls live outside it, never inside a link. */
const RollingWorld = forwardRef<RollingWorldHandle, Props>(
  function RollingWorld(
    { autoPlay = true, className = "", onComplete, onStateChange },
    ref,
  ) {
    const rootRef = useRef<HTMLSpanElement>(null);
    const actionsRef = useRef<RollingWorldHandle | null>(null);
    const requestedRef = useRef(autoPlay);
    const speedRef = useRef(1);
    const unavailableRef = useRef(false);
    const callbacksRef = useRef({ onComplete, onStateChange });

    useEffect(() => {
      callbacksRef.current = { onComplete, onStateChange };
    }, [onComplete, onStateChange]);

    useImperativeHandle(
      ref,
      () => ({
        reset() {
          requestedRef.current = false;
          actionsRef.current?.reset();
        },
        restart() {
          requestedRef.current = true;
          if (unavailableRef.current) callbacksRef.current.onComplete?.();
          else actionsRef.current?.restart();
        },
        play() {
          requestedRef.current = true;
          actionsRef.current?.play();
        },
        pause() {
          actionsRef.current?.pause();
        },
        progress(value) {
          actionsRef.current?.progress(value);
        },
        timeScale(value) {
          speedRef.current = value;
          actionsRef.current?.timeScale(value);
        },
      }),
      [],
    );

    useEffect(() => {
      const world = rootRef.current;

      if (!world) return;

      const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const letter = world.querySelector<HTMLElement>("[data-rolling-letter]")!;
      const actor = world.querySelector<HTMLElement>("[data-rolling-actor]")!;
      const image = world.querySelector<HTMLImageElement>(
        "[data-rolling-image]",
      )!;
      const baseline = world.querySelector<HTMLElement>(
        "[data-rolling-baseline]",
      )!;
      const shadow = world.querySelector<HTMLElement>("[data-rolling-shadow]")!;
      const slot = world.querySelector<HTMLElement>("[data-rolling-slot]")!;
      const ghosts = world.querySelectorAll<HTMLElement>(
        "[data-rolling-ghost]",
      );
      const pose = { ...INITIAL_POSE };
      let timeline: gsap.core.Timeline | null = null;
      let disposed = false;
      let imageReady = false;
      let resumeWhenVisible = false;
      let phase = -1;
      let goalX = 0.9;
      let floor = 0.92;
      let letterWidth = 0.8;
      let actorWidth = 1.5;
      let actorHeight = 1.2;
      let status: RollingWorldState = {
        ready: false,
        playing: false,
        reducedMotion: motion.matches,
        phase: PHASES[0],
      };

      const report = (patch: Partial<RollingWorldState>) => {
        status = { ...status, ...patch };
        callbacksRef.current.onStateChange?.(status);
      };
      const measure = () => {
        const fontSize = parseFloat(window.getComputedStyle(letter).fontSize);
        const previousTransform = letter.style.transform;

        letter.style.removeProperty("transform");
        const worldBounds = world.getBoundingClientRect();
        const letterBounds = letter.getBoundingClientRect();

        goalX = (letterBounds.left - worldBounds.left) / fontSize;
        floor =
          (baseline.getBoundingClientRect().top - worldBounds.top) / fontSize;
        letterWidth = letter.offsetWidth / fontSize;
        actorWidth = actor.offsetWidth / fontSize;
        actorHeight = actor.offsetHeight / fontSize;
        letter.style.transform = previousTransform;
        shadow.style.top = String(floor + 0.01) + "em";
        slot.style.left = String(goalX) + "em";
        slot.style.top =
          String((letterBounds.top - worldBounds.top) / fontSize) + "em";
      };
      const draw = () => {
        const bump =
          -Math.abs(Math.sin((pose.rotation * Math.PI) / 180)) * 0.025;
        const actorX =
          goalX +
          pose.x +
          letterWidth * 0.88 -
          actorWidth * 0.07 +
          pose.retreat;
        const actorY = floor - actorHeight * 0.986 + pose.step;

        letter.style.transform =
          "translate(" +
          pose.x +
          "em, " +
          bump +
          "em) rotate(" +
          pose.rotation +
          "deg)";
        letter.style.opacity = String(pose.letterOpacity);
        slot.style.opacity = String(pose.slotOpacity);
        actor.style.transform =
          "translate(" +
          actorX +
          "em, " +
          actorY +
          "em) rotate(" +
          pose.lean +
          "deg) scaleY(" +
          pose.squash +
          ")";
        actor.style.opacity = String(pose.actorOpacity);
        shadow.style.transform =
          "translateX(" + (goalX + pose.x + letterWidth * 0.2) + "em)";
        shadow.style.opacity = String(pose.actorOpacity * 0.16);
        ghosts.forEach((ghost) => {
          ghost.style.opacity = String(pose.ghostOpacity);
        });

        const time = timeline?.time() ?? 0;
        const nextPhase = time < 1.7 ? 0 : time < 3.1 ? 1 : time < 3.6 ? 2 : 3;

        if (nextPhase !== phase) {
          phase = nextPhase;
          report({ phase: PHASES[nextPhase] });
        }
      };
      const showStill = (message: string) => {
        timeline?.kill();
        timeline = null;
        world.dataset.enhanced = "false";
        letter.style.removeProperty("transform");
        letter.style.removeProperty("opacity");
        actor.style.opacity = "0";
        shadow.style.opacity = "0";
        slot.style.opacity = "0";
        ghosts.forEach((ghost) => ghost.style.removeProperty("opacity"));
        report({
          ready: false,
          playing: false,
          reducedMotion: motion.matches,
          phase: message,
        });
      };
      const restart = () => {
        if (!timeline || motion.matches || document.hidden) return;
        timeline.pause(0);
        Object.assign(pose, INITIAL_POSE);
        timeline.invalidate();
        phase = -1;
        measure();
        world.dataset.enhanced = "true";
        draw();
        report({ playing: true });
        timeline.timeScale(speedRef.current).restart();
      };
      const createTimeline = () => {
        if (disposed || !imageReady) return;
        if (motion.matches) {
          showStill("Still composition · reduced motion");
          return;
        }
        timeline?.kill();
        Object.assign(pose, INITIAL_POSE);
        phase = -1;
        measure();
        timeline = gsap.timeline({
          paused: true,
          onUpdate: draw,
          onComplete: () => {
            world.dataset.enhanced = "false";
            requestedRef.current = false;
            report({ playing: false });
            callbacksRef.current.onComplete?.();
          },
        });
        timeline
          .to(
            pose,
            {
              actorOpacity: 1,
              letterOpacity: 1,
              duration: 0.3,
              ease: "power2.out",
            },
            0,
          )
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
          .to(
            pose,
            { x: 0, rotation: 0, duration: 1.1, ease: "power2.inOut" },
            2,
          )
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
          .to(
            pose,
            {
              ghostOpacity: 1,
              slotOpacity: 0,
              duration: 0.3,
              ease: "power2.out",
            },
            3.25,
          )
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
        report({ ready: true, reducedMotion: false });
        if (requestedRef.current) restart();
      };
      actionsRef.current = {
        reset() {
          resumeWhenVisible = false;
          timeline?.pause(0, true);
          world.dataset.enhanced = "false";
          letter.style.removeProperty("transform");
          letter.style.removeProperty("opacity");
          actor.style.opacity = "0";
          shadow.style.opacity = "0";
          slot.style.opacity = "0";
          ghosts.forEach((ghost) => ghost.style.removeProperty("opacity"));
          report({ playing: false, phase: PHASES[0] });
        },
        restart,
        play() {
          if (!timeline || motion.matches) return;
          if (timeline.progress() >= 1) restart();
          else {
            world.dataset.enhanced = "true";
            timeline.play();
            report({ playing: true });
          }
        },
        pause() {
          resumeWhenVisible = false;
          timeline?.pause();
          report({ playing: false });
        },
        progress(value) {
          if (!timeline || motion.matches) return;
          world.dataset.enhanced = "true";
          timeline.pause().progress(Math.max(0, Math.min(1, value)));
          report({ playing: false });
        },
        timeScale(value) {
          timeline?.timeScale(value);
        },
      };
      const onLoad = () => {
        if (!image.naturalWidth || disposed) return;
        imageReady = true;
        unavailableRef.current = false;
        createTimeline();
      };
      const onError = () => {
        imageReady = false;
        unavailableRef.current = true;
        showStill("Animation unavailable");
        if (requestedRef.current) {
          requestedRef.current = false;
          callbacksRef.current.onComplete?.();
        }
      };
      const onMotionChange = () => {
        if (motion.matches) showStill("Still composition · reduced motion");
        else createTimeline();
      };
      const onResize = () => {
        if (!timeline) return;
        measure();
        if (world.dataset.enhanced === "true") draw();
      };
      const onVisibilityChange = () => {
        if (document.hidden && timeline?.isActive()) {
          resumeWhenVisible = true;
          timeline.pause();
          report({ playing: false });
        } else if (!document.hidden && resumeWhenVisible && timeline) {
          resumeWhenVisible = false;
          timeline.play();
          report({ playing: true });
        } else if (
          !document.hidden &&
          requestedRef.current &&
          timeline?.time() === 0
        )
          restart();
      };

      report({ reducedMotion: motion.matches });
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
        timeline?.kill();
        actionsRef.current = null;
        image.removeEventListener("load", onLoad);
        image.removeEventListener("error", onError);
        motion.removeEventListener("change", onMotionChange);
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        letter.style.removeProperty("transform");
        letter.style.removeProperty("opacity");
        ghosts.forEach((ghost) => ghost.style.removeProperty("opacity"));
        actor.style.opacity = "0";
        shadow.style.opacity = "0";
        slot.style.opacity = "0";
        delete world.dataset.enhanced;
      };
    }, []);

    return (
      <span
        ref={rootRef}
        aria-hidden="true"
        className={styles.world + " " + className}
      >
        <span className={styles.ghost} data-rolling-ghost="">
          W
        </span>
        <span className={styles.letter} data-rolling-letter="">
          O
        </span>
        <span className={styles.ghost} data-rolling-ghost="">
          RLDS
        </span>
        <span className={styles.baseline} data-rolling-baseline="" />
        <span className={styles.slot} data-rolling-slot="">
          O
        </span>
        <span className={styles.shadow} data-rolling-shadow="" />
        <span className={styles.actor} data-rolling-actor="">
          <Image
            unoptimized
            alt=""
            className={styles.image}
            data-rolling-image=""
            draggable={false}
            height={615}
            loading="eager"
            src={assetPath("/media/motion/explorer.webp")}
            width={768}
          />
        </span>
      </span>
    );
  },
);

export default RollingWorld;
