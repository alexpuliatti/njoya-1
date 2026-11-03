# Gradient Components

`GradientLine` and `GradientDivider` are TypeScript adaptations of [Alex Puliatti's Gradient Components](https://github.com/alexpuliatti/gradient-components), pinned to commit [`4ba7a65`](https://github.com/alexpuliatti/gradient-components/commit/4ba7a657985e898f3a96767ebdcea5a9ce488d83). The upstream README identifies the project as MIT licensed; the license notice is retained in `LICENSE`.

The adaptation retains the upstream divider composition, horizontal/vertical gradient line geometry, taper masks, scroll progress, and spring-driven scaling. Only the static and scroll modes needed here are included. The site's existing Framer Motion dependency is used; no packages were added.

About page dividers use a copper, orange, amber and brown palette over a quiet static track. Each fills from left to right as it travels from 95% to 45% of the viewport height. Page progress also completes the lines over the final 10% of the document, so the last divider can fill on tall screens. A restrained, non-bouncing spring smooths scrolling. Only `transform` changes during the animation; no layout properties, gradient positions or filters animate.

Reduced-motion visitors receive fully drawn static gradients without scroll subscriptions or springs. The dividers are decorative and hidden from assistive technology. Without JavaScript, the underlying static tracks preserve the page's section boundaries.
