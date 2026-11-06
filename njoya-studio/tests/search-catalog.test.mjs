import test from "node:test";
import assert from "node:assert/strict";

import { createSearchCatalogLoader } from "../lib/search-catalog.mjs";
import { matchesSearch } from "../lib/content/search.mjs";

const catalog = [
  {
    id: "hermes-project",
    title: "Hermès Brides de Galaxy",
    subtitle: "Hermès",
    category: "Worlds",
    href: "/work/projects/hermes-brides-de-galaxy",
    imageUrl: "/media/images/hermes-480.webp",
    searchText: "Hermès Brides de Galaxy Worlds Set Design Luiza Kwok Hei Yung",
  },
  {
    id: "perfect-project",
    title: "Perfect",
    subtitle: "Perfect Magazine",
    category: "Editorials",
    href: "/work/projects/perfect",
    imageUrl: "/media/images/perfect-480.webp",
    searchText: "Perfect Magazine Editorials Talent Rihanna",
  },
];

const response = (data) => ({ ok: true, json: async () => data });

test("search consumers share the in-flight request and reuse its successful result", async () => {
  let calls = 0;
  let complete;
  const waiting = new Promise((resolve) => {
    complete = resolve;
  });
  const load = createSearchCatalogLoader("/search-index.json", () => {
    calls += 1;
    return waiting;
  });

  const dialog = load();
  const resultsPage = load();

  assert.equal(dialog, resultsPage);
  await Promise.resolve();
  assert.equal(calls, 1);
  complete(response(catalog));
  const [dialogData, pageData] = await Promise.all([dialog, resultsPage]);

  assert.equal(dialogData, catalog);
  assert.equal(pageData, catalog);
  assert.equal(await load(), catalog);
  assert.equal(calls, 1);
});

test("search fetches the supplied GitHub Pages prefix without changing paths in catalog data", async () => {
  const requested = [];
  const load = createSearchCatalogLoader(
    "/njoya-1/search-index.json",
    async (url) => {
      requested.push(url);
      return response(catalog);
    },
  );

  const data = await load();

  assert.deepEqual(requested, ["/njoya-1/search-index.json"]);
  assert.equal(data[0].href, "/work/projects/hermes-brides-de-galaxy");
  assert.equal(data[0].imageUrl, "/media/images/hermes-480.webp");
});

test("an unsuccessful HTTP response is not parsed or cached and can be retried", async () => {
  let calls = 0;
  let parsedFailure = false;
  const load = createSearchCatalogLoader("/search-index.json", async () => {
    calls += 1;
    return calls === 1
      ? {
          ok: false,
          json: async () => {
            parsedFailure = true;
            return catalog;
          },
        }
      : response(catalog);
  });

  await assert.rejects(load(), /Search is unavailable/);
  assert.equal(parsedFailure, false);
  assert.equal(await load(), catalog);
  assert.equal(calls, 2);
});

test("concurrent network failures clear the cache for a successful retry", async () => {
  const offline = new TypeError("Network request failed");
  let calls = 0;
  const load = createSearchCatalogLoader("/search-index.json", async () => {
    calls += 1;
    if (calls === 1) throw offline;
    return response(catalog);
  });

  const failed = await Promise.allSettled([load(), load()]);

  assert.equal(calls, 1);
  assert.ok(
    failed.every(
      (result) => result.status === "rejected" && result.reason === offline,
    ),
  );
  assert.equal(await load(), catalog);
  assert.equal(calls, 2);
});

test("malformed catalog data is rejected and does not prevent retry", async (t) => {
  const missingField = { ...catalog[0] };
  delete missingField.searchText;
  const cases = [
    ["object rather than an array", { items: catalog }],
    ["null payload", null],
    ["null item", [null]],
    ["missing search text", [missingField]],
    ["non-string URL", [{ ...catalog[0], href: 42 }]],
    [
      "invalid item after a valid item",
      [catalog[0], { ...catalog[1], id: null }],
    ],
  ];

  for (const [name, data] of cases) {
    await t.test(name, async () => {
      let calls = 0;
      const load = createSearchCatalogLoader("/search-index.json", async () => {
        calls += 1;
        return response(calls === 1 ? data : catalog);
      });

      await assert.rejects(load(), /Search data is unavailable/);
      assert.equal(await load(), catalog);
      assert.equal(calls, 2);
    });
  }
});

test("a JSON decoding failure can be retried", async () => {
  const invalidJson = new SyntaxError("Unexpected token");
  let calls = 0;
  const load = createSearchCatalogLoader("/search-index.json", async () => {
    calls += 1;
    return calls === 1
      ? {
          ok: true,
          json: async () => {
            throw invalidJson;
          },
        }
      : response(catalog);
  });

  await assert.rejects(load(), (error) => error === invalidJson);
  assert.equal(await load(), catalog);
  assert.equal(calls, 2);
});

test("an empty catalog is valid and remains cached", async () => {
  let calls = 0;
  const load = createSearchCatalogLoader("/search-index.json", async () => {
    calls += 1;
    return response([]);
  });

  assert.deepEqual(await load(), []);
  assert.deepEqual(await load(), []);
  assert.equal(calls, 1);
});

test("loaded search data retains accent, multi-term and credit-only matching", async () => {
  const load = createSearchCatalogLoader("/search-index.json", async () =>
    response(catalog),
  );
  const items = await load();
  const idsFor = (query) =>
    items.filter((item) => matchesSearch(item, query)).map((item) => item.id);

  assert.deepEqual(idsFor("HERMES"), ["hermes-project"]);
  assert.deepEqual(idsFor("Hermès Luiza"), ["hermes-project"]);
  assert.deepEqual(idsFor("Kwok Hei Yung"), ["hermes-project"]);
  assert.deepEqual(idsFor("Rihanna"), ["perfect-project"]);
  assert.deepEqual(idsFor("Hermès missing-person"), []);
});
