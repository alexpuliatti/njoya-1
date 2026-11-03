"use client";

import type { ContentImage } from "@/lib/content/types";
import type { ObserverCharacterHandle } from "./observer-character";

import Link from "next/link";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import ObserverCharacter from "./observer-character";
import StudioImage from "./studio-image";
import styles from "./observer-study.module.css";

export default function ObserverStudy({
  image,
  title,
  href,
}: {
  image: ContentImage;
  title: string;
  href: string;
}) {
  const observer = useRef<ObserverCharacterHandle>(null);
  const progress = useRef<HTMLInputElement>(null);
  const output = useRef<HTMLOutputElement>(null);
  const phase = useRef(-1);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(motion.matches);

    update();
    motion.addEventListener("change", update);
    return () => motion.removeEventListener("change", update);
  }, []);

  return (
    <div className={styles.study}>
      <h1 className={styles.heading}>A closer look.</h1>
      <div className={styles.scene}>
        <div aria-hidden="true" className={styles.peekWindow}>
          <ObserverCharacter
            ref={observer}
            autoPlay
            revealFrom="left"
            onPlayingChange={setPlaying}
            onProgress={(value) => {
              if (progress.current) {
                progress.current.value = String(value * 100);
                progress.current.setAttribute(
                  "aria-valuenow",
                  String(value * 100),
                );
              }
              const next = value < 0.35 ? 0 : value < 0.7 ? 1 : 2;
              if (next !== phase.current && output.current) {
                phase.current = next;
                output.current.textContent = [
                  "Come a little closer",
                  "Take a look around",
                  "Back to the work",
                ][next];
              }
            }}
            onReady={setReady}
          />
        </div>
        <Link className={styles.project} href={href}>
          <StudioImage
            alt={image.alt}
            className={styles.projectImage}
            height={image.height}
            image={image}
            sizes="(max-width: 640px) 65vw, 35vw"
            src={image.src}
            width={image.width}
          />
          <span className={styles.caption}>
            <span>From the Lab</span>
            <strong>{title}</strong>
          </span>
        </Link>
      </div>
      <div aria-label="Animation controls" className={styles.controls}>
        <div className={styles.row}>
          <button
            aria-label={playing ? "Pause animation" : "Play animation"}
            className={styles.play}
            disabled={!ready || reduced}
            type="button"
            onClick={() => {
              if (playing) observer.current?.pause();
              else observer.current?.play();
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
            disabled={!ready || reduced}
            type="button"
            onClick={() => observer.current?.restart()}
          >
            <RotateCcw aria-hidden="true" size={13} /> Peek again
          </button>
          <button
            aria-label="Half-speed playback"
            aria-pressed={slow}
            className={styles.speed}
            disabled={!ready || reduced}
            type="button"
            onClick={() => {
              observer.current?.timeScale(slow ? 1 : 0.5);
              setSlow(!slow);
            }}
          >
            0.5×
          </button>
        </div>
        <input
          ref={progress}
          aria-label="Animation progress"
          className={styles.progress}
          defaultValue="0"
          disabled={!ready || reduced}
          max="100"
          min="0"
          step="0.1"
          type="range"
          onChange={(event) =>
            observer.current?.progress(Number(event.target.value) / 100)
          }
        />
        <output ref={output} aria-live="polite" className={styles.output}>
          {reduced
            ? "Still composition · reduced motion"
            : "Come a little closer"}
        </output>
      </div>
    </div>
  );
}
