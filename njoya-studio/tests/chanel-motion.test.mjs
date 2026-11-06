import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const project = JSON.parse(readFileSync(new URL("../content/work/chanel.json", import.meta.url)));

test("Chanel shares its existing project and images between Commercials and Motion", () => {
  assert.equal(project.id, "279b6b0b-7048-43c3-aede-14829ddbc6ab");
  assert.deepEqual(project.categories, ["commercials", "motion"]);
  assert.equal(project.gallery.filter((entry) => entry.type === "image").length, 5);
  assert.ok(project.legacyUrls.includes("/shoots/chanel/editions/chanel"));
  assert.equal(project.gallery[0].type, "video");
  assert.ok(project.gallery[0].src.startsWith("/media/videos/chanel-film-"));
});

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

test("the published Chanel film and preview contain video tracks only", () => {
  for (const src of [project.gallery[0].src, project.previewVideoSrc]) {
    const buffer = readFileSync(new URL(`../public${src}`, import.meta.url));
    const top = boxes(buffer);
    const moov = top.find((box) => box.type === "moov");
    assert.ok(moov, "MP4 has its movie metadata");
    assert.ok(moov.start < top.find((box) => box.type === "mdat").start, "Movie metadata precedes media for fast startup");
    const handlers = boxes(buffer, moov.start, moov.end)
      .filter((box) => box.type === "trak")
      .map((track) => {
        const media = boxes(buffer, track.start, track.end).find((box) => box.type === "mdia");
        const handler = boxes(buffer, media.start, media.end).find((box) => box.type === "hdlr");
        return buffer.toString("ascii", handler.start + 8, handler.start + 12);
      });
    assert.deepEqual(handlers, ["vide"], `${src} must have no audio track`);
  }
});
