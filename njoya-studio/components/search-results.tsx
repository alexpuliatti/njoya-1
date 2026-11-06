"use client";

import type { NjoyaCarouselItem } from "@/lib/njoya-carousel-types";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import NjoyaCarousel from "./njoya-carousel";
import { StudioButton } from "./ui/studio-button";

import { matchesSearch } from "@/lib/content/search.mjs";
import { assetPath } from "@/lib/asset-path";
import { useSearchCatalog } from "@/lib/use-search-catalog";

export default function SearchResults({
  items,
}: {
  items: NjoyaCarouselItem[];
}) {
  const { catalog: index, loading, error, retry } = useSearchCatalog();
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
        {query && !loading && !error && (
          <p>
            {results.length} {results.length === 1 ? "project" : "projects"} for
            “{query}”
          </p>
        )}
      </section>
      {loading ? (
        <div className="empty-state" role="status">
          Loading search…
        </div>
      ) : error ? (
        <div className="empty-state" role="alert">
          <p>Search couldn’t load.</p>
          <StudioButton variant="outline" onClick={retry}>
            Try again
          </StudioButton>
        </div>
      ) : results.length ? (
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
