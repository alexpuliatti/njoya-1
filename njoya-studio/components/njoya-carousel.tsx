"use client";

import type {
  NjoyaCarouselItem,
  NjoyaClickPayload,
} from "@/lib/njoya-carousel-types";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import NjoyaCarouselCard from "./njoya-carousel-card";
import NjoyaCarouselDetailPanel from "./njoya-carousel-detail-panel";

import animationData from "@/assets/njoya_loader_lottie.json";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export default function NjoyaCarousel({
  items,
  pinned,
  label = "Projects",
  showLoader = false,
}: {
  items: NjoyaCarouselItem[];
  pinned?: React.ReactNode;
  label?: string;
  showLoader?: boolean;
}) {
  const [viewportRef, api] = useEmblaCarousel({
    align: "start",
    loop: items.length > 3,
    containScroll: "trimSnaps",
  });
  const [payload, setPayload] = useState<NjoyaClickPayload | null>(null);
  const [reset, setReset] = useState(0);
  const [selected, setSelected] = useState(0);
  const [scrollable, setScrollable] = useState(false);
  const [loading, setLoading] = useState(showLoader);
  const dragging = useRef(false);
  const pointerDown = useRef(false);
  const finishIntro = useCallback(() => {
    setLoading(false);
    try {
      sessionStorage.setItem("njoya-intro-seen", "true");
    } catch {
      /* Storage may be unavailable. */
    }
  }, []);

  useEffect(() => {
    if (!showLoader) return;
    try {
      if (sessionStorage.getItem("njoya-intro-seen")) {
        setLoading(false);

        return;
      }
    } catch {
      /* Optional session memory. */
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLoading(false);

      return;
    }
    const timeout = window.setTimeout(finishIntro, 4500);

    return () => window.clearTimeout(timeout);
  }, [showLoader, finishIntro]);
  useEffect(() => {
    if (!api) return;
    const select = () => {
      setSelected(api.selectedScrollSnap());
      setScrollable(api.scrollSnapList().length > 1);
    };

    select();
    const down = () => {
      pointerDown.current = true;
      dragging.current = false;
    };
    const scroll = () => {
      if (pointerDown.current) dragging.current = true;
    };
    const up = () => {
      pointerDown.current = false;
      window.setTimeout(() => {
        dragging.current = false;
      }, 80);
    };

    api
      .on("select", select)
      .on("reInit", select)
      .on("pointerDown", down)
      .on("scroll", scroll)
      .on("pointerUp", up);
    const viewport = api.rootNode();
    const wheel = (event: WheelEvent) => {
      if (
        payload ||
        api.scrollSnapList().length < 2 ||
        event.ctrlKey ||
        Math.abs(event.deltaY) + Math.abs(event.deltaX) < 1
      )
        return;
      if (
        window.innerWidth < 768 &&
        Math.abs(event.deltaY) > Math.abs(event.deltaX)
      )
        return;
      event.preventDefault();
      const engine = api.internalEngine();
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      const target = engine.target.get() - delta;

      engine.target.set(
        engine.options.loop ? target : engine.limit.constrain(target),
      );
      engine.scrollBody.useBaseFriction();
      engine.animation.start();
    };

    viewport.addEventListener("wheel", wheel, { passive: false });

    return () => {
      api
        .off("select", select)
        .off("reInit", select)
        .off("pointerDown", down)
        .off("scroll", scroll)
        .off("pointerUp", up);
      viewport.removeEventListener("wheel", wheel);
    };
  }, [api, payload]);
  const close = useCallback(() => {
    payload?.imgEl
      .closest<HTMLElement>('[role="button"]')
      ?.focus({ preventScroll: true });
    setPayload(null);
    setReset((value) => value + 1);
  }, [payload]);

  return (
    <section
      aria-label={label}
      className={`portfolio-stage ${pinned ? "has-statement" : ""}`}
    >
      {pinned}
      <div className="project-carousel">
        <div
          ref={viewportRef}
          aria-label={label}
          aria-roledescription="carousel"
          className="project-viewport"
          role="region"
        >
          <div className="project-track">
            {items.map((item, index) => (
              <div key={item.id} className="project-slide">
                <NjoyaCarouselCard
                  item={item}
                  priority={index < 2}
                  resetSignal={reset}
                  onClick={(next) => {
                    if (!dragging.current) setPayload(next);
                    else setReset((value) => value + 1);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        {scrollable && (
          <div className="carousel-controls">
            <span aria-live="polite" className="carousel-count">
              {String(selected + 1).padStart(2, "0")}{" "}
              <span>/ {String(items.length).padStart(2, "0")}</span>
            </span>
            <button
              aria-label="Previous project"
              className="icon-button"
              onClick={() => api?.scrollPrev()}
            >
              <ArrowLeft size={19} />
            </button>
            <button
              aria-label="Next project"
              className="icon-button"
              onClick={() => api?.scrollNext()}
            >
              <ArrowRight size={19} />
            </button>
          </div>
        )}
      </div>
      {loading && (
        <div aria-label="Njoya Studios introduction" className="intro-overlay">
          <Lottie
            animationData={animationData}
            className="intro-animation"
            loop={false}
            onComplete={finishIntro}
          />
          <button className="intro-skip" onClick={finishIntro}>
            Skip intro
          </button>
        </div>
      )}
      <NjoyaCarouselDetailPanel clickPayload={payload} onClose={close} />
    </section>
  );
}
