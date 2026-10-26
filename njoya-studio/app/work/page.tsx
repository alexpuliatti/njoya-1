import type { Metadata } from "next";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import Image from "@/components/studio-image";
import { assetPath } from "@/lib/asset-path";
import { coverSize } from "@/lib/image-sources";
import CategoryBrowser from "@/components/category-browser";
import { getCategories, getWorks } from "@/lib/content/repository";

export const metadata: Metadata = { title: "Work" };
const mobileCardWidth = "calc((100vw - clamp(36px, 10vw, 48px)) * 0.92)";
const mobileCardHeight = "clamp(330px, 67svh, 640px)";
const tabletCardWidth = "calc((91.2vw - 30px) / 2)";
const tabletCardHeight = `calc((${tabletCardWidth}) * 4 / 3)`;

export default async function WorkPage() {
  const [categories, works] = await Promise.all([getCategories(), getWorks()]);
  // Match the responsive grid and height cap in globals.css.
  const desktopCardWidth = `min(calc((91.2vw - ${(categories.length - 1) * 24}px) / ${categories.length}), calc(max(240px, 100svh - 230px) * 0.75))`;
  const desktopCardHeight = `calc((${desktopCardWidth}) * 4 / 3)`;

  return (
    <CategoryBrowser categoryCount={categories.length}>
      {categories.map((category, index) => {
        const cover = works.find((work) => work.id === category.coverWorkId)?.cover;
        return (
          <Link
            key={category.id}
            className="category-card"
            href={`/work/${category.id}`}
          >
            {cover && (
              <Image
                fill
                alt={cover.alt}
                image={cover}
                priority={index < 3}
                sizes={`(max-width: 767px) ${coverSize(mobileCardWidth, mobileCardHeight, cover)}, (max-width: 1023px) ${coverSize(tabletCardWidth, tabletCardHeight, cover)}, ${coverSize(desktopCardWidth, desktopCardHeight, cover)}`}
                src={assetPath(cover.src)}
              />
            )}
            <span className="category-shade" />
            <span className="category-card-top">
              0{index + 1} <ArrowUpRight size={21} />
            </span>
            <span className="category-card-info">
              <span className="category-name">{category.title}</span>
              <span className="category-description">
                {category.description}
              </span>
            </span>
          </Link>
        );
      })}
    </CategoryBrowser>
  );
}
