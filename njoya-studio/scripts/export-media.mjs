import fs from "node:fs/promises";
import path from "node:path";

const textExtensions = new Set([
  ".html",
  ".txt",
  ".js",
  ".mjs",
  ".css",
  ".json",
  ".svg",
  ".xml",
  ".webmanifest",
]);
const preparedImagePath = /^\/media\/images\/[a-zA-Z0-9_-]+\.(?:webp|avif)$/;

async function exportFiles(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await exportFiles(file)));
    else if (entry.isFile()) files.push(file);
  }
  return files;
}

// RSC payloads can contain JSON nested inside JavaScript strings. Normalize
// escaped slashes without evaluating any generated code or parsing HTML.
const normalizeSlashes = (text) => text.replace(/\\+(?:u002f|x2f|\/)/gi, "/");

async function inspectExportMedia({ output, images }) {
  const files = await exportFiles(output);
  if (!files.some((file) => path.extname(file) === ".html"))
    throw new Error("Refusing to prune media without exported HTML pages");

  const text = (
    await Promise.all(
      files
        .filter((file) => textExtensions.has(path.extname(file)))
        .map(async (file) => normalizeSlashes(await fs.readFile(file, "utf8"))),
    )
  ).join("\n");
  const referenced = new Set(
    [
      ...text.matchAll(
        /\/media\/[a-zA-Z0-9_./-]+\.(?:webp|avif|mp4|svg|png|jpe?g|gif|json)(?![a-zA-Z0-9_.-])/g,
      ),
    ].map((match) => match[0]),
  );

  const families = Object.entries(images).map(([id, image]) => {
    const sources = new Set([
      image.fallback.src,
      ...image.variants.map((variant) => variant.src),
    ]);
    for (const source of sources)
      if (!preparedImagePath.test(source))
        throw new Error(
          `Invalid prepared image path in export manifest: ${source}`,
        );
    return {
      sources,
      // Keep whole responsive families, including fallbacks the browser may
      // need even if only one size appears in markup. Basenames and source IDs
      // also protect references assembled from strings in client bundles.
      used:
        text.includes(id) ||
        [...sources].some(
          (source) =>
            referenced.has(source) ||
            text.includes(path.posix.basename(source)),
        ),
    };
  });
  if (!families.some((family) => family.used))
    throw new Error(
      "Refusing to prune media without rendered image references",
    );

  const retained = new Set(
    families
      .filter((family) => family.used)
      .flatMap((family) => [...family.sources]),
  );
  for (const source of new Set([...referenced, ...retained])) {
    if (source.split("/").includes(".."))
      throw new Error(`Invalid media reference in export: ${source}`);
    const file = path.join(output, source);
    const stat = await fs.stat(file).catch(() => null);
    if (!stat?.isFile() || !stat.size)
      throw new Error(`Missing exported media: ${source}`);
  }
  return { files, families, retained };
}

export async function assertExportMedia(options) {
  await inspectExportMedia(options);
}

export async function pruneUnusedExportMedia(options) {
  const { files, families, retained } = await inspectExportMedia(options);
  const unused = new Set(
    families
      .filter((family) => !family.used)
      .flatMap((family) => [...family.sources])
      .filter((source) => !retained.has(source)),
  );
  let removedFiles = 0;
  let removedBytes = 0;
  for (const file of files) {
    const source = `/${path.relative(options.output, file).split(path.sep).join("/")}`;
    // Files outside the managed image manifest may be assembled dynamically
    // (characters, branding, videos). Preserve those, and every source file.
    if (!unused.has(source) && path.basename(file) !== ".DS_Store") continue;
    removedBytes += (await fs.stat(file)).size;
    await fs.unlink(file);
    removedFiles++;
  }
  return { removedFiles, removedBytes };
}
