# Motion film galleries

Film-only galleries show up to three columns on desktop and one column below 768px. A single film stays centered. Mixed image/film galleries retain their ordered vertical layout. Posters size each film without cropping.

In Motion category popups, a local film can provide an optional `previewVideoSrc` alongside its full `src`, prepared `poster`, and `alt`. This field must reference a separate short, silent H.264 faststart MP4 under `/media/videos/`. The content validator checks that the clip exists. Preparation records are in `content/motion-gallery-preview-assets.json`.

Motion previews start automatically as soon as their film is visible, on desktop and touch devices. Moving the pointer away does not stop playback. Previews pause when offscreen or when the tab is hidden, then resume when visible again. Popup films retain their buffered frame rather than reloading the clip. Reduced-motion visitors see the poster and use the play button. The play button switches to the full film with native controls and its approved audio; films without a preview keep native controls. Direct project pages keep native full-film controls and the complete gallery.

Project cards use the Work record's top-level `previewVideoSrc`. In the Motion section, visible cards start their silent previews immediately without requiring hover, and pause while a project popup is open. Other sections retain hover previews. The still cover remains visible until playback starts. Previews pause when offscreen or when the tab is hidden, and respect reduced motion.

Motion clips preload metadata and use native autoplay alongside explicit playback. If a browser interrupts or rejects a start, the shared preview controller retries when media becomes ready or during the next genuine touch, pointer or keyboard gesture. iOS Low Power Mode can still require interaction; a website cannot guarantee gesture-free autoplay under that policy. Phones loop the original project cards; only wider layouts add duplicate cards for the three-column carousel. This preserves mobile player identity and any playback permission already granted to it.
