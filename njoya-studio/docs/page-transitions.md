# Character page transitions

Click a section link to see its character perform a short drawn action, then blur away as the destination appears. A light background blur separates the character from the page. Work and Home use the builder, Lab uses the explorer, and About uses the observer's walk/jump strips.

- Drawn action: 300 ms for turns; 320 ms for the observer.
- Character blur: begins at 260 ms, reaching 8 px and zero opacity at 440 ms.
- Navigation: begins at 320 ms, during the character dissolve.
- Scene cleanup: about 560 ms total, including on slower routes.
- Background: one temporary viewport layer, with a fixed 3 px blur (2 px on mobile). Only its opacity animates, fading in over 90 ms and out over 160 ms. It adds no downloads or dependencies, is removed with the scene, and is omitted for reduced motion or browsers without backdrop-filter support. Moving content behind the layer can still require the browser to refresh its blur; this is not a cached screenshot.

`components/page-transition-scene.module.css` controls the artwork timing, size and blur. `components/page-transition-scene.tsx` signals navigation at 320 ms; the provider starts the final fade 40 ms later. Keep these values coordinated when tuning.

`TransitionLink` retains Next Link navigation. Modified clicks, keyboard activation, downloads, external URLs, same-page fragments/query changes, and links inside native dialogs keep their normal behavior. Reduced motion and unavailable sprite artwork skip the effect. Browser history cancels an in-progress scene.

Run locally from `njoya-studio`:

```sh
npm run dev -- --hostname 127.0.0.1 --port 3011
```

Publish using the repository's GitHub Pages workflow; see `docs/github-pages.md`.
