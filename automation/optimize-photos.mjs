/**
 * Photo optimizer.
 *
 *   npm run optimize
 *
 * Takes whatever is in photos/ straight off a phone — often 4000px and several
 * megabytes — and turns it into something a phone on mobile data can actually
 * load. For every photo it writes:
 *
 *   photos/NAME.jpg          max 1600px, quality 80   (the lightbox / full view)
 *   photos/thumbs/NAME.jpg   max 500px,  quality 72   (the grid tiles)
 *
 * The grid loads thumbs, so a gallery page costs a few hundred KB instead of
 * fifteen megabytes.
 *
 * Originals are copied to photos/_inbox/_filed/ (which git ignores) before
 * anything is overwritten, so nothing is ever lost.
 *
 * EXIF rotation is baked into the pixels rather than left as a tag, so photos
 * cannot show up sideways in a viewer that ignores EXIF. Other metadata —
 * including GPS coordinates — is stripped, which is worth having on a public
 * site full of pictures of where someone lives.
 *
 * Safe to re-run: already-optimized files are detected and skipped.
 */

import sharp from "sharp";
import { readdir, mkdir, copyFile, stat, access, writeFile } from "fs/promises";
import { constants } from "fs";
import path from "path";
import { fileURLToPath } from "url";

sharp.cache(false);   // don't keep source files open between operations

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PHOTOS = path.join(ROOT, "photos");
const THUMBS = path.join(PHOTOS, "thumbs");
const ORIGINALS = path.join(PHOTOS, "_inbox", "_filed");

const FULL = { width: 1600, quality: 80 };
const THUMB = { width: 500, quality: 72 };
const PORTRAIT = { width: 900, quality: 82 };   // hero portrait, displayed small

const KB = (bytes) => (bytes / 1024).toFixed(0) + " KB";
const MB = (bytes) => (bytes / 1048576).toFixed(1) + " MB";

async function exists(p) {
  try { await access(p, constants.F_OK); return true; } catch { return false; }
}

async function main() {
  await mkdir(THUMBS, { recursive: true });
  await mkdir(ORIGINALS, { recursive: true });

  const entries = (await readdir(PHOTOS, { withFileTypes: true }))
    .filter((e) => e.isFile() && /\.(jpe?g|png)$/i.test(e.name))
    .map((e) => e.name)
    .sort();

  if (!entries.length) {
    console.log("No photos found in photos/ — nothing to do.");
    return;
  }

  let before = 0, after = 0, done = 0, skipped = 0;

  for (const name of entries) {
    const src = path.join(PHOTOS, name);
    const base = name.replace(/\.(jpe?g|png)$/i, "");
    const outName = base + ".jpg";
    const out = path.join(PHOTOS, outName);
    const thumb = path.join(THUMBS, outName);

    const meta = await sharp(src).metadata();
    const size = (await stat(src)).size;

    // sharp reports pre-rotation dimensions, so account for the EXIF tag
    const sideways = meta.orientation && meta.orientation >= 5;
    const w = sideways ? meta.height : meta.width;
    const h = sideways ? meta.width : meta.height;

    const isPortraitFile = /^preston\./i.test(name);
    const target = isPortraitFile ? PORTRAIT : FULL;

    // Already small enough and the thumb exists? Leave it alone.
    if (Math.max(w, h) <= target.width && await exists(thumb) && size < 900 * 1024) {
      console.log(`  skip  ${name}  (already ${w}x${h}, ${KB(size)})`);
      skipped++;
      continue;
    }

    // Keep the untouched original before overwriting
    const backup = path.join(ORIGINALS, name);
    if (!(await exists(backup))) await copyFile(src, backup);

    const pipeline = () => sharp(src)
      .rotate()                       // bake EXIF orientation into the pixels
      .withMetadata({ orientation: undefined });

    const fullBuf = await pipeline()
      .resize({ width: target.width, height: target.width, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: target.quality, mozjpeg: true, progressive: true })
      .toBuffer();

    const thumbBuf = await pipeline()
      .resize({ width: THUMB.width, height: THUMB.width, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: THUMB.quality, mozjpeg: true, progressive: true })
      .toBuffer();

    // Write the buffers directly. sharp keeps a handle on the source file, so
    // .toFile() onto that same path fails on Windows — and this skips a
    // pointless second encode anyway.
    await writeFile(out, fullBuf);
    await writeFile(thumb, thumbBuf);

    before += size;
    after += fullBuf.length + thumbBuf.length;
    done++;

    console.log(
      `  ok    ${name.padEnd(20)} ${String(w) + "x" + String(h)} ${MB(size).padStart(8)}` +
      `  ->  ${KB(fullBuf.length).padStart(7)} full + ${KB(thumbBuf.length).padStart(6)} thumb`
    );
  }

  console.log("");
  if (done) {
    console.log(`Optimized ${done} photo${done === 1 ? "" : "s"}${skipped ? `, skipped ${skipped}` : ""}.`);
    console.log(`Total: ${MB(before)} -> ${MB(after)}  (${(100 - (after / before) * 100).toFixed(0)}% smaller)`);
    console.log(`Originals kept in photos/_inbox/_filed/`);
  } else {
    console.log(`Nothing to do — all ${skipped} photo${skipped === 1 ? " is" : "s are"} already optimized.`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
