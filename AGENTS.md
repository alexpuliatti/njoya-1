# Instructions for agents working on Njoya Studios

## Start here

- The website application is `njoya-studio/`. Run its npm commands there, not at the repository root or in the archived `njoyastudio/` directory.
- Read `README.md` and `njoya-studio/docs/content-guide.md` before a content upload. Use `njoya-studio/README.md` for application maintenance. Follow the actual schema in `njoya-studio/lib/content/schema.mjs` if documentation and code disagree; report the discrepancy.
- Inspect `git status` before editing. Preserve existing changes and stage only the files belonging to the requested update. Do not reset, clean, overwrite unrelated edits or regenerate the portfolio as part of an ordinary upload.

## Content work

- Use the supplied copy and assets. Check for an existing project before creating a record. Do not invent project facts, credits, dates, permission to release embargoed content or replacement artwork.
- Work goes in `content/work/<slug>.json`; Lab goes in `content/lab/<slug>.json`, relative to the app. JSON filenames must match their record's slug. Use unique stable IDs and lowercase, hyphenated slugs for new records; preserve existing IDs, slugs and legacy links.
- The only Work category values are `worlds`, `exhibition`, `commercials`, `editorials` and `motion`. Use multiple values on one project where appropriate. The first category controls its default label and direct page's back link.
- All valid Work files are public on the next deployment: there is no Work `published` flag. Keep unfinished Work in a branch/PR. Lab supports `published: false`; its files still undergo validation. Neither a hidden Lab entry nor Git-ignored originals make committed or publicly served files confidential.
- Use actual Work dates (`YYYY-MM-DD`, `YYYY-MM`, or `null` if unknown), never the upload date to move work up a list. Lab needs a real full entry date (`YYYY-MM-DD`); ask for it if missing.
- Keep approved gallery and credit order. Use the preset credit keys from `lib/credits.ts`; use `role: "other"` with `customRole` for a custom label. `setDesignAssistants` means Set Design Assistants; preserve unrelated assistant roles.
- A Motion project needs a playable local gallery film, a prepared still cover and a prepared poster per film. Motion category popups filter out stills/synopsis images; direct project pages retain the full gallery.
- Lab's first gallery image is the story image. Use the optional `project` structure for sketches, making and results. Lab accepts images/synopsis images, not video objects. Follow the guide's section behavior; do not redesign the layout for a content upload.
- Lab story cards on `/lab` and `/lab/<slug>` must show only the title followed by body text in the existing grey tone (`--studio-muted`). Render `summary` as the first body paragraph with the same size, colour and spacing as `paragraphs`; do not style it as a separate subtitle or a larger, brighter introduction.
- Work automatically appears in assigned sections and search. Lab is not in the search index. Change the four homepage slots, category covers or legacy collections only when part of the request.

## Optimization is mandatory for every uploaded image and video

- Prepare every image, including covers, portraits, sketches, synopsis artwork and film posters, with `npm run media:add -- "/path/to/file" --alt "Accurate description"`. Use `--web` for Lab/process galleries and appropriate posters; use the default profile for finished Work and text-heavy artwork. Inspect output quality and crops. Never upscale to disguise a low-resolution source.
- Run image uploads sequentially; the script updates shared manifests. Paste the complete printed image object into content. Do not fabricate filenames, dimensions or responsive entries, and do not hand-edit `media-variants.json`.
- Commit new prepared images and both media manifests with the content. Originals in `media/originals/` are ignored and must remain outside `public/`. Do not commit or publish original camera files, masters, private source documents or credentials.
- Prepare full films as browser-compatible H.264, `yuv420p`, faststart MP4s in `public/media/videos/`. Inspect source codecs first; losslessly remux compatible sources when appropriate, otherwise encode at a visually checked quality without upscaling. Preserve approved audio using AAC or compatible stream copy; remove audio only when requested. Keep a source/output record with dimensions, duration, bytes and audio decisions.
- Optional hover previews must be separate small, silent, short MP4s; assign `previewVideoSrc` while keeping the still cover. Full films go in `gallery`, not in the preview field. Local films do not require enabling the global legacy Mux setting.
- Validate file sizes and test actual playback, seeking, poster aspect ratio and sound. Optimization checks are partly manual: `content:validate` checks file existence and structure, not codecs, bitrate, audio correctness or visual quality. See the guide for the full procedure.
- Do not run `media:prepare` for a normal upload: it processes the full inventory and needs private original sources. Do not rerun `content:import`; it is a historical migration tool.

## Finish the requested update

- Run `npm run content:validate` and `npm test`. For publishable content, also run `npm run build:pages` and `npm run test:pages`, matching CI. Report any failed or unavailable checks accurately; do not claim success without running them.
- Preview the affected category, popup and direct page on desktop/mobile. Check gallery order, alt text, credits, cropping, keyboard closing/focus, reduced motion, and video playback/audio. For Lab also check the index story and its popup. State when browser QA could not be completed.
- Review the diff for unintended files and missing generated media. Do not use `npm run lint` as a read-only check: it includes `--fix`.
- Summarize changed sections/URLs, media optimization and any unresolved editorial questions. Distinguish a local update, a PR, a merge and a verified live deployment.
- Follow the user's requested release scope. A push/merge affecting `njoya-studio/` on `main` triggers Pages publishing; a PR does not. Do not publish unfinished or embargoed work. Do not ask again for a release action the user has already authorized.
