# Implementation verification

Verified locally on 30 October 2026.

- GitHub Pages export passed 259 static route checks, 123 automatic-forwarding checks and 1,015 asset/link checks under `/njoya-1/`, including the social-preview image. Chrome confirmed search after refreshing its URL and forwarding from an old project URL.
- Production build passed with `NEXT_PUBLIC_SANITY_PROJECT_ID` unset. Fonts, content and prepared images are local.
- Content validation passed for 90 works, 23 collections, 1,624 prepared image files and all legacy mappings.
- All eight content, chronology, search and migration tests passed.
- The packaged standalone Node server passed 252 route/redirect checks, local image checks and Next.js image optimization.
- With `videoPlaybackEnabled: false`, the route checks confirmed that all successful pages omit video elements and external Mux media URLs. Exported references remain in the source content.
- Chrome checks covered homepage browsing, project detail panels, search suggestions/results, keyboard dismissal, direct project pages and desktop/mobile layouts. The final Chanel page uses its local cover image.
- `git diff --check` passed. The build has existing lint warnings in older unused components; no build or TypeScript errors remain.

The standalone server was tested on the local macOS Node.js 26 installation. The Docker configuration targets Node.js 22 on Linux. Docker is not installed on this machine, so the image has not been built or run here. GitHub Pages uses the static export and does not need this server or Docker image.

## Content still to supply or review

- Jaguar project and artwork: the fourth homepage slot is a Coming soon card.
- Lab research entries and final design; designed synopsis artwork and its text equivalent.
- Actual video files: playback stays disabled until the media is available.
- Proposed category assignments and dates, including Brides de Galaxy's title/date conflict and two undated editions. These are preserved in `migration-audit.json` for editorial review.

See [README](../README.md) for editing and media preparation, and [self-hosting](self-hosting.md) for Node/Docker deployment.
