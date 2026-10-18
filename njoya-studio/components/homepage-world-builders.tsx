"use client";

import type { ObserverCharacterHandle } from "./observer-character";
import type { RollingWorldHandle } from "./rolling-world";

import { useCallback, useEffect, useRef } from "react";

import ObserverCharacter from "./observer-character";
import RollingWorld from "./rolling-world";
import WorldBuilderHeadline from "./world-builder-headline";
import styles from "./homepage-world-builders.module.css";

/** One shared heading and three short actions, sequenced after the intro. */
export default function HomepageWorldBuilders() {
  const explorerRef = useRef<RollingWorldHandle>(null);
  const observerRef = useRef<ObserverCharacterHandle>(null);
  const phase = useRef<"builder" | "explorer" | "observer">("builder");
  const bringInExplorer = useCallback(() => {
    if (phase.current !== "builder") return;
    phase.current = "explorer";
    explorerRef.current?.restart();
  }, []);
  const bringInObserver = useCallback(() => {
    if (phase.current !== "explorer") return;
    phase.current = "observer";
    observerRef.current?.restart();
  }, []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const resetCompanions = () => {
      // The builder handles its own media change. Companions wait for its
      // completion again, even if they were midway through their previous turn.
      phase.current = "builder";
      explorerRef.current?.reset();
      observerRef.current?.reset();
    };

    motion.addEventListener("change", resetCompanions);
    return () => motion.removeEventListener("change", resetCompanions);
  }, []);

  return (
    <>
      <WorldBuilderHeadline
        onComplete={bringInExplorer}
        worlds={
          <RollingWorld
            ref={explorerRef}
            autoPlay={false}
            onComplete={bringInObserver}
          />
        }
      />
      <span aria-hidden="true" className={styles.observerWindow}>
        <ObserverCharacter
          ref={observerRef}
          autoPlay={false}
          revealFrom="right"
        />
      </span>
    </>
  );
}
