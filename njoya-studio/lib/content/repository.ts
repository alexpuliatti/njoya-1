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
  responsiveMediaSchema,
} from "./schema.mjs";
import { compareWorkDate } from "./order.mjs";

import { creditsToMetadata } from "@/lib/credits";

const directory = path.join(process.cwd(), "content");
const readJson = async (file: string): Promise<unknown> =>
  JSON.parse(await fs.readFile(path.join(directory, file), "utf8"));
const getMediaIndex = cache(async () => {
  try {
    return z
      .object({ images: z.record(responsiveMediaSchema) })
      .parse(await readJson("media-variants.json")).images;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
});

async function withMedia<T>(value: T): Promise<T> {
  const images = await getMediaIndex();
  const visit = (value: unknown): unknown => {
    const node = value as Record<string, unknown>;

    if (Array.isArray(node)) return node.map(visit);
    if (!node || typeof node !== "object") return node;
    if (
      (node.type === "image" || node.type === "synopsis") &&
      typeof node.src === "string"
    ) {
      const media = images[path.basename(node.src).split(/[.-]/)[0]];

      return media
        ? {
            ...node,
            width: media.width,
            height: media.height,
            responsive: media,
          }
        : node;
    }

    return Object.fromEntries(
      Object.entries(node).map(([key, child]) => [key, visit(child)]),
    );
  };

  return visit(value) as T;
}

async function readDirectory<T>(
  folder: string,
  schema: z.ZodType<T>,
): Promise<T[]> {
  const files = (await fs.readdir(path.join(directory, folder)))
    .filter((file) => file.endsWith(".json"))
    .sort();

  return withMedia(
    await Promise.all(
      files.map(async (file) =>
        schema.parse(await readJson(`${folder}/${file}`)),
      ),
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
    withMedia(aboutSchema.parse(await readJson("about.json"))),
);
export const getCategories = cache(
  async (): Promise<Category[]> =>
    withMedia(z.array(categorySchema).parse(await readJson("categories.json"))),
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
    imageUrl: work.cover.responsive?.fallback.src ?? work.cover.src,
    cover: work.cover,
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
    previewVideoSrc: work.previewVideoSrc,
    galleryVideoPlaybackIds: media.gallery.flatMap((entry) =>
      entry.type === "video" && "playbackId" in entry ? [entry.playbackId] : [],
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
      : work.gallery.filter((entry) => entry.type !== "video" || "src" in entry),
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
