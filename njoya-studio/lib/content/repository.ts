import "server-only";

import type {
  AboutContent,
  Category,
  Collection,
  HomeContent,
  LabEntry,
  SiteContent,
  Work,
} from "./types";
import type { NjoyaCarouselItem, SearchItem } from "@/lib/njoya-carousel-types";

import fs from "node:fs/promises";
import path from "node:path";

import { cache } from "react";
import { z } from "zod";

import {
  aboutSchema,
  categorySchema,
  collectionSchema,
  homeSchema,
  labSchema,
  siteSchema,
  workSchema,
} from "./schema.mjs";
import { compareWorkDate } from "./order.mjs";

import { creditsToMetadata } from "@/lib/credits";

const directory = path.join(process.cwd(), "content");
const readJson = async (file: string): Promise<unknown> =>
  JSON.parse(await fs.readFile(path.join(directory, file), "utf8"));

async function readDirectory<T>(
  folder: string,
  schema: z.ZodType<T>,
): Promise<T[]> {
  const files = (await fs.readdir(path.join(directory, folder)))
    .filter((file) => file.endsWith(".json"))
    .sort();

  return Promise.all(
    files.map(async (file) =>
      schema.parse(await readJson(`${folder}/${file}`)),
    ),
  );
}
export const getSite = cache(
  async (): Promise<SiteContent> =>
    siteSchema.parse(await readJson("site.json")),
);
export const getHome = cache(
  async (): Promise<HomeContent> =>
    homeSchema.parse(await readJson("home.json")),
);
export const getAbout = cache(
  async (): Promise<AboutContent> =>
    aboutSchema.parse(await readJson("about.json")),
);
export const getCategories = cache(
  async (): Promise<Category[]> =>
    z.array(categorySchema).parse(await readJson("categories.json")),
);
export const getCollections = cache(
  async (): Promise<Collection[]> =>
    readDirectory("collections", collectionSchema),
);
export const getWorks = cache(async (): Promise<Work[]> => {
  const works = await readDirectory("work", workSchema);

  return works.sort(compareWorkDate);
});
export const getWork = cache(async (slug: string) =>
  (await getWorks()).find((work) => work.slug === slug),
);
export const getCollection = cache(async (slug: string) =>
  (await getCollections()).find((collection) => collection.slug === slug),
);
export const getLegacyRoutes = cache(async () =>
  z.record(z.string()).parse(await readJson("legacy-routes.json")),
);
export const getLegacyDestination = cache(
  async (url: string) => (await getLegacyRoutes())[url],
);
export const getLabEntries = cache(
  async (): Promise<LabEntry[]> =>
    (await readDirectory("lab", labSchema))
      .filter((entry) => entry.published)
      .sort((a, b) => b.date.localeCompare(a.date)),
);

export function workMetadata(work: Work) {
  return [
    ...(work.client
      ? [{ label: "Client / publication", value: work.client }]
      : []),
    ...creditsToMetadata(work),
    ...(work.date ? [{ label: "Date", value: work.date }] : []),
  ];
}
export function toCarouselItem(
  work: Work,
  categories: Category[],
  videoPlaybackEnabled = false,
): NjoyaCarouselItem {
  const media = workMedia(work, videoPlaybackEnabled);

  return {
    id: work.id,
    title: work.title,
    subtitle: work.client,
    imageUrl: work.cover.previewSrc,
    imageAlt: work.cover.alt,
    heroImageUrl: work.cover.src,
    href: `/work/projects/${work.slug}`,
    linkLabel: "View project",
    category:
      categories.find((category) => category.id === work.categories[0])
        ?.title ?? "Work",
    type: work.kind === "edition" ? "shoot" : "design-project",
    images: work.gallery.flatMap((entry) =>
      entry.type === "video" ? [] : [entry.src],
    ),
    gallery: media.gallery,
    metadata: workMetadata(work),
    coverVideoPlaybackId: media.coverVideoPlaybackId,
    galleryVideoPlaybackIds: media.gallery.flatMap((entry) =>
      entry.type === "video" ? [entry.playbackId] : [],
    ),
  };
}
export function workMedia(work: Work, videoPlaybackEnabled = false) {
  return {
    coverVideoPlaybackId: videoPlaybackEnabled
      ? work.coverVideoPlaybackId
      : undefined,
    gallery: videoPlaybackEnabled
      ? work.gallery
      : work.gallery.filter((entry) => entry.type !== "video"),
  };
}
export const getSearchIndex = cache(async (): Promise<SearchItem[]> => {
  const [works, categories] = await Promise.all([getWorks(), getCategories()]);

  return works.map((work) => ({
    id: work.id,
    title: work.title,
    subtitle: work.client,
    category:
      categories.find((category) => category.id === work.categories[0])
        ?.title ?? "Work",
    href: `/work/projects/${work.slug}`,
    imageUrl: work.cover.previewSrc,
    searchText: [
      work.title,
      work.client,
      ...work.tags,
      ...work.categories,
      ...workMetadata(work).flatMap((entry) => [entry.label, entry.value]),
      ...work.gallery.flatMap((entry) =>
        entry.type === "synopsis" ? [entry.text ?? ""] : [],
      ),
    ].join(" "),
  }));
});
