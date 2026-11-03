import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import ts from "typescript";

const source = await fs.readFile(
  new URL("../lib/character-actions.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
  },
});
const { sampleBuildAction, BUILD_ACTION_DURATION_MS, BUILD_BRICK_SLOTS } =
  await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );

test("building starts with a genuinely empty line", () => {
  for (const time of [0, 1, 249, 250, 499]) {
    const sample = sampleBuildAction(time);

    assert.equal(sample.placedCount, 0);
    assert.deepEqual(sample.bricks, [null, null, null]);
  }
});

test("the wall only grows, one stable brick identity at a time", () => {
  const seenCounts = new Set();
  const placed = new Map();
  let previousCount = 0;

  for (let time = 0; time <= BUILD_ACTION_DURATION_MS; time += 10) {
    const sample = sampleBuildAction(time);
    const bricks = sample.bricks.filter(Boolean);
    const fixed = bricks.filter((brick) => brick.state === "placed");

    assert.equal(fixed.length, sample.placedCount);
    assert.ok(sample.placedCount >= previousCount, `Wall shrank at ${time}ms`);
    assert.ok(
      sample.placedCount <= previousCount + 1,
      `Several bricks appeared at ${time}ms`,
    );
    assert.ok(bricks.filter((brick) => brick.state === "held").length <= 1);
    assert.equal(new Set(bricks.map((brick) => brick.id)).size, bricks.length);
    assert.ok(bricks.length <= 3);
    seenCounts.add(sample.placedCount);
    previousCount = sample.placedCount;
    for (const brick of fixed) {
      assert.deepEqual(brick.position, BUILD_BRICK_SLOTS[brick.id - 1]);
      if (placed.has(brick.id))
        assert.deepEqual(brick.position, placed.get(brick.id));
      placed.set(brick.id, brick.position);
    }
    for (const [id, position] of placed) {
      const brick = sample.bricks.find((entry) => entry?.id === id);

      assert.equal(
        brick.state,
        "placed",
        `Placed brick ${id} disappeared at ${time}ms`,
      );
      assert.deepEqual(brick.position, position);
    }
  }
  assert.deepEqual([...seenCounts], [0, 1, 2, 3]);
});

test("release keeps the same brick and the same position instead of duplicating it", () => {
  let previous = sampleBuildAction(0);
  let transfers = 0;

  for (let time = 1; time <= BUILD_ACTION_DURATION_MS; time++) {
    const sample = sampleBuildAction(time);

    if (sample.placedCount > previous.placedCount) {
      const id = sample.placedCount;
      const before = previous.bricks.find((brick) => brick?.id === id);
      const after = sample.bricks.find((brick) => brick?.id === id);

      assert.equal(before.state, "held");
      assert.equal(after.state, "placed");
      assert.deepEqual(after.position, before.position);
      assert.equal(sample.bricks.filter((brick) => brick?.id === id).length, 1);
      transfers++;
    }
    previous = sample;
  }
  assert.equal(transfers, 3);
});

test("the completed wall stays built instead of resetting or losing bricks", () => {
  for (const time of [
    BUILD_ACTION_DURATION_MS,
    BUILD_ACTION_DURATION_MS * 2,
    60_000,
    3_600_000,
  ]) {
    const sample = sampleBuildAction(time);

    assert.equal(sample.completed, true);
    assert.equal(sample.pose, 23);
    assert.equal(sample.placedCount, 3);
    assert.equal(sample.nextChangeInMs, Infinity);
    assert.deepEqual(
      sample.bricks.map((brick) => brick.position),
      BUILD_BRICK_SLOTS,
    );
  }
});
