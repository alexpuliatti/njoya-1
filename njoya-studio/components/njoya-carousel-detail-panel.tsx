"use client";

import type { NjoyaClickPayload } from "@/lib/njoya-carousel-types";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";

import Image from "./studio-image";
import MediaGallery from "./media-gallery";
import StudioVideo from "./studio-video";

import { panelImageSize } from "@/lib/image-sources";
import { assetPath } from "@/lib/asset-path";
import { muxPlaybackUrl } from "@/lib/mux";

interface Props {
  clickPayload: NjoyaClickPayload | null;
  onClose: () => void;
}

/* Desktop sidebar reveal.
   The credits sit out of flow (absolute, below the title) so the title
   lands in the same spot for every item regardless of how many credits
   it carries. On scroll the whole sidebar slides up by half the credits
   height + gap, which optically re-centers the title+credits group.
   SHOW/HIDE ratios differ to give the toggle a dead-band. */
const META_SHOW_RATIO = 0.4;
const META_HIDE_RATIO = 0.32;
const META_GAP = 24; // matches mt-6 on the credits block
const META_MAX_SHIFT_RATIO = 0.26;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ─────────────────────────────────────────────────────
   Detail panel — FLIP into a centered hero, then a
   vertically-scrollable gallery below.

   VIDEO SUPPORT
   - If item.coverVideoPlaybackId exists, the hero pane
     renders a <StudioVideo> instead of <Image>. The clone
     during the FLIP is still the still-image clone of
     the card poster (Mux thumbnail), so the morph code
     is unchanged. When the FLIP lands, we wait for the
     video to be ready (loadeddata) and crossfade it in
     over the clone — same crossfade pattern the image
     flow already uses, just gated on a different event.
   - The cover video also appears as the first item in
     the gallery so users who scroll past the hero can
     rewatch it. Remove the GalleryVideo block in the
     gallery if you'd rather not duplicate.
