import type { NjoyaCarouselItem } from "@/lib/njoya-carousel-types";

import Link from "next/link";
import { Suspense } from "react";

import HomepageCarousel from "@/components/homepage-carousel";
import HomeQueryRedirect from "@/components/home-query-redirect";
import HomepageWorldBuilders from "@/components/homepage-world-builders";
import { homepageCycleCount } from "@/lib/homepage-cycle.mjs";
import {
  getCategories,
  getHome,
  getSite,
  getWorks,
  toCarouselItem,
} from "@/lib/content/repository";

export default async function Home() {
  const [site, home, works, categories] = await Promise.all([
    getSite(),
    getHome(),
    getWorks(),
    getCategories(),
  ]);
  const byId = new Map(works.map((work) => [work.id, work]));
  const cycleCount = homepageCycleCount(
    home.featured.map((slot) => slot.projects.length),
  );
  const cycles: NjoyaCarouselItem[][] = Array.from(
    { length: cycleCount },
    (_, cycle) =>
      home.featured.map((slot) => {
        const feature = slot.projects[cycle % slot.projects.length];
        const work = byId.get(feature.workId);

        if (!work)
          throw new Error(`Unknown homepage project: ${feature.workId}`);

        return toCarouselItem(
          work,
          categories,
          site.videoPlaybackEnabled,
          slot.category,
        );
      }),
  );

  return (
    <>
      <Suspense fallback={null}>
        <HomeQueryRedirect />
      </Suspense>
      <HomepageCarousel
        cycles={cycles}
        pinned={
          <Link className="statement-card" href="/about">
            <HomepageWorldBuilders />
            <p>{site.statement}</p>
          </Link>
        }
      />
    </>
  );
}
