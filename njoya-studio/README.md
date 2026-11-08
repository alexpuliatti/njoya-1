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

## Experimental components

The local `experiment/refined-design` prototype adds a small owned component set in `components/ui/`: `StudioButton`, `StudioIconButton`, `StudioDialog` with composable panel/hero/close parts, `SearchField`, and `SurfaceLight`. Styles live in `styles/studio-components.css`. No packages were added.

Project cards open a framed viewer with an image morph, credits and the existing ordered gallery. Search uses the same native dialog shell, with thumbnails, suggested searches and an Escape-to-clear field. Keyboard activation and reduced-motion preferences skip the animated entrance; closing restores focus and page scrolling. The pointer highlight only runs for a fine pointer with motion enabled.

Design references: [BoardUI controls](https://www.boardui.com/components), [React Bits Spotlight Card](https://reactbits.dev/components/spotlight-card), and [Motion Primitives Morphing Dialog](https://motion-primitives.com/docs/morphing-dialog). The featured homepage cards use an adapted [React Bits Tilted Card](https://reactbits.dev/components/tilted-card), with the upstream spring motion, a restrained hover tilt and a staggered entrance after the Njoya intro. Its source attribution and license are in `components/react-bits/`.

To review locally, run `npm run dev`, open a project card, browse its credits and gallery, and close it with the close control, Escape or the backdrop. Open Search with its button or ⌘/Ctrl K; try a suggested search, clear it with Escape, then press Escape again to close. Check the same flows at phone width and with reduced motion enabled. The automated build and static checks pass; visual interaction QA remains pending because the browser-control host was unavailable during implementation.

## Content structure

```text
content/site.json             Studio statement, inquiry contacts, video setting
content/home.json             Ordered featured project slots (at least one)
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
- `categories`: one or more of `worlds`, `exhibition`, `commercials`, `editorials`, `motion`.
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

## Videos

Prepared MP4 files in `public/media/videos/` are served directly with the GitHub Pages export. Gallery films have native playback controls, local posters, preserved audio and `preload="none"`. A work can provide a small silent `previewVideoSrc` for its desktop hover preview; touch and reduced-motion visitors retain the still cover and open the project to play its films.

Use a prepared image object for the poster, just as for a project cover:

```json
{
  "type": "video",
  "src": "/media/videos/project-film.mp4",
  "poster": { "type": "image", "src": "/media/images/PREPARED.webp", "previewSrc": "/media/images/PREPARED-480.webp", "alt": "Film poster", "width": 1080, "height": 1920 },
  "alt": "Describe the project film"
}
```

`videoPlaybackEnabled` remains `false` in `content/site.json` for the unavailable legacy Mux references. Local films work independently of that setting. The current site makes no video-provider requests. The preserved remote format is:

```json
{
  "type": "video",
  "playbackId": "PUBLIC_MUX_PLAYBACK_ID",
  "alt": "Describe the project film"
}
```

`coverVideoPlaybackId` holds a cover-film reference. Always retain the local image cover.

## Category covers

The five Work category cards in `content/categories.json` have their own optional `cover` image objects, separate from the project's full-quality cover. Their source entries use `"profile": "cover"` for lighter AVIF/WebP files and additional 320px and 640px responsive sizes. `npm run media:prepare` regenerates them alongside the project images. When changing `coverWorkId`, replace or remove the category's `cover` too; without it the card falls back to the project cover.

## Select homepage projects

`content/home.json` contains an ordered list of `{ "title": "Display title", "workId": "PROJECT_ID" }` entries, with at least one feature. Match `workId` to a project's `id`. Add or replace entries only as requested. The studio statement is separate and stays fixed while the project cards browse in a loop.

The five features include Balmain Motion alongside the four existing projects. Jaguar uses the supplied Miami installation photographs and credits, dated December 2024.

The homepage intro uses `public/media/brand/njoya-intro.webp`, prepared from the supplied logo artwork. It appears on each full homepage load, then reveals the homepage with an upward screen wipe. It stays dismissed during navigation within the same document. It finishes automatically without a visible skip button; Escape dismisses it immediately. Reduced-motion visitors see the still artwork briefly without the animated entrance or wipe. The pre-hydration setup is in `lib/intro.ts`.

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
