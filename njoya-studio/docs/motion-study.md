# Character motion study

The reusable homepage animation is accompanied by a standalone `/motion` study. Further character experiments are developed on the `motion` branch.

## Preview

Run `npm run dev` from `njoya-studio`, then open `http://localhost:3000/motion`. The study has play/pause, replay, a timeline scrubber and playback speed. The homepage uses the same headline animation once, after the existing intro finishes.

## First proof

The first character grips a rope, braces, pulls the W in two movements and releases it. After settling at the end of BUILD, it turns toward the viewer into separate, upright artwork with its green arm lowered and hands released. The right sole remains anchored to BUILD throughout the turn. The original pulling artwork is no longer stretched into a resting pose. It is 20% larger than the first study; its soles track the actual tops of the BUILD letters across layouts. The other letters stay readable. Three clipped layers share the original transparent 768 × 650 WebP; a second cutout supplies the new turned pose. GSAP drives the character, letter, rope and turn on one reversible timeline. No 3D model, new runtime dependency or video is required.

The home card keeps its mobile two-line heading. Reduced motion and image failure show the complete, still headline. Browser visibility pauses the timeline. All decorative pieces are hidden from assistive technology.

## Artwork and prompts

Tool: built-in image_gen (not the API/CLI). Identity reference: `public/media/brand/njoya-intro.webp`. This is an AI-prepared pulling pose based on the original artwork, not a recovered 3D rendering. Runtime asset: `public/media/motion/world-builder.webp`. Original source artwork is unchanged.

Generation prompt:

> Create one transparent miniature of the supplied Njoya character, preserving its elongated grey stone head, long textured green arm and human green fingers, turquoise loops, purple torso with glossy eyes, yellow accent, red orange side, lime green hip, lavender legs and orange human feet. Preserve rich sculptural textured materials while making the silhouette readable small. Full-body, three-quarter view facing left, braced pulling stance; long green arm reaches left, gripping empty space at about 55% of character height. Torso leans right, knees bent, feet planted and separated. No rope, letter, prop, pedestal, cast shadow, glow, text or background. Full silhouette with transparent padding.

Final cleanup prompt:

> Use case: background-extraction. Edit target: this supplied full-body surreal stone-head green-arm purple-eye character. Keep the character identity, materials, colours, pose, proportions and entire silhouette exactly as shown. Change ONLY the unwanted hazy background: REMOVE EVERY patch of grey/white mist and coloured glow behind and between the head, arm, torso, and legs. Every pixel outside actual solid character surfaces must be fully alpha transparent, including the large triangular opening inside the long green arm, the area around the head, all gaps between limbs. Hard clean antialiased cutout edges. No light bloom, no coloured spill, no fog, no backdrop, no ground shadow, no typography. Preserve exactly one character in the same braced pulling pose, fully visible.

## Next art pass

The current motion branch adds dedicated resting artwork for both the builder and explorer. Their action images remain unchanged. Each character turns through profile with a short artwork blend, then stays in its new pose. The explorer completes its return beside S before turning; the narrower new silhouette is positioned using its visible bounds. Both action and resting images load before playback. Exact built-in image_gen prompts and canvas preparation are saved in `docs/character-rest-prompts.json`.
