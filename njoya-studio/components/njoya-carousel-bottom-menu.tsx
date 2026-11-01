"use client";

import { usePathname } from "next/navigation";

import Link from "./transition-link";
import { siteConfig } from "@/config/site";

export default function StudioNavigation() {
  const pathname = usePathname().replace(/\/$/, "") || "/";

  if (pathname !== "/") return null;

  return (
    <nav aria-label="Main navigation" className="studio-navigation">
      {siteConfig.navItems.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            aria-current={active ? "page" : undefined}
            className={active ? "is-active" : ""}
            href={href}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
