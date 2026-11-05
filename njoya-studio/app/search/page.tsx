import type { Metadata } from "next";

import { Suspense } from "react";

import SearchResults from "@/components/search-results";
import {
  getCategories,
  getSite,
  getWorks,
  toCarouselItem,
} from "@/lib/content/repository";

export const metadata: Metadata = { title: "Search" };
export default async function SearchPage() {
  const [works, categories, site] = await Promise.all([
    getWorks(),
    getCategories(),
    getSite(),
  ]);

  return (
    <Suspense fallback={<div className="empty-state">Loading search…</div>}>
      <SearchResults
        items={works.map((work) =>
          toCarouselItem(work, categories, site.videoPlaybackEnabled),
        )}
      />
    </Suspense>
  );
}
