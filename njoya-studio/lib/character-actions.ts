export type BrickPoint = readonly [x: number, y: number];

export type BuildBrick = {
  id: number;
  position: BrickPoint;
  state: "held" | "placed";
};

export type BuildActionSample = {
  step: number;
  pose: number;
  completed: boolean;
  placedCount: number;
  bricks: readonly (BuildBrick | null)[];
  nextChangeInMs: number;
};

type BuildStep = {
  pose: number;
  bricks: readonly (BrickPoint | null)[];
  placed: number;
};

export const BUILD_POSE_COUNT = 24;
export const BUILD_ACTION_STEP_MS = 250;
export const BUILD_ACTION_HOLD_MS = 2000;
export const BUILD_ACTION_DURATION_MS =
  23 * BUILD_ACTION_STEP_MS + BUILD_ACTION_HOLD_MS;
export const BUILD_BRICK_SIZE = { width: 32, height: 17 } as const;

// The ground row ends at the same y=184 baseline as the character's feet.
export const BUILD_BRICK_SLOTS = [
  [116, 167],
  [84, 167],
  [100, 150],
] as const;

const [FIRST_BRICK, SECOND_BRICK, TOP_BRICK] = BUILD_BRICK_SLOTS;

// Each column belongs to one persistent brick, from pickup through placement.
// Reusing a slot at the handoff avoids a duplicate or a position jump.
const BUILD_STEPS: readonly BuildStep[] = [
  { pose: 0, bricks: [null, null, null], placed: 0 },
  { pose: 1, bricks: [null, null, null], placed: 0 },
  { pose: 2, bricks: [[94, 174], null, null], placed: 0 },
  { pose: 3, bricks: [[94, 150], null, null], placed: 0 },
  { pose: 4, bricks: [[74, 122], null, null], placed: 0 },
  { pose: 5, bricks: [[75, 114], null, null], placed: 0 },
  { pose: 6, bricks: [[103, 119], null, null], placed: 0 },
  { pose: 7, bricks: [FIRST_BRICK, null, null], placed: 0 },
  { pose: 8, bricks: [FIRST_BRICK, null, null], placed: 1 },
  { pose: 9, bricks: [FIRST_BRICK, [78, 184], null], placed: 1 },
  { pose: 10, bricks: [FIRST_BRICK, [87, 155], null], placed: 1 },
  { pose: 11, bricks: [FIRST_BRICK, [74, 118], null], placed: 1 },
  { pose: 12, bricks: [FIRST_BRICK, [90, 136], null], placed: 1 },
  { pose: 13, bricks: [FIRST_BRICK, [90, 166], null], placed: 1 },
  { pose: 14, bricks: [FIRST_BRICK, SECOND_BRICK, null], placed: 1 },
  { pose: 15, bricks: [FIRST_BRICK, SECOND_BRICK, null], placed: 2 },
  { pose: 16, bricks: [FIRST_BRICK, SECOND_BRICK, [64, 184]], placed: 2 },
  { pose: 17, bricks: [FIRST_BRICK, SECOND_BRICK, [65, 147]], placed: 2 },
  { pose: 18, bricks: [FIRST_BRICK, SECOND_BRICK, [63, 110]], placed: 2 },
  { pose: 19, bricks: [FIRST_BRICK, SECOND_BRICK, [85, 115]], placed: 2 },
  { pose: 20, bricks: [FIRST_BRICK, SECOND_BRICK, TOP_BRICK], placed: 2 },
  { pose: 21, bricks: [FIRST_BRICK, SECOND_BRICK, TOP_BRICK], placed: 2 },
  { pose: 22, bricks: [FIRST_BRICK, SECOND_BRICK, TOP_BRICK], placed: 3 },
  { pose: 23, bricks: [FIRST_BRICK, SECOND_BRICK, TOP_BRICK], placed: 3 },
];

/** One clock builds once, then keeps the final pose and three bricks in place. */
export function sampleBuildAction(elapsedMs: number): BuildActionSample {
  const elapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const actionTime = Math.min(elapsed, BUILD_ACTION_DURATION_MS);
  const completed = elapsed >= BUILD_ACTION_DURATION_MS;
  const stepIndex = Math.min(
    BUILD_POSE_COUNT - 1,
    Math.floor(actionTime / BUILD_ACTION_STEP_MS),
  );
  const step = BUILD_STEPS[stepIndex];
  const nextBoundary =
    stepIndex === BUILD_POSE_COUNT - 1
      ? BUILD_ACTION_DURATION_MS
      : (stepIndex + 1) * BUILD_ACTION_STEP_MS;

  return {
    step: stepIndex,
    pose: step.pose,
    completed,
    placedCount: step.placed,
    bricks: step.bricks.map((position, index) =>
      position
        ? {
            id: index + 1,
            position,
            state: index < step.placed ? "placed" : "held",
          }
        : null,
    ),
    nextChangeInMs: completed ? Infinity : nextBoundary - actionTime,
  };
}
