import type { Metadata } from "next";

import { notFound } from "next/navigation";
import Link from "next/link";

import { getLabEntries } from "@/lib/content/repository";
import MediaGallery from "@/components/media-gallery";
export const dynamicParams = false;
export const dynamic = "force-static";
export async function generateStaticParams() {
  const entries = (await getLabEntries()).map((entry) => ({ slug: entry.slug }));

  // Next.js 14 rejects an empty params array during static export. This unused
  // path reaches notFound() below; it never creates a published Lab entry.
  return entries.length ? entries : [{ slug: "__unpublished__" }];
}
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  return {
    title:
      (await getLabEntries()).find((entry) => entry.slug === params.slug)
        ?.title ?? "Lab",
  };
}
export default async function LabEntryPage({
  params,
}: {
  params: { slug: string };
}) {
  const entry = (await getLabEntries()).find(
    (item) => item.slug === params.slug,
  );

  if (!entry) notFound();

  return (
    <article className="lab-article">
      <Link className="text-button" href="/lab">
        ← Back to Lab
      </Link>
      <p className="eyebrow">{entry.date}</p>
      <h1>{entry.title}</h1>
      <p className="lab-summary">{entry.summary}</p>
      {entry.paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
      <MediaGallery entries={entry.gallery} />
    </article>
  );
}
