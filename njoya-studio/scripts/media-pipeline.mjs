import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";

const run = promisify(execFile);
export const MEDIA_PROFILE = {
  maxWidth: 2560,
  widths: [480, 960, 1600],
  webp: { quality: 88, effort: 6 },
  avif: { quality: 80, effort: 5, chromaSubsampling: "4:4:4" },
  minimumAvifSaving: 0.08,
};
export const PROFILE_ID = `p${createHash("sha1").update(JSON.stringify(MEDIA_PROFILE)).digest("hex").slice(0, 7)}`;

export async function prepareImage({ id, entry, root, sourceRoot, temporary }) {
  const source = entry.localSource
    ? path.join(root, entry.localSource)
    : path.join(sourceRoot, entry.file);
  const stat = await fs.stat(source);
  const signature = `${PROFILE_ID}:${stat.size}:${stat.mtimeMs}`;
  const output = path.join(root, "public/media/images");
  await fs.mkdir(output, { recursive: true });
  let decoded;
  try {
    decoded = await sharp(source, { limitInputPixels: 200_000_000 })
      .rotate()
      .toColourspace("srgb")
      .raw()
      .toBuffer({ resolveWithObject: true });
  } catch (error) {
    if (process.platform !== "darwin" || !/\.hei[cf]$/i.test(source))
      throw error;
    const converted = path.join(temporary, `${id}.png`);
    await run("sips", ["-s", "format", "png", source, "--out", converted]);
    decoded = await sharp(converted)
      .rotate()
      .toColourspace("srgb")
      .raw()
      .toBuffer({ resolveWithObject: true });
  }
  const { width, height, channels } = decoded.info;
  const fullWidth = Math.min(width, MEDIA_PROFILE.maxWidth);
  const pipeline = (size) =>
    sharp(decoded.data, { raw: { width, height, channels } }).resize({
      width: size,
      withoutEnlargement: true,
    });
  const fullWebp = await pipeline(fullWidth)
    .webp(MEDIA_PROFILE.webp)
    .toBuffer();
  const fullAvif = await pipeline(fullWidth)
    .avif(MEDIA_PROFILE.avif)
    .toBuffer();
  const format =
    fullAvif.length <= fullWebp.length * (1 - MEDIA_PROFILE.minimumAvifSaving)
      ? "avif"
      : "webp";
  const prefix = `${id}-${PROFILE_ID}`;
  const fallback = {
    src: `/media/images/${prefix}.webp`,
    width: fullWidth,
    bytes: fullWebp.length,
  };
  const write = async (url, data) => {
    const destination = path.join(root, "public", url);
    await fs.writeFile(`${destination}.tmp`, data);
    await fs.rename(`${destination}.tmp`, destination);
  };
  await write(fallback.src, fullWebp);
  const variants = [];
  for (const size of [
    ...MEDIA_PROFILE.widths.filter((size) => size < fullWidth),
    fullWidth,
  ]) {
    const src = `/media/images/${prefix}${size === fullWidth ? "" : `-${size}`}.${format}`;
    const data =
      size === fullWidth
        ? format === "avif"
          ? fullAvif
          : fullWebp
        : await pipeline(size)[format](MEDIA_PROFILE[format]).toBuffer();
    if (src !== fallback.src) await write(src, data);
    variants.push({ src, width: size, bytes: data.length });
  }
  return {
    signature,
    width,
    height,
    format,
    fallback,
    variants,
    sourceBytes: stat.size,
  };
}

export async function migrateImageReferences(root, images) {
  const update = (value) => {
    if (Array.isArray(value)) return value.map(update);
    if (!value || typeof value !== "object") return value;
    if ((value.type === "image" || value.type === "synopsis") && value.src) {
      const id = path.basename(value.src).split(/[.-]/)[0];
      const media = images[id];
      if (!media) throw new Error(`No prepared source for ${value.src}`);
      return {
        ...value,
        src: media.fallback.src,
        previewSrc: media.variants[0].src,
        width: media.width,
        height: media.height,
      };
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, update(child)]),
    );
  };
  const files = ["about.json"];
  for (const folder of ["work", "collections", "lab"]) {
    for (const file of await fs.readdir(path.join(root, "content", folder)))
      if (file.endsWith(".json")) files.push(`${folder}/${file}`);
  }
  for (const file of files) {
    const location = path.join(root, "content", file);
    const previous = await fs.readFile(location, "utf8");
    const next = `${JSON.stringify(update(JSON.parse(previous)), null, 2)}\n`;
    if (previous !== next) await fs.writeFile(location, next);
  }
}
