import type { NjoyaCarouselItem } from "@/lib/njoya-carousel-types";

import Link from "next/link";
import { Suspense } from "react";

import NjoyaCarousel from "@/components/njoya-carousel";
import HomeQueryRedirect from "@/components/home-query-redirect";
import HomepageWorldBuilders from "@/components/homepage-world-builders";
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
  const items: NjoyaCarouselItem[] = home.featured.map((feature) => {
    const work = feature.workId ? byId.get(feature.workId) : undefined;

    if (work)
      return toCarouselItem(
        work,
        categories,
        site.videoPlaybackEnabled,
        work.categories.includes("motion") ? "motion" : undefined,
      );

    return {
      id: `pending-${feature.title}`,
      title: feature.title,
      subtitle: "Coming soon",
      imageUrl: "",
      href: "",
      linkLabel: "",
      category: "Selected project",
      type: "design-project",
      images: [],
      metadata: [],
      unavailable: true,
    };
  });

  return (
    <>
      <Suspense fallback={null}>
        <HomeQueryRedirect />
      </Suspense>
      <NjoyaCarousel
        showLoader
        items={items}
        label="Selected projects"
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
