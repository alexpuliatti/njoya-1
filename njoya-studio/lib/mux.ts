/** Public Mux playback helpers. Content and image assets are local; films remain on Mux. */

export const muxThumbnail = (
  playbackId: string,
  opts?: { width?: number; height?: number; time?: number },
) => {
  const params = new URLSearchParams();

  if (opts?.width) params.set("width", String(opts.width));
  if (opts?.height) params.set("height", String(opts.height));
  if (opts?.time !== undefined) params.set("time", String(opts.time));
  params.set("fit_mode", "smartcrop");

  return `https://image.mux.com/${playbackId}/thumbnail.jpg?${params.toString()}`;
};

export const muxPlaybackUrl = (playbackId: string) =>
  `https://stream.mux.com/${playbackId}.m3u8`;
