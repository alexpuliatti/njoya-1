"use client";

import { useRef, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { StudioIconButton } from "./ui/studio-button";

export default function CategoryBrowser({
  children,
  categoryCount,
}: {
  children: React.ReactNode;
  categoryCount: number;
}) {
  const track = useRef<HTMLDivElement>(null);
  const browse = (direction: number) => {
    const element = track.current;

    if (!element) return;
    const card = element.firstElementChild as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(element).columnGap) || 0;
    const distance = (card?.offsetWidth ?? element.clientWidth) + gap;

    element.scrollBy({
      left: direction * distance,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  return (
    <section
      aria-label="Explore our work"
      className="category-stage"
      style={{ "--category-count": categoryCount } as CSSProperties}
    >
      <div ref={track} className="category-track">
        {children}
      </div>
      <div className="category-browser-footer">
        <p className="browse-hint">Scroll to explore</p>
        <div>
          <StudioIconButton
            label="Previous category"
            variant="outline"
            onClick={() => browse(-1)}
          >
            <ArrowLeft size={19} />
          </StudioIconButton>
          <StudioIconButton
            label="Next category"
            variant="outline"
            onClick={() => browse(1)}
          >
            <ArrowRight size={19} />
          </StudioIconButton>
        </div>
      </div>
    </section>
  );
}
