import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { prepareImage, WEB_PROFILE_ID } from "../scripts/media-pipeline.mjs";

// Exercise the upload pipeline with a real EXIF-rotated source. This catches
// upscaling, lost orientation and profiles that disagree with encoded bytes.
test("responsive uploads preserve orientation, avoid upscaling, and provide a valid WebP fallback", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "njoya-media-test-"));
  try {
    const source = path.join(root, "rotated.jpg");
    await sharp({
      create: { width: 1000, height: 600, channels: 3, background: "#ad5937" },
    })
      .jpeg({ quality: 95 })
      .withMetadata({ orientation: 6 })
      .toFile(source);
    const media = await prepareImage({
      id: "orientation-test",
      entry: { localSource: "rotated.jpg" },
      root,
      temporary: root,
    });
    assert.equal(media.width, 600);
    assert.equal(media.height, 1000);
    assert.deepEqual(
      media.variants.map((variant) => variant.width),
      [480, 600],
    );
    for (const variant of [...media.variants, media.fallback]) {
      const file = path.join(root, "public", variant.src);
      const metadata = await sharp(file).metadata();
      assert.equal(metadata.width, variant.width);
      assert.equal(metadata.height, Math.round((variant.width * 1000) / 600));
      assert.equal((await fs.stat(file)).size, variant.bytes);
      assert.ok(metadata.width <= media.width);
    }
    assert.equal(
      (await sharp(path.join(root, "public", media.fallback.src)).metadata())
        .format,
      "webp",
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("web gallery uploads cap large originals and retain responsive WebP candidates", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "njoya-gallery-test-"));
  try {
    await sharp({
      create: { width: 2400, height: 1600, channels: 3, background: "#c85091" },
    })
      .png()
      .toFile(path.join(root, "gallery.png"));
    const media = await prepareImage({
      id: "gallery-test",
      entry: { localSource: "gallery.png", profile: "web" },
      root,
      temporary: root,
    });
    assert.equal(media.format, "webp");
    assert.equal(media.width, 2400);
    assert.equal(media.height, 1600);
    assert.deepEqual(
      media.variants.map((variant) => variant.width),
      [480, 960, 1440, 1920],
    );
    assert.ok(media.signature.startsWith(`${WEB_PROFILE_ID}:`));
    for (const variant of media.variants) {
      const file = path.join(root, "public", variant.src);
      const metadata = await sharp(file).metadata();
      assert.equal(metadata.format, "webp");
      assert.equal(metadata.width, variant.width);
      assert.equal(metadata.height, Math.round((variant.width * 2) / 3));
      assert.equal((await fs.stat(file)).size, variant.bytes);
    }
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