─────────────────────────────────────────────────────── */
export default function NjoyaCarouselDetailPanel({
  clickPayload,
  onClose,
}: Props) {
  const isOpen = clickPayload !== null;
  const item = clickPayload?.item ?? null;
  const additionalImages = item?.images ?? [];
  const galleryVideoIds = item?.galleryVideoPlaybackIds ?? [];
  const heroVideoId = item?.coverVideoPlaybackId;
  const hasHeroVideo = !!heroVideoId;
  const hasGallery =
    (item?.gallery?.length ?? 0) > 0 ||
    additionalImages.length > 0 ||
    galleryVideoIds.length > 0;
  const metadataItems = item?.metadata ?? [];
  const hasInfo = metadataItems.length > 0 || !!item?.subtitle;

  const [isRendered, setIsRendered] = useState(false);
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const panelImgRef = useRef<HTMLImageElement>(null);
  const panelVideoRef = useRef<HTMLVideoElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const sideRef = useRef<HTMLElement>(null);
  const sideTitleRef = useRef<HTMLDivElement>(null);
  const sideMetaRef = useRef<HTMLDivElement>(null);
  const mobileInfoBtnRef = useRef<HTMLButtonElement>(null);

  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const hintHiddenRef = useRef(false);
  const sideMetaShownRef = useRef(false);

  /* Mount on open */
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      hintHiddenRef.current = false;
      sideMetaShownRef.current = false;
      setMobileInfoOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isRendered) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus({ preventScroll: true });
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const targets = Array.from(
        overlayRef.current?.querySelectorAll<HTMLElement>(
          'button, a[href], input, video[controls], [tabindex="0"]',
        ) ?? [],
      ).filter((element) => element.offsetParent !== null);
      const first = targets[0];
      const last = targets[targets.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    window.addEventListener("keydown", trapFocus);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", trapFocus);
      previousFocus?.focus({ preventScroll: true });
    };
  }, [isRendered]);

  /* Fresh scroll position for every new item */
  useEffect(() => {
    if (!isRendered) return;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    sideMetaShownRef.current = false;
  }, [isRendered, clickPayload]);

  /* Scroll-driven: fade hint, fade side metadata in/out */
  useEffect(() => {
    if (!isRendered) return;
    const el = scrollRef.current;

    if (!el) return;

    const onScroll = () => {
      if (
        !hintHiddenRef.current &&
        hasGallery &&
        el.scrollTop > 24 &&
        hintRef.current
      ) {
        hintHiddenRef.current = true;
        gsap.to(hintRef.current, {
          opacity: 0,
          y: 6,
          duration: 0.35,
          ease: "power2.out",
        });
      }

      const meta = sideMetaRef.current;
      const side = sideRef.current;

      if (!hasInfo || !meta || !side) return;

      const ratio = el.scrollTop / window.innerHeight;
      const shouldShow = sideMetaShownRef.current
        ? ratio > META_HIDE_RATIO
        : ratio > META_SHOW_RATIO;

      if (shouldShow === sideMetaShownRef.current) return;
      sideMetaShownRef.current = shouldShow;

      /* Measured per toggle, not cached: the height isn't final until
         webfonts settle, and it changes with the viewport. */
      const shift = shouldShow
        ? Math.min(
            (meta.offsetHeight + META_GAP) / 2,
            window.innerHeight * META_MAX_SHIFT_RATIO,
          )
        : 0;
      const reduced = prefersReducedMotion();

      gsap.to(side, {
        y: -shift,
        duration: reduced ? 0 : 0.4,
        ease: shouldShow ? "expo.out" : "power2.inOut",
      });
      gsap.to(meta, {
        opacity: shouldShow ? 1 : 0,
        y: shouldShow ? 0 : 12,
        duration: reduced ? 0 : 0.25,
        ease: "power2.out",
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });

    return () => el.removeEventListener("scroll", onScroll);
  }, [isRendered, hasGallery, hasInfo]);

  /* ── Open animation (FLIP) ─────────────────────────── */
  useEffect(() => {
    if (!isRendered || !clickPayload) return;
    const overlay = overlayRef.current;
    const backdrop = backdropRef.current;
    const pane = paneRef.current;

    if (!overlay || !backdrop || !pane) return;

    if (clickPayload.instant || prefersReducedMotion()) {
      gsap.set(
        [
          backdrop,
          panelImgRef.current,
          panelVideoRef.current,
          galleryRef.current,
          sideTitleRef.current,
          mobileInfoBtnRef.current,
        ].filter(Boolean),
        { opacity: 1 },
      );
      if (sideRef.current) gsap.set(sideRef.current, { yPercent: -50, y: 0 });

      return;
    }

    const { imgEl, fromRect, fromRadius, rotation } = clickPayload;
    const toRect = pane.getBoundingClientRect();

    /* Clone is absolute inside the fixed overlay → viewport coords.
       Scrolling the content doesn't drag the clone. */
    const clone = document.createElement("div");

    clone.style.cssText = `
      position: absolute;
      top: ${toRect.top}px;
      left: ${toRect.left}px;
      width: ${toRect.width}px;
      height: ${toRect.height}px;
      overflow: hidden;
      z-index: 20;
      pointer-events: none;
      transform-origin: center center;
      will-change: transform, border-radius;
    `;
    const cloneImg = document.createElement("img");

    cloneImg.src = imgEl.currentSrc || imgEl.src;
    cloneImg.style.cssText =
      "width:100%;height:100%;object-fit:cover;object-position:top center;display:block;";
    clone.appendChild(cloneImg);
    overlay.appendChild(clone);

    /* Aspect ratios match (9:13) → uniform scale, no distortion. */
    const scale = fromRect.width / toRect.width;
    const dx =
      fromRect.left + fromRect.width / 2 - (toRect.left + toRect.width / 2);
    const dy =
      fromRect.top + fromRect.height / 2 - (toRect.top + toRect.height / 2);

    const startRadius = parseFloat(fromRadius) / scale;
    const endRadius = parseFloat(getComputedStyle(pane).borderTopLeftRadius);

    gsap.set(clone, {
      x: dx,
      y: dy,
      scale,
      rotation,
      borderRadius: startRadius,
    });
    gsap.set(backdrop, { opacity: 0 });
    if (panelImgRef.current) gsap.set(panelImgRef.current, { opacity: 0 });
    if (panelVideoRef.current) gsap.set(panelVideoRef.current, { opacity: 0 });
    if (galleryRef.current) gsap.set(galleryRef.current, { opacity: 0, y: 28 });
    if (hintRef.current) gsap.set(hintRef.current, { opacity: 0, y: 8 });
    /* Vertical centering lives here rather than in a Tailwind
       -translate-y-1/2, which the scroll shift would overwrite. y is
       reset so a shift left over from the previous item doesn't stick. */
    if (sideRef.current) gsap.set(sideRef.current, { yPercent: -50, y: 0 });
    if (sideTitleRef.current)
      gsap.set(sideTitleRef.current, { opacity: 0, x: -24 });
    if (sideMetaRef.current)
      gsap.set(sideMetaRef.current, { opacity: 0, y: 12 });
    if (mobileInfoBtnRef.current)
      gsap.set(mobileInfoBtnRef.current, { opacity: 0, scale: 0.96 });

    /* Crossfade clone → real media. Image items wait for decode();
       video items wait for loadeddata (readyState >= 2) so we
       don't fade in over a black <StudioVideo> that hasn't decoded a
       frame yet. Both have a safety-net timeout so a stalled
       network never strands the clone on screen. */
    const revealRealMedia = () => {
      if (clone.dataset.revealed === "true") return;
      clone.dataset.revealed = "true";
      const target = hasHeroVideo ? panelVideoRef.current : panelImgRef.current;

      gsap.to(target, {
        opacity: 1,
        duration: 0.25,
        ease: "power1.out",
      });
      gsap.to(clone, {
        opacity: 0,
        duration: 0.25,
        ease: "power1.out",
        onComplete: () => clone.remove(),
      });

      // Kick the hero video into playback once it's visible
      if (hasHeroVideo && panelVideoRef.current) {
        const p = panelVideoRef.current.play();

        if (p && typeof p.catch === "function") p.catch(() => undefined);
      }
    };

    const waitForRealMedia = () => {
      if (hasHeroVideo) {
        const v = panelVideoRef.current;

        if (!v) return revealRealMedia();
        if (v.readyState >= 2) return revealRealMedia();
        const onReady = () => {
          v.removeEventListener("loadeddata", onReady);
          v.removeEventListener("error", onReady);
          revealRealMedia();
        };

        v.addEventListener("loadeddata", onReady);
        v.addEventListener("error", onReady);
        window.setTimeout(revealRealMedia, 2000);

        return;
      }

      const realImg = panelImgRef.current;

      if (!realImg) return revealRealMedia();
      const finalize = () => {
        const decodePromise = realImg.decode
          ? realImg.decode().catch(() => undefined)
          : Promise.resolve();

        decodePromise.then(revealRealMedia);
      };

      if (realImg.complete && realImg.naturalWidth > 0) return finalize();
      const onLoad = () => {
        realImg.removeEventListener("load", onLoad);
        realImg.removeEventListener("error", onLoad);
        finalize();
      };

      realImg.addEventListener("load", onLoad);
      realImg.addEventListener("error", onLoad);
      window.setTimeout(revealRealMedia, 1500);
    };

    const tl = gsap.timeline({ onComplete: waitForRealMedia });

    tl.to(backdrop, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0).to(
      clone,
      {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        borderRadius: endRadius,
        duration: 0.75,
        ease: "power3.inOut",
      },
      0,
    );

    if (hasGallery && galleryRef.current) {
      tl.to(
        galleryRef.current,
        { opacity: 1, y: 0, duration: 0.35, ease: "expo.out" },
        0.45,
      );
    }
    if (hasGallery && hintRef.current) {
      tl.to(
        hintRef.current,
        { opacity: 1, y: 0, duration: 0.25, ease: "expo.out" },
        0.6,
      );
    }
    if (sideTitleRef.current) {
      tl.to(
        sideTitleRef.current,
        { opacity: 1, x: 0, duration: 0.35, ease: "expo.out" },
        0.5,
      );
    }
    if (hasInfo && mobileInfoBtnRef.current) {
      tl.to(
        mobileInfoBtnRef.current,
        { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out" },
        0.6,
      );
    }

    openTlRef.current = tl;

    return () => {
      tl.kill();
      clone.remove();
    };
  }, [isRendered, clickPayload, hasGallery, hasInfo, hasHeroVideo]);

  /* ── Close ───────────────────────────────────────────── */
  const handleClose = useCallback(
    (instant = false) => {
      openTlRef.current?.kill();
      if (!backdropRef.current) return;
      if (instant || prefersReducedMotion()) {
        setIsRendered(false);
        setMobileInfoOpen(false);
        onClose();

        return;
      }

      // Stop the hero video so audio (if any was added) cuts immediately.
      // Gallery videos manage their own state via native controls.
      if (panelVideoRef.current) {
        try {
          panelVideoRef.current.pause();
        } catch {
          /* noop */
        }
      }

      const tl = gsap.timeline({
        onComplete: () => {
          setIsRendered(false);
          setMobileInfoOpen(false);
          onClose();
        },
      });

      tl.to(
        backdropRef.current,
        { opacity: 0, duration: 0.25, ease: "power2.out" },
        0,
      );
      if (panelImgRef.current) {
        tl.to(
          panelImgRef.current,
          { opacity: 0, duration: 0.22, ease: "power2.out" },
          0,
        );
      }
      if (panelVideoRef.current) {
        tl.to(
          panelVideoRef.current,
          { opacity: 0, duration: 0.22, ease: "power2.out" },
          0,
        );
      }
      if (galleryRef.current) {
        tl.to(
          galleryRef.current,
          { opacity: 0, y: 8, duration: 0.22, ease: "power2.out" },
          0,
        );
      }
      if (hintRef.current) {
        tl.to(
          hintRef.current,
          { opacity: 0, duration: 0.18, ease: "power2.out" },
          0,
        );
      }
      if (sideTitleRef.current) {
        tl.to(
          sideTitleRef.current,
          { opacity: 0, x: -8, duration: 0.22, ease: "power2.out" },
          0,
        );
      }
      if (sideMetaRef.current) {
        tl.to(
          sideMetaRef.current,
          { opacity: 0, y: 6, duration: 0.22, ease: "power2.out" },
          0,
        );
      }
      if (mobileInfoBtnRef.current) {
        tl.to(
          mobileInfoBtnRef.current,
          { opacity: 0, scale: 0.96, duration: 0.22, ease: "power2.out" },
          0,
        );
      }
    },
    [onClose],
  );

  /* ESC — close mobile modal first if open, else close the panel */
  useEffect(() => {
    if (!isRendered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (mobileInfoOpen) {
        setMobileInfoOpen(false);

        return;
      }
      handleClose(true);
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [isRendered, mobileInfoOpen, handleClose]);

  if (!isRendered) return null;

  return (
    <div
      ref={overlayRef}
      aria-label={item?.title}
      aria-modal="true"
      className="project-overlay pointer-events-auto fixed inset-0 z-[200]"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-[var(--studio-bg)]"
        style={{ opacity: 0 }}
      />

      {/* Desktop side info panel */}
      <aside
        ref={sideRef}
        className="pointer-events-none fixed left-5 top-1/2 z-[15] hidden w-[210px] md:block lg:left-8 lg:w-[260px] xl:left-10 xl:w-[300px]"
      >
        <div
          ref={sideTitleRef}
          className="flex shrink-0 flex-col gap-1.5"
          style={{ opacity: 0 }}
        >
          {item?.category && <span className="eyebrow">{item.category}</span>}
          <h2 className="project-panel-title font-sans text-[22px] leading-[1.15] lg:text-[26px] xl:text-[30px]">
            {item?.title}
          </h2>
        </div>

        {hasInfo && (
          <div
            ref={sideMetaRef}
            className="absolute left-0 right-0 top-full mt-6 flex max-h-[40vh] min-h-0 flex-col gap-3 border-t border-white/10 pt-4"
            style={{ opacity: 0 }}
          >
            {item?.subtitle && item?.type === "design-project" && (
              <p className="shrink-0 text-[12px] font-medium leading-snug text-white/70 lg:text-[13px]">
                {item.subtitle}
              </p>
            )}
            {metadataItems.length > 0 && <MetadataList items={metadataItems} />}
          </div>
        )}
      </aside>

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className="relative z-[5] h-full w-full overflow-y-auto overflow-x-hidden focus:outline-none"
        style={{ scrollBehavior: "smooth" }}
        tabIndex={-1}
      >
        {/* Hero — image OR video, sized identically */}
        <div className="flex h-screen w-full items-center justify-center">
          <div
            ref={paneRef}
            className="relative aspect-[9/13] h-[85vh] max-h-[780px] max-w-[90vw] overflow-hidden rounded-[var(--studio-radius)]"
          >
            {hasHeroVideo ? (
              <StudioVideo
                ref={panelVideoRef}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 block h-full w-full object-cover object-top"
                poster={assetPath(item?.imageUrl ?? "")}
                src={muxPlaybackUrl(heroVideoId!)}
                style={{ opacity: 0 }}
              />
            ) : (
              <Image
                ref={panelImgRef}
                fill
                priority
                alt={item?.imageAlt ?? item?.title ?? ""}
                className="absolute inset-0 block h-full w-full object-cover object-top"
                image={item?.cover}
                sizes={panelImageSize(item?.cover)}
                src={assetPath(item?.heroImageUrl ?? item?.imageUrl ?? "")}
                style={{ opacity: 0 }}
              />
            )}
          </div>
        </div>

        {/* Gallery — videos first, then images */}
        {hasGallery && (
          <div
            ref={galleryRef}
            className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-6 px-4 pb-24 md:gap-10 md:px-10 md:pb-32"
            style={{ opacity: 0 }}
          >
            <MediaGallery entries={item?.gallery ?? []} maxWidth={620} />
          </div>
        )}
      </div>

      {/* Close */}
      <button
        ref={closeButtonRef}
        aria-label="Close"
        className="icon-button fixed right-3 top-3 z-[30] text-[15px] md:right-8 md:top-8"
        style={{
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
        onClick={(event) => handleClose(event.detail === 0)}
      >
        ✕
      </button>

      {/* Mobile info button — bottom-right floating button */}
      {hasInfo && (
        <button
          ref={mobileInfoBtnRef}
          aria-label="View details"
          className="icon-button project-mobile-info fixed bottom-3 right-3 z-[30]"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            opacity: 0,
          }}
          onClick={(e) => {
            e.stopPropagation();
            setMobileInfoOpen(true);
          }}
        >
          <svg
            fill="none"
            height="16"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="16" y2="12" />
            <line x1="12" x2="12.01" y1="8" y2="8" />
          </svg>
        </button>
      )}

      {/* Mobile info modal */}
      {mobileInfoOpen && item && (
        <MobileInfoModal item={item} onClose={() => setMobileInfoOpen(false)} />
      )}

      {/* Scroll hint */}
      {hasGallery && (
        <div
          ref={hintRef}
          className="pointer-events-none fixed bottom-8 left-1/2 z-[25] flex -translate-x-1/2 flex-col items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.22em] text-white/60 md:bottom-12 md:text-[10px]"
          style={{ opacity: 0 }}
        >
          <span>Scroll</span>
          <svg
            fill="none"
            height="14"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
            width="14"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Credits / metadata list.

   Editorial shoots can carry 20+ credits, which is taller
   than both the desktop sidebar and the mobile card, so
   the list scrolls on its own. A mask fades whichever
   edge still has content beyond it — never both when the
   list fits, so short lists look untouched.

   Alongside it sits a proportional rail: the thumb's
   height is the visible fraction of the list, so a long
   credit list reads as obviously long at a glance. The
   rail lives outside the masked scroller, otherwise it
   would fade away with the text it's describing.
─────────────────────────────────────────────────────── */
const FADE_SIZE = "18px";
const THUMB_MIN_PCT = 12;

interface ThumbGeometry {
  heightPct: number;
  topPct: number;
  visible: boolean;
}

const HIDDEN_THUMB: ThumbGeometry = {
  heightPct: 0,
  topPct: 0,
  visible: false,
};

function MetadataList({
  items,
  valueClassName = "text-[12px] lg:text-[13px]",
}: {
  items: { label: string; value: string }[];
  valueClassName?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [fadeTop, setFadeTop] = useState(false);
  const [fadeBottom, setFadeBottom] = useState(false);
  const [thumb, setThumb] = useState<ThumbGeometry>(HIDDEN_THUMB);

  const syncScrollState = useCallback(() => {
    const el = listRef.current;

    if (!el) return;
    const scrollable = el.scrollHeight - el.clientHeight;
    const overflows = scrollable > 1;

    setFadeTop(overflows && el.scrollTop > 1);
    setFadeBottom(
      overflows && el.scrollTop + el.clientHeight < el.scrollHeight - 1,
    );

    if (!overflows) {
      setThumb(HIDDEN_THUMB);

      return;
    }

    /* Clamped so a 30-credit list still leaves a grabbable-looking thumb,
       then offset by scroll progress rather than scrollTop so it lands
       flush at both ends despite the clamp. */
    const heightPct = Math.max(
      (el.clientHeight / el.scrollHeight) * 100,
      THUMB_MIN_PCT,
    );
    const progress = el.scrollTop / scrollable;

    setThumb({
      heightPct,
      topPct: progress * (100 - heightPct),
      visible: true,
    });
  }, []);

  useEffect(() => {
    const el = listRef.current;

    if (!el) return;
    syncScrollState();
    el.addEventListener("scroll", syncScrollState, { passive: true });
    const observer = new ResizeObserver(syncScrollState);

    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", syncScrollState);
      observer.disconnect();
    };
  }, [syncScrollState, items]);

  const maskImage =
    fadeTop || fadeBottom
      ? `linear-gradient(to bottom, transparent, black ${
          fadeTop ? FADE_SIZE : "0px"
        }, black calc(100% - ${fadeBottom ? FADE_SIZE : "0px"}), transparent)`
      : undefined;

  return (
    <div className="relative flex min-h-0 flex-col">
      <div
        ref={listRef}
        className="credits-scroll pointer-events-auto flex min-h-0 flex-col gap-2.5 overflow-y-auto overscroll-contain pr-3.5"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        {items.map((m, i) => (
          <div key={i} className="flex shrink-0 flex-col gap-0.5">
            <span className="eyebrow">{m.label}</span>
            <span
              className={`text-[12px] font-normal leading-relaxed text-[var(--studio-text)] [overflow-wrap:anywhere] ${valueClassName}`}
            >
              {m.value}
            </span>
          </div>
        ))}
      </div>

      {thumb.visible && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-full w-[2px] overflow-hidden rounded-full bg-white/10"
        >
          <div
            className="absolute left-0 w-full rounded-full bg-white/50"
            style={{
              height: `${thumb.heightPct}%`,
              top: `${thumb.topPct}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Mobile info modal — centered card with the same
   metadata as the desktop side panel. Tap backdrop or
   ✕ to dismiss.
─────────────────────────────────────────────────────── */
function MobileInfoModal({
  item,
  onClose,
}: {
  item: any;
  onClose: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  useEffect(() => {
    gsap.fromTo(
      backdropRef.current,
      { opacity: 0 },
      {
        opacity: 1,
        duration: prefersReducedMotion() ? 0 : 0.2,
        ease: "power2.out",
      },
    );
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 18, scale: 0.96 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: prefersReducedMotion() ? 0 : 0.25,
        ease: "expo.out",
      },
    );
  }, []);

  const handleClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (prefersReducedMotion()) {
      onClose();

      return;
    }
    const tl = gsap.timeline({ onComplete: onClose });

    tl.to(
      cardRef.current,
      { opacity: 0, y: 8, scale: 0.98, duration: 0.2, ease: "power2.out" },
      0,
    );
    tl.to(
      backdropRef.current,
      { opacity: 0, duration: 0.2, ease: "power2.out" },
      0,
    );
  };

  const metadataItems = item?.metadata ?? [];

  return (
    <div className="fixed inset-0 z-[40] flex items-center justify-center px-6 md:hidden">
      <div
        ref={backdropRef}
        aria-label="Close info"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm focus:outline-none"
        role="button"
        style={{ opacity: 0 }}
        tabIndex={0}
        onClick={handleClose}
        onKeyDown={(e) => {
          if (
            e.target === e.currentTarget &&
            (e.key === "Enter" || e.key === " ")
          ) {
            e.preventDefault();
            handleClose();
          }
        }}
      />
      <div
        ref={cardRef}
        className="relative flex max-h-[80vh] w-full max-w-[340px] flex-col overflow-hidden rounded-[var(--studio-radius)] border border-[var(--studio-line)] bg-[var(--studio-surface)] p-6 shadow-2xl"
        style={{ opacity: 0 }}
      >
        <button
          aria-label="Close info"
          className="icon-button absolute right-2 top-2 z-10 text-[14px]"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
          onClick={handleClose}
        >
          ✕
        </button>

        <div className="flex min-h-0 flex-col gap-5 pr-8">
          <div className="flex shrink-0 flex-col gap-1.5">
            {item?.category && <span className="eyebrow">{item.category}</span>}
            <h2 className="project-panel-title font-sans text-[22px] leading-[1.15]">
              {item?.title}
            </h2>
            {item?.subtitle && (
              <p className="text-[13px] font-medium leading-snug text-white/70">
                {item.subtitle}
              </p>
            )}
          </div>

          {metadataItems.length > 0 && (
            <div className="flex min-h-0 flex-col border-t border-white/10 pt-4">
              <MetadataList
                items={metadataItems}
                valueClassName="text-[13px]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
