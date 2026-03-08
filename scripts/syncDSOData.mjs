import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const outputDir = path.join(repoRoot, 'ainos-backend', 'src', 'main', 'resources', 'data');
const cacheDir = path.join(repoRoot, '.cache', 'dso');

// OpenNGC CSV from GitHub - correct path is in database_files folder
const OPENNGC_URL = 'https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/NGC.csv';

// Messier catalog mapping (Messier number -> NGC/IC designation)
const MESSIER_TO_NGC = {
  1: 'NGC1952', 2: 'NGC7089', 3: 'NGC5272', 4: 'NGC6121', 5: 'NGC5904',
  6: 'NGC6405', 7: 'NGC6475', 8: 'NGC6523', 9: 'NGC6333', 10: 'NGC6254',
  11: 'NGC6705', 12: 'NGC6218', 13: 'NGC6205', 14: 'NGC6402', 15: 'NGC7078',
  16: 'NGC6611', 17: 'NGC6618', 18: 'NGC6613', 19: 'NGC6273', 20: 'NGC6514',
  21: 'NGC6531', 22: 'NGC6656', 23: 'NGC6494', 24: 'NGC6603', 25: 'IC4725',
  26: 'NGC6694', 27: 'NGC6853', 28: 'NGC6626', 29: 'NGC6913', 30: 'NGC7099',
  31: 'NGC224', 32: 'NGC221', 33: 'NGC598', 34: 'NGC1039', 35: 'NGC2168',
  36: 'NGC1960', 37: 'NGC2099', 38: 'NGC1912', 39: 'NGC7092', 41: 'NGC2287',
  42: 'NGC1976', 43: 'NGC1982', 44: 'NGC2632', 45: null, // Pleiades - no NGC
  46: 'NGC2437', 47: 'NGC2422', 48: 'NGC2548', 49: 'NGC4472', 50: 'NGC2323',
  51: 'NGC5194', 52: 'NGC7654', 53: 'NGC5024', 54: 'NGC6715', 55: 'NGC6809',
  56: 'NGC6779', 57: 'NGC6720', 58: 'NGC4579', 59: 'NGC4621', 60: 'NGC4649',
  61: 'NGC4303', 62: 'NGC6266', 63: 'NGC5055', 64: 'NGC4826', 65: 'NGC3623',
  66: 'NGC3627', 67: 'NGC2682', 68: 'NGC4590', 69: 'NGC6637', 70: 'NGC6681',
  71: 'NGC6838', 72: 'NGC6981', 73: 'NGC6994', 74: 'NGC628', 75: 'NGC6864',
  76: 'NGC650', 77: 'NGC1068', 78: 'NGC2068', 79: 'NGC1904', 80: 'NGC6093',
  81: 'NGC3031', 82: 'NGC3034', 83: 'NGC5236', 84: 'NGC4374', 85: 'NGC4382',
  86: 'NGC4406', 87: 'NGC4486', 88: 'NGC4501', 89: 'NGC4552', 90: 'NGC4569',
  91: 'NGC4548', 92: 'NGC6341', 93: 'NGC2447', 94: 'NGC4736', 95: 'NGC3351',
  96: 'NGC3368', 97: 'NGC3587', 98: 'NGC4192', 99: 'NGC4254', 100: 'NGC4321',
  101: 'NGC5457', 102: 'NGC5866', 103: 'NGC581', 104: 'NGC4594', 105: 'NGC3379',
  106: 'NGC4258', 107: 'NGC6171', 108: 'NGC3556', 109: 'NGC3992', 110: 'NGC205'
};

// DSO type mapping
const TYPE_MAP = {
  '*': 'star',
  '**': 'double_star',
  '*Ass': 'stellar_association',
  'OCl': 'open_cluster',
  'GCl': 'globular_cluster',
  'Cl+N': 'cluster_nebula',
  'G': 'galaxy',
  'GPair': 'galaxy_pair',
  'GTrpl': 'galaxy_triplet',
  'GGroup': 'galaxy_group',
  'PN': 'planetary_nebula',
  'HII': 'hii_region',
  'DrkN': 'dark_nebula',
  'EmN': 'emission_nebula',
  'Neb': 'nebula',
  'RfN': 'reflection_nebula',
  'SNR': 'supernova_remnant',
  'Nova': 'nova',
  'NonEx': 'nonexistent',
  'Dup': 'duplicate',
  'Other': 'other'
};

function parseRA(raStr) {
  if (!raStr) return null;
  const parts = raStr.split(':');
  if (parts.length !== 3) return null;
  const h = parseFloat(parts[0]);
  const m = parseFloat(parts[1]);
  const s = parseFloat(parts[2]);
  // Convert to degrees
  return (h + m / 60 + s / 3600) * 15;
}

function parseDec(decStr) {
  if (!decStr) return null;
  const sign = decStr.startsWith('-') ? -1 : 1;
  const clean = decStr.replace(/^[+-]/, '');
  const parts = clean.split(':');
  if (parts.length !== 3) return null;
  const d = parseFloat(parts[0]);
  const m = parseFloat(parts[1]);
  const s = parseFloat(parts[2]);
  return sign * (d + m / 60 + s / 3600);
}

