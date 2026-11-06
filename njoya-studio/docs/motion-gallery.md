# Motion film galleries

Film-only galleries show up to three columns on desktop and one column below 768px. A single film stays centered. Mixed image/film galleries retain their ordered vertical layout. Posters size each film without cropping.

In Motion category popups, a local film can provide an optional `previewVideoSrc` alongside its full `src`, prepared `poster`, and `alt`. This field must reference a separate short, silent H.264 faststart MP4 under `/media/videos/`. The content validator checks that the clip exists. Preparation records are in `content/motion-gallery-preview-assets.json`.

Mouse hover plays the silent clip. Leaving restores the poster. The play button switches to the full film with native controls and its approved audio. Touch and reduced-motion visitors use the play button; films without a preview keep native controls. Direct project pages keep native full-film controls and the complete gallery.

Project cards continue to use the Work record's top-level `previewVideoSrc`. Their still cover remains visible until playback starts, and previews stop on leave, when offscreen, or when the tab is hidden.
