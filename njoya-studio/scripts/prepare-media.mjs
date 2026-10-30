import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  await fs.readFile(path.join(root, "content/media-sources.json"), "utf8"),
);
const sourceRoot = path.resolve(
  root,
  process.argv[2] ??
    "../njoya-sanity-backup/extracted/production-export-2026-10-29t16-30-14-149z/images",
);
const destination = path.join(root, "public/media/images");
await fs.mkdir(destination, { recursive: true });
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "njoya-media-"));
const queue = Object.entries(manifest);
let completed = 0;
let generatedBytes = 0;
async function convert(id, entry) {
  const full = path.join(destination, `${id}.webp`);
  const preview = path.join(destination, `${id}-720.webp`);
  if (
    (await fs.access(full).then(
      () => true,
      () => false,
    )) &&
    (await fs.access(preview).then(
      () => true,
      () => false,
    ))
  )
    return;
  let source = entry.localSource
    ? path.join(root, entry.localSource)
    : path.join(sourceRoot, entry.file);
  try {
    await sharp(source).metadata();
  } catch (error) {
    if (process.platform !== "darwin" || !/\.heif$/i.test(entry.file))
      throw error;
    const converted = path.join(temporary, `${id}.png`);
    await run("sips", ["-s", "format", "png", source, "--out", converted]);
    source = converted;
  }
  for (const [width, output] of [
    [2000, full],
    [720, preview],
  ]) {
    const temp = `${output}.tmp`;
    await sharp(source, { limitInputPixels: 200_000_000 })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toFile(temp);
    await fs.rename(temp, output);
  }
}
try {
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      while (queue.length) {
        const [id, entry] = queue.shift();
        try {
          await convert(id, entry);
        } catch (error) {
          throw new Error(
            `Media conversion failed for ${entry.file}: ${error.message}`,
          );
        }
        generatedBytes +=
          (await fs.stat(path.join(destination, `${id}.webp`))).size +
          (await fs.stat(path.join(destination, `${id}-720.webp`))).size;
        completed++;
        if (completed % 100 === 0)
          console.log(
            `Prepared ${completed}/${Object.keys(manifest).length} images`,
          );
      }
    }),
  );
  console.log(
    `Prepared ${completed} images with previews: ${(generatedBytes / 1_000_000).toFixed(1)} MB. Original files were not modified.`,
  );
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}
