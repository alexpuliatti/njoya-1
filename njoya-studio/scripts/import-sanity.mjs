import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  workSchema,
  collectionSchema,
  aboutSchema,
} from "../lib/content/schema.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const sourceArg = args.find((arg) => !arg.startsWith("--"));
const exportRoot = path.resolve(
  root,
  sourceArg ??
    "../njoya-sanity-backup/extracted/production-export-2026-10-29t16-30-14-149z",
);
const contentRoot = path.join(root, "content");
const overwrite = args.includes("--overwrite");
const slugify = (value) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const clean = (value) => (typeof value === "string" ? value.trim() : "");
const readJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"));
const exists = async (file) =>
  fs.access(file).then(
    () => true,
    () => false,
  );

if ((await exists(path.join(contentRoot, "work"))) && !overwrite) {
  throw new Error(
    "Local content already exists. Import is a one-time operation. Back up local edits before using --overwrite.",
  );
}
const documents = (
  await fs.readFile(path.join(exportRoot, "data.ndjson"), "utf8")
)
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));
const published = documents.filter((doc) => !doc._id.startsWith("drafts."));
const byId = new Map(published.map((doc) => [doc._id, doc]));
const assetMetadata = await readJson(path.join(exportRoot, "assets.json"));
const mediaSources = {};
const audit = {
  source: path.relative(root, exportRoot),
  excludedDrafts: documents.length - published.length,
  generatedSlugs: [],
  unlinkedWork: [],
  missingDates: [],
  dateConflicts: [],
  categoryReview: [],
  pendingHeroes: ["Jaguar"],
  preservedVideoReferences: "Mux playback IDs only; no video files supplied",
  counts: {},
};

