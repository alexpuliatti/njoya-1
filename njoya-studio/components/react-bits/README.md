# React Bits components

`tilted-card.tsx` adapts the TypeScript Tilted Card source by David Haz for this website:

- [Component documentation](https://reactbits.dev/components/tilted-card)
- [Upstream TypeScript source](https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/Components/TiltedCard/TiltedCard.tsx)
- [Upstream CSS](https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/Components/TiltedCard/TiltedCard.css)
- [Original license](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md), retained in `LICENSE.md`.

The adaptation retains the upstream spring integrator, normalized pointer coordinates, tilt transform and shadow structure. It accepts the studio's existing project trigger and responsive picture as children. Rotation is limited to four degrees, hover scale to 1.015, and the four featured homepage cards enter with a 65ms stagger after the intro. The flip, tooltip, ambient animation and gyroscope features are omitted. Touch scrolling stays native. Motion stops for keyboard focus and reduced-motion preferences; animation frames stop when the springs settle or the card leaves view. The adapted CSS is in `styles/studio-components.css`.
