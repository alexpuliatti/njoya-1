import { notFound, permanentRedirect } from "next/navigation";

import { getLegacyDestination } from "@/lib/content/repository";
export default async function LegacyProject({
  params,
}: {
  params: { slug: string };
}) {
  const destination = await getLegacyDestination(
    `/design-projects/${params.slug}`,
  );

  if (!destination) notFound();
  permanentRedirect(destination);
}