function image(value, fallbackAlt) {
  if (!value?._sanityAsset) return null;
  const pointer = value._sanityAsset;
  if (!pointer.startsWith("image@file://./images/"))
    throw new Error(`Unsupported asset pointer: ${pointer}`);
  const file = pointer.slice("image@file://./images/".length);
  if (path.basename(file) !== file)
    throw new Error("Image path must be a filename");
  const match = file.match(/^([a-f0-9]+)-(\d+)x(\d+)\.[a-z0-9]+$/i);
  if (!match) throw new Error(`Invalid image filename: ${file}`);
  const [, id, width, height] = match;
  const metadata = assetMetadata[`image-${id}`];
  mediaSources[id] = {
    file,
    originalFilename: metadata?.originalFilename ?? file,
    width: Number(width),
    height: Number(height),
  };
  return {
    type: "image",
    src: `/media/images/${id}.webp`,
    previewSrc: `/media/images/${id}-720.webp`,
    alt: clean(value.alt) || fallbackAlt,
    width: Number(width),
    height: Number(height),
  };
}
function slots(doc, prefix) {
  return Object.keys(doc)
    .filter((key) => new RegExp(`^${prefix}\\d+$`).test(key))
    .sort(
      (a, b) => Number(a.slice(prefix.length)) - Number(b.slice(prefix.length)),
    )
    .map((key) => doc[key]);
}
function videoId(value) {
  return byId.get(value?.asset?._ref)?.playbackId;
}
function credits(doc) {
  const structured = (doc.credits ?? [])
    .filter((credit) => clean(credit.name))
    .map((credit) => ({
      role: clean(credit.role) || "other",
      ...(clean(credit.customRole)
        ? { customRole: clean(credit.customRole) }
        : {}),
      name: clean(credit.name),
    }));
  if (structured.length) return structured;
  return [
    ["photographer", doc.magPhotographer],
    ["talent", doc.magTalent],
    ["stylist", doc.magStylist],
    ["assistant", doc.magAssistant],
    ["other", doc.magOthers],
  ]
    .filter(([, name]) => clean(name))
    .map(([role, name]) => ({ role, name: clean(name) }));
}
function categories(doc) {
  if (doc._type === "designProjects") {
    if (
      /exhibition/i.test(doc.designProjectType ?? "") ||
      /kway|off-white-imaginary/.test(doc.slug?.current ?? "")
    )
      return ["exhibition"];
    return ["worlds"];
  }
  const editorial =
    /magazine|vogue|dazed|perfect|paper|system|le monde|t magazine|wmagazine|new york times/i.test(
      `${doc.magName ?? ""} ${doc.magEdition ?? ""}`,
    );
  return [editorial ? "editorials" : "commercials"];
}
const usedSlugs = new Set();
const workDocuments = published.filter((doc) =>
  ["subShoots", "designProjects"].includes(doc._type),
);
const works = workDocuments.map((doc) => {
  const isEdition = doc._type === "subShoots";
  const title = clean(
    isEdition ? doc.magEdition || doc.magName : doc.designProjectName,
  );
  let slug = doc.slug?.current ?? slugify(title);
  if (usedSlugs.has(slug)) slug = `${slug}-${doc._id.slice(0, 8)}`;
  usedSlugs.add(slug);
  if (!doc.slug?.current)
    audit.generatedSlugs.push({ id: doc._id, title, slug });
  const cover = image(isEdition ? doc.magCover : doc.designImage1, title);
  if (!cover) throw new Error(`Work ${title} has no cover image`);
  const gallery = slots(doc, isEdition ? "magImage" : "designImage")
    .slice(isEdition ? 0 : 1)
    .map((entry, index) => image(entry, `${title} — image ${index + 1}`))
    .filter(Boolean);
  for (const value of slots(
    doc,
    isEdition ? "magVideo" : "designProjectVideo",
  )) {
    const playbackId = videoId(value);
    if (playbackId)
      gallery.push({ type: "video", playbackId, alt: `${title} — film` });
  }
  const coverVideoPlaybackId = videoId(
    isEdition ? doc.magCoverVideo : doc.designVideo1,
  );
  const date = clean(isEdition ? doc.magDate : doc.designProjectDate) || null;
  if (!date) audit.missingDates.push({ id: doc._id, title });
  if (!isEdition && /Brides de Galaxy/i.test(title))
    audit.dateConflicts.push({
      id: doc._id,
      title,
      date,
      note: "Title says 2025; source date says 2023. Source date retained pending review.",
    });
  const categoryIds = categories(doc);
  audit.categoryReview.push({
    id: doc._id,
    title,
    proposedCategories: categoryIds,
  });
  return workSchema.parse({
    id: doc._id,
    slug,
    title,
    client: clean(isEdition ? doc.magName : doc.designProjectClient),
    date,
    categories: categoryIds,
    kind: isEdition ? "edition" : "design-project",
    cover,
    ...(coverVideoPlaybackId ? { coverVideoPlaybackId } : {}),
    gallery,
    credits: credits(doc),
    tags: [
      clean(doc.designProjectType),
      clean(doc.designProjectLocation),
    ].filter(Boolean),
    legacyUrls:
      !isEdition && doc.slug?.current
        ? [`/design-projects/${doc.slug.current}`]
        : [],
  });
});
const workById = new Map(works.map((work) => [work.id, work]));
const linkedIds = new Set();
const collections = published
  .filter((doc) => doc._type === "shoots")
  .map((doc) => {
    const title = clean(doc.magName);
    const slug = doc.slug?.current ?? slugify(title);
    if (!doc.slug?.current)
      audit.generatedSlugs.push({ id: doc._id, title, slug });
    const workIds = slots(doc, "subShoot")
      .map((value) => value?._ref)
      .filter((id) => workById.has(id));
    for (const id of workIds) {
      linkedIds.add(id);
      const work = workById.get(id);
      const source = byId.get(id);
      for (const editionSlug of new Set(
        [source.slug?.current, source.edition?.current].filter(Boolean),
      )) {
        work.legacyUrls.push(`/shoots/${slug}/editions/${editionSlug}`);
      }
      if (!doc.multiShoot && id === workIds[0]) {
        work.legacyUrls.push(`/shoots/${slug}`);
      }
      if (id === workIds[0] && (workIds.length === 1 || !doc.multiShoot)) {
        work.coverVideoPlaybackId ??= videoId(doc.magCoverVideo);
      }
    }
    return collectionSchema.parse({
      id: doc._id,
      slug,
      title,
      cover: image(doc.magCover, title),
      workIds,
      isMultiEdition: !!doc.multiShoot,
      ...(videoId(doc.magCoverVideo)
        ? { coverVideoPlaybackId: videoId(doc.magCoverVideo) }
        : {}),
    });
  });
for (const work of works.filter(
  (work) => work.kind === "edition" && !linkedIds.has(work.id),
))
  audit.unlinkedWork.push({ id: work.id, title: work.title });
