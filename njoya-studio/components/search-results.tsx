"use client";

import type { NjoyaCarouselItem, SearchItem } from "@/lib/njoya-carousel-types";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import NjoyaCarousel from "./njoya-carousel";

import { matchesSearch } from "@/lib/content/search.mjs";
import { assetPath } from "@/lib/asset-path";

export default function SearchResults({
  index,
  items,
}: {
  index: SearchItem[];
  items: NjoyaCarouselItem[];
}) {
  const query = (useSearchParams().get("q") ?? "").trim();
  const router = useRouter();
  const matchedIds = new Set(
    query
      ? index
          .filter((item) => matchesSearch(item, query))
          .map((item) => item.id)
      : [],
  );
  const results = items.filter((work) => matchedIds.has(work.id));

  return (
    <>
      <section className="search-page-heading">
        <form
          action={assetPath("/search/")}
          onSubmit={(event) => {
            event.preventDefault();
            const value = String(
              new FormData(event.currentTarget).get("q") ?? "",
            ).trim();

            router.push(`/search?q=${encodeURIComponent(value)}`);
          }}
        >
          <label className="eyebrow" htmlFor="project-query">
            Search the studio
          </label>
          <div>
            <input
              key={query}
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
        <NjoyaCarousel items={results} label={`Results for ${query}`} />
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
