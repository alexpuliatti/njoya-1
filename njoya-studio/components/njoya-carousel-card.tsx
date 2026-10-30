"use client";

import type {
  NjoyaCarouselItem,
  NjoyaClickPayload,
} from "@/lib/njoya-carousel-types";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { useRouter } from "next/navigation";

import Image from "./studio-image";
import StudioVideo from "./studio-video";

import { assetPath } from "@/lib/asset-path";
import { muxPlaybackUrl } from "@/lib/mux";
import {
  coverSize,
  imageSrcSet,
  panelImageSize,
  preferredImageSrc,
} from "@/lib/image-sources";

interface Props {
  item: NjoyaCarouselItem;
  onClick: (payload: NjoyaClickPayload) => void;
  resetSignal: number;
  priority?: boolean;
  home?: boolean;
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
  home = false,
}: Props) {
  const router = useRouter();
  const morphRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const gradRef = useRef<HTMLDivElement>(null);

  const hoverTl = useRef<gsap.core.Timeline | null>(null);
  const isLaunchingRef = useRef(false);
  const hasPrefetchedRef = useRef(false);
  const hasPreloadedHeroRef = useRef(false);

  const hasVideo = !!item.coverVideoPlaybackId;

  /* ── Reset to base ─────────────────────────────────── */
  const resetHover = useCallback(() => {
    hoverTl.current?.kill();
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : 0.22;
    const tl = gsap.timeline({
      onComplete: () => {
        isLaunchingRef.current = false;
        // Pause the video so it stops decoding when off-screen.
        // Don't reset currentTime — that flashes the very first
        // frame, which can differ from the poster thumbnail.
        if (videoRef.current) videoRef.current.pause();
      },
    });

    tl.to(morphRef.current, { y: 0, duration, ease: "power2.out" }, 0).to(
      [imgRef.current, gradRef.current],
      { scale: 1, duration, ease: "power2.out" },
      0,
    );

    if (videoRef.current) {
      tl.to(videoRef.current, { opacity: 0, duration, ease: "power2.out" }, 0);
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
      heroPreload.sizes = panelImageSize(item.cover);
      // Match the detail panel's candidate instead of fetching the largest
      // file on hover. AVIF support is already established by the card image.
      const selectedAvif = imgRef.current?.currentSrc.endsWith(".avif");
      const usePrimary =
        item.cover?.responsive?.format !== "avif" || selectedAvif;

      if (usePrimary) heroPreload.srcset = imageSrcSet(item.cover) ?? "";
      heroPreload.src = preferredImageSrc(
        usePrimary ? item.cover : undefined,
        item.heroImageUrl ?? item.imageUrl,
      );
    }

    hoverTl.current?.kill();
    const tl = gsap.timeline();

    tl.to(
      morphRef.current,
      { y: -3, duration: 0.25, ease: "power3.out" },
      0,
    ).to(
      [imgRef.current, gradRef.current],
      { scale: 1.025, duration: 0.28, ease: "power3.out" },
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
      tl.to(v, { opacity: 1, duration: 0.25, ease: "power2.out" }, 0.05);
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

  useEffect(
    () => () => {
      hoverTl.current?.kill();
    },
    [],
  );

  /* ── Click: launch detail panel ────────────────────── */
  const handleClick = (instant = false) => {
    if (!imgRef.current) return;
    isLaunchingRef.current = true;
    hoverTl.current?.kill();
    // Always pass the <img> — the panel clones the still poster,
    // which is what was visible (or about to be visible) anyway.
    onClick({
      item,
      imgEl: imgRef.current,
      fromRect: imgRef.current.getBoundingClientRect(),
      fromRadius: getComputedStyle(imgRef.current).borderTopLeftRadius,
      morphProg: 0,
      rotation: 0,
      instant,
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
      className="project-card relative cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#261b15]"
      role="button"
      tabIndex={0}
      onClick={(event) => handleClick(event.detail === 0)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick(true);
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={morphRef}
        className="project-card-media relative h-full w-full overflow-hidden"
      >
        {/* 1. Poster image — always rendered. For video items this
              is the Mux thumbnail (set in the server mapper). */}
        <Image
          ref={imgRef}
          fill
          alt={item.imageAlt ?? item.title}
          className="pointer-events-none absolute inset-0 block h-full w-full object-cover object-top"
          image={item.cover}
          priority={priority}
          sizes={`(max-width: 767px) ${coverSize("82vw", home ? "clamp(300px, 46svh, 540px)" : "clamp(350px, 59svh, 600px)", item.cover)}, (max-width: 1023px) ${coverSize("45vw", "clamp(390px, 64svh, 720px)", item.cover)}, ${coverSize("32vw", "clamp(390px, 64svh, 720px)", item.cover)}`}
          src={assetPath(item.imageUrl)}
          style={{ borderRadius: "var(--studio-radius)" }}
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
            style={{ opacity: 0, borderRadius: "var(--studio-radius)" }}
          />
        )}

        {/* 3. Bottom gradient */}
        <div
          ref={gradRef}
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(180deg, transparent 35%, rgba(16,11,8,0.12) 55%, rgba(16,11,8,0.82) 100%)",
            borderRadius: "var(--studio-radius)",
          }}
        />

        {/* 4. Card info */}
        <div className="project-card-info absolute bottom-0 left-0 right-0 z-[2]">
          <div className="project-card-category">{item.category}</div>
          {item.subtitle && item.type === "design-project" && (
            <div className="project-card-title">{item.subtitle}</div>
          )}
          {item.type === "shoot" && (
            <div className="project-card-title">{item.title}</div>
          )}
        </div>
      </div>
    </div>
  );
}
