# Njoya Studios website analysis and implementation plan

Prepared 30 October 2026. The local migration, new route structure, homepage, search, About, and Lab foundation are implemented. Video playback is disabled pending the actual video files. See README.md for the editing workflow and docs/migration-audit.json for unresolved content decisions. The original analysis and implementation sequence are retained below.

The agreed editing workflow is to update local content files and media, then rebuild the site. The recommended replacement for Sanity is therefore a validated, file-based content layer inside the existing Next.js application. A database, upload API, and browser CMS are unnecessary for this workflow.

## Sources and scope

- Existing application: `njoya-studio/`, inspected in source and running locally in Chrome. The homepage and About page were visually reviewed; a direct project page and its credits were also verified.
- Brief: `../NJOYA STUDIOS VIRTUAL WOLRDS ( WEBSITE, SOCIALS) -(2026).pdf`, 25 pages. Text was extracted and the relevant visual layouts were rendered and inspected.
- Export: `../njoya-sanity-backup/extracted/production-export-2026-10-29t16-30-14-149z/`, including `data.ndjson`, `assets.json`, and `images/`.

This plan covers the website requirements in the brief and removing its Sanity content/image dependency. The brief does not provide a separate actionable social-media implementation scope.

## Current application

The application uses Next.js 14.2.12 and React 18.3.1, with Tailwind/NextUI, Embla, GSAP, and Lottie. It has a separate Sanity Studio in `njoyastudio/`.

- The homepage interleaves the full magazine/shoot and design-project catalogs. There is no fixed studio statement card or curated four-project home selection.
- `/shoots` groups work under brands/publications. Multi-edition shoots lead to edition carousels. Individual editions and design projects also have direct detail URLs.
- `/design-projects` presents design projects in the shared carousel.
- `/about` already has a founder biography and three team members. The brief requests a company biography and an additional contact section.
- The bottom menu currently contains SHOOTS, DESIGN PROJECTS, SEARCH, ABOUT. It is owned by the carousel, so the new global navigation should be moved into the shared application shell.
- Search is global but matches shoot titles and project titles/clients. Credits already exist in metadata but are not searched. Search currently sends results back to the homepage through `?q=`.
- `lib/sanity.ts`, page loaders, the root layout, and `lib/get-search-catalog.ts` fetch from Sanity. `lib/sanityImageUrl.ts` generates Sanity CDN URLs. Replacing only the client configuration would not complete the migration.
- The root layout fetches whole project/sub-shoot documents for navbar props that the current navbar does not use. The search catalog also includes entire gallery URL lists. The replacement should avoid shipping these unnecessarily.
- Gallery fields are numbered slots, with repeated conversion code in multiple loaders. Videos and images are separate lists, limiting deliberate interleaving of gallery content.
- A self-contained, three-second Lottie loader already exists. Compare its branding and animation with the PDF before replacing it.
- The current header logo differs from the wordmark shown in the brief. Confirm the final brand asset during the visual pass.

Relevant source locations: `app/page.tsx`, `app/layout.tsx`, `app/about/page.tsx`, `app/shoots/`, `app/design-projects/`, `components/njoya-carousel*.tsx`, `components/search-provider.tsx`, `components/work-detail.tsx`, and `lib/credits.ts`.

## Export audit

| Item | Finding |
| --- | --- |
| Export documents | 131 total |
| Shoot collections | 24 records: 23 published and one draft |
| Shoot editions | 77 records: 75 published and two drafts |
| Design projects | 15 published records |
| Other content | One each of About, magazine, paintings, homeGrid |
| Video records | 10 Mux asset records; no video binaries in this export |
| Local images | 1,693 files, with 1,693 asset-metadata entries |
| Referenced images | 818 unique files used by 911 image occurrences across the entire export |
| Missing referenced files | None |
| Unreferenced images | 875 files, approximately 3.11 GB; preserve in the archive |
| Export size | Approximately 5.47 GB, mostly original images |
| Empty image slots | 193 image objects without an asset; omit these during normalization |
| Missing published slugs | 14 records: one shoot collection, five editions, eight design projects |
| Unlinked published editions | Three: Issey Miyake, British Vogue March 2025, Le Monde d'Hermes No. 87 |
| Missing edition dates | Two published editions |

