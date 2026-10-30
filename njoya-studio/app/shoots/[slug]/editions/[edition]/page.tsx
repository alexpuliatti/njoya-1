import { notFound, permanentRedirect } from "next/navigation";

import { getLegacyDestination } from "@/lib/content/repository";
export default async function LegacyEdition({
  params,
}: {
  params: { slug: string; edition: string };
}) {
  const destination = await getLegacyDestination(
    `/shoots/${params.slug}/editions/${params.edition}`,
  );

  if (!destination) notFound();
  permanentRedirect(destination);
}
