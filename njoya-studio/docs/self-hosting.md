# Self-hosting Njoya Studios

For the GitHub Pages deployment, use [GitHub Pages instructions](github-pages.md). This document covers the optional Node.js/Docker deployment instead.

The website runs as a normal Next.js Node.js server. It does not require Vercel, Sanity, a database, or API credentials. Prepared images are served from the application, and content is bundled as local JSON files. Video playback is disabled pending the actual video files; projects use local still images.

## Build and run with Node.js

From the website directory, with Node.js 22 installed:

```bash
npm ci
npm run build
npm start -- --hostname 0.0.0.0 --port 3000
```

Put the server behind the hosting provider's HTTPS reverse proxy, such as Nginx or Caddy. Forward requests to port 3000. Keep `/_next/`, `/media/`, and all page requests on the same origin. Do not cache dynamic HTML indiscriminately at the proxy. A single Node server is sufficient for the file-based editing workflow.

Set `SITE_URL` to the public origin before building, for example `SITE_URL=https://your-domain.example npm run build`, so shared-link images use the correct domain. For Compose, set `SITE_URL` in the shell or a local `.env` file before building. This is a public URL, not a secret; `.env.example` documents the setting.

For a smaller deployment package, the build also produces `.next/standalone`. Next.js does not copy `public` or `.next/static` into that directory automatically. Package all required files:

```bash
cp -R public .next/standalone/public
mkdir -p .next/standalone/.next
cp -R .next/static .next/standalone/.next/static
# Content is also included in file tracing; copy explicitly for portability.
cp -R content .next/standalone/content
cd .next/standalone
HOSTNAME=0.0.0.0 PORT=3000 node server.js
```

Build on the same OS/architecture as the production server, or use Docker. Native image-optimization dependencies are platform-specific. A macOS standalone bundle should not be copied directly to a Linux server.

## Docker

The included multi-stage Dockerfile installs dependencies, validates content, builds the site, and runs the standalone server as an unprivileged user. The original image backup, archived Sanity Studio, environment files, and local original uploads are excluded. Prepared files under `public/media/` are included.

```bash
docker compose up --build -d
```

The site listens on port 3000. Photographs use the same prepared responsive WebP/AVIF files as the static site. The named volume preserves Next.js's cache across container replacements. Put HTTPS in front of this port using the host's reverse proxy.

## Verify a running server

```bash
npm run test:routes -- http://127.0.0.1:3000
```

This checks every local project page, category, collection, and legacy redirect, plus 404 handling, prepared media, and self-hosted image optimization. Use the address of the server you intend to test.

## Publish content updates

1. Edit the JSON files and add prepared local image files as described in the main README.
2. Run `npm run content:validate` and `npm test`.
3. Rebuild and replace/restart the running application, or run `docker compose up --build -d`.

No runtime upload directory or database needs to be maintained. Keep the source content and prepared images backed up together. The original Sanity export remains a separate private archive.

The content filesystem is read-only during normal use. Next.js keeps its normal writable `.next/cache` directory; photographs do not require on-demand image optimization. All local content files, including `media-variants.json`, and prepared images must accompany the deployment.

## External requests

- No video-provider requests are made with the current `videoPlaybackEnabled: false` setting. Optional Mux references are preserved in content for later review; original video files are needed to add local video hosting.
- Inter is bundled in `assets/fonts/` with its open font license. No font-service request is needed at build time or runtime.
- Instagram and inquiry email links open their respective destinations only when visitors use them.
- Vercel Analytics has been removed.

The current deployment target is GitHub Pages. These Node.js/Docker instructions remain available for a future server host; its domain, reverse proxy and service configuration would be set for that host.
