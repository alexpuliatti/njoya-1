# Character studies

The approved homepage cast is published from main. New studies are developed on the motion branch until reviewed.

## 01 — The builder

Stone head, green reaching arm, purple eyes. Deliberate and a little stubborn. Pulls the W into place, then stands on BUILD. The approved size is 20% larger than the first miniature. Preview: `/motion`.

## 02 — The explorer

Pink curved head, woven shoulder, green fringe, brown limbs. Curious and nimble. First movement: rolls the O into WORLDS, steadies it, then steps back beside the S and stays visible. The resting position follows the end of the word on resize, with the character scaled to fit when space is tight. Preview: `/motion/explorer`.

Asset: `public/media/motion/explorer.webp`, a transparent 768 × 615 WebP prepared from the user's pink-and-green character reference with built-in image_gen. The exact generation and cleanup prompts are saved in `docs/explorer-prompts.json`. No 3D model is used.

## 03 — The observer

Red face, blue eyelids, patterned legs and a small stone mask. A quiet companion beside the About introduction: stays in place and gently blinks every few seconds. On phones it sits beside the heading, leaving the biography full width. Reduced motion keeps the character visible with open eyes. Preview: `/about`. The original peeking study remains at `/motion/observer`, with its working link to the Brides de Galaxy Lab page.

Assets: `public/media/motion/observer.webp` and `observer-blink.webp`, two transparent 768 × 768 WebPs prepared with built-in image_gen from the user's red character reference. Only the closed-eye regions overlay the original character during the blink, keeping its body and textures steady. Exact prompts and eye coordinates are saved in `docs/observer-prompts.json`.

## Homepage cast

The homepage card shares one semantic headline between the builder and explorer. Once the artwork is ready and the existing intro clears, they start together: the builder pulls the W, then stands more upright on BUILD; the explorer rolls the O into the same WORLDS line, then stays beside the S. The observer now lives on About and no longer peeks around the homepage card. The homepage scene plays once, leaves the card link available, pauses in a hidden tab, and presents a readable still headline for reduced motion or artwork errors. The About observer remains visible with a repeating eyelid-only blink that pauses in a hidden tab. The three original studies remain available; further exploration continues on the motion branch.

The cast should feel like it inhabits the typography and edges of the work. Each moment has a short action and a clear finish; larger appearances belong in the Lab, with occasional smaller appearances elsewhere.
