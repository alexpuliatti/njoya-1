import test from "node:test";
import assert from "node:assert/strict";
import { createHomepageCycle, homepageCycleCount } from "../lib/homepage-cycle.mjs";

function storage(initial = null) {
  let stored = initial;

  return {
    getItem: () => stored,
    setItem: (_key, value) => { stored = value; },
  };
}

test("full page loads advance through all three sets and wrap around", () => {
  const session = storage();
  const selections = Array.from({ length: 7 }, () =>
    createHomepageCycle(() => session)(3),
  );

  assert.deepEqual(selections, [0, 1, 2, 0, 1, 2, 0]);
});

test("two Exhibition choices alternate while other categories keep three choices", () => {
  const count = homepageCycleCount([3, 2, 3, 3, 3]);
  const session = storage();
  const selections = Array.from({ length: 8 }, () =>
    createHomepageCycle(() => session)(count),
  );

  assert.equal(count, 6);
  assert.equal(homepageCycleCount([3, 3, 3, 3, 3]), 3);
  assert.deepEqual(selections.map((index) => index % 2), [0, 1, 0, 1, 0, 1, 0, 1]);
  assert.deepEqual(selections.map((index) => index % 3), [0, 1, 2, 0, 1, 2, 0, 1]);
});

test("repeated renders and homepage remounts keep the same set within a document", () => {
  const session = storage("1");
  const select = createHomepageCycle(() => session);

  assert.deepEqual([select(3), select(3), select(3)], [1, 1, 1]);
  assert.equal(createHomepageCycle(() => session)(3), 2);
});

test("corrupt or obsolete stored indices restart the three-set cycle", () => {
  for (const value of ["bad", "-1", "1.5", "3", "999"]) {
    const session = storage(value);

    assert.equal(createHomepageCycle(() => session)(3), 0);
    assert.equal(createHomepageCycle(() => session)(3), 1);
  }
});

test("blocked storage still provides a stable valid selection", () => {
  const select = createHomepageCycle(() => { throw new Error("Blocked"); });
  const selected = select(3);

  assert.ok([0, 1, 2].includes(selected));
  assert.equal(select(3), selected);
});
