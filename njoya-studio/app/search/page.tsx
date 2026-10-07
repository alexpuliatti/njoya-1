import type { Metadata } from "next";

import { Suspense } from "react";

import SearchResults from "@/components/search-results";
import {
  getCategories,
  getSearchIndex,
  getSite,
  getWorks,
  toCarouselItem,
} from "@/lib/content/repository";

export const metadata: Metadata = { title: "Search" };
export default async function SearchPage() {
  const [index, works, categories, site] = await Promise.all([
    getSearchIndex(),
    getWorks(),
    getCategories(),
    getSite(),
  ]);

  return (
    <Suspense fallback={<div className="empty-state">Loading search…</div>}>
      <SearchResults
        index={index}
        items={works.map((work) =>
          toCarouselItem(work, categories, site.videoPlaybackEnabled),
        )}
      />
    </Suspense>
  );
}
