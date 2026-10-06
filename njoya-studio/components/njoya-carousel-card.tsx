"use client";

import type {
  NjoyaCarouselItem,
  NjoyaClickPayload,
} from "@/lib/njoya-carousel-types";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { useRouter } from "next/navigation";
import Image from "next/image";

import StudioVideo from "./studio-video";

import { muxPlaybackUrl } from "@/lib/mux";

interface Props {
  item: NjoyaCarouselItem;
  onClick: (payload: NjoyaClickPayload) => void;
  resetSignal: number;
  priority?: boolean;
}

/* ─────────────────────────────────────────────────────
   Card layers (bottom → top):
     1. <Image>  poster — always present, used as the
                 FLIP clone source. For video items this
                 is the Mux thumbnail; for image-only
                 items it's the cover image.
     2. <StudioVideo>  overlay — only when coverVideoPlaybackId.
                 Starts at opacity 0; fades in + plays on
                 hover, fades out + pauses on leave.
     3. gradient
     4. card info

   The FLIP click handler always uses the <img> ref —
   so the morph code in the detail panel stays generic.
─────────────────────────────────────────────────────── */
export default function NjoyaCarouselCard({
  item,
  onClick,
  resetSignal,
  priority = false,
}: Props) {
  const router = useRouter();
  const morphRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const gradRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  const hoverTl = useRef<gsap.core.Timeline | null>(null);
  const isLaunchingRef = useRef(false);
  const hasPrefetchedRef = useRef(false);
  const hasPreloadedHeroRef = useRef(false);

  const hasVideo = !!item.coverVideoPlaybackId;

  /* ── Reset to base ─────────────────────────────────── */
  const resetHover = useCallback(() => {
    hoverTl.current?.kill();
    const tl = gsap.timeline({
      onComplete: () => {
        isLaunchingRef.current = false;
        // Pause the video so it stops decoding when off-screen.
        // Don't reset currentTime — that flashes the very first
        // frame, which can differ from the poster thumbnail.
        if (videoRef.current) videoRef.current.pause();
      },
    });

    tl.to(morphRef.current, { y: 0, duration: 0.35, ease: "power2.out" }, 0)
      .to(
        [imgRef.current, gradRef.current],
        { scale: 1, duration: 0.35, ease: "power2.out" },
        0,
      )
      .to(
        infoRef.current,
        { opacity: 1, duration: 0.35, ease: "power2.out" },
        0,
      );

    if (videoRef.current) {
      tl.to(
        videoRef.current,
        { opacity: 0, duration: 0.3, ease: "power2.out" },
        0,
      );
    }

    hoverTl.current = tl;
  }, []);

  /* ── Hover in ──────────────────────────────────────── */
  const handleMouseEnter = () => {
    if (
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    if (isLaunchingRef.current) return;

    if (item.isMultiEdition && item.href && !hasPrefetchedRef.current) {
      router.prefetch(item.href);
      hasPrefetchedRef.current = true;
    }

    if (!hasPreloadedHeroRef.current && typeof window !== "undefined") {
      hasPreloadedHeroRef.current = true;
      const heroPreload = new window.Image();

      heroPreload.decoding = "async";
      heroPreload.src = `/_next/image?url=${encodeURIComponent(
        item.imageUrl,
      )}&w=1920&q=75`;
    }

    hoverTl.current?.kill();
    const tl = gsap.timeline();

    tl.to(morphRef.current, { y: -10, duration: 0.45, ease: "power3.out" }, 0)
      .to(
        [imgRef.current, gradRef.current],
        { scale: 1.06, duration: 0.5, ease: "power3.out" },
        0,
      )
      .to(
        infoRef.current,
        { opacity: 0, duration: 0.25, ease: "power2.out" },
        0,
      );

    // Kick the video: play first (so the frame is decoded), then
    // fade it in over the poster. play() returns a Promise that may
    // reject on autoplay policy — we swallow it because muted videos
    // are allowed to autoplay everywhere.
    if (videoRef.current) {
      const v = videoRef.current;
      const playPromise = v.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => undefined);
      }
      tl.to(v, { opacity: 1, duration: 0.4, ease: "power2.out" }, 0.05);
    }

    hoverTl.current = tl;
  };

  const handleMouseLeave = () => {
    if (isLaunchingRef.current) return;
    resetHover();
  };

  useEffect(() => {
    if (isLaunchingRef.current) resetHover();
  }, [resetSignal, resetHover]);

  /* ── Click: launch detail panel ────────────────────── */
  const handleClick = () => {
    if (!imgRef.current) return;
    isLaunchingRef.current = true;
    hoverTl.current?.kill();
    // Always pass the <img> — the panel clones the still poster,
    // which is what was visible (or about to be visible) anyway.
    onClick({
      item,
      imgEl: imgRef.current,
      fromRect: imgRef.current.getBoundingClientRect(),
      fromRadius: "20px",
      morphProg: 0,
      rotation: 0,
    });
  };

  if (item.unavailable) {
    return (
      <div className="project-card pending-project">
        <span className="eyebrow">Selected project</span>
        <span aria-hidden="true" className="pending-project-symbol">
          J
        </span>
        <div>
          <h2>{item.title}</h2>
          <p>Coming soon</p>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-label={`View ${item.title}`}
      className="project-card relative cursor-pointer select-none rounded-[24px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#261b15]"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={morphRef}
        className="relative h-full w-full overflow-hidden rounded-[20px]"
      >
        {/* 1. Poster image — always rendered. For video items this
              is the Mux thumbnail (set in the server mapper). */}
        <Image
          ref={imgRef}
          fill
          alt={item.imageAlt ?? item.title}
          className="pointer-events-none absolute inset-0 block h-full w-full object-cover object-top"
          priority={priority}
          sizes="(max-width: 767px) 82vw, (max-width: 1023px) 45vw, 32vw"
          src={item.imageUrl}
          style={{ borderRadius: "20px" }}
        />

        {/* 2. Video overlay — only when this card has a cover video.
              Starts hidden; hover handler fades it in + plays it. */}
        {hasVideo && (
          <StudioVideo
            ref={videoRef}
            loop
            muted
            playsInline
            className="pointer-events-none absolute inset-0 block h-full w-full object-cover object-top"
            preload="metadata"
            src={muxPlaybackUrl(item.coverVideoPlaybackId!)}
            style={{ opacity: 0, borderRadius: "20px" }}
          />
        )}

        {/* 3. Bottom gradient */}
        <div
          ref={gradRef}
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(to bottom, transparent 42%, rgba(0,0,0,0.82) 100%)",
            borderRadius: "20px",
          }}
        />

        {/* 4. Card info */}
        <div
          ref={infoRef}
          className="absolute bottom-0 left-0 right-0 z-[2] p-4"
        >
          <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/50">
            {item.category}
          </div>
          {item.subtitle && item.type === "design-project" && (
            <div className="mb-1.5 text-sm font-semibold uppercase leading-tight text-white">
              {item.subtitle}
            </div>
          )}
          {item.type === "shoot" && (
            <div className="mb-1.5 text-sm font-semibold uppercase leading-tight text-white">
              {item.title}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
