"use client";

import type { VideoHTMLAttributes } from "react";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Play } from "lucide-react";

import StudioVideo from "./studio-video";

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
  const previewing = useRef(false);
  const previewRequest = useRef(0);
  const [started, setStarted] = useState(false);
  const canPreview = autoplayPreview && !!previewSrc;

  const stopPreview = useCallback(() => {
    if (!previewing.current) return;
    previewing.current = false;
    previewRequest.current += 1;
    const video = videoRef.current;

    if (video) {
      video.pause();
      // Restore the prepared poster and cancel any pending preview play request.
      video.load();
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const syncPreview = () => {
      if (!visible || document.hidden) {
        stopPreview();
        video.pause();

        return;
      }
      if (!canPreview || started || motion.matches) {
        stopPreview();

        return;
      }
      if (previewing.current) return;
      previewing.current = true;
      const request = ++previewRequest.current;

      // Set the DOM property before play(), including in Safari.
      video.muted = true;
      video.play().catch(() => {
        if (request === previewRequest.current) previewing.current = false;
      });
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
      previewRequest.current += 1;
      previewing.current = false;
      video.pause();
    };
  }, [canPreview, started, stopPreview]);

  return (
    <div className="gallery-film-player">
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
            previewRequest.current += 1;
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