function parseSize(sizeStr) {
  if (!sizeStr) return null;
  // Size is in arcminutes
  return parseFloat(sizeStr) || null;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function download(url, destination) {
  console.log(`Downloading ${url}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  const text = await response.text();
  await fs.writeFile(destination, text, 'utf8');
  return text;
}

async function ensureFile(url, destination) {
  try {
    await fs.access(destination);
    return await fs.readFile(destination, 'utf8');
  } catch {
    return await download(url, destination);
  }
}

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(';').map(h => h.trim());
  
  const objects = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(';');
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx]?.trim() || null;
    });
    
    objects.push(row);
  }
  
  return objects;
}

function buildNGCToMessier() {
  const map = new Map();
  for (const [messier, ngc] of Object.entries(MESSIER_TO_NGC)) {
    if (ngc) {
      map.set(ngc, parseInt(messier));
    }
  }
  return map;
}

async function main() {
  await ensureDir(cacheDir);
  await ensureDir(outputDir);

  // Download OpenNGC database
  const csvText = await ensureFile(OPENNGC_URL, path.join(cacheDir, 'NGC.csv'));
  const rawObjects = parseCSV(csvText);
  
  const ngcToMessier = buildNGCToMessier();
  
  const dsoObjects = [];
  
  for (const obj of rawObjects) {
    const name = obj.Name;
    if (!name) continue;
    
    const ra = parseRA(obj.RA);
    const dec = parseDec(obj.Dec);
    
    if (ra === null || dec === null) continue;
    
    const mag = obj['V-Mag'] ? parseFloat(obj['V-Mag']) : 
                obj['B-Mag'] ? parseFloat(obj['B-Mag']) : null;
    
    const type = TYPE_MAP[obj.Type] || 'unknown';
    
    // Skip nonexistent and duplicate entries
    if (type === 'nonexistent' || type === 'duplicate') continue;
    
    const messier = ngcToMessier.get(name);
    
    const majorAxis = parseSize(obj.MajAx);
    const minorAxis = parseSize(obj.MinAx);
    
    const dso = {
      id: name.toLowerCase().replace(/\s+/g, ''),
      name: name,
      messier: messier || null,
      displayName: messier ? `M${messier}` : name,
      type: type,
      ra: Number(ra.toFixed(6)),
      dec: Number(dec.toFixed(6)),
      mag: mag !== null && !isNaN(mag) ? Number(mag.toFixed(2)) : null,
      majorAxis: majorAxis,
      minorAxis: minorAxis,
      constellation: obj.Const || null,
      commonName: obj['Common names'] || null,
      surfaceBrightness: obj.SurfBr ? parseFloat(obj.SurfBr) : null,
      hubbleType: obj.Hubble || null,
    };
    
    dsoObjects.push(dso);
  }
  
  // Add Pleiades (M45) manually since it has no NGC designation
  dsoObjects.push({
    id: 'm45',
    name: 'Melotte 22',
    messier: 45,
    displayName: 'M45',
    type: 'open_cluster',
    ra: 56.75,
    dec: 24.1167,
    mag: 1.6,
    majorAxis: 110,
    minorAxis: 110,
    constellation: 'Tau',
    commonName: 'Pleiades, Seven Sisters',
    surfaceBrightness: null,
    hubbleType: null,
  });
  
  // Add M40 (double star, no NGC)
  dsoObjects.push({
    id: 'm40',
    name: 'Winnecke 4',
    messier: 40,
    displayName: 'M40',
    type: 'double_star',
    ra: 185.55,
    dec: 58.0833,
    mag: 8.4,
    majorAxis: null,
    minorAxis: null,
    constellation: 'UMa',
    commonName: 'Winnecke 4',
    surfaceBrightness: null,
    hubbleType: null,
  });
  
  // Sort by magnitude (brightest first), then by Messier number
  dsoObjects.sort((a, b) => {
    // Messier objects first
    if (a.messier && !b.messier) return -1;
    if (!a.messier && b.messier) return 1;
    if (a.messier && b.messier) return a.messier - b.messier;
    
    // Then by magnitude
    if (a.mag === null && b.mag === null) return 0;
    if (a.mag === null) return 1;
    if (b.mag === null) return -1;
    return a.mag - b.mag;
  });
  
  await fs.writeFile(
    path.join(outputDir, 'dso.json'),
    JSON.stringify(dsoObjects, null, 0) + '\n'
  );
  
  // Generate Messier-only catalog for quick access
  const messierObjects = dsoObjects.filter(obj => obj.messier !== null);
  await fs.writeFile(
    path.join(outputDir, 'messier.json'),
    JSON.stringify(messierObjects, null, 0) + '\n'
  );
  
  console.log(`Generated ${dsoObjects.length} DSO objects (${messierObjects.length} Messier objects).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
