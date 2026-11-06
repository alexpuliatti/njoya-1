# Observer Lab actions

Character actions for the gradient dividers inside Lab project dialogs.

- First Lab project divider: 24 newly drawn character-only building poses, with separately controlled bricks. The scene begins empty and places exactly three matching bricks in fixed positions. The 7.75-second action finishes with a two-second proud pose, then leaves the completed wall standing. Reopening the project starts a new build. The bricks are never generated as part of changing character frames.
- Second divider: 16 newly drawn dance poses, including side steps, heel taps, shoulder sways and a clap. Playback is 8 fps in a two-second loop.
- Third divider: the published wrapping walk.

The sheets were generated with built-in `image_gen`, using `public/media/motion/observer.webp` as the identity reference. Exact prompts are in `generation.json`. Original generated PNGs are retained under `source/`; no default image-generation path is needed to rebuild the sprites.

Run `node scripts/prepare-character-actions.mjs` to slice and pack the source grids. One common scale per action preserves the drawn crouches and sways. Feet are aligned to y=184 in each 192-pixel-high frame. Alpha is preserved; the script does not invent or distort character poses. Two unused dance-frame gutters are cropped to remove neighboring-cell fragments. `packing.json` records bounds, scale, placements and final sizes.

The brick prop reuses a single 39 × 19 texture crop from the original generated art (`left:183, top:207`). Runtime uses that same texture for every brick, with authored positions and placement timing, so brick counts cannot vary between character frames.

Prepared website sprites:

- `public/media/motion/observer-build.webp`: 24 horizontal 192 × 192 character-only cells.
- `public/media/motion/observer-dance.webp`: 16 horizontal 128 × 192 cells, about 141 KiB.
- `public/media/motion/observer-brick.webp`: one shared brick texture.

The `observer-*-frames.webp` files in this folder are static contact sheets for reviewing all poses. Only the small prepared strips are served as website artwork.

The runtime pauses offscreen and in hidden tabs, shows a still for reduced motion, and leaves the divider intact if a sprite fails to load. The build uses one shared clock for its poses and props and stops scheduling when complete; the dance uses CSS frame stepping. Neither needs per-frame React updates or a new animation dependency. `tests/character-actions.test.mjs` guards the empty starting state, progressive counts, fixed placed positions, handoffs and persistent finished wall.
