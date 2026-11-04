import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { MEDIA_PROFILE, PROFILE_ID, prepareImage } from "./media-pipeline.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
if (!args[0])
  throw new Error(
    'Usage: npm run media:add -- "/path/to/image.jpg" --alt "Description of the image"',
  );
const source = path.resolve(args[0]);
const alt = args.includes("--alt")
  ? args[args.indexOf("--alt") + 1]
  : undefined;
if (!alt?.trim()) throw new Error("Provide descriptive alt text with --alt.");
const id = createHash("sha1")
  .update(await fs.readFile(source))
  .digest("hex");
const original = `media/originals/${id}${path.extname(source).toLowerCase()}`;
await fs.mkdir(path.join(root, "media/originals"), { recursive: true });
if (source !== path.join(root, original))
  await fs.copyFile(source, path.join(root, original));
const sourcesPath = path.join(root, "content/media-sources.json");
const variantsPath = path.join(root, "content/media-variants.json");
const sources = JSON.parse(await fs.readFile(sourcesPath, "utf8"));
let variants;
try {
  variants = JSON.parse(await fs.readFile(variantsPath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
if (variants && variants.profileId !== PROFILE_ID)
  throw new Error(
    "Run npm run media:prepare to update the existing image profile first.",
  );
variants ??= { profile: MEDIA_PROFILE, profileId: PROFILE_ID, images: {} };
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "njoya-upload-"));
try {
  const entry = {
    file: path.basename(source),
    localSource: original,
    originalFilename: path.basename(source),
    ...(args.includes("--web") || sources[id]?.profile === "web"
      ? { profile: "web" }
      : {}),
  };
  const media = await prepareImage({ id, entry, root, temporary });
  sources[id] = { ...entry, width: media.width, height: media.height };
  variants.images[id] = media;
  for (const [file, value] of [
    [sourcesPath, sources],
    [variantsPath, variants],
  ]) {
    await fs.writeFile(`${file}.tmp`, `${JSON.stringify(value, null, 2)}\n`);
    await fs.rename(`${file}.tmp`, file);
  }
  console.log(
    "Prepared local media. Paste this object into a cover or gallery field:",
  );
  console.log(
    JSON.stringify(
      {
        type: "image",
        src: media.fallback.src,
        previewSrc: media.variants[0].src,
        alt: alt.trim(),
        width: media.width,
        height: media.height,
      },
      null,
      2,
    ),
  );
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}
