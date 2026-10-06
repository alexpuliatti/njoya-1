import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

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
const data = await fs.readFile(source);
const id = createHash("sha1").update(data).digest("hex");
const metadata = await sharp(data).metadata();
const rotated = [5, 6, 7, 8].includes(metadata.orientation ?? 1);
const width = rotated ? metadata.height : metadata.width;
const height = rotated ? metadata.width : metadata.height;
const destination = path.join(root, "public/media/images");
await fs.mkdir(destination, { recursive: true });
for (const [size, suffix] of [
  [2000, ""],
  [720, "-720"],
]) {
  await sharp(data, { limitInputPixels: 200_000_000 })
    .rotate()
    .resize({ width: size, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toFile(path.join(destination, `${id}${suffix}.webp`));
}
const original = `media/originals/${id}${path.extname(source).toLowerCase()}`;
await fs.mkdir(path.join(root, "media/originals"), { recursive: true });
await fs.copyFile(source, path.join(root, original));
const manifestPath = path.join(root, "content/media-sources.json");
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
manifest[id] = {
  file: path.basename(source),
  localSource: original,
  originalFilename: path.basename(source),
  width,
  height,
};
await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  "Prepared local media. Paste this object into a cover or gallery field:",
);
console.log(
  JSON.stringify(
    {
      type: "image",
      src: `/media/images/${id}.webp`,
      previewSrc: `/media/images/${id}-720.webp`,
      alt: alt.trim(),
      width,
      height,
    },
    null,
    2,
  ),
);
