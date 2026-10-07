import { notFound } from "next/navigation";

import {
  getCollection,
  getCollections,
  getLegacyDestination,
  getLegacyRoutes,
} from "@/lib/content/repository";
import LegacyRedirect from "@/components/legacy-redirect";

export const dynamicParams = false;
export async function generateStaticParams() {
  const [collections, aliases] = await Promise.all([
    getCollections(),
    getLegacyRoutes(),
  ]);
  const slugs = new Set(collections.map((collection) => collection.slug));

  for (const url of Object.keys(aliases)) {
    const match = url.match(/^\/shoots\/([^/]+)$/);

    if (match) slugs.add(match[1]);
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}
export default async function LegacyShoot({
  params,
}: {
  params: { slug: string };
}) {
  const destination = await getLegacyDestination(`/shoots/${params.slug}`);

  if (destination) return <LegacyRedirect href={destination} />;
  const collection = await getCollection(params.slug);

  if (!collection) notFound();

  return <LegacyRedirect href={`/shoots/${params.slug}/editions`} />;
}
