import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  MEDIA_PROFILE,
  PROFILE_ID,
  prepareImage,
  profileIdForSource,
  migrateImageReferences,
} from "./media-pipeline.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sources = JSON.parse(
  await fs.readFile(path.join(root, "content/media-sources.json"), "utf8"),
);
const sourceRoot = path.resolve(
  root,
  process.argv[2] ??
    "../njoya-sanity-backup/extracted/production-export-2026-10-29t16-30-14-149z/images",
);
const manifestPath = path.join(root, "content/media-variants.json");
let previous;
try {
  previous = JSON.parse(await fs.readFile(manifestPath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const manifest = {
  profile: MEDIA_PROFILE,
  profileId: PROFILE_ID,
  images:
    previous?.profileId === PROFILE_ID
      ? Object.fromEntries(
          Object.keys(sources)
            .filter((id) => previous.images[id])
            .map((id) => [id, previous.images[id]]),
        )
      : {},
};
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "njoya-media-hq-"));
const queue = Object.entries(sources);
let completed = 0;
let failure;
let saving = Promise.resolve();
const persist = () => {
  const json = `${JSON.stringify(manifest, null, 2)}\n`;
  saving = saving.then(async () => {
    await fs.writeFile(`${manifestPath}.tmp`, json);
    await fs.rename(`${manifestPath}.tmp`, manifestPath);
  });
  return saving;
};
sharp.concurrency(2);
sharp.cache({ memory: 64, files: 0, items: 16 });
try {
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (queue.length && !failure) {
        try {
          const [id, entry] = queue.shift();
          const source = entry.localSource
            ? path.join(root, entry.localSource)
            : path.join(sourceRoot, entry.file);
          const stat = await fs.stat(source);
          const cached = manifest.images[id];
          const signature = `${profileIdForSource(entry)}:${stat.size}:${stat.mtimeMs}`;
          const files = cached
            ? [
                ...new Set([
                  cached.fallback.src,
                  ...cached.variants.map((variant) => variant.src),
                ]),
              ]
            : [];
          const reusable =
            cached?.signature === signature &&
            (
              await Promise.all(
                files.map((file) =>
                  fs.access(path.join(root, "public", file)).then(
                    () => true,
                    () => false,
                  ),
                ),
              )
            ).every(Boolean);
          if (!reusable)
            manifest.images[id] = await prepareImage({
              id,
              entry,
              root,
              sourceRoot,
              temporary,
            });
          completed++;
          if (completed % 10 === 0) {
            await persist();
            console.log(
              `Prepared ${completed}/${Object.keys(sources).length} originals`,
            );
          }
        } catch (error) {
          failure = error;
        }
      }
    }),
  );
  await persist();
  if (failure) throw failure;
  await migrateImageReferences(root, manifest.images);
  const archive = path.join(root, "media/originals/previous-webp-82");
  await fs.mkdir(archive, { recursive: true });
  for (const id of Object.keys(sources))
    for (const suffix of [".webp", "-720.webp"]) {
      try {
        await fs.rename(
          path.join(root, "public/media/images", `${id}${suffix}`),
          path.join(archive, `${id}${suffix}`),
        );
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
  // Keep the deployed directory limited to the current profile, including
  // after a future settings change. Retain previous derivatives privately.
  const currentFiles = new Set(
    Object.values(manifest.images).flatMap((image) =>
      [image.fallback, ...image.variants].map((variant) =>
        path.basename(variant.src),
      ),
    ),
  );
  const obsolete = (
    await fs.readdir(path.join(root, "public/media/images"))
  ).filter(
    (file) =>
      /^[a-f0-9]{40}(?:-p[a-f0-9]{7})?(?:-\d+)?\.(webp|avif)$/.test(file) &&
      !currentFiles.has(file),
  );
  if (obsolete.length) {
    const previousDirectory = path.join(
      root,
      "media/originals/previous-prepared",
    );
    await fs.mkdir(previousDirectory, { recursive: true });
    for (const file of obsolete)
      await fs.rename(
        path.join(root, "public/media/images", file),
        path.join(previousDirectory, file),
      );
  }
  const entries = Object.values(manifest.images);
  const bytes = entries.reduce(
    (sum, image) =>
      sum +
      image.variants.reduce((total, variant) => total + variant.bytes, 0) +
      (image.format === "avif" ? image.fallback.bytes : 0),
    0,
  );
  console.log(
    `Prepared ${entries.length} originals; ${entries.filter((image) => image.format === "avif").length} prefer AVIF. All responsive variants and fallbacks: ${(bytes / 1_000_000).toFixed(1)} MB.`,
  );
} finally {
  await saving;
  await fs.rm(temporary, { recursive: true, force: true });
}
