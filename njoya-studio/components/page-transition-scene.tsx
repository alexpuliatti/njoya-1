"use client";

import { useEffect, useRef } from "react";

import styles from "./page-transition-scene.module.css";

import { assetPath } from "@/lib/asset-path";
import type { TransitionCharacter } from "@/lib/page-transition";

type Props = {
  character: TransitionCharacter;
  label: string;
  phase: "playing" | "waiting" | "leaving";
  onNavigate: () => void;
  onComplete: () => void;
};

const turns = {
  builder: "/media/motion/world-builder-turn.webp",
  explorer: "/media/motion/explorer-turn.webp",
};

/** A transparent sprite handoff; the provider owns navigation and focus. */
export default function PageTransitionScene({
  character,
  phase,
  onNavigate,
  onComplete,
}: Props) {
  const callbacks = useRef({ onNavigate, onComplete });

  callbacks.current = { onNavigate, onComplete };

  useEffect(() => {
    if (phase === "waiting") return;

    // Use elapsed time as well as CSS so navigation survives a cancelled
    // animation, a hidden tab, or an operating-system motion preference change.
    const timer = window.setTimeout(
      () => {
        if (phase === "playing") callbacks.current.onNavigate();
        else callbacks.current.onComplete();
      },
      phase === "playing" ? 320 : 200,
    );

    return () => window.clearTimeout(timer);
  }, [phase]);

  return (
    <div
      aria-hidden="true"
      className={styles.scene}
      data-character={character}
      data-phase={phase}
    >
      <div className={styles.stage}>
        <div className={styles.actor}>
          {character === "observer" ? (
            <>
              <span
                className={`${styles.sprite} ${styles.walk}`}
                style={{
                  backgroundImage: `url("${assetPath("/media/motion/observer-walk-right.webp")}")`,
                }}
              />
              <span
                className={`${styles.sprite} ${styles.jump}`}
                style={{
                  backgroundImage: `url("${assetPath("/media/motion/observer-jump.webp")}")`,
                }}
              />
            </>
          ) : (
            <span
              className={`${styles.sprite} ${styles.turn}`}
              style={{
                backgroundImage: `url("${assetPath(turns[character])}")`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
