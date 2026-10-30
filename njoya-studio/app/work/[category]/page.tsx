import type { Metadata } from "next";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import NjoyaCarousel from "@/components/njoya-carousel";
import {
  getCategories,
  getSite,
  getWorks,
  toCarouselItem,
} from "@/lib/content/repository";

export const dynamicParams = false;
export async function generateStaticParams() {
  return (await getCategories()).map((category) => ({ category: category.id }));
}
export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  return {
    title:
      (await getCategories()).find(
        (category) => category.id === params.category,
      )?.title ?? "Work",
  };
}
export default async function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const [categories, works, site] = await Promise.all([
    getCategories(),
    getWorks(),
    getSite(),
  ]);
  const category = categories.find((entry) => entry.id === params.category);

  if (!category) notFound();
  const selected = works.filter((work) =>
    work.categories.includes(category.id),
  );

  return (
    <>
      <div className="listing-heading">
        <Link className="text-button" href="/work">
          <ArrowLeft size={15} /> All work
        </Link>
        <p>
          {selected.length} projects <span>· Newest first</span>
        </p>
      </div>
      <NjoyaCarousel
        items={selected.map((work) =>
          toCarouselItem(work, categories, site.videoPlaybackEnabled),
        )}
        label={category.title}
      />
    </>
  );
}
