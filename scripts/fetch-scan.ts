// Downloads the scanned source PDF of a reference text and writes each page as a grayscale PNG
// to research/scans/<docId>/p<n>.png, for the side-by-side review page (SPEC A22, ADR-08).
// The scans are only for local checking: they are never committed or shipped (SPEC §8).
//
// Usage: node scripts/fetch-scan.ts <docId>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { crc32, deflateSync } from 'node:zlib';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';

const ROOT = join(import.meta.dirname, '..');
const ALLOWED_HOSTS = ['cdn.tbmm.gov.tr'];

interface Meta {
  url: string;
  pdfPages: string;
}

interface DecodedImage {
  width: number;
  height: number;
  kind: number; // 1 = 1 bit gray, 2 = RGB, 3 = RGBA (pdf.js ImageKind)
  data: Uint8Array | Uint8ClampedArray;
}

function pageRange(spec: string): number[] {
  const [from, to = from] = spec.split('-').map(Number) as [number, number?];
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

function toGray({ width, height, kind, data }: DecodedImage): Buffer {
  const out = Buffer.alloc(width * height);
  if (kind === 1) {
    const stride = Math.ceil(width / 8);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        out[y * width + x] = (data[y * stride + (x >> 3)]! >> (7 - (x & 7))) & 1 ? 255 : 0;
  } else {
    const channels = kind === 2 ? 3 : 4;
    for (let i = 0; i < width * height; i++) out[i] = data[i * channels]!;
  }
  return out;
}

function encodePng(width: number, height: number, gray: Buffer): Buffer {
  const raw = Buffer.alloc((width + 1) * height);
  for (let y = 0; y < height; y++) gray.copy(raw, y * (width + 1) + 1, y * width, (y + 1) * width);
  const chunk = (type: string, body: Buffer) => {
    const head = Buffer.alloc(4);
    head.writeUInt32BE(body.length);
    const typed = Buffer.concat([Buffer.from(type, 'ascii'), body]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typed) >>> 0);
    return Buffer.concat([head, typed, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 0; // grayscale
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const docId = process.argv[2];
if (!docId || !/^[\w-]+$/.test(docId)) {
  console.error('Kullanım: node scripts/fetch-scan.ts <docId>');
  process.exit(1);
}
const meta = JSON.parse(
  readFileSync(join(ROOT, 'data', 'reference', `${docId}.meta.json`), 'utf8'),
) as Meta;
if (!ALLOWED_HOSTS.includes(new URL(meta.url).host)) {
  console.error(`İzin verilmeyen kaynak: ${meta.url}`);
  process.exit(1);
}

const response = await fetch(meta.url);
if (!response.ok) throw new Error(`${meta.url}: HTTP ${response.status}`);
const pdf = await getDocument({
  data: new Uint8Array(await response.arrayBuffer()),
  verbosity: 0,
  isOffscreenCanvasSupported: false,
  // JBIG2-compressed scans need pdf.js's wasm decoder.
  wasmUrl: new URL('../node_modules/pdfjs-dist/wasm/', import.meta.url).href,
}).promise;

const outDir = join(ROOT, 'research', 'scans', docId);
mkdirSync(outDir, { recursive: true });
for (const n of pageRange(meta.pdfPages)) {
  const page = await pdf.getPage(n);
  const ops = await page.getOperatorList();
  const index = ops.fnArray.indexOf(OPS.paintImageXObject);
  if (index < 0) throw new Error(`PDF s.${n}: taranmış görüntü yok`);
  const name = (ops.argsArray[index] as [string])[0];
  const image = await new Promise<DecodedImage | null>((resolve) => page.objs.get(name, resolve));
  if (!image) throw new Error(`PDF s.${n}: görüntü çözülemedi`);
  writeFileSync(join(outDir, `p${n}.png`), encodePng(image.width, image.height, toGray(image)));
  console.log(`p${n}.png  ${image.width}×${image.height}`);
}
console.log(`Yazıldı: research/scans/${docId}/`);
