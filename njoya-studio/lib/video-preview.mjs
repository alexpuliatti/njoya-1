const gestureGroups = new WeakMap();
const previewOwners = new WeakMap();

// One set of gesture listeners per document, shared by visible previews.
function recoverOnGesture(document, retry) {
  let group = gestureGroups.get(document);

  if (!group) {
    const callbacks = new Set();
    const recover = () => callbacks.forEach((callback) => callback());

    group = { callbacks, recover };
    gestureGroups.set(document, group);
    for (const event of ["touchend", "pointerup", "keydown"]) {
      document.addEventListener(event, recover, {
        capture: true,
        passive: true,
      });
    }
  }
  group.callbacks.add(retry);

  return () => {
    group.callbacks.delete(retry);
    if (group.callbacks.size) return;
    for (const event of ["touchend", "pointerup", "keydown"]) {
      document.removeEventListener(event, group.recover, true);
    }
    gestureGroups.delete(document);
  };
}

/**
 * Own silent preview playback, including Safari's interrupted/blocked starts.
 * The caller supplies visibility, reduced-motion and dialog state via setActive.
 * @param {HTMLVideoElement} video
 * @param {{onPlaying?: () => void, onStop?: () => void}} callbacks
 */
export function createVideoPreview(video, { onPlaying, onStop } = {}) {
  const owner = {};

  previewOwners.set(video, owner);
  let active = false;
  let disposed = false;
  let pending = false;
  let playing = false;
  let request = 0;
  let removeGestureRecovery;

  const reveal = () => {
    if (disposed || !active) {
      video.pause();

      return;
    }
    if (video.paused || playing) return;
    pending = false;
    playing = true;
    onPlaying?.();
  };
  const play = (retry = false) => {
    if (disposed || !active || (playing && !video.paused)) return;
    if (pending && !retry) return;
    const attempt = ++request;

    pending = true;
    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    // Give Safari a native autoplay hint as well as the explicit play request.
    video.autoplay = true;
    video.preload = "auto";
    video
      .play()
      .then(() => {
        if (disposed || !active) {
          if (previewOwners.get(video) === owner) video.pause();

          return;
        }
        if (attempt !== request) return;
        pending = false;
        reveal();
      })
      .catch(() => {
        if (attempt === request) pending = false;
        // Keep the prepared cover. Readiness events and a genuine next gesture
        // retry; a timer cannot grant iOS user activation or defeat Low Power Mode.
      });
  };
  const retry = () => play(true);
  const paused = () => {
    if (!active || disposed) return;
    request += 1;
    pending = false;
    playing = false;
    onStop?.();
  };

  video.addEventListener("playing", reveal);
  video.addEventListener("pause", paused);
  video.addEventListener("loadeddata", retry);
  video.addEventListener("canplay", retry);

  return {
    setActive(value) {
      if (disposed) return;
      if (value === active) return;
      active = value;
      if (active) {
        removeGestureRecovery = recoverOnGesture(video.ownerDocument, retry);
        play();
      } else {
        request += 1;
        pending = false;
        playing = false;
        removeGestureRecovery?.();
        removeGestureRecovery = undefined;
        video.autoplay = false;
        video.pause();
        onStop?.();
        // Preserve the buffered clip across carousel swipes; load() discards it.
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      active = false;
      request += 1;
      removeGestureRecovery?.();
      removeGestureRecovery = undefined;
      video.removeEventListener("playing", reveal);
      video.removeEventListener("pause", paused);
      video.removeEventListener("loadeddata", retry);
      video.removeEventListener("canplay", retry);
      video.autoplay = false;
      video.pause();
    },
  };
}
