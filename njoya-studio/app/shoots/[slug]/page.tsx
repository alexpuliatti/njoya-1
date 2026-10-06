import { notFound, permanentRedirect } from "next/navigation";

import { getCollection, getLegacyDestination } from "@/lib/content/repository";
export default async function LegacyShoot({
  params,
}: {
  params: { slug: string };
}) {
  const destination = await getLegacyDestination(`/shoots/${params.slug}`);

  if (destination) permanentRedirect(destination);
  const collection = await getCollection(params.slug);

  if (!collection) notFound();
  permanentRedirect(`/shoots/${params.slug}/editions`);
}