const aboutDoc = published.find((doc) => doc._type === "about");
const about = aboutSchema.parse({
  biography:
    "Njoya Studios is a multidisciplinary creative practice producing physical worlds through colour, material, movement and storytelling. Every project begins with a foundation of built visual language to craft an immersive aesthetic and emotional representation of a place. The studio specializes in creative direction, spatial and environmental design, commercial and editorial design, and cultural spaces. Founder and director Ibby Njoya is represented by New School Represents.",
  portrait: image(
    aboutDoc?.aboutMainImage,
    "Ibby Njoya, founder and director of Njoya Studios",
  ),
  team: [1, 2, 3]
    .filter((n) => clean(aboutDoc?.[`aboutTeamName${n}`]))
    .map((n) => ({
      name: clean(aboutDoc[`aboutTeamName${n}`]),
      position: clean(aboutDoc[`aboutTeamPosition${n}`]),
      description: clean(aboutDoc[`aboutTeamRoleDescription${n}`]),
      email: clean(aboutDoc[`aboutTeamEmail${n}`]).toLowerCase(),
      image: image(
        aboutDoc[`aboutTeamImage${n}`],
        clean(aboutDoc[`aboutTeamName${n}`]),
      ),
    })),
});
const legacyRoutes = Object.fromEntries(
  works.flatMap((work) =>
    work.legacyUrls.map((url) => [url, `/work/projects/${work.slug}`]),
  ),
);
const write = async (relative, value) => {
  const file = path.join(root, relative);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
};
const initialize = async (relative, value) => {
  if (!(await exists(path.join(root, relative)))) await write(relative, value);
};
for (const work of works) await write(`content/work/${work.slug}.json`, work);
for (const collection of collections)
  await write(`content/collections/${collection.slug}.json`, collection);
await write("content/about.json", about);
await write("content/media-sources.json", mediaSources);
await write("content/legacy-routes.json", legacyRoutes);
await initialize("content/site.json", {
  name: "NJOYA STUDIOS",
  headline: "WE BUILD WORLDS",
  statement:
    "A multidisciplinary creative practice working across space, image, objects and experiences.",
  instagram: "https://www.instagram.com/njoyastudios/",
  videoPlaybackEnabled: false,
  contacts: [
    { label: "Job inquiries", emails: ["sam@newschoolrepresents.com"] },
    {
      label: "General & studio inquiries",
      emails: ["luiza@ibbynjoya.com", "aisha@ibbynjoya.com"],
    },
  ],
});
const findWork = (slug) => works.find((work) => work.slug === slug)?.id;
await initialize("content/home.json", {
  featured: [
    { title: "Brides de Galaxy", workId: findWork("hermes-brides-de-galaxy") },
    { title: "Lacoste", workId: findWork("lacoste-april-2024") },
    { title: "Jaguar", workId: null },
    { title: "Vogue Hommes", workId: findWork("vogue-hommes-march-2021") },
  ],
});
await initialize("content/categories.json", [
  {
    id: "worlds",
    title: "Worlds",
    description: "Spaces, environments and experiences.",
    coverWorkId: findWork("hermes-brides-de-galaxy"),
  },
  {
    id: "exhibition",
    title: "Exhibition",
    description: "Stories brought into physical space.",
    coverWorkId: works.find((work) => work.title === "NAOMI: In Fashion")?.id,
  },
  {
    id: "commercials",
    title: "Commercials",
    description: "Imagined worlds for brands.",
    coverWorkId: findWork("lacoste-april-2024"),
  },
  {
    id: "editorials",
    title: "Editorials",
    description: "Image-making through colour and storytelling.",
    coverWorkId: findWork("dazed-autumn-2021-30th-anniversary-issue"),
  },
]);
await fs.mkdir(path.join(contentRoot, "lab"), { recursive: true });
await fs.writeFile(path.join(contentRoot, "lab", ".gitkeep"), "");
for (const source of Object.values(mediaSources))
  await fs.access(path.join(exportRoot, "images", source.file));
audit.counts = {
  work: works.length,
  collections: collections.length,
  images: Object.keys(mediaSources).length,
  legacyRoutes: Object.keys(legacyRoutes).length,
};
await write("docs/migration-audit.json", audit);
console.log(
  `Imported ${works.length} works, ${collections.length} collections, and ${Object.keys(mediaSources).length} image sources. Review docs/migration-audit.json.`,
);
