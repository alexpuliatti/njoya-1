import { notFound } from "next/navigation";

import {
  getLegacyDestination,
  getLegacyRoutes,
} from "@/lib/content/repository";
import LegacyRedirect from "@/components/legacy-redirect";

export const dynamicParams = false;
export async function generateStaticParams() {
  return Object.keys(await getLegacyRoutes()).flatMap((url) => {
    const match = url.match(/^\/design-projects\/([^/]+)$/);

    return match ? [{ slug: match[1] }] : [];
  });
}
export default async function LegacyProject({
  params,
}: {
  params: { slug: string };
}) {
  const destination = await getLegacyDestination(
    `/design-projects/${params.slug}`,
  );

  if (!destination) notFound();

  return <LegacyRedirect href={destination} />;
}
