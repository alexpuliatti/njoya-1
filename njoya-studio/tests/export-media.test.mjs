import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  assertExportMedia,
  pruneUnusedExportMedia,
} from "../scripts/export-media.mjs";

const family = (name) => ({
  fallback: { src: `/media/images/${name}.webp` },
  variants: [
    { src: `/media/images/${name}-480.avif` },
    { src: `/media/images/${name}.avif` },
  ],
});
const present = (file) =>
  fs.access(file).then(
    () => true,
    () => false,
  );

async function fixture(t, names = ["used", "unused"]) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "njoya-export-media-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const output = path.join(root, "out");
  const images = Object.fromEntries(names.map((name) => [name, family(name)]));
  const write = async (name, data = "image bytes") => {
    const file = path.join(output, name);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, data);
    return file;
  };
  for (const image of Object.values(images))
    for (const source of [image.fallback, ...image.variants])
      await write(source.src);
  await write("index.html", '<img src="/njoya-1/media/images/used-480.avif">');
  return { root, output, images, write };
}

test("export pruning retains complete responsive families and source media", async (t) => {
  const f = await fixture(t);
  const source = path.join(f.root, "public/media/images/unused.webp");
  await fs.mkdir(path.dirname(source), { recursive: true });
  await fs.writeFile(source, "original prepared file");
  const unknown = await f.write("media/images/not-in-manifest.webp");
  const video = await f.write("media/videos/unused-film.mp4");
  const artwork = await f.write("media/motion/rest.webp");
  await f.write("media/.DS_Store", "finder data");

  const result = await pruneUnusedExportMedia(f);
  assert.deepEqual(result, { removedFiles: 4, removedBytes: 44 });
  for (const asset of [f.images.used.fallback, ...f.images.used.variants])
    assert.ok(await present(path.join(f.output, asset.src)));
  for (const asset of [f.images.unused.fallback, ...f.images.unused.variants])
    assert.equal(await present(path.join(f.output, asset.src)), false);
  for (const file of [source, unknown, video, artwork])
    assert.ok(await present(file));
  assert.equal(await fs.readFile(source, "utf8"), "original prepared file");
  await assertExportMedia(f);
  assert.deepEqual(await pruneUnusedExportMedia(f), {
    removedFiles: 0,
    removedBytes: 0,
  });
});

test("serialized route data, JSON, CSS and constructed client paths retain images", async (t) => {
  const f = await fixture(t, ["used", "route", "data", "style", "constructed"]);
  await f.write(
    "work/index.txt",
    String.raw`{"src":"\\/media\\/images\\/route.webp"}`,
  );
  await f.write(
    "search-data.json",
    String.raw`{"src":"\u002fmedia\u002fimages\u002fdata.webp"}`,
  );
  await f.write(
    "_next/static/style.css",
    ".image{background:url(/njoya-1/media/images/style.webp)}",
  );
  await f.write(
    "_next/static/app.js",
    'const src="/media/images/"+"constructed"+".webp";',
  );
  assert.deepEqual(await pruneUnusedExportMedia(f), {
    removedFiles: 0,
    removedBytes: 0,
  });
});

test("shared family files survive when an otherwise-unused family owns them too", async (t) => {
  const f = await fixture(t);
  f.images.unused.variants.push(f.images.used.variants[1]);
  await pruneUnusedExportMedia(f);
  assert.ok(await present(path.join(f.output, f.images.used.variants[1].src)));
});

test("missing responsive fallback fails before any pruning", async (t) => {
  const f = await fixture(t);
  await fs.unlink(path.join(f.output, f.images.used.fallback.src));
  await assert.rejects(
    pruneUnusedExportMedia(f),
    /Missing exported media: \/media\/images\/used.webp/,
  );
  assert.ok(await present(path.join(f.output, f.images.unused.fallback.src)));
});

test("missing JSON-referenced film fails export validation", async (t) => {
  const f = await fixture(t);
  await f.write("search-data.json", '{"film":"/media/videos/missing.mp4"}');
  await assert.rejects(
    assertExportMedia(f),
    /Missing exported media: \/media\/videos\/missing.mp4/,
  );
});

test("empty or incomplete generated evidence never deletes the image library", async (t) => {
  const f = await fixture(t);
  await fs.unlink(path.join(f.output, "index.html"));
  await assert.rejects(pruneUnusedExportMedia(f), /without exported HTML/);
  await f.write("index.html", "<h1>Incomplete build</h1>");
  await assert.rejects(
    pruneUnusedExportMedia(f),
    /without rendered image references/,
  );
  for (const image of Object.values(f.images))
    assert.ok(await present(path.join(f.output, image.fallback.src)));
});
