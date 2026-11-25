import test from "node:test";
import assert from "node:assert/strict";
import { validateContent } from "../scripts/validate-content.mjs";
import { matchesSearch, normalizeSearch } from "../lib/content/search.mjs";
import { homeSchema, workSchema, videoSchema } from "../lib/content/schema.mjs";
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
test("category cards use separate optimized images with the project cover framing", () => {
  for (const category of content.categories) {
    const work = content.works.find((work) => work.id === category.coverWorkId);
    assert.ok(category.cover, `${category.id} has a dedicated card image`);
    assert.notEqual(category.cover.src, work.cover.src);
    assert.equal(category.cover.width, work.cover.width);
    assert.equal(category.cover.height, work.cover.height);
    assert.equal(category.cover.alt, work.cover.alt);
  }
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
test("local films require a prepared poster and cannot reference remote or traversing paths", () => {
  const film = content.works.find((work) => work.slug === "balmain-motion").gallery[0];
  assert.equal(videoSchema.safeParse(film).success, true);
  assert.equal(videoSchema.safeParse({ ...film, poster: undefined }).success, false);
  for (const src of ["https://example.com/film.mp4", "/media/videos/../film.mp4", "/media/videos/film.mov"]) {
    assert.equal(videoSchema.safeParse({ ...film, src }).success, false);
  }
});
test("Balmain is a Motion project with all three local films and supplied credits", () => {
  const work = content.works.find((work) => work.slug === "balmain-motion");
  assert.deepEqual(work.categories, ["motion"]);
  assert.equal(work.gallery.length, 3);
  assert.ok(work.gallery.every((entry) => entry.type === "video" && "src" in entry));
  assert.equal(work.credits.length, 8);
  assert.ok(work.credits.some((credit) => credit.name === "Carlijn Jacobs"));
  assert.equal(content.categories.find((category) => category.id === "motion").coverWorkId, work.id);
});
test("the homepage has distinct projects in their assigned categories and retains the existing heroes", () => {
  assert.deepEqual(
    content.home.featured.map((slot) => slot.category),
    ["worlds", "exhibition", "commercials", "editorials", "motion"],
  );
  const featuredIds = content.home.featured.flatMap((slot) =>
    slot.projects.map((project) => project.workId),
  );
  assert.equal(new Set(featuredIds).size, featuredIds.length);
  for (const original of [
      "ad25c23d-8ceb-4710-90fa-11f10ae4a272",
      "eba3e495-0a85-4a16-ac67-00535be1f3ad",
      "jaguar-miami-2024",
      "ff65ad54-4a50-4404-a4b8-4484728d1ef3",
      "balmain-motion",
  ]) assert.ok(featuredIds.includes(original));
  for (const slot of content.home.featured) {
    assert.equal(slot.projects.length, slot.category === "exhibition" ? 2 : 3);
    for (const project of slot.projects) {
      const work = content.works.find((work) => work.id === project.workId);

      assert.ok(work.categories.includes(slot.category));
      if (slot.category === "motion")
        assert.ok(work.gallery.some((entry) => entry.type === "video" && "src" in entry));
    }
  }
});
test("homepage configuration accepts two or three projects and rejects incomplete cycles and repeated categories", () => {
  const twoChoices = structuredClone(content.home);
  twoChoices.featured[0].projects.pop();
  assert.equal(homeSchema.safeParse(twoChoices).success, true);
  const incomplete = structuredClone(content.home);
  incomplete.featured[0].projects.splice(1);
  assert.equal(homeSchema.safeParse(incomplete).success, false);
  const tooMany = structuredClone(content.home);
  tooMany.featured[0].projects.push(tooMany.featured[0].projects[0]);
  assert.equal(homeSchema.safeParse(tooMany).success, false);
  const repeated = structuredClone(content.home);
  repeated.featured[1].category = repeated.featured[0].category;
  assert.equal(homeSchema.safeParse(repeated).success, false);
});
test("the featured Jaguar retains its supplied project details", () => {
  const jaguar = content.works.find((work) => work.id === "jaguar-miami-2024");
  assert.equal(jaguar.client, "Jaguar");
  assert.equal(jaguar.date, "2024-12");
  assert.equal(jaguar.gallery.length, 2);
});
