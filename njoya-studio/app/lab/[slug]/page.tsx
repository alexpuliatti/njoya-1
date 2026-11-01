import type { Metadata } from "next";

import { notFound } from "next/navigation";

import styles from "../lab.module.css";

import Link from "@/components/transition-link";
import { getLabEntries } from "@/lib/content/repository";
import LabCaseStudy from "@/components/lab-case-study";
import MediaGallery from "@/components/media-gallery";
export const dynamicParams = false;
export const dynamic = "force-static";
export async function generateStaticParams() {
  const entries = (await getLabEntries()).map((entry) => ({
    slug: entry.slug,
  }));

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
    <div className={styles.detail}>
      <Link className={`text-button ${styles.back}`} href="/lab">
        ← Back to Lab
      </Link>
      <LabCaseStudy priority entry={entry} heading="h1" />
      {entry.gallery.length > 1 ? (
        <MediaGallery entries={entry.gallery.slice(1)} />
      ) : null}
    </div>
  );
}
