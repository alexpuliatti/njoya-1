import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import ts from "typescript";

const source = await fs.readFile(
  new URL("../lib/page-transition.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
});
const { getTransitionDestination } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const origin = "https://njoya.test";

test("each section selects its existing character and keeps the requested URL", () => {
  for (const [path, character, label] of [
    ["/work", "builder", "Work"],
    ["/work/projects/balmain-motion", "builder", "Work"],
    ["/shoots/chanel/editions", "builder", "Work"],
    ["/design-projects/some-project", "builder", "Work"],
    ["/lab", "explorer", "Lab"],
    ["/lab/brides-de-galaxy", "explorer", "Lab"],
    ["/motion/observer", "explorer", "Motion studies"],
    ["/about", "observer", "About"],
    ["/search?q=Rihanna#results", "explorer", "Search"],
  ]) {
    const destination = getTransitionDestination(path, `${origin}/`);

    assert.equal(destination.character, character);
    assert.equal(destination.label, label);
    assert.equal(destination.href, path);
  }
  assert.deepEqual(getTransitionDestination("/", `${origin}/work`), {
    href: "/",
    pathname: "/",
    character: "builder",
    label: "Home",
  });
});

test("same-page clicks, queries and fragments never wait for a pathname change", () => {
  for (const href of [
    "/about",
    "/about/",
    "#studio",
    "?view=contact",
    "/about?q=new#team",
  ]) {
    assert.equal(getTransitionDestination(href, `${origin}/about/`), null);
  }
  assert.equal(getTransitionDestination("/#main-content", `${origin}/`), null);
});

test("external, special-scheme, invalid and non-page URLs retain native navigation", () => {
  for (const href of [
    "https://elsewhere.test/about",
    "//elsewhere.test/work",
    "mailto:studio@njoya.test",
    "tel:+4400000000",
    "javascript:void(0)",
    "data:text/html,example",
    "http://[",
    "/media/motion/observer.webp",
    "/favicon.ico",
    "/unrelated-page",
    "/workshop",
  ]) {
    assert.equal(getTransitionDestination(href, `${origin}/`), null, href);
  }
});

test("a deployment prefix is removed once for the App Router and must match a path boundary", () => {
  const current = `${origin}/njoya/work/`;

  assert.deepEqual(
    getTransitionDestination(
      "/njoya/about/?topic=studio#team",
      current,
      "/njoya/",
    ),
    {
      href: "/about?topic=studio#team",
      pathname: "/about",
      character: "observer",
      label: "About",
    },
  );
  assert.equal(
    getTransitionDestination("/njoya/work#projects", current, "/njoya"),
    null,
  );
  assert.equal(
    getTransitionDestination("/njoya-other/about", current, "/njoya"),
    null,
  );
  assert.equal(getTransitionDestination("/about", current, "/njoya"), null);
  assert.equal(
    getTransitionDestination("/njoya/", current, "/njoya").href,
    "/",
  );
});

test("relative destinations and encoded search terms survive URL resolution", () => {
  const destination = getTransitionDestination(
    "../../about?name=Herm%C3%A8s#studio",
    `${origin}/work/projects/example`,
  );

  assert.equal(destination.href, "/about?name=Herm%C3%A8s#studio");
  assert.equal(destination.character, "observer");
});
