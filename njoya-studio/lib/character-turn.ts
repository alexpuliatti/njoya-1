/** Select an actual turn pose from a twelve-frame horizontal sprite strip. */
export function drawCharacterTurnFrames(
  action: HTMLElement,
  sequence: HTMLElement,
  strip: HTMLElement,
  progress: number,
) {
  const turn = Math.max(0, Math.min(1, progress));
  const frame = Math.min(11, Math.floor(turn * 12));

  // Ease the original rig into the first drawn pose over one frame only.
  const handoff = Math.min(1, turn * 12);

  action.style.opacity = String(1 - handoff);
  sequence.style.opacity = String(handoff);
  action.style.removeProperty("transform");
  sequence.style.removeProperty("transform");
  strip.style.transform = `translate3d(${(-frame * 100) / 12}%, 0, 0)`;
}
