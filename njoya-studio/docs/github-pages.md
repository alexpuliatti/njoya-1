# GitHub Pages

The repository's `.github/workflows/pages.yml` builds the website from `njoya-studio/` and publishes only the generated `out/` directory. It runs on changes pushed to `main`, or from the workflow's **Run workflow** button. The original Sanity archive is excluded from the repository and deployment.

The project URL is **https://alexpuliatti.github.io/njoya-1/**. In repository **Settings → Pages**, the publishing source must be **GitHub Actions**.

## Editing and publishing

1. Edit local JSON content and add prepared images using the main README's workflow.
2. Commit and push changes to `main`.
3. Wait for **Deploy website to GitHub Pages** in the Actions tab to finish.

GitHub installs dependencies, validates content, runs the content/search tests, builds the static pages, checks routes/assets and publishes the artifact. Failed checks prevent deployment.

## Build locally

From `njoya-studio/`:

```bash
npm ci
npm run build:pages
npm run test:pages
```

The output is in `out/`. The script builds in a temporary source copy and then copies the finished export back, so a running development server can keep using its own `.next/` files. Environment files, original uploads and the archived Sanity Studio are excluded from that temporary copy. `npm start` runs the Node build, not the static export. To preview Pages locally, serve `out/` beneath `/njoya-1/` using a static file server.

The build uses `STATIC_EXPORT=true`, `trailingSlash`, and the repository's base path. Local media and font URLs include that path, including every responsive image candidate. Prepared WebP/AVIF images are served directly through `<picture>` and `srcset`, without a live image-optimization server. Search loads the shared `/search-index.json` file on demand and filters it in the browser; opening a search URL or refreshing it works. Existing project URLs have generated redirect pages with a normal link and automatic browser forwarding, since Pages cannot emit application HTTP redirects.

After rendering, `scripts/export-media.mjs` scans generated pages, navigation payloads, scripts, styles and JSON. It omits unused manifest-managed image families and Finder metadata from the deployment only. A reference to any family member retains every size and fallback. Prepared files in `public/` and content manifests are unchanged; unknown assets, branding, characters and films remain included. The build prints removed bytes and records the result in `out/pages-build.json`. `test:pages` checks the shared search catalog and retained media. Do not treat pruning as protection for confidential files.

The workflow reads the base path and public URL from `actions/configure-pages`. If a custom domain is configured later, the next build uses its corresponding path. To test an export at the domain root locally:

```bash
NEXT_PUBLIC_BASE_PATH= SITE_URL=https://your-domain.example npm run build:pages
npm run test:pages
```

All published content and images are static files. Updating local content requires a new build; there is no runtime database or content server. Videos stay disabled pending the original files.

The normal `npm run build` still creates the standalone Node.js build documented in [self-hosting](self-hosting.md).
