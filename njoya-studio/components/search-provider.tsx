"use client";

import type { SearchItem } from "@/lib/njoya-carousel-types";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const SearchModal = dynamic(() => import("./njoya-carousel-search-modal"));
const SearchContext = createContext<{ openSearch: () => void } | null>(null);

export const useSearch = () => useContext(SearchContext);

export default function SearchProvider({
  children,
  catalog,
}: {
  children: React.ReactNode;
  catalog: SearchItem[];
}) {
  const [open, setOpen] = useState(false);
  const openSearch = useCallback(() => setOpen(true), []);
  const router = useRouter();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <SearchContext.Provider value={{ openSearch }}>
      {children}
      {open && (
        <SearchModal
          items={catalog}
          onClose={() => setOpen(false)}
          onSubmit={(query) => {
            setOpen(false);
            router.push(`/search?q=${encodeURIComponent(query)}`);
          }}
        />
      )}
    </SearchContext.Provider>
  );
}
