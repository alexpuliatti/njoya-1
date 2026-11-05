"use client";

import type { SearchItem } from "@/lib/njoya-carousel-types";

import { useCallback, useEffect, useState } from "react";

import { assetPath } from "./asset-path";
import { createSearchCatalogLoader } from "./search-catalog.mjs";

const loadSearchCatalog = createSearchCatalogLoader(
  assetPath("/search-index.json"),
);
const emptyCatalog: SearchItem[] = [];

export function useSearchCatalog() {
  const [catalog, setCatalog] = useState<SearchItem[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setError(false);
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;

    loadSearchCatalog().then(
      (items) => {
        if (active) setCatalog(items);
      },
      () => {
        if (active) setError(true);
      },
    );

    return () => {
      active = false;
    };
  }, [attempt]);

  return {
    catalog: catalog ?? emptyCatalog,
    loading: catalog === null && !error,
    error,
    retry,
  };
}
