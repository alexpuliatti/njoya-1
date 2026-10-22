/** Exchange action/rest artwork while the character turns through profile. */
export function drawCharacterTurn(
  action: HTMLElement,
  rest: HTMLElement,
  progress: number,
) {
  const turn = Math.max(0, Math.min(1, progress));
  const blend = Math.max(0, Math.min(1, (turn - 0.4) / 0.2));

  action.style.opacity = String(1 - blend);
  rest.style.opacity = String(blend);
  action.style.transform = `perspective(8em) rotateY(${-72 * Math.min(1, turn / 0.6)}deg)`;
  rest.style.transform = `perspective(8em) rotateY(${72 * Math.min(1, (1 - turn) / 0.6)}deg)`;
}
