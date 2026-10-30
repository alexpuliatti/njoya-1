import test from "node:test";
import assert from "node:assert/strict";
import { validateContent } from "../scripts/validate-content.mjs";
import { matchesSearch, normalizeSearch } from "../lib/content/search.mjs";
import { workSchema } from "../lib/content/schema.mjs";
import { compareWorkDate } from "../lib/content/order.mjs";

const content = await validateContent();

test("project chronology uses work dates, with deterministic ties and undated work last", () => {
  const records = [
    { id: "b", title: "Same title", date: "2024-01-01" },
    { id: "undated", title: "Undated", date: null },
    { id: "recent", title: "Recent", date: "2026-01-01" },
    { id: "month", title: "Month precision", date: "2024-12" },
    { id: "a", title: "Same title", date: "2024-01-01" },
  ];
  assert.deepEqual(
    records.sort(compareWorkDate).map((record) => record.id),
    ["recent", "month", "a", "b", "undated"],
  );
});

test("a single-edition collection preserves its original cover film", () => {
  const collection = content.collections.find(
    (entry) => entry.slug === "chanel",
  );
  const edition = content.works.find(
    (entry) => entry.id === collection.workIds[0],
  );
  assert.equal(edition.coverVideoPlaybackId, collection.coverVideoPlaybackId);
  assert.ok(edition.coverVideoPlaybackId);
});
const searchable = (work) => ({
  title: work.title,
  subtitle: work.client,
  searchText: [
    work.title,
    work.client,
    ...work.credits.flatMap((credit) => [
      credit.role,
      credit.customRole ?? "",
      credit.name,
    ]),
  ].join(" "),
});

test("published work and collections have valid local media and legacy links", () => {
  assert.ok(
    content.works.length >= 90,
    "The original published work is preserved",
  );
  assert.ok(
    content.collections.length >= 23,
    "The original collections are preserved",
  );
  assert.ok(content.imageFiles > 0);
  assert.equal(
    new Set(content.works.map((work) => work.slug)).size,
    content.works.length,
  );
});
test("credit search finds Rihanna across different publications", () => {
  const results = content.works.filter((work) =>
    matchesSearch(searchable(work), "Rihanna"),
  );
  assert.ok(results.length >= 2);
  assert.ok(results.some((work) => work.client === "Perfect"));
  assert.ok(results.some((work) => work.client === "Dazed"));
});
test("search matches accents, punctuation, multiple terms, and credit-only people", () => {
  assert.equal(normalizeSearch("  HERMÈS — Paris  "), "hermes paris");
  const work = content.works.find(
    (work) => work.slug === "hermes-brides-de-galaxy",
  );
  assert.ok(matchesSearch(searchable(work), "hermes Luiza"));
  assert.ok(!matchesSearch(searchable(work), "hermes missing-person"));
  assert.ok(matchesSearch(searchable(work), "Kwok Hei Yung"));
});
test("public schema rejects drafts, remote images, and unknown credential fields", () => {
  const sample = content.works[0];
  assert.equal(
    workSchema.safeParse({ ...sample, id: `drafts.${sample.id}` }).success,
    false,
  );
  assert.equal(
    workSchema.safeParse({
      ...sample,
      cover: { ...sample.cover, src: "https://cdn.sanity.io/image.jpg" },
    }).success,
    false,
  );
  assert.equal(
    workSchema.safeParse({ ...sample, secretKey: "must-not-publish" }).success,
    false,
  );
});
test("ordered galleries support a synopsis image between photographs and videos", () => {
  const sample = content.works[0];
  const result = workSchema.parse({
    ...sample,
    gallery: [
      sample.cover,
      {
        ...sample.cover,
        type: "synopsis",
        text: "The intention behind the project.",
      },
      { type: "video", playbackId: "example", alt: "Studio film" },
    ],
  });
  assert.deepEqual(
    result.gallery.map((entry) => entry.type),
    ["image", "synopsis", "video"],
  );
});
test("the four homepage heroes resolve to published projects, including the supplied Jaguar work", () => {
  assert.equal(content.home.featured.length, 4);
  const jaguarId = content.home.featured.find((entry) => entry.title === "Jaguar").workId;
  const jaguar = content.works.find((work) => work.id === jaguarId);
  assert.equal(jaguar.client, "Jaguar");
  assert.equal(jaguar.date, "2024-12");
  assert.equal(jaguar.gallery.length, 2);
  assert.ok(
    content.home.featured
      .every((entry) => content.works.some((work) => work.id === entry.workId)),
  );
});
