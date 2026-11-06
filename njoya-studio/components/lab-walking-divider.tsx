"use client";

import { useEffect, useRef } from "react";

import { GradientDivider } from "./gradient-components/gradient-divider";
import styles from "./lab-walking-divider.module.css";

import { assetPath } from "@/lib/asset-path";
import {
  BUILD_ACTION_DURATION_MS,
  BUILD_BRICK_SIZE,
  BUILD_POSE_COUNT,
  sampleBuildAction,
} from "@/lib/character-actions";
import type { BuildActionSample, BrickPoint } from "@/lib/character-actions";

type CharacterAction = "walk" | "build" | "dance";
const actionSprite = (action: CharacterAction, direction: "left" | "right") =>
  assetPath(
    action === "walk"
      ? `/media/motion/observer-walk-${direction}.webp`
      : `/media/motion/observer-${action}.webp`,
  );

/** Drawn character actions pause when their Lab divider leaves the viewport. */
export default function LabWalkingDivider({
  direction = "right",
  action = "walk",
}: {
  direction?: "left" | "right";
  action?: CharacterAction;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const performerRef = useRef<HTMLSpanElement>(null);
  const framesRef = useRef<HTMLSpanElement>(null);
  const brickRefs = useRef<(HTMLSpanElement | null)[]>([]);

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
    let buildElapsed = 0;
    let buildStartedAt: number | null = null;
    let buildTimer: number | undefined;
    let lastBuildStep = -1;
    const lastBrickPositions: (BrickPoint | null)[] = [null, null, null];

    const drawBuild = (sample: BuildActionSample) => {
      if (sample.step === lastBuildStep) return;
      lastBuildStep = sample.step;
      if (framesRef.current)
        framesRef.current.style.transform = `translate3d(${(-sample.pose * 100) / BUILD_POSE_COUNT}%, 0, 0)`;
      sample.bricks.forEach((prop, index) => {
        const brick = brickRefs.current[index];
        const point = prop?.position ?? null;

        if (!brick) return;
        // The same element changes from a front-of-body held prop to a fixed
        // brick behind the hands, even when the handoff keeps its exact point.
        brick.dataset.state = prop?.state ?? "hidden";
        if (point === lastBrickPositions[index]) return;
        lastBrickPositions[index] = point;
        brick.style.visibility = point ? "visible" : "hidden";
        if (point)
          brick.style.transform = `translate3d(${(point[0] / BUILD_BRICK_SIZE.width) * 100}%, ${(point[1] / BUILD_BRICK_SIZE.height) * 100}%, 0)`;
      });
      root.dataset.buildStep = String(sample.step);
      root.dataset.placedBricks = String(sample.placedCount);
    };
    const pauseBuild = () => {
      if (buildStartedAt !== null) {
        buildElapsed = Math.min(
          BUILD_ACTION_DURATION_MS,
          buildElapsed + performance.now() - buildStartedAt,
        );
        buildStartedAt = null;
      }
      window.clearTimeout(buildTimer);
      buildTimer = undefined;
    };
    const tickBuild = () => {
      if (disposed || buildStartedAt === null) return;
      const elapsed = buildElapsed + performance.now() - buildStartedAt;

      const sample = sampleBuildAction(elapsed);

      drawBuild(sample);
      if (sample.completed) {
        buildElapsed = BUILD_ACTION_DURATION_MS;
        buildStartedAt = null;
        buildTimer = undefined;
        return;
      }
      // One shared four-Hz clock selects both the pose and all three props.
      // The final hold schedules no intermediate callbacks or DOM writes.
      buildTimer = window.setTimeout(
        tickBuild,
        Math.max(1, sample.nextChangeInMs),
      );
    };
    const playBuild = () => {
      if (buildStartedAt !== null) return;
      if (buildElapsed >= BUILD_ACTION_DURATION_MS) {
        drawBuild(sampleBuildAction(buildElapsed));
        return;
      }
      buildStartedAt = performance.now();
      tickBuild();
    };

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
        pauseBuild();
        if (action === "build") drawBuild(sampleBuildAction(buildElapsed));
        root.dataset.state = "still";
        return;
      }
      const playing =
        loaded && inView && !document.hidden && (action !== "walk" || !!travel);

      root.dataset.state = playing ? "playing" : "paused";
      if (action === "build") {
        if (playing) playBuild();
        else pauseBuild();
      }
      if (playing) travel?.play();
      else travel?.pause();
    };
    const measure = () => {
      if (disposed) return;
      stopTravel();
      const width = root.clientWidth;
      const characterWidth = performer.offsetWidth;
      if (action !== "walk") {
        const space = Math.max(0, width - characterWidth);
        const position = space * (action === "build" ? 0.18 : 0.5);

        performer.style.transform = `translate3d(${position}px, 0, 0)`;
        sync();
        return;
      }
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
    image.src = actionSprite(action, direction);
    const images = [image];

    if (action === "build") {
      const brick = new window.Image();

      brick.src = assetPath("/media/motion/observer-brick.webp");
      images.push(brick);
      drawBuild(sampleBuildAction(0));
    }
    void Promise.all(images.map((asset) => asset.decode()))
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
      pauseBuild();
      stopTravel();
      visibility.disconnect();
      resize.disconnect();
      motion.removeEventListener("change", measure);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [action, direction]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={styles.rail}
      data-action={action}
      data-direction={direction}
      data-ready="false"
      data-state="paused"
    >
      <GradientDivider animation="none" thickness="3px" />
      <span ref={performerRef} className={styles.performer}>
        <span className={styles.window}>
          {action === "build"
            ? [0, 1, 2].map((index) => (
                <span
                  key={index}
                  ref={(element) => {
                    brickRefs.current[index] = element;
                  }}
                  className={styles.brick}
                  data-brick={index + 1}
                  style={{
                    backgroundImage: `url("${assetPath("/media/motion/observer-brick.webp")}")`,
                  }}
                />
              ))
            : null}
          <span
            ref={framesRef}
            className={styles.frames}
            style={{
              backgroundImage: `url("${actionSprite(action, direction)}")`,
            }}
          />
        </span>
      </span>
    </div>
  );
}
