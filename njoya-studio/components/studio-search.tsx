"use client";

import type { SearchItem } from "@/lib/njoya-carousel-types";

import { useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import Image from "./studio-image";
import { StudioButton } from "./ui/studio-button";
import { SearchField } from "./ui/search-field";
import {
  StudioDialog,
  StudioDialogClose,
  StudioDialogPanel,
} from "./ui/studio-dialog";

import { matchesSearch } from "@/lib/content/search.mjs";

export default function StudioSearch({
  items,
  instant,
  onClose,
  onSubmit,
}: {
  items: SearchItem[];
  instant: boolean;
  onClose: () => void;
  onSubmit: (query: string) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const matches = useMemo(
    () => items.filter((item) => matchesSearch(item, query)),
    [items, query],
  );
  const hasQuery = !!query.trim();
  const visibleItems = (hasQuery ? matches : items).slice(0, hasQuery ? 6 : 4);

  return (
    <StudioDialog
      aria-labelledby={titleId}
      className="studio-search-dialog"
      initialFocusRef={inputRef}
      instant={instant}
      onClose={onClose}
    >
      <StudioDialogPanel className="studio-search-panel">
        <header className="studio-search-heading">
          <div>
            <p className="eyebrow">The studio index</p>
            <h2 id={titleId}>Find a world.</h2>
          </div>
          <StudioDialogClose label="Close search" />
        </header>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (hasQuery) onSubmit(query.trim());
          }}
        >
          <SearchField
            ref={inputRef}
            label="Search by project, brand, person or credit"
            placeholder="Project, brand, person or credit…"
            value={query}
            onChange={setQuery}
          />
        </form>
        {!hasQuery && (
          <div className="studio-search-topics">
            <span className="eyebrow">Try</span>
            {["Hermès", "Lacoste", "Rihanna"].map((topic) => (
              <StudioButton
                key={topic}
                variant="outline"
                onClick={() => setQuery(topic)}
              >
                {topic}
              </StudioButton>
            ))}
          </div>
        )}
        <div aria-live="polite" className="studio-search-status">
          <span>
            {hasQuery
              ? `${matches.length} ${matches.length === 1 ? "project" : "projects"} found`
              : "From the archive"}
          </span>
          <span>{hasQuery ? "Search results" : "Selected entries"}</span>
        </div>
        <div className="studio-search-results">
          {visibleItems.map((item, index) => (
            <Link key={item.id} href={item.href} onClick={onClose}>
              <span className="studio-result-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Image
                alt=""
                className="studio-result-image"
                height={52}
                sizes="44px"
                src={item.imageUrl}
                width={44}
              />
              <span className="studio-result-copy">
                <strong>{item.title}</strong>
                <small>
                  {item.category}
                  {item.subtitle && item.subtitle !== item.title
                    ? ` · ${item.subtitle}`
                    : ""}
                </small>
              </span>
              <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.4} />
            </Link>
          ))}
          {hasQuery && !matches.length && (
            <div className="studio-search-empty">
              <p>No worlds found.</p>
              <span>Try another name, collaborator or credit.</span>
            </div>
          )}
        </div>
        <footer className="studio-search-footer">
          <span>
            <kbd>esc</kbd> {hasQuery ? "Clear search" : "Close"}
          </span>
          {hasQuery && (
            <StudioButton onClick={() => onSubmit(query.trim())}>
              View all results <ArrowUpRight size={15} />
            </StudioButton>
          )}
        </footer>
      </StudioDialogPanel>
    </StudioDialog>
  );
}
