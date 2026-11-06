"use client";

import type { VideoHTMLAttributes } from "react";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Play } from "lucide-react";

import StudioVideo from "./studio-video";

/** Hover is a silent preview; an explicit play keeps the film and audio running. */
export default function GalleryFilm({
  hoverPreview = false,
  previewSrc,
  ...props
}: VideoHTMLAttributes<HTMLVideoElement> & {
  hoverPreview?: boolean;
  previewSrc?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewing = useRef(false);
  const [started, setStarted] = useState(false);
  const canPreview = hoverPreview && !!previewSrc;

  const stopPreview = useCallback(() => {
    if (!previewing.current) return;
    previewing.current = false;
    const video = videoRef.current;

    if (video) {
      video.pause();
      // Restore the prepared poster and cancel any pending hover play request.
      video.load();
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pauseWhenHidden = () => {
      if (document.hidden) {
        stopPreview();
        video.pause();
      }
    };
    const reduceMotion = () => {
      if (motion.matches) stopPreview();
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        stopPreview();
        video.pause();
      }
    });

    observer.observe(video);
    document.addEventListener("visibilitychange", pauseWhenHidden);
    motion.addEventListener("change", reduceMotion);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", pauseWhenHidden);
      motion.removeEventListener("change", reduceMotion);
      video.pause();
    };
  }, [stopPreview]);

  return (
    <div
      className="gallery-film-player"
      onPointerEnter={(event) => {
        const video = videoRef.current;

        if (
          !canPreview ||
          started ||
          !video ||
          event.pointerType !== "mouse" ||
          !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          return;
        previewing.current = true;
        // Set the DOM property before play(), including in Safari.
        video.muted = true;
        video.play().catch(() => undefined);
      }}
      onPointerLeave={stopPreview}
    >
      <StudioVideo
        {...props}
        ref={videoRef}
        playsInline
        controls={!canPreview || started}
        loop={canPreview && !started}
        muted={canPreview && !started}
        preload="none"
        src={canPreview && !started ? previewSrc : props.src}
      />
      {canPreview && !started && (
        <button
          aria-label={`Play film: ${props["aria-label"] ?? "project film"}`}
          className="gallery-film-play"
          type="button"
          onClick={() => {
            const video = videoRef.current;

            if (!video) return;
            previewing.current = false;
            // Switch to the full film within the click gesture so browsers
            // can start its approved audio without losing user activation.
            flushSync(() => setStarted(true));
            video.play().catch(() => undefined);
          }}
        >
          <Play aria-hidden="true" fill="currentColor" size={24} />
        </button>
      )}
    </div>
  );
}
