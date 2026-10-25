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

## Source limits

Some selected originals are small: the Vogue Hommes cover is 763×1077. Larger dimensions created by upscaling cannot recover missing detail. The full Sanity export also includes unused page layouts, images with printed captions, and differently cropped copies. Those are not silently substituted for the selected project photographs.

Originals are never overwritten. Old quality-82 derivatives are archived privately under `media/originals/previous-webp-82/`. Only the current responsive files and brand artwork are deployed. The generated manifest records source fingerprints, dimensions, format, widths and byte counts; filenames include the profile version to avoid stale caches when the encoding settings change.

See [README](../README.md#add-an-image) for adding or regenerating images. Format and encoder documentation: [Sharp output options](https://sharp.pixelplumbing.com/api-output/) and [MDN image formats](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types).
