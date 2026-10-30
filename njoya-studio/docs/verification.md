# Implementation verification

Verified locally on 30 October 2026.

- GitHub Pages export passed 260 static route checks, 123 automatic-forwarding checks and 2,950 asset/link checks under `/njoya-1/`, including all responsive `srcset` candidates, the social-preview image and supplied intro artwork. Earlier Chrome checks confirmed search after refreshing its URL and forwarding from an old project URL.
- Production build passed with `NEXT_PUBLIC_SANITY_PROJECT_ID` unset. Fonts, content and prepared images are local.
- Content validation passed for 91 works, 23 collections, 2,872 prepared image files and all legacy mappings.
- All nine content, chronology, search, migration and image-pipeline tests passed. The image test exercises an EXIF-rotated upload, native-size limits and the WebP fallback.
- All 815 selected originals were rebuilt directly from source with the new quality profile: 165 prefer AVIF and 650 prefer WebP. Every one of the 2,872 generated files was checked against its manifest dimensions, byte count and codec, without failures. An immediate cached regeneration reused the outputs successfully.
- The responsive variants and fallbacks total 569.1 MB, derived from 2.16 GB of selected originals. The preferred full-size variants total 296.5 MB. Original backup files remain unchanged, and obsolete derivatives are retained outside the deployment.
- Chrome confirmed responsive AVIF/WebP delivery on desktop and mobile, the 480px mobile candidate, Retina card sizing, portrait/gallery rendering, and the animated detail panel. The static Pages preview used correctly prefixed responsive candidates and had no browser errors. Photographs no longer pass through the runtime image optimizer. See [image optimization notes](image-optimization.md) for the measured codec comparison and source limitations.
- The initial packaged standalone Node server passed 252 route/redirect checks, local image checks and Next.js image optimization before the Jaguar addition.
- With `videoPlaybackEnabled: false`, the route checks confirmed that all successful pages omit video elements and external Mux media URLs. Exported references remain in the source content.
- Chrome checks covered homepage browsing, project detail panels, search suggestions/results, keyboard dismissal, direct project pages and desktop/mobile layouts. The final Chanel page uses its local cover image.
- The bottom navigation appears only on Home. Inner pages use compact desktop header links or a mobile Menu; Chrome checks confirmed the active section, menu navigation and Escape dismissal.
- Work uses larger 3:4 category cards instead of stretching them to the full page height. Chrome checks at 1280×720, 1024×600 and 2560×540 confirmed that all four cards and their labels fit without page scrolling; the row also caps its width on short screens. Mobile keeps horizontal browsing with the same proportions, checked at 390×844.
- Jaguar uses the supplied three photographs and credits. Its date remains month-precise (`2024-12`) and displays as December 2024.
- The supplied logo artwork replaces the old Lottie intro. The visible Skip Intro button has been removed. Chrome confirmed that the intro contains no skip button, completes its screen-lift reveal automatically and restores scrolling; earlier checks covered desktop/mobile rendering and return-visit bypass without a flash. Escape still dismisses the intro, and JavaScript and CSS both bypass it for reduced-motion preferences.
- The Pages build now runs in an isolated temporary source copy, keeping its generated files separate from the running dev server.
- `git diff --check` passed. The build has existing lint warnings in older unused components; no build or TypeScript errors remain.

The standalone server was tested on the local macOS Node.js 26 installation. The Docker configuration targets Node.js 22 on Linux. Docker is not installed on this machine, so the image has not been built or run here. GitHub Pages uses the static export and does not need this server or Docker image.

## Content still to supply or review

- Lab research entries and final design; designed synopsis artwork and its text equivalent.
- Actual video files: playback stays disabled until the media is available.
- Proposed category assignments and dates, including Brides de Galaxy's title/date conflict and two undated editions. These are preserved in `migration-audit.json` for editorial review.

See [README](../README.md) for editing and media preparation, and [self-hosting](self-hosting.md) for Node/Docker deployment.
