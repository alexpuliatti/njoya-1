import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const definitions = [
  { action: "build", columns: 6, rows: 4, width: 192, height: 192 },
  { action: "dance", columns: 4, rows: 4, width: 128, height: 192 },
];

// These are newly drawn poses from image_gen. This script only slices,
// uniformly scales, aligns and packs them; it does not invent or warp poses.
const bounds = (data, width, height) => {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Ignore nearly transparent edge noise when measuring ground contact.
      // Original alpha, including antialiasing, is retained in the output.
      if (data[(y * width + x) * 4 + 3] < 32) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left)
    throw new Error("A sprite cell contains no visible artwork");
  return {
    left,
    top,
    right,
    bottom,
    width: right - left + 1,
    height: bottom - top + 1,
  };
};

const prepared = [];
for (const definition of definitions) {
  const { action, columns, rows, width, height } = definition;
  const source = `docs/character-actions/source/observer-${action}${action === "dance" ? "-clean" : "-character"}.png`;
  const input = path.join(root, source);
  const metadata = await sharp(input).metadata();
  if (!metadata.hasAlpha)
    throw new Error(`${source} needs its generated alpha channel`);
  const cells = [];
  for (let index = 0; index < columns * rows; index++) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const left = Math.round((column * metadata.width) / columns);
    const top = Math.round((row * metadata.height) / rows);
    const cellWidth =
      Math.round(((column + 1) * metadata.width) / columns) - left;
    const cellHeight = Math.round(((row + 1) * metadata.height) / rows) - top;
    const cell = await sharp(input)
      .extract({ left, top, width: cellWidth, height: cellHeight })
      .ensureAlpha()
      .raw()
      .toBuffer();
    cells.push({
      data: cell,
      width: cellWidth,
      height: cellHeight,
      bounds: bounds(cell, cellWidth, cellHeight),
    });
  }
  // One common scale per action preserves all intentional crouches and sways.
  const scale = Math.min(
    (width - 12) / Math.max(...cells.map((cell) => cell.bounds.width)),
    (height - 16) / Math.max(...cells.map((cell) => cell.bounds.height)),
  );
  const frames = [];
  const placements = [];
  for (let index = 0; index < cells.length; index++) {
    const cell = cells[index];
    const resizedWidth = Math.round(cell.width * scale);
    const resizedHeight = Math.round(cell.height * scale);
    const { data, info } = await sharp(cell.data, {
      raw: { width: cell.width, height: cell.height, channels: 4 },
    })
      .resize(resizedWidth, resizedHeight)
      .raw()
      .toBuffer({ resolveWithObject: true });
    const measured = bounds(data, info.width, info.height);
    const left = Math.round((width - resizedWidth) / 2);
    const top = 184 - measured.bottom;
    // Two dance tiles include tiny neighboring-tile fragments in their empty
    // left gutter. The actual character starts beyond x=24 in those cells.
    const leftGutter = action === "dance" && [9, 10].includes(index) ? 12 : 0;
    const cropLeft = Math.max(0, -left, leftGutter - left);
    const cropTop = Math.max(0, -top);
    const destinationLeft = Math.max(0, left + cropLeft);
    const inputWidth = Math.min(
      resizedWidth - cropLeft,
      width - destinationLeft,
    );
    const inputHeight = Math.min(
      resizedHeight - cropTop,
      height - Math.max(0, top),
    );
    const image = await sharp(data, {
      raw: { width: resizedWidth, height: resizedHeight, channels: 4 },
    })
      .extract({
        left: cropLeft,
        top: cropTop,
        width: inputWidth,
        height: inputHeight,
      })
      .png()
      .toBuffer();
    const frame = await sharp({
      create: { width, height, channels: 4, background: "#00000000" },
    })
      .composite([
        { input: image, left: destinationLeft, top: Math.max(0, top) },
      ])
      .png()
      .toBuffer();
    frames.push(frame);
    placements.push({
      index,
      sourceBounds: cell.bounds,
      left,
      top,
      resizedWidth,
      resizedHeight,
      leftGutter,
    });
  }
  const output = `public/media/motion/observer-${action}.webp`;
  await sharp({
    create: {
      width: width * frames.length,
      height,
      channels: 4,
      background: "#00000000",
    },
  })
    .composite(
      frames.map((input, index) => ({ input, left: index * width, top: 0 })),
    )
    .webp({ quality: 84, alphaQuality: 100, effort: 6 })
    .toFile(path.join(root, output));
  const previewColumns = action === "build" ? 6 : 4;
  await sharp({
    create: {
      width: width * previewColumns,
      height: height * Math.ceil(frames.length / previewColumns),
      channels: 4,
      background: "#2a201a",
    },
  })
    .composite(
      frames.map((input, index) => ({
        input,
        left: (index % previewColumns) * width,
        top: Math.floor(index / previewColumns) * height,
      })),
    )
    .webp({ quality: 88 })
    .toFile(
      path.join(root, `docs/character-actions/observer-${action}-frames.webp`),
    );
  const { size } = await fs.stat(path.join(root, output));
  prepared.push({
    ...definition,
    frameCount: frames.length,
    footY: 184,
    source,
    output,
    bytes: size,
    scale,
    placements,
  });
  console.log(
    `${action}: ${frames.length} frames, ${width}x${height}, ${(size / 1024).toFixed(1)} KiB`,
  );
}
// Reuse one brick-face texture from the original art. Runtime positions and
// counts are authored independently; the model never redraws the growing wall.
await sharp(path.join(root, "docs/character-actions/source/observer-build.png"))
  .extract({ left: 183, top: 207, width: 39, height: 19 })
  .webp({ quality: 88, alphaQuality: 100 })
  .toFile(path.join(root, "public/media/motion/observer-brick.webp"));
await fs.writeFile(
  path.join(root, "docs/character-actions/packing.json"),
  JSON.stringify({ tool: "built-in image_gen", prepared }, null, 2) + "\n",
);
