"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/work", label: "Work" },
  { href: "/lab", label: "Lab" },
  { href: "/about", label: "About" },
];

export default function StudioNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="studio-navigation">
      {links.map(({ href, label }) => {
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
