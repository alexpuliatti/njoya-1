import type { Metadata } from "next";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import CategoryBrowser from "@/components/category-browser";
import { getCategories, getWorks } from "@/lib/content/repository";

export const metadata: Metadata = { title: "Work" };
export default async function WorkPage() {
  const [categories, works] = await Promise.all([getCategories(), getWorks()]);

  return (
    <CategoryBrowser>
      {categories.map((category, index) => {
        const cover = works.find(
          (work) => work.id === category.coverWorkId,
        )?.cover;
        const count = works.filter((work) =>
          work.categories.includes(category.id),
        ).length;

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
                priority={index < 3}
                sizes="(max-width: 767px) 78vw, 32vw"
                src={cover.src}
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
              <span className="category-count">{count} projects</span>
            </span>
          </Link>
        );
      })}
    </CategoryBrowser>
  );
}
