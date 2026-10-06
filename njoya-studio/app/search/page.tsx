import type { Metadata } from "next";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import NjoyaCarousel from "@/components/njoya-carousel";
import {
  getCategories,
  getSearchIndex,
  getSite,
  getWorks,
  toCarouselItem,
} from "@/lib/content/repository";
import { matchesSearch } from "@/lib/content/search.mjs";

export const metadata: Metadata = { title: "Search" };
export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = (searchParams.q ?? "").trim();
  const [index, works, categories, site] = await Promise.all([
    getSearchIndex(),
    getWorks(),
    getCategories(),
    getSite(),
  ]);
  const matchedIds = new Set(
    query
      ? index
          .filter((item) => matchesSearch(item, query))
          .map((item) => item.id)
      : [],
  );
  const results = works.filter((work) => matchedIds.has(work.id));

  return (
    <>
      <section className="search-page-heading">
        <form action="/search">
          <label className="eyebrow" htmlFor="project-query">
            Search the studio
          </label>
          <div>
            <input
              defaultValue={query}
              id="project-query"
              name="q"
              placeholder="Project, brand, person or credit…"
              type="search"
            />
            <button aria-label="Search" className="icon-button" type="submit">
              <ArrowUpRight size={24} />
            </button>
          </div>
        </form>
        {query && (
          <p>
            {results.length} {results.length === 1 ? "project" : "projects"} for
            “{query}”
          </p>
        )}
      </section>
      {results.length ? (
        <NjoyaCarousel
          items={results.map((work) =>
            toCarouselItem(work, categories, site.videoPlaybackEnabled),
          )}
          label={`Results for ${query}`}
        />
      ) : (
        <div className="empty-state">
          <p>
            {query
              ? "No projects found. Try another name, brand or credit."
              : "Search projects and the people behind them."}
          </p>
          <Link className="text-button" href="/work">
            Explore all work <ArrowUpRight size={17} />
          </Link>
        </div>
      )}
    </>
  );
}
