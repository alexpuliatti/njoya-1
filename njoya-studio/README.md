# Njoya Studios

A portfolio for Njoya Studios, a multidisciplinary creative practice working across space, image, objects and experiences.

The Next.js application reads **local content files** and serves **local images**. Sanity is not used by the frontend. Inter is also bundled locally, so builds do not depend on Google Fonts. Videos are pending: the export contains playback references but no video files. Playback is disabled and all projects use local still images.

## Run locally

```bash
npm ci
npm run dev
```

Open the Local URL printed by Next.js. No Sanity project ID or API token is required.

The site can publish to **GitHub Pages** through the repository's Pages workflow; see [GitHub Pages instructions](docs/github-pages.md). A standalone Node.js server build, Dockerfile, and Compose configuration are also available; see [self-hosting instructions](docs/self-hosting.md).

```bash
npm run content:validate
npm test
npm run build
npm start
```

Content and media validation runs automatically before production builds. The repo uses legacy peer dependency resolution for its existing dependency tree; `.npmrc` applies this consistently to installs.

## Content structure

```text
content/site.json             Studio statement, inquiry contacts, video setting
content/home.json             Exactly four featured project slots
content/categories.json       Work categories and their cover project IDs
content/about.json            Company biography, portrait and team
content/work/*.json           Individual projects and shoot editions
content/collections/*.json    Legacy publication/brand collections
content/lab/*.json            Research entries; published:false stays private
content/legacy-routes.json    Old project URLs and their new destinations
content/media-sources.json    Source image inventory for local tooling
content/media-variants.json   Generated responsive image profiles
public/media/images/          Prepared responsive WebP/AVIF images
public/media/brand/           Optimized supplied intro artwork
media/originals/              Local original uploads (Git-ignored)
```

The schema is in `lib/content/schema.mjs`. The server-only repository in `lib/content/repository.ts` reads, validates and sorts content. Public search data contains searchable text and card information, without galleries or private source documents.

## Edit a project

Edit its JSON file under `content/work/`, then rebuild. Preserve `id` and `slug` for existing projects. Each project has:

- `id`, `slug`, `title`, `client`, and a `date` in `YYYY-MM-DD` format, or `YYYY-MM` when only the month is known (or `null` for a date that has not been established).
- `categories`: one or more of `worlds`, `exhibition`, `commercials`, `editorials`.
- `kind`: `edition` or `design-project`.
- `cover`: a local image object.
- `gallery`: an ordered array of image, synopsis-image, and video objects.
- `credits`: `{ "role": "photographer", "name": "Person Name" }`, or `{ "role": "other", "customRole": "Art Direction", "name": "Person Name" }`.
- `tags`: additional useful search terms.
- `legacyUrls`: existing URLs that must keep working.

The explicit credit role for **Set Design Assistants** is `setDesignAssistants`. Preserve unrelated assistant roles as `assistant`.

Projects are sorted by their actual date, newest first, with undated work last. Dates should reflect the work/publication date, not the upload date. Search matches names, brands, publications, credits, titles and tags, ignoring case, accents and punctuation.

When creating a project, use a new stable ID, create a unique slug, and name the JSON file `<slug>.json`. Use an existing project as the structural example. A project does not need a legacy collection to appear in Work or search.

## Add an image

```bash
npm run media:add -- "/absolute/path/to/photo.jpg" --alt "Describe what the image shows"
```

The command retains a local original in `media/originals/`, prepares responsive images, and prints the image object to paste into a project cover, gallery, team portrait, or research entry. It does not modify the source image.

Images are generated directly from the original at 480, 960, 1600 and up to 2560 pixels wide, omitting sizes larger than the source. WebP uses quality 88; AVIF uses quality 80 with 4:4:4 chroma. These settings were compared visually on the installed Sharp 0.33.5 encoder. AVIF is selected only when its full-size output is at least 8% smaller than WebP; otherwise WebP is retained. An AVIF image also has a full-size WebP fallback. The browser downloads the appropriate format and resolution through `<picture>`/`srcset`, with crop-aware sizing for tall cards. Photos use these prepared files on every host, without another lossy encoding pass in Next.js.

Include the generated files under `public/media/images/` and both media manifests with the content changes when sharing or deploying. Do not edit `media-variants.json` manually. Original uploads and the full Sanity archive do not belong in the public directory. Production builds use the prepared web files and do not need the original archive.

To regenerate existing media from the original Sanity export:

```bash
npm run media:prepare
# Or supply the images directory explicitly:
npm run media:prepare -- "/path/to/export/images"
```

