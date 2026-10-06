"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Instagram, Search } from "lucide-react";

import { useSearch } from "./search-provider";

export function Navbar({ instagram }: { instagram: string }) {
  const pathname = usePathname();
  const search = useSearch();
  const titles: Record<string, string> = {
    "/work": "Work",
    "/work/worlds": "Worlds",
    "/work/exhibition": "Exhibition",
    "/work/commercials": "Commercials",
    "/work/editorials": "Editorials",
    "/lab": "Lab",
    "/about": "About",
    "/search": "Search",
    "/shoots": "Archive",
    "/design-projects": "Design projects",
  };

  return (
    <header className="studio-header">
      <Link aria-label="Njoya Studios — home" className="wordmark" href="/">
        <span aria-hidden="true" className="wordmark-name">
          NJ
          <span className="wordmark-o" />
          YA
        </span>
        <span aria-hidden="true" className="wordmark-caption">
          STUDIOS
        </span>
      </Link>
      <span className="page-label">{titles[pathname] ?? ""}</span>
      <div className="header-actions">
        <button
          aria-label="Search work, people and credits"
          className="icon-button"
          type="button"
          onClick={() => search?.openSearch()}
        >
          <Search size={23} strokeWidth={1.6} />
        </button>
        <a
          aria-label="Njoya Studios on Instagram"
          className="icon-button"
          href={instagram}
          rel="noreferrer"
          target="_blank"
        >
          <Instagram size={22} strokeWidth={1.6} />
        </a>
      </div>
    </header>
  );
}
