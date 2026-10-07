import { notFound } from "next/navigation";

import {
  getLegacyDestination,
  getLegacyRoutes,
} from "@/lib/content/repository";
import LegacyRedirect from "@/components/legacy-redirect";

export const dynamicParams = false;
export async function generateStaticParams() {
  return Object.keys(await getLegacyRoutes()).flatMap((url) => {
    const match = url.match(/^\/shoots\/([^/]+)\/editions\/([^/]+)$/);

    return match ? [{ slug: match[1], edition: match[2] }] : [];
  });
}
export default async function LegacyEdition({
  params,
}: {
  params: { slug: string; edition: string };
}) {
  const destination = await getLegacyDestination(
    `/shoots/${params.slug}/editions/${params.edition}`,
  );

  if (!destination) notFound();

  return <LegacyRedirect href={destination} />;
}
