import type { Metadata } from "next";

import { notFound } from "next/navigation";
import Link from "next/link";

import { getLabEntries } from "@/lib/content/repository";
import MediaGallery from "@/components/media-gallery";
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
