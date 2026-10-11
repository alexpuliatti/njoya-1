"use client";

import type { SearchItem } from "@/lib/njoya-carousel-types";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const SearchModal = dynamic(() => import("./studio-search"));
const SearchContext = createContext<{
  openSearch: (instant?: boolean) => void;
} | null>(null);

export const useSearch = () => useContext(SearchContext);

export default function SearchProvider({
  children,
  catalog,
}: {
  children: React.ReactNode;
  catalog: SearchItem[];
}) {
  const [open, setOpen] = useState(false);
  const instantRef = useRef(false);
  const openSearch = useCallback((instant = false) => {
    instantRef.current = instant;
    setOpen(true);
  }, []);
  const router = useRouter();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        instantRef.current = true;
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
          instant={instantRef.current}
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