This command is incremental and resumable. It fingerprints the encoding profile and original file, skips valid existing outputs, and updates content paths after all images are ready. Profile changes receive versioned filenames to avoid stale browser caches. The former quality-82 images and 720px previews are retained privately under `media/originals/previous-webp-82/`, outside the deployment. Original files must be available when regenerating missing output. HEIF originals are converted using macOS `sips` when needed; a different build platform must support decoding the source format or use the already-prepared web images.

Future obsolete profile files are also archived privately under `media/originals/previous-prepared/`, so the public directory contains only current outputs. See [image optimization notes](docs/image-optimization.md) for the format comparisons and source-resolution limits.

## Add a synopsis image

The studio designs these cards as images. Add the image normally, then set its `type` to `synopsis` and supply `text` containing the same information in readable text:

```json
{
  "type": "synopsis",
  "src": "/media/images/IMAGE_HASH-PROFILE.webp",
  "previewSrc": "/media/images/IMAGE_HASH-PROFILE-480.webp",
  "alt": "Behind the scenes of the Lacoste project",
  "width": 1200,
  "height": 1600,
  "text": "The intention and idea behind the project."
}
```

Replace the example paths with actual generated files. Place the object at the intended point in `gallery`. Both direct project pages and the animated detail panel preserve this order.

## Videos (pending assets)

`videoPlaybackEnabled` is `false` in `content/site.json`. Cover films display their local cover image, and video gallery entries are omitted. Existing playback references remain in the project files for future use. The current site makes no video-provider requests.

Once the actual files are supplied, local video serving can be added alongside the local image setup. The export alone cannot supply those files. Optional Mux support is retained in code; enabling `videoPlaybackEnabled` would instead use those external streams and should only be done after confirming their availability. The preserved reference format is:

```json
{
  "type": "video",
  "playbackId": "PUBLIC_MUX_PLAYBACK_ID",
  "alt": "Describe the project film"
}
```

`coverVideoPlaybackId` holds a cover-film reference. Always retain the local image cover.

## Select homepage projects

`content/home.json` contains exactly four `{ "title": "Display title", "workId": "PROJECT_ID" }` entries. Match `workId` to a project's `id`. The studio statement is separate and stays fixed while the four project slots browse in a loop.

All four slots now point to published projects. Jaguar uses the supplied Miami installation photographs and credits, dated December 2024.

The homepage intro uses `public/media/brand/njoya-intro.webp`, prepared from the supplied logo artwork. It plays once per browser-tab session, then reveals the homepage with an upward screen wipe. Skip/Escape dismiss it immediately; reduced-motion visitors go straight to the page. The session key and pre-hydration check are in `lib/intro.ts`.

## Add a Lab entry

Create `content/lab/<slug>.json`:

```json
{
  "id": "research-unique-id",
  "slug": "research-title",
  "title": "Research title",
  "date": "2026-10-30",
  "summary": "A brief introduction to the research.",
  "paragraphs": ["The research statement and observations."],
  "gallery": [],
  "published": false
}
```

Add prepared image objects to `gallery`. Change `published` to `true` when ready. Unpublished research is excluded from the index and direct routes. No fictional entries are published by default.

## Legacy URLs

Existing shoot, edition, and design-project links redirect to canonical `/work/projects/<slug>` URLs. Old multi-edition collection URLs retain a local collection view. When adding or changing a legacy URL, keep both the project's `legacyUrls` and `content/legacy-routes.json` synchronized; validation checks them together.

## Initial migration

The original export is outside the website repo at `../njoya-sanity-backup/extracted/production-export-2026-10-29t16-30-14-149z/`.

```bash
npm run content:import
```

This is a one-time importer. It refuses to replace existing local work files. **Do not rerun it after editing content.** For a deliberate re-import, back up local content first and use `npm run content:import -- --overwrite`. The original backup is never modified. Drafts, credential documents and unused sample content are excluded by an explicit field/type allowlist.

The initial import produced 90 work entries, 23 collections and 812 image sources. `docs/migration-audit.json` records generated slugs, missing dates, unlinked editions, the Brides de Galaxy date conflict, and provisional category assignments.

The historical Sanity Studio source remains in `njoyastudio/` as an archive, with its own dependencies. It is excluded from the frontend TypeScript build and is not needed to run the website.

## Outstanding studio content

- Final Lab research entries and design direction.
- Designed synopsis cards.
- Editorial review of category assignments and uncertain dates.
- Final header wordmark asset; the loading intro now uses the supplied illustrated logo.

The detailed brief mapping and original implementation sequence are in `docs/implementation-plan.md`.
