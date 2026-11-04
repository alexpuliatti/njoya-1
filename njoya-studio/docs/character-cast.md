# Character studies

The approved homepage cast is published from main. New studies are developed on the motion branch until reviewed.

## 01 — The builder

Stone head, green reaching arm, purple eyes. Deliberate and a little stubborn. Pulls the W into place, settles on BUILD, then turns toward the viewer into a separate upright pose with its arm lowered. The approved size is 20% larger than the first miniature. New resting asset: `public/media/motion/world-builder-rest.webp`. Preview: `/motion`.

## 02 — The explorer

Pink curved head, woven shoulder, green fringe, brown limbs. Curious and nimble. Rolls the O into WORLDS, steadies it, then steps back beside the S, turns toward the viewer and stays visible in separate standing artwork with its arms lowered. The resting position follows the end of the word on resize, with the character scaled to fit when space is tight. New resting asset: `public/media/motion/explorer-rest.webp`. Preview: `/motion/explorer`.

Asset: `public/media/motion/explorer.webp`, a transparent 768 × 615 WebP prepared from the user's pink-and-green character reference with built-in image_gen. The exact generation and cleanup prompts are saved in `docs/explorer-prompts.json`. No 3D model is used.

## 03 — The observer

Red face, blue eyelids, patterned legs and a small stone mask. Starts beside the About introduction, then follows the reader on a frame-by-frame walking route: down the right margin, left across the first divider, down the left margin, right across the second divider, down again, then across the third divider with a small jump. Both margins and the space above dividers are reserved so it stays clear of text and controls. Four distinct eight-frame sequences show actual articulated walking down, left, right, and an anticipation/takeoff/tuck/landing jump—32 movement frames in total, played at 12 fps. The jump finishes even if scrolling stops. Parked characters blink continuously with two blinks per six-second CSS loop. Reverse scrolling reverses the route and selects the matching walking direction. Hidden tabs and off-page activity stop playback; reduced motion keeps the character still beside the introduction with open eyes. Preview: `/about`. The original peeking study remains at `/motion/observer`.

Assets: `public/media/motion/observer.webp` and `observer-blink.webp`, two transparent 768 × 768 WebPs prepared with built-in image_gen from the user's red character reference. Only the closed-eye regions overlay the original character during the blink, keeping its body and textures steady. Exact prompts and eye coordinates are saved in `docs/observer-prompts.json`.

Movement assets: `observer-walk-down.webp`, `observer-walk-left.webp`, `observer-walk-right.webp`, and `observer-jump.webp` in `public/media/motion/`. Each transparent strip has eight 128 × 192 frames with a shared foot anchor at (64, 184). Exact generation/cleanup prompts, cell alignment and source paths are saved in `docs/observer-animation-prompts.json`; all 32 prepared frames can be reviewed in `docs/observer-frame-preview.webp`. No 3D rig, added runtime dependency, or video is required.

## Homepage cast

The homepage card shares one semantic headline between the builder and explorer. Once the artwork is ready and the existing intro clears, they start together: the builder pulls the W and turns into its new standing pose on BUILD; the explorer rolls the O into the same WORLDS line, returns beside S and turns into its own new resting pose. Both remain visible. Their separate cutouts and exact generation prompts are documented in `docs/character-rest-prompts.json`. The observer now walks the About page through separate animation frames and blinks while parked; it no longer peeks around the homepage card. The homepage scene plays once, leaves the card link available, pauses in a hidden tab, and presents a readable still headline for reduced motion or artwork errors. The three original studies remain available; further exploration continues on the motion branch.

The cast should feel like it inhabits the typography and edges of the work. Each moment has a short action and a clear finish; larger appearances belong in the Lab, with occasional smaller appearances elsewhere.
