"use client";

import type { TiltedCardEntry } from "./react-bits/tilted-card";
import type {
  NjoyaCarouselItem,
  NjoyaClickPayload,
} from "@/lib/njoya-carousel-types";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { useRouter } from "next/navigation";

import Image from "./studio-image";
import StudioVideo from "./studio-video";
import SurfaceLight from "./ui/surface-light";
import TiltedCard from "./react-bits/tilted-card";

import { assetPath } from "@/lib/asset-path";
import { muxPlaybackUrl } from "@/lib/mux";
import { createVideoPreview } from "@/lib/video-preview.mjs";
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
  previewPaused?: boolean;
  priority?: boolean;
  home?: boolean;
  introDelay?: number;
  introState?: TiltedCardEntry;
}

/* ─────────────────────────────────────────────────────
   Card layers (bottom → top):
     1. <Image>  poster — always present, used as the
                 FLIP clone source. For video items this
                 is the Mux thumbnail; for image-only
                 items it's the cover image.
     2. <StudioVideo>  overlay — when a local or legacy preview exists.
                 Starts at opacity 0; fades in + plays on
                 hover, or while visible in Motion.
     3. gradient
     4. card info

   The FLIP click handler always uses the <img> ref —
   so the morph code in the detail panel stays generic.
─────────────────────────────────────────────────────── */
export default function NjoyaCarouselCard({
  item,
  onClick,
  resetSignal,
  previewPaused = false,
  priority = false,
  home = false,
  introDelay = 0,
  introState = "animate",
}: Props) {
  const router = useRouter();
  const morphRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const gradRef = useRef<HTMLDivElement>(null);

  const hoverTl = useRef<gsap.core.Timeline | null>(null);
  const videoFade = useRef<gsap.core.Tween | null>(null);
  const isHoveringRef = useRef(false);
  const previewRef = useRef<ReturnType<typeof createVideoPreview> | null>(null);
  const syncPreviewRef = useRef<(() => void) | null>(null);
  const isLaunchingRef = useRef(false);
  const hasPrefetchedRef = useRef(false);
  const hasPreloadedHeroRef = useRef(false);

  const videoSource = item.previewVideoSrc
    ? assetPath(item.previewVideoSrc)
    : item.coverVideoPlaybackId
      ? muxPlaybackUrl(item.coverVideoPlaybackId)
      : undefined;
  const hasVideo = !!videoSource;

  /* ── Reset to base ─────────────────────────────────── */
  const resetHover = useCallback((keepPreview = false) => {
    isHoveringRef.current = false;
    isLaunchingRef.current = false;
    hoverTl.current?.kill();
    if (!keepPreview) {
      previewRef.current?.setActive(false);
    }
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : 0.22;
    const tl = gsap.timeline();

    tl.to(morphRef.current, { y: 0, duration, ease: "power2.out" }, 0).to(
      [imgRef.current, gradRef.current],
      { scale: 1, duration, ease: "power2.out" },
      0,
    );

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
    isHoveringRef.current = true;

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
      { y: home ? 0 : -3, duration: 0.25, ease: "power3.out" },
      0,
    ).to(
      [imgRef.current, gradRef.current],
      { scale: 1.025, duration: 0.28, ease: "power3.out" },
      0,
    );

    syncPreviewRef.current?.();

    hoverTl.current = tl;
  };

  const handleMouseLeave = () => {
    if (isLaunchingRef.current) return;
    resetHover(!!item.videoOnly && !previewPaused);
  };

  useEffect(() => {
    if (isLaunchingRef.current) resetHover();
  }, [resetSignal, resetHover]);

  useEffect(
    () => () => {
      hoverTl.current?.kill();
      videoFade.current?.kill();
      isHoveringRef.current = false;
    },
    [],
  );

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const preview = createVideoPreview(video, {
      onPlaying: () => {
        videoFade.current?.kill();
        videoFade.current = gsap.to(video, {
          opacity: 1,
          duration: 0.25,
          ease: "power2.out",
        });
      },
      onStop: () => {
        videoFade.current?.kill();
        videoFade.current = gsap.to(video, {
          opacity: 0,
          duration: motion.matches ? 0 : 0.22,
          ease: "power2.out",
        });
      },
    });

    previewRef.current = preview;
    const syncPreview = () => {
      if (document.hidden || motion.matches || previewPaused || !visible) {
        resetHover();
      } else {
        preview.setActive(
          !isLaunchingRef.current &&
            (!!item.videoOnly || isHoveringRef.current),
        );
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncPreview();
    });

    observer.observe(video);
    syncPreviewRef.current = syncPreview;
    syncPreview();
    document.addEventListener("visibilitychange", syncPreview);
    motion.addEventListener("change", syncPreview);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPreview);
      motion.removeEventListener("change", syncPreview);
      preview.dispose();
      previewRef.current = null;
      syncPreviewRef.current = null;
      videoFade.current?.kill();
    };
  }, [hasVideo, item.videoOnly, previewPaused, resetHover, resetSignal]);

  /* ── Click: launch detail panel ────────────────────── */
  const handleClick = (instant = false) => {
    if (!imgRef.current) return;
    isLaunchingRef.current = true;
    isHoveringRef.current = false;
    hoverTl.current?.kill();
    videoFade.current?.kill();
    previewRef.current?.setActive(false);
    // Always pass the <img> — the panel clones the still poster,
    // which is what was visible (or about to be visible) anyway.
    onClick({
      item,
      imgEl: imgRef.current,
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

  const card = (
    <div
      aria-haspopup="dialog"
      aria-label={`View ${item.title}`}
      className={`${home ? "project-card-content" : "project-card"} relative cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#261b15]`}
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
          sizes={`(max-width: 767px) ${coverSize("84vw", home ? "max(228px, calc(100svh - 380px))" : "clamp(330px, 62svh, 600px)", item.cover)}, (max-width: 1023px) ${coverSize("45vw", "clamp(390px, 64svh, 720px)", item.cover)}, ${coverSize("32vw", "clamp(390px, 64svh, 720px)", item.cover)}`}
          src={assetPath(item.imageUrl)}
          style={{ borderRadius: "var(--studio-radius)" }}
        />

        {/* 2. Video overlay — only when this card has a cover video.
              Starts hidden until the silent preview is playing. */}
        {hasVideo && (
          <StudioVideo
            ref={videoRef}
            loop
            muted
            playsInline
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 block h-full w-full object-cover object-top"
            preload={item.videoOnly ? "metadata" : "none"}
            src={videoSource}
            style={{ opacity: 0, borderRadius: "var(--studio-radius)" }}
            tabIndex={-1}
          />
        )}

        {/* 3. Bottom gradient */}
        <div
          ref={gradRef}
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(180deg, transparent 35%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.75) 75%, rgba(0,0,0,0.97) 100%)",
            borderRadius: "var(--studio-radius)",
          }}
        />

        {/* 4. Card info */}
        <SurfaceLight />
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

  return home ? (
    <TiltedCard
      className="project-card"
      entry={introState}
      introDelay={introDelay}
    >
      {card}
    </TiltedCard>
  ) : (
    card
  );
}
