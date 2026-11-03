"use client";

import type { CSSProperties } from "react";
import type { MotionValue } from "framer-motion";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

import "./gradient-components.css";

/**
 * Adapted from Alex Puliatti's GradientLine (MIT).
 * https://github.com/alexpuliatti/gradient-components/blob/4ba7a657985e898f3a96767ebdcea5a9ce488d83/src/components/ui/GradientLine.jsx
 * Retains the gradient, taper masks, scroll progress and spring-driven scale.
 * This site uses the static and scroll modes. See README.md and LICENSE.
 */
export type GradientLineProps = {
  gradient?: string;
  orientation?: "vertical" | "horizontal";
  thickness?: string;
  length?: string;
  origin?: string;
  animation?: "none" | "scroll";
  scrollProgress?: MotionValue<number>;
  taper?: "start" | "end" | "both";
  className?: string;
  style?: CSSProperties;
};

function ScrollGradientLine({
  className,
  style,
  isVertical,
  scrollProgress,
}: {
  className: string;
  style: CSSProperties;
  isVertical: boolean;
  scrollProgress?: MotionValue<number>;
}) {
  const lineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: internalScroll } = useScroll({
    target: lineRef,
    offset: ["start 95%", "start 45%"],
  });
  const { scrollYProgress: pageScroll } = useScroll();
  const activeScroll = scrollProgress ?? internalScroll;
  // Complete even the last divider when the reader reaches the page bottom.
  const progress = useTransform(
    [activeScroll, pageScroll],
    ([local, page]: number[]) =>
      Math.min(1, Math.max(0, local, (page - 0.9) * 10)),
  );
  const smoothScroll = useSpring(progress, {
    stiffness: 180,
    damping: 30,
    mass: 0.5,
    restDelta: 0.001,
  });
  const transform = useTransform(
    smoothScroll,
    (value) => `${isVertical ? "scaleY" : "scaleX"}(${value})`,
  );

  return (
    <motion.div
      ref={lineRef}
      className={`${className} gradient-line-scroll`}
      style={{ ...style, transform }}
    />
  );
}

export function GradientLine({
  gradient = "linear-gradient(to bottom, transparent, rgba(255,255,255,0.2))",
  orientation = "vertical",
  thickness = "4px",
  length = "100%",
  origin = "top",
  animation = "none",
  scrollProgress,
  taper,
  className = "",
  style,
}: GradientLineProps) {
  const reducedMotion = useReducedMotion();
  const isVertical = orientation === "vertical";
  const direction = isVertical ? "to bottom" : "to right";
  const taperMask =
    taper === "start"
      ? `linear-gradient(${direction}, transparent 0%, black 20%)`
      : taper === "end"
        ? `linear-gradient(${direction}, black 80%, transparent 100%)`
        : taper === "both"
          ? `linear-gradient(${direction}, transparent 0%, black 15%, black 85%, transparent 100%)`
          : undefined;
  const baseStyle: CSSProperties = {
    background: gradient,
    transformOrigin: origin,
    width: isVertical ? thickness : length,
    height: isVertical ? length : thickness,
    WebkitMaskImage: taperMask,
    maskImage: taperMask,
    ...style,
  };
  const classes = `gradient-line-base gradient-line-${orientation} ${className}`;

  if (animation === "scroll" && !reducedMotion) {
    return (
      <ScrollGradientLine
        className={classes}
        isVertical={isVertical}
        scrollProgress={scrollProgress}
        style={baseStyle}
      />
    );
  }

  return <div className={classes} style={baseStyle} />;
}
