"use client";

import type { GradientLineProps } from "./gradient-line";

import { GradientLine } from "./gradient-line";

/**
 * Adapted from Alex Puliatti's GradientDivider (MIT).
 * https://github.com/alexpuliatti/gradient-components/blob/4ba7a657985e898f3a96767ebdcea5a9ce488d83/src/components/ui/GradientDivider.jsx
 */
const WARM_GRADIENT =
  "linear-gradient(90deg, #704832 0%, #a9633d 25%, #dfa064 50%, #b96c43 75%, #704832 100%)";

type GradientDividerProps = Pick<
  GradientLineProps,
  "gradient" | "thickness" | "taper" | "animation" | "className"
> & {
  label?: string;
};

export function GradientDivider({
  gradient = WARM_GRADIENT,
  label = "",
  thickness = "2px",
  taper = "both",
  animation = "scroll",
  className = "",
}: GradientDividerProps) {
  const lineProps = {
    gradient,
    thickness,
    animation,
    orientation: "horizontal" as const,
    length: "100%",
    origin: "left center",
  };

  return (
    <div aria-hidden={!label || undefined} className={`gradient-divider ${className}`}>
      {label ? (
        <>
          <GradientLine {...lineProps} taper="end" />
          <span className="gradient-divider-label">{label}</span>
          <GradientLine {...lineProps} taper="start" />
        </>
      ) : (
        <GradientLine {...lineProps} taper={taper} />
      )}
    </div>
  );
}
