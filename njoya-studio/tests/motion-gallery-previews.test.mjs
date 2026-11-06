import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

import { localVideoSchema } from "../lib/content/schema.mjs";

const works = readdirSync(new URL("../content/work/", import.meta.url))
  .filter((name) => name.endsWith(".json"))
  .map((name) => JSON.parse(readFileSync(new URL(`../content/work/${name}`, import.meta.url))))
  .filter((work) => work.categories.includes("motion"));
const films = works.flatMap((work) => work.gallery.filter((entry) => entry.type === "video" && "src" in entry && entry.previewVideoSrc));

function boxes(buffer, start = 0, end = buffer.length) {
  const result = [];
  for (let offset = start; offset < end;) {
    let size = buffer.readUInt32BE(offset);
    let header = 8;
    if (size === 1) {
      size = Number(buffer.readBigUInt64BE(offset + 8));
      header = 16;
    } else if (size === 0) size = end - offset;
    assert.ok(size >= header && offset + size <= end, "Valid MP4 box size");
    result.push({ type: buffer.toString("ascii", offset + 4, offset + 8), start: offset + header, end: offset + size });
    offset += size;
  }
  return result;
}

test("Motion gallery films use separate local hover clips and retain full-film sources", () => {
  assert.ok(films.length > 0);
  for (const film of films) {
    assert.ok(film.previewVideoSrc, `Missing hover clip for ${film.src}`);
    assert.notEqual(film.previewVideoSrc, film.src);
    assert.ok(localVideoSchema.safeParse(film).success);
    assert.ok(!localVideoSchema.safeParse({ ...film, previewVideoSrc: "https://example.com/private.mp4" }).success);
    assert.ok(!localVideoSchema.safeParse({ ...film, previewVideoSrc: "/media/videos/../private.mp4" }).success);
  }
});

test("gallery hover clips are short, lightweight, silent faststart MP4s", () => {
  for (const src of new Set(films.map((film) => film.previewVideoSrc))) {
    const buffer = readFileSync(new URL(`../public${src}`, import.meta.url));
    assert.ok(buffer.length < 2 * 1024 * 1024, `Hover clip is too large: ${src}`);
    const top = boxes(buffer);
    const moov = top.find((box) => box.type === "moov");
    assert.ok(moov.start < top.find((box) => box.type === "mdat").start, `Faststart required: ${src}`);
    const movie = boxes(buffer, moov.start, moov.end);
    const handlers = movie.filter((box) => box.type === "trak").map((track) => {
      const media = boxes(buffer, track.start, track.end).find((box) => box.type === "mdia");
      const handler = boxes(buffer, media.start, media.end).find((box) => box.type === "hdlr");
      return buffer.toString("ascii", handler.start + 8, handler.start + 12);
    });
    assert.deepEqual(handlers, ["vide"], `Hover clip must have no audio track: ${src}`);
    const header = movie.find((box) => box.type === "mvhd");
    const version = buffer[header.start];
    const timescale = buffer.readUInt32BE(header.start + (version === 1 ? 20 : 12));
    const duration = version === 1
      ? Number(buffer.readBigUInt64BE(header.start + 24))
      : buffer.readUInt32BE(header.start + 16);
    assert.ok(duration / timescale > 0 && duration / timescale <= 8.1, `Hover clip must be at most eight seconds: ${src}`);
  }
});
