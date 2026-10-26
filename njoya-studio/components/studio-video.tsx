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

    // Native MP4 playback is owned by the rendered src attribute. Reassigning
    // it in an effect restarts loading, especially during hydration/refresh.
    if (!video || !src?.includes(".m3u8")) return;
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

  return (
    <video
      ref={videoRef}
      muted
      {...props}
      src={src?.includes(".m3u8") ? undefined : src}
    />
  );
});

export default StudioVideo;