Important migration details:

1. The export uses `_sanityAsset: image@file://./images/...` for image locations. These are local export pointers, not the `_ref` asset format expected by the current Sanity image helper. A dedicated importer must resolve them.
2. All non-image document references inspected resolve within the export. Preserve original IDs when converting relationships.
3. Exclude the three drafts from public output by default. Preserve them in the source backup for later review.
4. Preserve alt text, dimensions, original filenames, credit order, gallery order, and intentional repeated media. Convert numbered slots into arrays in numeric order.
5. The export contains a `mux.apiKey` document. Use an explicit allowlist of content fields; never copy the raw export into `public/`, client bundles, or generated search data.
6. HEIF and TIFF originals are present. Publish browser-compatible image derivatives and retain the originals separately.
7. Existing unused magazine/homeGrid records and the Mona Lisa painting sample should be archived, not automatically introduced into the new work catalog.
8. Treat the 75 published editions and 15 design projects as candidate individual work entries. The 23 shoot records primarily represent collections, not 23 additional distinct projects.

## Requirements from the PDF

| Area | Required behavior | PDF pages |
| --- | --- | --- |
| Loading/branding | Review the illustrated loader and supplied wordmark against existing assets | 3-4 |
| Home | A fixed WE BUILD WORLDS card with the supplied studio statement; clicking it opens About | 6-8, 23 |
| Home heroes | Exactly four featured projects: Brides de Galaxy, Lacoste, Jaguar, Vogue Hommes | 9 |
| Desktop home movement | Keep the studio card visible on the left while the two project positions on the right browse a loop of the four selected projects | 6-9 |
| Main navigation | WORK, LAB, ABOUT; visible search and Instagram actions in the header | 6-7, 11, 16, 18, 22 |
| Work directory | Four category cards: Worlds, Exhibition, Commercials, Editorials | 12-13 |
| Category order | Individual work appears newest first using its project/publication date | 14 |
| Search | Search by brand, person, and credits; Rihanna is the explicit example | 11 |
| Credits | Add the explicit role Set Design Assistants | 15 |
| Lab | A research/journal area for statements, materials, sketches, iterations, and projects in progress; design is explicitly TBC | 17 |
| About | Company biography first, followed by team members and their functions | 19-20 |
| Contact | Job inquiries to sam@newschoolrepresents.com; general/studio inquiries to luiza@ibbynjoya.com and aisha@ibbynjoya.com | 21 |
| Project synopsis | Optional studio-designed synopsis/behind-the-scenes image cards in selected project galleries | 24 |

The homepage is not a five-slide carousel in which the statement scrolls away. The desktop layout has a persistent statement beside a separate project carousel. Mobile behavior is not specified in the PDF: propose a compact persistent introduction above a swipeable project card, then review it before final implementation.

## Recommended content architecture

```text
content/
  site.json                 # studio statement, contacts, navigation settings
  home.json                 # four featured work IDs, in deliberate order
  categories.json           # labels, category covers, category order
  about.json                # company biography and team array
  work/<slug>.json           # one editable record per individual project/edition
  collections/<slug>.json    # legacy brand/publication grouping where useful
  lab/<slug>.json            # research entry text and media
  legacy-routes.json         # old URL -> stable work/collection ID
lib/content/
  schema.ts                 # validation and shared types
  repository.ts             # server-side reading, lookup, sorting, relationships
  media.ts                  # local manifest and URL lookup
  search.ts                 # shared normalized search logic and lightweight index
public/media/
  images/                   # web-ready variants only
  videos/                   # if local video hosting is selected
scripts/
  import-sanity.*            # repeatable export conversion and audit report
  prepare-media.*            # image conversion, variants, media manifest
  validate-content.*         # build-time integrity checks
```

