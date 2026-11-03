"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Instagram, Search } from "lucide-react";
import { useEffect, useRef } from "react";

import { useSearch } from "./search-provider";
import { StudioButton, StudioIconButton } from "./ui/studio-button";

import { siteConfig } from "@/config/site";
import Image from "@/components/studio-image";
import { assetPath } from "@/lib/asset-path";

export function Navbar({ instagram }: { instagram: string }) {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const isHome = pathname === "/";
  const search = useSearch();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const menuButtonRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (menuRef.current) menuRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const menu = menuRef.current;

      if (
        menu?.open &&
        event.target instanceof Node &&
        !menu.contains(event.target)
      )
        menu.open = false;
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuRef.current?.open) {
        menuRef.current.open = false;
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("pointerdown", closeOutside);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("pointerdown", closeOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const sectionLinks = siteConfig.navItems.map(({ href, label }) => (
    <Link
      key={href}
      aria-current={
        pathname === href || pathname.startsWith(`${href}/`)
          ? "page"
          : undefined
      }
      href={href}
      onClick={() => {
        if (menuRef.current) menuRef.current.open = false;
      }}
    >
      {label}
    </Link>
  ));

  return (
    <header className="studio-header">
      <Link aria-label="Njoya Studios — home" className="wordmark" href="/">
        <Image
          priority
          alt=""
          aria-hidden="true"
          className="wordmark-logo"
          height={249}
          src={assetPath("/media/brand/logo-njoya-whitetext.svg")}
          width={796}
        />
      </Link>
      {!isHome && (
        <nav aria-label="Main navigation" className="header-navigation">
          {sectionLinks}
        </nav>
      )}
      <div className="header-actions">
        {!isHome && (
          <details ref={menuRef} className="section-menu">
            <summary ref={menuButtonRef}>Menu</summary>
            <nav aria-label="Mobile navigation">{sectionLinks}</nav>
          </details>
        )}
        <StudioIconButton
          label="Search work, people and credits"
          onClick={(event) => search?.openSearch(event.detail === 0)}
        >
          <Search size={20} strokeWidth={1.6} />
        </StudioIconButton>
        <StudioButton asChild className="studio-icon-button">
          <a
            aria-label="Njoya Studios on Instagram"
            href={instagram}
            rel="noreferrer"
            target="_blank"
          >
            <Instagram size={20} strokeWidth={1.5} />
          </a>
        </StudioButton>
      </div>
    </header>
  );
}
