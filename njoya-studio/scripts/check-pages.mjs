import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const output = path.resolve("out");
const { basePath } = JSON.parse(await fs.readFile(path.join(output, "pages-build.json"), "utf8"));
const read = async (file) => JSON.parse(await fs.readFile(path.join("content", file), "utf8"));
const records = async (folder) => Promise.all(
  (await fs.readdir(path.join("content", folder)))
    .filter((name) => name.endsWith(".json"))
    .map((name) => read(`${folder}/${name}`)),
);
const [works, collections, categories, aliases, lab] = await Promise.all([
  records("work"), records("collections"), read("categories.json"), read("legacy-routes.json"), records("lab"),
]);
const pagePath = (url) => path.join(output, url, "index.html");
const routes = new Set([
  "/", "/work", "/about", "/lab", "/search", "/shoots", "/design-projects",
  ...works.map((work) => `/work/projects/${work.slug}`),
  ...categories.map((category) => `/work/${category.id}`),
  ...collections.flatMap((collection) => [`/shoots/${collection.slug}`, `/shoots/${collection.slug}/editions`]),
  ...Object.keys(aliases),
  ...lab.filter((entry) => entry.published).map((entry) => `/lab/${entry.slug}`),
]);
const exists = async (file) => fs.access(file).then(() => true, () => false);
for (const route of routes) assert.ok(await exists(pagePath(route)), `Missing static page: ${route}`);
for (const [url, destination] of Object.entries(aliases)) {
  const html = await fs.readFile(pagePath(url), "utf8");
  assert.ok(html.includes(`0;url=${basePath}${destination}`), `Missing static redirect: ${url}`);
}
assert.ok(await exists(path.join(output, "404.html")), "Missing custom 404 page");
assert.ok(await exists(path.join(output, ".nojekyll")), "Missing .nojekyll");

const assets = new Set();
for (const route of [...routes, "/404.html"]) {
  const html = await fs.readFile(route === "/404.html" ? path.join(output, route) : pagePath(route), "utf8");
  assert.doesNotMatch(html, /\/_next\/image\?/, `Image optimizer is unavailable on Pages: ${route}`);
  for (const match of html.matchAll(/\b(?:src|href)="(\/[^\"]*)"/g)) {
    const url = match[1].replaceAll("&amp;", "&");
    if (url.startsWith("//")) continue;
    assert.ok(!basePath || url === basePath || url.startsWith(`${basePath}/`), `Unprefixed asset/link on ${route}: ${url}`);
    assets.add(decodeURIComponent(url.slice(basePath.length).split(/[?#]/)[0] || "/"));
  }
}
for (const url of assets) {
  const file = path.join(output, url);
  assert.ok(await exists(file) || await exists(path.join(file, "index.html")), `Missing exported asset/link: ${url}`);
}
console.log(`Passed ${routes.size} static route checks, ${Object.keys(aliases).length} redirect checks, and ${assets.size} asset/link checks for ${basePath || "/"}.`);
