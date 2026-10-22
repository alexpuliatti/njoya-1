export type ObserverDirection = "down" | "left" | "right";
export type ObserverAnimation = ObserverDirection | "jump";

export type ObserverRoutePoint = {
  x: number;
  y: number;
};

export type ObserverRouteInput = {
  startY: number;
  endY: number;
  dividerYs: number[];
  leftX: number;
  rightX: number;
  viewportHeight: number;
  maxScroll: number;
};

export type ObserverRouteSegment = {
  id: string;
  animation: ObserverAnimation;
  direction: ObserverDirection;
  startScroll: number;
  endScroll: number;
  from: ObserverRoutePoint;
  to: ObserverRoutePoint;
};

export type ObserverRoute = {
  maxScroll: number;
  start: ObserverRoutePoint;
  end: ObserverRoutePoint;
  segments: ObserverRouteSegment[];
};

export type ObserverRouteSample = ObserverRoutePoint & {
  animation: ObserverAnimation;
  direction: ObserverDirection;
  progress: number;
  segmentId: string;
  segmentIndex: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
const finite = (value: number, fallback: number) =>
  Number.isFinite(value) ? value : fallback;
const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

/**
 * Plan straight walks down the page edges and across its first three dividers.
 * X coordinates are viewport pixels; Y coordinates are document-space feet.
 */
export function buildObserverRoute(input: ObserverRouteInput): ObserverRoute {
  const maxScroll = Math.max(0, finite(input.maxScroll, 0));
  const viewportHeight = Math.max(1, finite(input.viewportHeight, 1));
  const startY = finite(input.startY, 0);
  const endY = Math.max(startY, finite(input.endY, startY));
  const firstX = finite(input.leftX, 0);
  const secondX = finite(input.rightX, firstX);
  const leftX = Math.min(firstX, secondX);
  const rightX = Math.max(firstX, secondX);
  const dividerYs = Array.from(new Set(input.dividerYs))
    .filter((y) => Number.isFinite(y) && y > startY && y <= endY)
    .sort((a, b) => a - b)
    .slice(0, 3);
  const start = { x: rightX, y: startY };
  const segments: ObserverRouteSegment[] = [];
  let cursor = start;
  let scrollCursor = 0;

  const append = (
    id: string,
    animation: ObserverAnimation,
    direction: ObserverDirection,
    to: ObserverRoutePoint,
    endScroll: number,
  ) => {
    segments.push({
      id,
      animation,
      direction,
      startScroll: scrollCursor,
      endScroll,
      from: cursor,
      to,
    });
    cursor = to;
    scrollCursor = endScroll;
  };

  // No scrollable distance means the character stays at its introduction.
  if (!maxScroll) {
    append("down-0", "down", "down", start, 0);
    return { maxScroll, start, end: start, segments };
  }

  // Leave room for the first/last down legs, even on short pages. The desired
  // crossing center is where its divider sits at 55% of the viewport height.
  const count = dividerYs.length;
  const margin = Math.min(viewportHeight * 0.12, maxScroll / (2 * (count + 1)));
  const separation = Math.min(
    viewportHeight * 0.1,
    (maxScroll - margin * 2) / Math.max(1, count - 1),
  );
  const centers = dividerYs.map((y, index) =>
    clamp(
      y - viewportHeight * 0.55,
      margin + index * separation,
      maxScroll - margin - (count - 1 - index) * separation,
    ),
  );

  for (let index = 1; index < centers.length; index++)
    centers[index] = Math.max(centers[index], centers[index - 1] + separation);

  dividerYs.forEach((y, index) => {
    const center = centers[index];
    const previous = index ? centers[index - 1] : 0;
    const next = index + 1 < count ? centers[index + 1] : maxScroll;
    const halfRange = Math.min(
      viewportHeight * 0.11,
      (center - previous) * 0.35,
      (next - center) * 0.35,
    );
    const crossingStart = center - halfRange;
    const crossingEnd = center + halfRange;
    const direction: ObserverDirection = index % 2 ? "right" : "left";
    const destinationX = direction === "left" ? leftX : rightX;

    append(`down-${index}`, "down", "down", { x: cursor.x, y }, crossingStart);

    if (index === 2) {
      const fromX = cursor.x;
      const jumpStart = lerp(crossingStart, crossingEnd, 0.66);
      const jumpEnd = lerp(crossingStart, crossingEnd, 0.9);

      append(
        "cross-3-before-jump",
        direction,
        direction,
        { x: lerp(fromX, destinationX, 0.66), y },
        jumpStart,
      );
      // The renderer can finish this eight-frame gesture on its own clock,
      // even when scrolling stops or skips across this entire scroll range.
      append(
        "jump-3",
        "jump",
        direction,
        { x: lerp(fromX, destinationX, 0.9), y },
        jumpEnd,
      );
      append(
        "cross-3-after-jump",
        direction,
        direction,
        { x: destinationX, y },
        crossingEnd,
      );
    } else {
      append(
        `cross-${index + 1}`,
        direction,
        direction,
        { x: destinationX, y },
        crossingEnd,
      );
    }
  });

  append(`down-${count}`, "down", "down", { x: cursor.x, y: endY }, maxScroll);
  return { maxScroll, start, end: cursor, segments };
}

/** Sample the path without easing, so every walk remains a straight segment. */
export function sampleObserverRoute(
  scroll: number,
  route: ObserverRoute,
): ObserverRouteSample {
  const position = clamp(finite(scroll, 0), 0, route.maxScroll);
  let segmentIndex = route.segments.length - 1;

  for (let index = 0; index < route.segments.length; index++) {
    if (position < route.segments[index].endScroll || !route.maxScroll) {
      segmentIndex = index;
      break;
    }
  }

  const segment = route.segments[segmentIndex];
  const span = segment.endScroll - segment.startScroll;
  const progress =
    span > 0 ? clamp((position - segment.startScroll) / span, 0, 1) : 0;

  return {
    x: lerp(segment.from.x, segment.to.x, progress),
    y: lerp(segment.from.y, segment.to.y, progress),
    animation: segment.animation,
    direction: segment.direction,
    progress,
    segmentId: segment.id,
    segmentIndex,
  };
}
