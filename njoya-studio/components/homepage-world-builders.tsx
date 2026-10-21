"use client";

import type { RollingWorldHandle, RollingWorldState } from "./rolling-world";

import { useCallback, useEffect, useRef, useState } from "react";

import RollingWorld from "./rolling-world";
import WorldBuilderHeadline from "./world-builder-headline";

/** One shared heading and two actions starting together after the intro. */
export default function HomepageWorldBuilders() {
  const explorerRef = useRef<RollingWorldHandle>(null);
  const startTimer = useRef<number>();
  const [explorerSettled, setExplorerSettled] = useState(false);
  const markExplorerSettled = useCallback((state: RollingWorldState) => {
    if (
      state.ready ||
      state.phase === "Still composition · reduced motion" ||
      state.phase === "Animation unavailable"
    )
      setExplorerSettled(true);
  }, []);
  const startTogether = useCallback(() => {
    window.clearTimeout(startTimer.current);
    // Finish any media-query reset events before starting the explorer.
    startTimer.current = window.setTimeout(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      explorerRef.current?.restart();
    }, 0);
  }, []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const resetExplorer = () => {
      // The builder handles its own media change and supplies a fresh start.
      if (motion.matches) window.clearTimeout(startTimer.current);
      explorerRef.current?.reset();
    };

    motion.addEventListener("change", resetExplorer);
    return () => {
      window.clearTimeout(startTimer.current);
      motion.removeEventListener("change", resetExplorer);
    };
  }, []);

  return (
    <WorldBuilderHeadline
      playWhen={explorerSettled}
      onStart={startTogether}
      worlds={
        <RollingWorld
          ref={explorerRef}
          autoPlay={false}
          onStateChange={markExplorerSettled}
        />
      }
    />
  );
}
