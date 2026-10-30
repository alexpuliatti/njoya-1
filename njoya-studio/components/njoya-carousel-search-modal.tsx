"use client";

import type { SearchItem } from "@/lib/njoya-carousel-types";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, X, ArrowUpRight } from "lucide-react";

import { matchesSearch } from "@/lib/content/search.mjs";

export default function SearchModal({
  items,
  onClose,
  onSubmit,
}: {
  items: SearchItem[];
  onClose: () => void;
  onSubmit: (query: string) => void;
}) {
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const matches = useMemo(
    () =>
      query.trim() ? items.filter((item) => matchesSearch(item, query)) : [],
    [items, query],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement as HTMLElement | null;

    dialog?.showModal();
    inputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="search-title"
      className="search-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <button
        aria-label="Dismiss search"
        className="search-dialog-dismiss"
        type="button"
        onClick={onClose}
      />
      <div className="search-dialog-inner">
        <div className="search-heading">
          <h2 id="search-title">Find a world.</h2>
          <button
            aria-label="Close search"
            className="icon-button"
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (query.trim()) onSubmit(query.trim());
          }}
        >
          <label className="search-input-wrap">
            <Search size={22} />
            <span className="sr-only">
              Search by project, brand, person or credit
            </span>
            <input
              ref={inputRef}
              autoComplete="off"
              placeholder="Project, brand, person or credit…"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              className="text-button"
              disabled={!query.trim()}
              type="submit"
            >
              Search <ArrowUpRight size={16} />
            </button>
          </label>
        </form>
        <div aria-live="polite" className="search-suggestions">
          {!query.trim() ? (
            <p className="muted-copy">
              Explore projects, collaborators and the people behind the work.
            </p>
          ) : (
            <>
              <p className="eyebrow">
                {matches.length} {matches.length === 1 ? "project" : "projects"}
              </p>
              {matches.slice(0, 6).map((item) => (
                <Link key={item.id} href={item.href} onClick={onClose}>
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      {item.subtitle} · {item.category}
                    </small>
                  </span>
                  <ArrowUpRight size={18} />
                </Link>
              ))}
              {!matches.length && (
                <p className="muted-copy">
                  No projects found. Try a different name or credit.
                </p>
              )}
              {matches.length > 6 && (
                <button
                  className="text-button all-results"
                  onClick={() => onSubmit(query)}
                >
                  View all {matches.length} projects <ArrowUpRight size={16} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
