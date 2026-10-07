import type { Metadata } from "next";

import { notFound } from "next/navigation";

import WorkDetail from "@/components/work-detail";
import {
  getCategories,
  getSite,
  getWork,
  getWorks,
  workMetadata,
  workMedia,
} from "@/lib/content/repository";

export const dynamicParams = false;
export async function generateStaticParams() {
  return (await getWorks()).map((work) => ({ slug: work.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const work = await getWork(params.slug);

  return {
    title: work?.title ?? "Project",
    description: work
      ? `${work.title} — ${work.client}. A project by Njoya Studios.`
      : undefined,
  };
}
export default async function ProjectPage({
  params,
}: {
  params: { slug: string };
}) {
  const [work, categories, site] = await Promise.all([
    getWork(params.slug),
    getCategories(),
    getSite(),
  ]);

  if (!work) notFound();
  const category = categories.find((entry) => entry.id === work.categories[0]);
  const media = workMedia(work, site.videoPlaybackEnabled);

  return (
    <WorkDetail
      backHref={`/work/${category?.id ?? "worlds"}`}
      backLabel={category?.title ?? "Work"}
      cover={work.cover}
      gallery={media.gallery}
      heroVideoPlaybackId={media.coverVideoPlaybackId}
      metadata={workMetadata(work)}
      subtitle={work.client}
      title={work.title}
    />
  );
}
