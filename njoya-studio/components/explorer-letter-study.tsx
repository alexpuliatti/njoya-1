"use client";

import type { RollingWorldHandle, RollingWorldState } from "./rolling-world";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import RollingWorld from "./rolling-world";
import styles from "./explorer-letter-study.module.css";

export default function ExplorerLetterStudy() {
  const worldRef = useRef<RollingWorldHandle>(null);
  const [slow, setSlow] = useState(false);
  const [state, setState] = useState<RollingWorldState>({
    ready: false,
    playing: false,
    reducedMotion: false,
    phase: "Find a little momentum",
  });
  const onStateChange = useCallback(
    (next: RollingWorldState) => setState(next),
    [],
  );
  const disabled = !state.ready || state.reducedMotion;

  return (
    <div className={styles.root}>
      <h1 aria-label="We build worlds" className={styles.heading}>
        <span aria-hidden="true" className={styles.line}>
          WE{" "}
        </span>
        <span aria-hidden="true" className={styles.line}>
          BUILD{" "}
        </span>
        <RollingWorld ref={worldRef} onStateChange={onStateChange} />
      </h1>
      <div aria-label="Animation controls" className={styles.controls}>
        <div className={styles.buttons}>
          <button
            aria-label={state.playing ? "Pause animation" : "Play animation"}
            className={styles.playButton}
            disabled={disabled}
            type="button"
            onClick={() => {
              if (state.playing) worldRef.current?.pause();
              else worldRef.current?.play();
            }}
          >
            {state.playing ? (
              <Pause aria-hidden="true" size={14} />
            ) : (
              <Play aria-hidden="true" size={14} />
            )}
          </button>
          <button
            className={styles.textButton}
            disabled={disabled}
            type="button"
            onClick={() => worldRef.current?.restart()}
          >
            <RotateCcw aria-hidden="true" size={13} /> Replay
          </button>
          <button
            aria-label="Half-speed playback"
            aria-pressed={slow}
            className={styles.speedButton}
            disabled={disabled}
            type="button"
            onClick={() => {
              const next = !slow;
              worldRef.current?.timeScale(next ? 0.5 : 1);
              setSlow(next);
            }}
          >
            0.5×
          </button>
        </div>
        <output aria-live="polite" className={styles.phase}>
          {state.phase}
        </output>
      </div>
    </div>
  );
}
