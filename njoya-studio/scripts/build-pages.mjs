import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/njoya-1";
const result = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  env: {
    ...process.env,
    STATIC_EXPORT: "true",
    NEXT_PUBLIC_BASE_PATH: basePath,
    SITE_URL: process.env.SITE_URL ?? `https://alexpuliatti.github.io${basePath}/`,
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_IGNORE_INCORRECT_LOCKFILE: "1",
  },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
await fs.writeFile("out/.nojekyll", "");
await fs.writeFile("out/pages-build.json", JSON.stringify({ basePath }));
