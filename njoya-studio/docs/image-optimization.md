# Image preparation

The site uses local responsive image files on GitHub Pages and Node.js. All 815 selected photograph sources (812 from the Sanity export and three supplied Jaguar photographs) are prepared directly from their originals. The supplied intro artwork remains a separate optimized brand asset.

## Quality and format choices

The former pipeline encoded WebP at quality 82, with a 2000px maximum and a 720px preview. Large carousel cards used the preview; the Node/dev image optimizer then applied another lossy encoding pass. The new carousel uses the responsive source instead, and photographs bypass runtime re-encoding on every host.

The current profile is in `scripts/media-pipeline.mjs`:

- WebP quality 88, encoder effort 6.
- AVIF quality 80, encoder effort 5, 4:4:4 chroma.
- Widths 480, 960, 1600 and the native width capped at 2560; no upscaling.
- AVIF is preferred only when its full-size file is at least 8% smaller than WebP. Otherwise the photograph uses WebP. AVIF images retain a full-size WebP fallback.

Seven representative originals were compared at identical dimensions, including detailed installations, editorial grain, portraits and the Jaguar work. Lower AVIF settings saved more bytes but softened fine texture. Quality 80 was chosen to preserve that detail; forcing every photograph into AVIF at that setting would increase several files. The raw size/timing results are in [image-optimization-benchmark.json](image-optimization-benchmark.json). Quality numbers are specific to the installed Sharp 0.33.5 encoder and are not equivalent between codecs.

Examples at the full prepared width:

| Photograph | WebP 88 | AVIF 80 | Selected |
| --- | ---: | ---: | --- |
| Hermès Brides de Galaxy | 493 KB | 603 KB | WebP |
| Lacoste | 252 KB | 217 KB | AVIF |
| Jaguar | 486 KB | 470 KB | WebP; saving below threshold |
| Vogue Hommes cover | 157 KB | 199 KB | WebP |
| Perfect / Rihanna | 216 KB | 192 KB | AVIF |

These are full-size files, not the bytes downloaded by every visitor. The browser chooses one candidate for its viewport and pixel density. Galleries load lazily, and tall image cards account for the horizontal pixels cropped by `object-fit: cover`. Hover preloads use the same sizes as the detail panel, and the animation clone uses the image's actual `currentSrc`.

The finished library has 165 AVIF selections and 650 WebP selections. All responsive variants and fallbacks occupy 569.1 MB; the complete static export is 615.7 MB, below [GitHub Pages' published-site limit](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits). The selected originals total 2.16 GB, while the preferred full-size outputs total 296.5 MB. These storage totals include the whole portfolio, rather than a single page load.

## Lab process galleries

The nineteen Brides de Galaxy sketches, making photographs and result photographs
use a lighter, source-specific `web` profile: WebP quality 80, a maximum width of
1920px, and responsive candidates at 480, 960 and 1440px where the original permits.
The original files are retained privately and are never enlarged. The source
manifest preserves this choice when regenerating media; new uploads can opt in
with `npm run media:add -- "/path/to/image.jpg" --alt "Description" --web`.

The popup supplies image sizes matching its actual width, mounts its galleries
only when opened, and uses lazy loading and asynchronous decoding. Superseded
derivatives are archived outside the public directory.

Lab galleries use two equal columns with matching 4:3 image tiles, capped at
360px high. Portraits and final unpaired images keep the same tile size. Photos
fill their tiles with a centred crop; sketches fit in full on a white background.
Phone layouts use one column with the same height cap. Responsive image sizes
account for the photo crop rather than requesting full-width gallery images.

## BALMAIN motion films

The three supplied films are already 1080×1920 H.264 at 25 fps with AAC audio.
The prepared MP4s copy both streams without re-encoding and place the MP4 index
at the start (`-c copy -map_metadata -1 -movflags +faststart`). Per-stream SHA-256
checks confirmed that all three films retain the exact original video and audio.
Their combined size is 18,879,509 bytes. A separate eight-second silent 540×960
H.264 hover preview uses CRF 20 and weighs 1,284,519 bytes. Covers and video
posters use the responsive WebP pipeline. Source-to-output mappings are recorded
in `content/balmain-video-assets.json`; incoming originals stay in the ignored
root `motion/` directory. Only the prepared files are committed and published.

Full films use native controls and do not preload their video data. The card
preview loads on desktop hover, pauses on leave, when off-screen, and when the
tab is hidden. Reduced-motion and touch users get the supplied still cover.

## CHANEL motion film

The existing Chanel Mother's Day project is shared between Commercials and
Motion. All five supplied still images matched the original SHA-1 source IDs,
so their prepared images and existing references are reused. The supplied
1280×478 HEVC MOV is converted to H.264 CRF 18 at the original resolution and
frame timing, with `-an` removing the audio track entirely and `+faststart`
placing movie metadata before the media. It is 1,842,008 bytes, compared with
5,008,874 bytes for the MOV. Range-normalized SSIM against the source is 0.996077.
The eight-second silent hover preview is 429,088 bytes. The film poster is a
prepared frame from the video. Encoding details and source mapping are in
`content/chanel-video-assets.json`. Tests inspect MP4 track handlers directly
to ensure that neither published file contains an audio track.

## MAC motion films

The three MAC Studio Fix films retain their original 1080×1080 resolution and
25 fps timing, encoded as H.264 CRF 18 with the slow preset and faststart. The
original AAC audio is copied unchanged; per-film audio hashes confirm this.
Together the films are 26,364,168 bytes, down from 127,512,262 bytes. SSIM against
the original films is recorded in `content/mac-video-assets.json`. A six-second
640×640 silent hover preview weighs 511,258 bytes. The supplied cover and three
video-frame posters use the responsive WebP pipeline. Full films load only when
played, with native controls; the preview follows the existing hover and
reduced-motion behavior. Originals remain in the ignored `motion/MAC` folder.

## Louboutin motion film

The existing Christian Louboutin Men's project is shared between Commercials
and Motion, with its original eleven photographs, cover, credits and URL kept.
The supplied 720×1280 H.264 film is already compact. Both video and AAC audio
are copied unchanged into a faststart MP4; per-stream SHA-256 checks confirm
identical encoded media. The full film is 2,727,348 bytes. A separate
six-second silent hover preview is 513,114 bytes, encoded at
480×854, 18 fps, CRF 24 and a 600 kbps maximum video rate. The native player uses
`preload="none"`, with a responsive WebP poster extracted from the film. Source
mapping and verification hashes are in `content/louboutin-video-assets.json`.

## Source limits

Some selected originals are small: the Vogue Hommes cover is 763×1077. Larger dimensions created by upscaling cannot recover missing detail. The full Sanity export also includes unused page layouts, images with printed captions, and differently cropped copies. Those are not silently substituted for the selected project photographs.

Originals are never overwritten. Old quality-82 derivatives are archived privately under `media/originals/previous-webp-82/`. Only the current responsive files and brand artwork are deployed. The generated manifest records source fingerprints, dimensions, format, widths and byte counts; filenames include the profile version to avoid stale caches when the encoding settings change.

See [README](../README.md#add-an-image) for adding or regenerating images. Format and encoder documentation: [Sharp output options](https://sharp.pixelplumbing.com/api-output/) and [MDN image formats](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types).
