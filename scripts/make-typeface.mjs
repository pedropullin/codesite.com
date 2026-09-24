// Converts a .woff font into the "typeface" JSON format that three.js
// FontLoader / drei <Text3D> expect (same algorithm as facetype.js).
// Only the glyphs the 3D scene actually uses are kept, to stay small.
//
//   node scripts/make-typeface.mjs
import fs from "node:fs";
import path from "node:path";
import opentype from "opentype.js";

const CHARS =
  " {}[]()<>/\\;:=+-*_$#@!?&|~.,'\"0123456789" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const JOBS = [
  {
    src: "node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-700-normal.woff",
    out: "public/fonts/plex-mono-bold.typeface.json",
  },
];

function convert(font) {
  const scale = (1000 * 100) / ((font.unitsPerEm || 2048) * 72);
  const round = (n) => Math.round(n * scale);
  const glyphs = {};

  for (const ch of new Set(CHARS)) {
    const glyph = font.charToGlyph(ch);
    if (!glyph || glyph.unicode === undefined) continue;
    let o = "";
    for (const c of glyph.path.commands) {
      const type = c.type === "C" ? "b" : c.type.toLowerCase();
      o += type + " ";
      if (c.x !== undefined && c.y !== undefined) o += `${round(c.x)} ${round(c.y)} `;
      if (c.x1 !== undefined && c.y1 !== undefined) o += `${round(c.x1)} ${round(c.y1)} `;
      if (c.x2 !== undefined && c.y2 !== undefined) o += `${round(c.x2)} ${round(c.y2)} `;
    }
    glyphs[ch] = {
      ha: round(glyph.advanceWidth),
      x_min: round(glyph.xMin ?? 0),
      x_max: round(glyph.xMax ?? 0),
      o: o.trim(),
    };
  }

  return {
    glyphs,
    familyName: font.names.fontFamily?.en ?? "font",
    ascender: round(font.ascender),
    descender: round(font.descender),
    underlinePosition: round(font.tables.post.underlinePosition),
    underlineThickness: round(font.tables.post.underlineThickness),
    boundingBox: {
      xMin: round(font.tables.head.xMin),
      yMin: round(font.tables.head.yMin),
      xMax: round(font.tables.head.xMax),
      yMax: round(font.tables.head.yMax),
    },
    resolution: 1000,
    original_font_information: { format: 0, fontFamily: font.names.fontFamily?.en },
  };
}

for (const job of JOBS) {
  const buf = fs.readFileSync(job.src);
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  const json = convert(font);
  fs.mkdirSync(path.dirname(job.out), { recursive: true });
  fs.writeFileSync(job.out, JSON.stringify(json));
  console.log(`${job.out}: ${Object.keys(json.glyphs).length} glyphs`);
}
