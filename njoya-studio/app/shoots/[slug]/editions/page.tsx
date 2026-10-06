import { notFound } from "next/navigation";
import Link from "next/link";

import NjoyaCarousel from "@/components/njoya-carousel";
import {
  getCategories,
  getCollection,
  getSite,
  getWorks,
  toCarouselItem,
} from "@/lib/content/repository";
export default async function CollectionPage({
  params,
}: {
  params: { slug: string };
}) {
  const [collection, works, categories, site] = await Promise.all([
    getCollection(params.slug),
    getWorks(),
    getCategories(),
    getSite(),
  ]);

  if (!collection) notFound();
  const selected = works.filter((work) => collection.workIds.includes(work.id));

  return (
    <>
      <div className="listing-heading">
        <Link href="/work">All work</Link>
        <h1>{collection.title}</h1>
        <p>{selected.length} projects</p>
      </div>
      <NjoyaCarousel
        items={selected.map((work) =>
          toCarouselItem(work, categories, site.videoPlaybackEnabled),
        )}
        label={collection.title}
      />
    </>
  );
}
