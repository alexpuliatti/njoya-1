import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  aboutSchema,
  categorySchema,
  collectionSchema,
  homeSchema,
  labSchema,
  siteSchema,
  workSchema,
} from "../lib/content/schema.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const content = path.join(root, "content");
const read = async (file) =>
  JSON.parse(await fs.readFile(path.join(content, file), "utf8"));
async function records(folder, schema) {
  const files = (await fs.readdir(path.join(content, folder))).filter((file) =>
    file.endsWith(".json"),
  );
  return Promise.all(
    files.map(async (file) => {
      try {
        const record = schema.parse(await read(`${folder}/${file}`));
        if (file !== `${record.slug}.json`)
          throw new Error("Filename must match the record slug");
        return record;
      } catch (error) {
        throw new Error(`${folder}/${file}: ${error.message}`);
      }
    }),
  );
}
export async function validateContent({ checkMedia = true } = {}) {
  const [works, collections, lab, categories, home, about] = await Promise.all([
    records("work", workSchema),
    records("collections", collectionSchema),
    records("lab", labSchema),
    read("categories.json").then((value) =>
      z.array(categorySchema).length(4).parse(value),
    ),
    read("home.json").then((value) => homeSchema.parse(value)),
    read("about.json").then((value) => aboutSchema.parse(value)),
    read("site.json").then((value) => siteSchema.parse(value)),
  ]);
  const ids = new Set();
  const slugs = new Set();
  const urls = new Set();
  const imagePaths = new Set();
  const categoryIds = new Set(categories.map((category) => category.id));
  if (categoryIds.size !== categories.length)
    throw new Error("Duplicate category IDs");
  const addImage = (image) => {
    if (image) {
      imagePaths.add(image.src);
      imagePaths.add(image.previewSrc);
    }
  };
  for (const work of works) {
    if (ids.has(work.id) || slugs.has(work.slug))
      throw new Error(`Duplicate ID or slug: ${work.title}`);
    ids.add(work.id);
    slugs.add(work.slug);
    for (const category of work.categories)
      if (!categoryIds.has(category))
        throw new Error(`Unknown category on ${work.slug}`);
    for (const url of work.legacyUrls) {
      if (urls.has(url)) throw new Error(`Duplicate legacy URL ${url}`);
      urls.add(url);
    }
    addImage(work.cover);
    for (const entry of work.gallery)
      if (entry.type !== "video") addImage(entry);
  }
  for (const collection of collections) {
    for (const id of collection.workIds)
      if (!ids.has(id))
        throw new Error(`Broken collection link: ${collection.slug} -> ${id}`);
    addImage(collection.cover);
  }
  for (const category of categories)
    if (!ids.has(category.coverWorkId))
      throw new Error(`Unknown category cover: ${category.id}`);
  const featuredIds = home.featured
    .map((entry) => entry.workId)
    .filter(Boolean);
  if (new Set(featuredIds).size !== featuredIds.length)
    throw new Error("Duplicate homepage projects");
  for (const id of featuredIds)
    if (!ids.has(id)) throw new Error(`Unknown featured work ID: ${id}`);
  addImage(about.portrait);
  about.team.forEach((person) => addImage(person.image));
  lab.forEach((entry) => entry.gallery.forEach(addImage));
  const routes = z.record(z.string()).parse(await read("legacy-routes.json"));
  for (const [oldUrl, destination] of Object.entries(routes)) {
    const work = works.find(
      (work) => destination === `/work/projects/${work.slug}`,
    );
    if (!work || !work.legacyUrls.includes(oldUrl))
      throw new Error(`Invalid legacy route ${oldUrl}`);
  }
  if (Object.keys(routes).length !== urls.size)
    throw new Error("Legacy route map is out of sync");
  if (checkMedia)
    await Promise.all(
      [...imagePaths].map(async (url) => {
        try {
          if (!(await fs.stat(path.join(root, "public", url))).size)
            throw new Error("Empty image");
        } catch {
          throw new Error(
            `Missing prepared image: ${url}. Run npm run media:prepare.`,
          );
        }
      }),
    );
  return {
    works,
    collections,
    lab: lab.filter((entry) => entry.published),
    categories,
    home,
    imageFiles: imagePaths.size,
  };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const result = await validateContent();
  console.log(
    `Validated ${result.works.length} works, ${result.collections.length} collections, ${result.imageFiles} local image files, and all legacy routes.`,
  );
}
