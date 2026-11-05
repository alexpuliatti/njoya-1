import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import Link from "@/components/transition-link";
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
      </div>
      {selected.length ? (
        <NjoyaCarousel
          items={selected.map((work) => ({
            ...toCarouselItem(work, categories, site.videoPlaybackEnabled),
            category: category.title,
          }))}
          label={category.title}
          loop={category.id === "motion" ? true : undefined}
        />
      ) : (
        <section className="empty-state">
          <h1>{category.title}</h1>
          <p>New projects coming soon.</p>
        </section>
      )}
    </>
  );
}
