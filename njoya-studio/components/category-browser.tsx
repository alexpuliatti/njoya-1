"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function CategoryBrowser({
  children,
}: {
  children: React.ReactNode;
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
    <section aria-label="Explore our work" className="category-stage">
      <div ref={track} className="category-track">
        {children}
      </div>
      <div className="category-browser-footer">
        <p className="browse-hint">Scroll to explore</p>
        <div>
          <button
            aria-label="Previous category"
            className="icon-button"
            onClick={() => browse(-1)}
          >
            <ArrowLeft size={19} />
          </button>
          <button
            aria-label="Next category"
            className="icon-button"
            onClick={() => browse(1)}
          >
            <ArrowRight size={19} />
          </button>
        </div>
      </div>
    </section>
  );
}