Each work record should have a stable ID, slug, title, client/publication, date, category IDs, cover, ordered gallery, structured credits, and legacy URLs. Gallery entries should support `image`, `video`, and `synopsis` types, with alt text or a text equivalent for synopsis artwork. Keep collections separate so old magazine relationships are preserved without dictating the new categories.

Use explicit `categories[]` assignments rather than inferring categories solely from the legacy document type. Campaigns and editorials share the current shoots model, and the PDF places some event projects in Exhibition. Proposed category assignments need studio review.

Read and validate content at build time, pre-render known routes, and serve prepared media from the site's own origin. Continue using the current Next.js hosting model initially; a pure static export is optional and would also require handling image optimization and redirects accordingly.

The original 5.47 GB backup should remain outside the deployed/public site. Publish only selected optimized derivatives. Measure generated media size before choosing the repository/deployment packaging approach; ensure the build environment can access whichever media sources it needs.

Video playback is disabled for the current implementation. Local content retains the exported Mux playback IDs without querying Sanity, and projects display local still images. Obtain the original video files before adding local video hosting. The current export alone cannot supply those files.

## Proposed routes

| Route | Purpose |
| --- | --- |
| `/` | Curated statement and four hero projects |
| `/work` | Four category cards |
| `/work/worlds` | Worlds, newest first |
| `/work/exhibition` | Exhibition, newest first |
| `/work/commercials` | Commercials, newest first |
| `/work/editorials` | Editorials, newest first |
| `/work/projects/[slug]` | Canonical individual work page, shared with the animated detail view |
| `/lab` | Research/journal index |
| `/lab/[slug]` | Research entry |
| `/about` | Biography, team, contact |
| `/search?q=...` | Search across all published work |

Preserve existing valid `/shoots/...`, edition, and `/design-projects/...` links through aliases/redirects. Existing collection URLs can remain as collection views until their replacement is agreed. Resolve every legacy URL explicitly rather than redirecting all old links to the homepage.

Use a separate search results route so the homepage remains curated. Existing `/?q=` links should continue to resolve to the new search experience.

## Implementation sequence

1. **Establish the content and media inventory.** Build the repeatable importer and a human-readable audit. Resolve exported image pointers and collection references, normalize galleries and credits, preserve IDs, exclude drafts and secrets, generate deterministic missing slugs with collision checks, and flag unresolved editorial choices. Keep the original backup intact.

   Deliverable: validated local content files, media manifest, and an exceptions list covering dates, categories, unlinked entries, and missing assets.

2. **Replace Sanity while preserving current behavior.** Introduce the shared content repository and local image handling. Move the homepage, listing pages, editions, direct detail pages, About, metadata, and search catalog onto it. Remove unused navbar data fetches and avoid sending entire galleries through the global search provider. Use arrays instead of numbered fields in application code.

   Deliverable: the current site works with no Sanity project ID and no Sanity API/CDN requests. Mux, if retained, is an explicitly separate video dependency.

3. **Introduce the new navigation and work structure.** Build the shared WORK/LAB/ABOUT navigation and header search. Add the work category directory and date-sorted category views. Map individual projects to their reviewed categories. Add the canonical work route and legacy URL handling.

   Deliverable: all existing published work is reachable through the new information architecture without breaking valid old links.

4. **Build the curated homepage.** Add the persistent studio statement and independently looping four-project carousel. Set the exact hero IDs, order, and cover artwork. Link the statement to About. Align the wordmark, loader, card styling, typography, and spacing with the PDF. Review the mobile interpretation.

   Deliverable: the homepage contains only the required statement and four selected hero projects; search results do not replace this curated view.

