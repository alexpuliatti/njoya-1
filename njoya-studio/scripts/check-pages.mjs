import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { assertExportMedia } from "./export-media.mjs";
import { matchesSearch } from "../lib/content/search.mjs";

const output = path.resolve("out");
const { basePath, origin } = JSON.parse(
  await fs.readFile(path.join(output, "pages-build.json"), "utf8"),
);
const read = async (file) =>
  JSON.parse(await fs.readFile(path.join("content", file), "utf8"));
const records = async (folder) =>
  Promise.all(
    (await fs.readdir(path.join("content", folder)))
      .filter((name) => name.endsWith(".json"))
      .map((name) => read(`${folder}/${name}`)),
  );
const [works, collections, categories, aliases, lab, home] = await Promise.all([
  records("work"),
  records("collections"),
  read("categories.json"),
  read("legacy-routes.json"),
  records("lab"),
  read("home.json"),
]);
const pagePath = (url) => path.join(output, url, "index.html");
const routes = new Set([
  "/",
  "/work",
  "/about",
  "/lab",
  "/search",
  "/shoots",
  "/design-projects",
  ...works.map((work) => `/work/projects/${work.slug}`),
  ...categories.map((category) => `/work/${category.id}`),
  ...collections.flatMap((collection) => [
    `/shoots/${collection.slug}`,
    `/shoots/${collection.slug}/editions`,
  ]),
  ...Object.keys(aliases),
  ...lab
    .filter((entry) => entry.published)
    .map((entry) => `/lab/${entry.slug}`),
]);
const exists = async (file) =>
  fs.access(file).then(
    () => true,
    () => false,
  );
const searchIndex = JSON.parse(
  await fs.readFile(path.join(output, "search-index.json"), "utf8"),
);
assert.ok(Array.isArray(searchIndex), "Missing shared search catalog");
assert.deepEqual(
  searchIndex.map((item) => item.id).sort(),
  works.map((work) => work.id).sort(),
  "Shared search catalog must contain every Work project exactly once",
);
for (const work of works) {
  const item = searchIndex.find((item) => item.id === work.id);
  assert.equal(item.href, `/work/projects/${work.slug}`);
  assert.equal(item.imageUrl, work.cover.previewSrc);
  assert.ok(
    matchesSearch(item, work.title),
    `Unsearchable project: ${work.slug}`,
  );
}
for (const [query, minimum] of [
  ["Rihanna", 2],
  ["hermes Luiza", 1],
  ["Kwok Hei Yung", 1],
]) {
  assert.ok(
    searchIndex.filter((item) => matchesSearch(item, query)).length >= minimum,
    `Shared search catalog lost credit/accent matching: ${query}`,
  );
}
await assertExportMedia({
  output,
  images: (await read("media-variants.json")).images,
});
for (const route of routes)
  assert.ok(await exists(pagePath(route)), `Missing static page: ${route}`);
for (const [url, destination] of Object.entries(aliases)) {
  const html = await fs.readFile(pagePath(url), "utf8");
  assert.ok(
    html.includes(`0;url=${basePath}${destination}`),
    `Missing static redirect: ${url}`,
  );
}
// Homepage Motion cards share the section's visibility-controlled preview.
const homepage = await fs.readFile(pagePath("/"), "utf8");
const homepagePreviews = [...homepage.matchAll(/<video\b[^>]*>/g)].map(
  (match) => match[0],
);
for (const feature of home.featured) {
  const work = works.find((entry) => entry.id === feature.workId);

  if (!work?.categories.includes("motion") || !work.previewVideoSrc) continue;
  const preview = homepagePreviews.find((tag) =>
    tag.includes(`src="${basePath}${work.previewVideoSrc}"`),
  );

  assert.ok(preview, `Missing homepage Motion preview: ${work.slug}`);
  assert.ok(
    preview.includes('preload="metadata"') &&
      /\bmuted=""/i.test(preview) &&
      /\bplaysinline=""/i.test(preview) &&
      /\bloop=""/i.test(preview),
    `Homepage Motion cards must use the silent inline looping preview: ${work.slug}`,
  );
}
// A serialized source in the React payload is insufficient: native local
// films must have a playable src in the exported video element itself.
for (const work of works) {
  const localFilms = work.gallery.filter(
    (entry) => entry.type === "video" && entry.src,
  );
  if (!localFilms.length) continue;
  const html = await fs.readFile(
    pagePath(`/work/projects/${work.slug}`),
    "utf8",
  );
  const players = [...html.matchAll(/<video\b[^>]*>/g)].map(
    (match) => match[0],
  );
  for (const film of localFilms) {
    const player = players.find((tag) =>
      tag.includes(`src="${basePath}${film.src}"`),
    );
    assert.ok(player, `Missing playable local film: ${film.src}`);
    assert.ok(
      player.includes('controls=""') && player.includes('preload="none"'),
      `Local films need controls and deferred loading: ${film.src}`,
    );
  }
}
assert.ok(
  await exists(path.join(output, "404.html")),
  "Missing custom 404 page",
);
assert.ok(await exists(path.join(output, ".nojekyll")), "Missing .nojekyll");

const assets = new Set();
for (const route of [...routes, "/404.html"]) {
  const html = await fs.readFile(
    route === "/404.html" ? path.join(output, route) : pagePath(route),
    "utf8",
  );
  assert.doesNotMatch(
    html,
    /\/_next\/image\?/,
    `Image optimizer is unavailable on Pages: ${route}`,
  );
  assert.ok(
    !html.includes("searchText"),
    `Search catalog embedded in page: ${route}`,
  );
  const payload = path.join(output, route, "index.txt");
  if (await exists(payload)) {
    assert.ok(
      !(await fs.readFile(payload, "utf8")).includes("searchText"),
      `Search catalog embedded in navigation payload: ${route}`,
    );
  }
  const urls = [...html.matchAll(/\b(?:src|href|poster)="(\/[^\"]*)"/g)].map(
    (match) => match[1],
  );
  for (const match of html.matchAll(/\bsrcSet="([^\"]*)"/gi)) {
    for (const candidate of match[1].split(",")) {
      const url = candidate.trim().split(/\s+/)[0];
      if (url.startsWith("/")) urls.push(url);
    }
  }
  for (const match of html.matchAll(
    /<meta\b[^>]*\bcontent="(https?:\/\/[^\"]*)"/g,
  )) {
    const url = new URL(match[1].replaceAll("&amp;", "&"));
    if (url.origin === origin) urls.push(url.pathname + url.search);
  }
  for (const source of urls) {
    const url = source.replaceAll("&amp;", "&");
    if (url.startsWith("//")) continue;
    assert.ok(
      !basePath || url === basePath || url.startsWith(`${basePath}/`),
      `Unprefixed asset/link on ${route}: ${url}`,
    );
    assets.add(
      decodeURIComponent(url.slice(basePath.length).split(/[?#]/)[0] || "/"),
    );
  }
}
for (const item of searchIndex) {
  assets.add(item.href);
  assets.add(item.imageUrl);
}
for (const url of assets) {
  const file = path.join(output, url);
  assert.ok(
    (await exists(file)) || (await exists(path.join(file, "index.html"))),
    `Missing exported asset/link: ${url}`,
  );
}
console.log(
  `Passed ${routes.size} static route checks, ${Object.keys(aliases).length} redirect checks, and ${assets.size} asset/link checks for ${basePath || "/"}.`,
);
