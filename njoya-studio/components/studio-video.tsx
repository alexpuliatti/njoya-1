"use client";

import type { VideoHTMLAttributes } from "react";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

/** Adaptive HLS playback, with native fallback on browsers without MSE. */
const StudioVideo = forwardRef<
  HTMLVideoElement,
  VideoHTMLAttributes<HTMLVideoElement>
>(function StudioVideo({ src, ...props }, forwardedRef) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(forwardedRef, () => videoRef.current!, []);
  useEffect(() => {
    const video = videoRef.current;

    if (!video || !src) return;
    if (!src.includes(".m3u8")) {
      video.src = src;

      return;
    }
    let cancelled = false;
    let destroy: (() => void) | undefined;

    import("hls.js")
      .then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) {
          video.src = src;

          return;
        }
        const player = new Hls({ maxBufferLength: 10, maxMaxBufferLength: 30 });

        destroy = () => player.destroy();
        player.loadSource(src);
        player.attachMedia(video);
        player.on(Hls.Events.MANIFEST_PARSED, () => {
          if (video.autoplay) video.play().catch(() => undefined);
        });
      })
      .catch(() => {
        if (!cancelled) video.src = src;
      });

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [src]);

  return <video ref={videoRef} muted {...props} />;
});

export default StudioVideo;
