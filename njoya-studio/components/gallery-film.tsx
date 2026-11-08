"use client";

import type { VideoHTMLAttributes } from "react";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Play } from "lucide-react";

import StudioVideo from "./studio-video";

import { createVideoPreview } from "@/lib/video-preview.mjs";

/** Visible Motion films preview silently; explicit play starts the full film with audio. */
export default function GalleryFilm({
  autoplayPreview = false,
  previewSrc,
  ...props
}: VideoHTMLAttributes<HTMLVideoElement> & {
  autoplayPreview?: boolean;
  previewSrc?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<ReturnType<typeof createVideoPreview> | null>(null);
  const [started, setStarted] = useState(false);
  const canPreview = autoplayPreview && !!previewSrc;

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const preview = canPreview && !started ? createVideoPreview(video) : null;

    previewRef.current = preview;
    let visible = false;
    const syncPreview = () => {
      if (preview) {
        preview.setActive(visible && !document.hidden && !motion.matches);
      } else if (!visible || document.hidden) {
        video.pause();
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPreview();
    });

    observer.observe(video);
    document.addEventListener("visibilitychange", syncPreview);
    motion.addEventListener("change", syncPreview);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPreview);
      motion.removeEventListener("change", syncPreview);
      preview?.dispose();
      previewRef.current = null;
      video.pause();
    };
  }, [canPreview, started]);

  return (
    <div className="gallery-film-player">
      <StudioVideo
        {...props}
        ref={videoRef}
        playsInline
        controls={!canPreview || started}
        loop={canPreview && !started}
        muted={canPreview && !started}
        preload={canPreview && !started ? "metadata" : "none"}
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
            previewRef.current?.dispose();
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
