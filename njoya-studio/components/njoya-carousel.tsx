"use client";

import type {
  NjoyaCarouselItem,
  NjoyaClickPayload,
} from "@/lib/njoya-carousel-types";

import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

import NjoyaCarouselCard from "./njoya-carousel-card";
import ProjectDialog from "./project-dialog";
import StudioIntro from "./studio-intro";

export default function NjoyaCarousel({
  items,
  pinned,
  label = "Projects",
  showLoader = false,
  loop,
}: {
  items: NjoyaCarouselItem[];
  pinned?: React.ReactNode;
  label?: string;
  showLoader?: boolean;
  loop?: boolean;
}) {
  // Leave enough cards outside the three-card desktop viewport for Embla
  // to recycle them without disabling looping on short collections.
  const slides =
    loop && items.length > 0 && items.length < 6
      ? Array.from(
          { length: items.length * Math.ceil(6 / items.length) },
          (_, index) => items[index % items.length],
        )
      : items;
  const [viewportRef, api] = useEmblaCarousel({
    align: "start",
    loop: loop ?? items.length > 3,
    containScroll: "trimSnaps",
  });
  const [payload, setPayload] = useState<NjoyaClickPayload | null>(null);
  const [reset, setReset] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [homeReady, setHomeReady] = useState(!showLoader);
  const dragging = useRef(false);
  const pointerDown = useRef(false);
  const revealHome = useCallback((animated: boolean) => {
    setReveal(animated);
    setHomeReady(true);
  }, []);

  useEffect(() => {
    if (!api) return;
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

    api.on("pointerDown", down).on("scroll", scroll).on("pointerUp", up);
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
      api.off("pointerDown", down).off("scroll", scroll).off("pointerUp", up);
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
      className={`portfolio-stage ${pinned ? "has-statement" : ""} ${reveal ? "intro-reveal" : ""}`}
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
            {slides.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                aria-label={`${(index % items.length) + 1} of ${items.length}`}
                aria-roledescription="slide"
                className="project-slide"
                role="group"
              >
                <NjoyaCarouselCard
                  home={!!pinned}
                  introDelay={index * 65}
                  introState={
                    homeReady ? (reveal ? "animate" : "instant") : "pending"
                  }
                  item={item}
                  previewPaused={!!payload}
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
      </div>
      {showLoader && <StudioIntro onReveal={revealHome} />}
      <ProjectDialog clickPayload={payload} onClose={close} />
    </section>
  );
}
