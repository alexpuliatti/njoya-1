import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/njoya-1";
const siteUrl = process.env.SITE_URL ?? `https://alexpuliatti.github.io${basePath}/`;
// Next.js 14's static exporter always uses .next internally. Isolate the build
// rather than replacing a running development server's generated files.
const staging = await fs.mkdtemp(path.join(os.tmpdir(), "njoya-pages-build-"));
const excluded = new Set(["node_modules", ".next", "out", "njoyastudio", "media", ".git"]);
try {
  await fs.cp(root, staging, {
    recursive: true,
    filter: (source) => {
      const top = path.relative(root, source).split(path.sep)[0];
      return !excluded.has(top) && !top.startsWith(".env") && top !== ".DS_Store";
    },
  });
  await fs.symlink(path.join(root, "node_modules"), path.join(staging, "node_modules"), "dir");
  const result = spawnSync("npm", ["run", "build"], {
    cwd: staging,
    stdio: "inherit",
    env: {
      ...process.env,
      STATIC_EXPORT: "true",
      NEXT_PUBLIC_BASE_PATH: basePath,
      SITE_URL: siteUrl,
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_IGNORE_INCORRECT_LOCKFILE: "1",
    },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  } else {
    const output = path.join(root, "out");
    await fs.rm(output, { recursive: true, force: true });
    await fs.cp(path.join(staging, "out"), output, { recursive: true });
    await fs.writeFile(path.join(output, ".nojekyll"), "");
    await fs.writeFile(path.join(output, "pages-build.json"), JSON.stringify({ basePath, origin: new URL(siteUrl).origin }));
  }
} finally {
  await fs.rm(staging, { recursive: true, force: true });
}
