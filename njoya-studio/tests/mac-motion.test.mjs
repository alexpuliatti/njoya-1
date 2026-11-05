import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const project = JSON.parse(readFileSync(new URL("../content/work/mac.json", import.meta.url)));

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

function trackHandlers(src) {
  const buffer = readFileSync(new URL(`../public${src}`, import.meta.url));
  const top = boxes(buffer);
  const moov = top.find((box) => box.type === "moov");
  assert.ok(moov, "MP4 has movie metadata");
  assert.ok(moov.start < top.find((box) => box.type === "mdat").start, "Faststart metadata precedes media");
  return boxes(buffer, moov.start, moov.end)
    .filter((box) => box.type === "trak")
    .map((track) => {
      const media = boxes(buffer, track.start, track.end).find((box) => box.type === "mdia");
      const handler = boxes(buffer, media.start, media.end).find((box) => box.type === "hdlr");
      return buffer.toString("ascii", handler.start + 8, handler.start + 12);
    });
}

test("MAC publishes all three supplied films in Motion with its cover and credits", () => {
  assert.equal(project.slug, "mac");
  assert.deepEqual(project.categories, ["motion"]);
  assert.equal(project.gallery.length, 3);
  for (const film of project.gallery) {
    assert.equal(film.type, "video");
    assert.equal(film.poster.width, 1080);
    assert.equal(film.poster.height, 1080);
    assert.ok(film.poster.src.endsWith(".webp"));
  }
  assert.ok(project.cover.src.endsWith(".webp"));
  assert.equal(project.credits.find((credit) => credit.role === "setDesigner").name, "Ibby Njoya");
  assert.equal(project.credits.find((credit) => credit.customRole === "Director").name, "Tyler Kohlkoff");
  assert.ok(project.credits.find((credit) => credit.role === "njoyaTeam").name.includes("Aisha Ahamed"));
});

test("MAC full films retain sound while the lightweight hover preview has no audio", () => {
  for (const film of project.gallery) {
    assert.deepEqual(trackHandlers(film.src), ["vide", "soun"]);
  }
  assert.deepEqual(trackHandlers(project.previewVideoSrc), ["vide"]);
});
