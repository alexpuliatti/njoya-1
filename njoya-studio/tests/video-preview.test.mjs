import test from "node:test";
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";

import { createVideoPreview } from "../lib/video-preview.mjs";

class PreviewDocument extends EventTarget {
  listeners = new Set();
  addEventListener(type, listener, options) {
    this.listeners.add(type);
    super.addEventListener(type, listener, options);
  }
  removeEventListener(type, listener, options) {
    this.listeners.delete(type);
    super.removeEventListener(type, listener, options);
  }
}

class PreviewVideo extends EventTarget {
  ownerDocument;
  paused = true;
  muted = false;
  defaultMuted = false;
  playsInline = false;
  autoplay = false;
  preload = "metadata";
  playCalls = 0;
  loadCalls = 0;
  start;

  constructor(document = new PreviewDocument()) {
    super();
    this.ownerDocument = document;
  }
  play() {
    this.playCalls += 1;
    if (this.start) return this.start();
    this.beginPlaying();
    return Promise.resolve();
  }
  beginPlaying() {
    this.paused = false;
    this.dispatchEvent(new Event("playing"));
  }
  pause() {
    if (this.paused) return;
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  }
  load() {
    this.loadCalls += 1;
  }
}

test("a blocked mobile start recovers synchronously on the next touch gesture", async () => {
  const video = new PreviewVideo();
  let revealed = 0;
  const preview = createVideoPreview(video, { onPlaying: () => revealed++ });

  video.start = () =>
    Promise.reject(
      new DOMException("User gesture required", "NotAllowedError"),
    );
  preview.setActive(true);
  await setImmediate();
  assert.equal(
    revealed,
    0,
    "Keep the prepared cover when autoplay is rejected",
  );
  assert.equal(video.paused, true);
  video.start = undefined;
  video.ownerDocument.dispatchEvent(new Event("touchend"));
  assert.equal(
    video.playCalls,
    2,
    "Retry inside the gesture, before its activation expires",
  );
  assert.equal(revealed, 1);
  assert.equal(video.muted, true);
  assert.equal(video.defaultMuted, true);
  assert.equal(video.playsInline, true);
  assert.equal(video.autoplay, true);
  preview.dispose();
});

test("media becoming ready can recover an interrupted initial request", async () => {
  const video = new PreviewVideo();
  let revealed = 0;
  const preview = createVideoPreview(video, { onPlaying: () => revealed++ });

  video.start = () =>
    Promise.reject(new DOMException("Interrupted", "AbortError"));
  preview.setActive(true);
  await setImmediate();
  video.start = undefined;
  video.dispatchEvent(new Event("canplay"));
  assert.equal(revealed, 1);
  assert.equal(video.paused, false);
  video.dispatchEvent(new Event("loadeddata"));
  assert.equal(
    video.playCalls,
    2,
    "Readiness events must not restart a playing film",
  );
  preview.dispose();
});

test("a still-pending start does not consume the next gesture recovery", async () => {
  const video = new PreviewVideo();
  let finishInitial;
  let revealed = 0;
  const preview = createVideoPreview(video, { onPlaying: () => revealed++ });

  video.start = () => {
    video.paused = false;
    return new Promise((resolve) => {
      finishInitial = resolve;
    });
  };
  preview.setActive(true);
  assert.equal(
    revealed,
    0,
    "paused=false alone does not mean a frame is playing",
  );
  video.start = undefined;
  video.ownerDocument.dispatchEvent(new Event("pointerup"));
  assert.equal(revealed, 1);
  finishInitial();
  await setImmediate();
  assert.equal(revealed, 1, "An older promise must not reveal the video twice");
  preview.dispose();
});

test("hidden, offscreen, reduced-motion and dialog-paused previews stay inactive on gestures", () => {
  const video = new PreviewVideo();
  const preview = createVideoPreview(video);

  preview.setActive(true);
  preview.setActive(false);
  const attempts = video.playCalls;
  for (const event of [
    "touchend",
    "pointerup",
    "keydown",
    "canplay",
    "loadeddata",
  ]) {
    video.ownerDocument.dispatchEvent(new Event(event));
    video.dispatchEvent(new Event(event));
  }
  assert.equal(video.playCalls, attempts);
  assert.equal(video.paused, true);
  assert.equal(video.autoplay, false);
  preview.dispose();
});

test("swiping away and back preserves the buffered preview", () => {
  const video = new PreviewVideo();
  const preview = createVideoPreview(video);

  preview.setActive(true);
  preview.setActive(false);
  preview.setActive(true);
  assert.equal(video.paused, false);
  assert.equal(video.playCalls, 2);
  assert.equal(
    video.loadCalls,
    0,
    "Do not discard the clip's buffer between swipes",
  );
  preview.dispose();
});

test("late play completion cannot restart a hidden or disposed preview", async () => {
  for (const dispose of [false, true]) {
    const video = new PreviewVideo();
    let finish;
    let revealed = 0;
    const preview = createVideoPreview(video, { onPlaying: () => revealed++ });

    video.start = () =>
      new Promise((resolve) => {
        finish = resolve;
      });
    preview.setActive(true);
    if (dispose) preview.dispose();
    else preview.setActive(false);
    video.paused = false;
    finish();
    await setImmediate();
    assert.equal(video.paused, true);
    assert.equal(revealed, 0);
    preview.dispose();
  }
});

test("visible previews share gesture listeners and dispose them safely", () => {
  const document = new PreviewDocument();
  const first = createVideoPreview(new PreviewVideo(document));
  const second = createVideoPreview(new PreviewVideo(document));

  first.setActive(true);
  second.setActive(true);
  assert.equal(document.listeners.size, 3);
  first.dispose();
  first.dispose();
  assert.equal(document.listeners.size, 3);
  second.dispose();
  assert.equal(document.listeners.size, 0);
});

test("an obsolete request cannot pause a replacement controller on the same player", async () => {
  const video = new PreviewVideo();
  let finishInitial;

  video.start = () =>
    new Promise((resolve) => {
      finishInitial = resolve;
    });
  const previous = createVideoPreview(video);

  previous.setActive(true);
  previous.dispose();
  video.start = undefined;
  const replacement = createVideoPreview(video);

  replacement.setActive(true);
  finishInitial();
  await setImmediate();
  assert.equal(video.paused, false);
  assert.equal(video.autoplay, true);
  replacement.dispose();
});