5. **Complete project content and search.** Share one project model between the animated detail panel and direct route. Support ordered synopsis images alongside other media. Add Set Design Assistants as a specific credit role without relabeling unrelated legacy assistants. Search titles, clients/publications, editions, credit names/roles, and appropriate tags with case/accent normalization. Use the same matcher for suggestions and result filtering.

   Deliverable: Rihanna finds the relevant Perfect and Dazed entries in the export, brand/person searches work across categories, and synopsis cards work on direct and animated project views.

6. **Complete About and Lab.** Replace the founder-led opening text with the company biography supplied on PDF page 20, retain and normalize the team data, and add the specified inquiry contacts. Build a Lab index and research-entry template. Use a restrained draft layout until the studio supplies final Lab content/design; do not invent research projects for publication.

   Deliverable: About follows biography -> team -> contact; Lab can represent statements, materials, sketches, and iterations once supplied.

7. **Verify and remove obsolete integrations.** Check the migrated catalog, routes, links, search, dates, media, responsive layouts, keyboard operation, reduced motion, and image loading. Validate the content before every build. Remove unused Sanity packages/configuration after parity is established, and document how to add/edit a project, upload local media, generate variants, and rebuild.

   Deliverable: a production build with no Sanity runtime dependency, a clean migration audit, and an editing guide.

## Decisions and missing inputs

- **Jaguar:** no matching project document or original image filename was found. Unreferenced images may still contain the artwork; review those before requesting new source material. A complete Jaguar entry and chosen cover are needed for the final four-hero homepage.
- **Hero artwork:** Brides de Galaxy, Lacoste, and Vogue Hommes have matching content. Verify the exact image/crop shown in the brief. Lacoste's edition cover matches the Venus Williams reference better than its current parent collection cover.
- **Chronology:** Brides de Galaxy is titled 2025 but dated `2023-11-15`; confirm the date before relying on date sorting. Two published editions have no date.
- **Categorization:** agree which work belongs in Worlds, Exhibition, Commercials, and Editorials, and whether intentional overlap is allowed. The model can support multiple categories.
- **Unlinked entries:** decide how the three published, unlinked editions should be grouped or exposed. Preserve them during migration.
- **Lab:** final visual design and actual research/journal material remain to be supplied. The brief itself marks the design TBC.
- **Synopsis cards:** the studio will supply the final designed images. Store accompanying text so the information is accessible and searchable.
- **Branding and mobile:** confirm the final wordmark/loader assets and the proposed mobile interpretation of the fixed statement card.
- **Videos:** playback is disabled pending actual video files. Preserve the exported references and use local still images in the meantime.

## Acceptance checks

- All imported image/document references resolve; invalid or missing media fails validation with a useful record/field error.
- Only deliberately published content appears. Drafts, unused sample content, raw backups, and credential records are absent from public output.
- All 14 missing published slugs are addressed without collisions; existing valid URLs retain a working destination.
- Category chronology uses explicit work dates and a deterministic tie-breaker. Missing/conflicting dates are resolved or explicitly documented.
- The statement stays visible while desktop hero projects change; exactly four hero project IDs are configured.
- Header and main navigation work on Home, category pages, Lab, About, search, and direct project pages.
- Rihanna/brand/credit searches produce the expected work and consistent suggestions/results, including accent-insensitive names such as Hermes/Hermès.
- Synopsis cards and normal image galleries work in the animated panel and direct page. Disabled videos use local cover images and are omitted from galleries; verify playback separately when actual video assets are available.
- New routes and legacy aliases work after a production build; refresh/back navigation and 404 handling are checked.
- Browser traffic and build configuration show no Sanity API/CDN dependency after the migration. Any retained Mux traffic is documented.
- Images are responsive and loaded according to visibility; mobile layout, keyboard focus, touch browsing, and reduced-motion behavior are reviewed.

Reference for local media serving: [Next.js 14 public assets](https://nextjs.org/docs/14/app/building-your-application/optimizing/static-assets). A pure static deployment, if chosen later, has additional constraints described in [Next.js 14 static exports](https://nextjs.org/docs/14/app/building-your-application/deploying/static-exports).
