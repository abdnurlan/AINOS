import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const outputDir = path.join(repoRoot, 'ainos-backend', 'src', 'main', 'resources', 'data');
const cacheDir = path.join(repoRoot, '.cache', 'stellarium');

const STAR_BASE_URL =
  'https://raw.githubusercontent.com/Stellarium/stellarium/master/stars/hip_gaia3';
const MODERN_SKY_URL =
  'https://raw.githubusercontent.com/Stellarium/stellarium/master/skycultures/modern/index.json';

const starFiles = [
  'defaultStarsConfig.json',
  'stars_0_0v0_20.cat',
  'stars_1_0v0_16.cat',
  'stars_2_0v0_17.cat',
  'stars_3_0v0_10.cat',
];

function bvToSpectral(bv) {
  if (!Number.isFinite(bv)) return '';
  if (bv < -0.2) return 'O';
  if (bv < 0.0) return 'B';
  if (bv < 0.3) return 'A';
  if (bv < 0.58) return 'F';
  if (bv < 0.81) return 'G';
  if (bv < 1.4) return 'K';
  return 'M';
}

function readHip24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function download(url, destination) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(destination, Buffer.from(arrayBuffer));
}

async function ensureFile(url, destination) {
  try {
    await fs.access(destination);
  } catch {
    await download(url, destination);
  }
}

function buildConstellationOutputs(modernSky) {
  const constellationMembership = new Map();

  const constellations = modernSky.constellations.map((entry) => {
    const abbr = entry.id.split(' ').at(-1);
    const name =
      entry.common_name?.native ||
      entry.common_name?.english ||
      abbr;

    const lines = [];
    for (const polyline of entry.lines ?? []) {
      for (let index = 1; index < polyline.length; index += 1) {
        const from = polyline[index - 1];
        const to = polyline[index];
        if (!Number.isInteger(from) || !Number.isInteger(to)) continue;
        lines.push({ from, to });

        if (!constellationMembership.has(from)) constellationMembership.set(from, abbr);
        if (!constellationMembership.has(to)) constellationMembership.set(to, abbr);
      }
    }

    return { name, abbr, lines };
  });

  return { constellations, constellationMembership };
}

function buildNameMap(modernSky) {
  const names = new Map();

  for (const [key, values] of Object.entries(modernSky.common_names ?? {})) {
    const match = key.match(/^HIP\s+(\d+)$/);
    if (!match) continue;

    const hip = Number(match[1]);
    const preferred = values.find((value) => value.native) ?? values[0];
    const name = preferred?.native || preferred?.english;
    if (name) names.set(hip, name);
  }

  return names;
}

function parseStarCatalog(buffer, namesByHip, constellationMembership) {
  const level = buffer.readUInt32LE(16);
  const zoneCount = 20 * 4 ** level + 1;
  const zonesOffset = 28;
  const dataOffset = zonesOffset + zoneCount * 4;

  const stars = [];

  for (let offset = dataOffset; offset + 48 <= buffer.length; offset += 48) {
    const x = buffer.readInt32LE(offset + 8) / 2_000_000_000;
    const y = buffer.readInt32LE(offset + 12) / 2_000_000_000;
    const z = buffer.readInt32LE(offset + 16) / 2_000_000_000;
    const magnitude = buffer.readInt16LE(offset + 34) / 1000;
    const bMinusV = buffer.readInt16LE(offset + 32) / 1000;
    const hip = readHip24LE(buffer, offset + 45);

    const length = Math.sqrt(x * x + y * y + z * z) || 1;
    let ra = (Math.atan2(y, x) * 180) / Math.PI;
    if (ra < 0) ra += 360;
    const dec = (Math.asin(z / length) * 180) / Math.PI;

    stars.push({
      hip,
      name: namesByHip.get(hip) ?? null,
      ra: Number(ra.toFixed(6)),
      dec: Number(dec.toFixed(6)),
      mag: Number(magnitude.toFixed(3)),
      spectral: bvToSpectral(bMinusV),
      constellation: constellationMembership.get(hip) ?? null,
      bayer: null,
    });
  }

  return stars;
}

async function main() {
  await ensureDir(cacheDir);
  await ensureDir(outputDir);

  for (const fileName of starFiles) {
    await ensureFile(`${STAR_BASE_URL}/${fileName}`, path.join(cacheDir, fileName));
  }
  await ensureFile(MODERN_SKY_URL, path.join(cacheDir, 'modern.index.json'));

  const modernSky = JSON.parse(
    await fs.readFile(path.join(cacheDir, 'modern.index.json'), 'utf8')
  );
  const namesByHip = buildNameMap(modernSky);
  const { constellations, constellationMembership } = buildConstellationOutputs(modernSky);

  const stars = [];
  for (const fileName of starFiles.filter((name) => name.endsWith('.cat'))) {
    const buffer = await fs.readFile(path.join(cacheDir, fileName));
    const parsedStars = parseStarCatalog(buffer, namesByHip, constellationMembership);
    for (const star of parsedStars) {
      stars.push(star);
    }
  }

  await fs.writeFile(
    path.join(outputDir, 'stars.json'),
    `${JSON.stringify(stars)}\n`
  );
  await fs.writeFile(
    path.join(outputDir, 'constellations.json'),
    `${JSON.stringify(constellations)}\n`
  );

  console.log(`Generated ${stars.length} Stellarium stars and ${constellations.length} constellations.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
