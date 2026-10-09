import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = new URL(process.argv[2] ?? "http://127.0.0.1:3000");
const read = async (file) =>
  JSON.parse(await fs.readFile(path.join(root, "content", file), "utf8"));
const files = async (folder) =>
  Promise.all(
    (await fs.readdir(path.join(root, "content", folder)))
      .filter((file) => file.endsWith(".json"))
      .map((file) => read(`${folder}/${file}`)),
  );
const [works, collections, categories, aliases, site] = await Promise.all([
  files("work"),
  files("collections"),
  read("categories.json"),
  read("legacy-routes.json"),
  read("site.json"),
]);
const cases = [
  ...["/", "/work", "/about", "/lab", "/search?q=Rihanna"].map((url) => ({
    url,
    status: 200,
  })),
  ...categories.map((category) => ({
    url: `/work/${category.id}`,
    status: 200,
  })),
  ...works.map((work) => ({
    url: `/work/projects/${encodeURIComponent(work.slug)}`,
    status: 200,
  })),
  ...collections.map((collection) => ({
    url: `/shoots/${encodeURIComponent(collection.slug)}/editions`,
    status: 200,
  })),
  ...Object.entries(aliases).map(([url, destination]) => ({
    url,
    status: 308,
    destination,
  })),
  { url: "/shoots/vogue", status: 308, destination: "/shoots/vogue/editions" },
  { url: "/shoots", status: 307, destination: "/work" },
  { url: "/design-projects", status: 307, destination: "/work/worlds" },
  // Query migration runs in the browser so it also works on static hosts.
  { url: "/?q=Rihanna", status: 200 },
  ...[
    "/work/not-a-category",
    "/work/projects/not-a-project",
    "/lab/not-a-published-entry",
  ].map((url) => ({ url, status: 404 })),
];
const queue = [...cases];
const failures = [];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const entry = queue.shift();
      try {
        const response = await fetch(new URL(entry.url, origin), {
          redirect: "manual",
          signal: AbortSignal.timeout(30_000),
        });
        assert.equal(
          response.status,
          entry.status,
          `${entry.url}: expected ${entry.status}, got ${response.status}`,
        );
        if (entry.destination) {
          const location = new URL(response.headers.get("location"), origin);
          assert.equal(
            decodeURIComponent(location.pathname + location.search),
            decodeURIComponent(entry.destination),
            `Wrong redirect for ${entry.url}`,
          );
        }
        const html = await response.text();
        if (entry.status === 200 && !site.videoPlaybackEnabled) {
          assert.doesNotMatch(
            html,
            /<video\b|(?:stream|image)\.mux\.com/i,
            `${entry.url}: disabled video playback must use local stills`,
          );
        }
      } catch (error) {
        failures.push(error.message);
      }
    }
  }),
);
for (const image of [works[0].cover.src, works[0].cover.previewSrc]) {
  const response = await fetch(new URL(image, origin), { method: "HEAD" });
  assert.equal(response.status, 200, `Local image missing: ${image}`);
  assert.match(response.headers.get("content-type"), /^image\/(webp|avif)/);
}
const optimized = new URL("/_next/image", origin);
optimized.searchParams.set("url", works[0].cover.src);
optimized.searchParams.set("w", "640");
optimized.searchParams.set("q", "75");
const optimizedResponse = await fetch(optimized);
assert.equal(
  optimizedResponse.status,
  200,
  "Self-hosted image optimization failed",
);
await optimizedResponse.arrayBuffer();
if (failures.length) throw new Error(failures.join("\n"));
console.log(
  `Passed ${cases.length} route/redirect checks, local media checks, and self-hosted image optimization at ${origin.origin}.`,
);
