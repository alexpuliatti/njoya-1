"use client";

import type { NjoyaCarouselItem } from "@/lib/njoya-carousel-types";

import { useLayoutEffect, useState } from "react";

import NjoyaCarousel from "./njoya-carousel";

import { createHomepageCycle } from "@/lib/homepage-cycle.mjs";

const selectCycle = createHomepageCycle();

export default function HomepageCarousel({
  cycles,
  pinned,
}: {
  cycles: NjoyaCarouselItem[][];
  pinned: React.ReactNode;
}) {
  // Match the static HTML during hydration, then select the session's next set
  // before React paints. No server-side randomness or hydration mismatch.
  const [cycle, setCycle] = useState(0);

  useLayoutEffect(() => {
    setCycle(selectCycle(cycles.length));
  }, [cycles.length]);

  return (
    <NjoyaCarousel
      showLoader
      items={cycles[cycle]}
      label="Selected projects"
      pinned={pinned}
    />
  );
}
