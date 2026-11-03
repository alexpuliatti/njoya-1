"use client";

import type { ObserverCharacterHandle } from "./observer-character";
import type { RollingWorldHandle, RollingWorldState } from "./rolling-world";

import { useCallback, useEffect, useRef, useState } from "react";

import ObserverCharacter from "./observer-character";
import RollingWorld from "./rolling-world";
import WorldBuilderHeadline from "./world-builder-headline";
import styles from "./homepage-world-builders.module.css";

/** One shared heading and three actions starting together after the intro. */
export default function HomepageWorldBuilders() {
  const explorerRef = useRef<RollingWorldHandle>(null);
  const observerRef = useRef<ObserverCharacterHandle>(null);
  const startTimer = useRef<number>();
  const [explorerSettled, setExplorerSettled] = useState(false);
  const [observerSettled, setObserverSettled] = useState(false);
  const markExplorerSettled = useCallback((state: RollingWorldState) => {
    if (
      state.ready ||
      state.phase === "Still composition · reduced motion" ||
      state.phase === "Animation unavailable"
    )
      setExplorerSettled(true);
  }, []);
  const markObserverSettled = useCallback(() => setObserverSettled(true), []);
  const startTogether = useCallback(() => {
    window.clearTimeout(startTimer.current);
    // Finish any media-query reset events before starting both companions.
    startTimer.current = window.setTimeout(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      explorerRef.current?.restart();
      observerRef.current?.restart();
    }, 0);
  }, []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const resetCompanions = () => {
      // The builder handles its own media change and supplies a fresh start.
      if (motion.matches) window.clearTimeout(startTimer.current);
      explorerRef.current?.reset();
      observerRef.current?.reset();
    };

    motion.addEventListener("change", resetCompanions);
    return () => {
      window.clearTimeout(startTimer.current);
      motion.removeEventListener("change", resetCompanions);
    };
  }, []);

  return (
    <>
      <WorldBuilderHeadline
        playWhen={explorerSettled && observerSettled}
        onStart={startTogether}
        worlds={
          <RollingWorld
            ref={explorerRef}
            autoPlay={false}
            onStateChange={markExplorerSettled}
          />
        }
      />
      <span aria-hidden="true" className={styles.observerWindow}>
        <ObserverCharacter
          ref={observerRef}
          autoPlay={false}
          revealFrom="right"
          onReady={markObserverSettled}
        />
      </span>
    </>
  );
}
