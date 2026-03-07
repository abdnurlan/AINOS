// Star catalog data generator for AINOS
// This generates a compact JSON of bright stars for the sky renderer.
// In production, this would pull from the full Bright Star Catalogue (BSC5).
// For now we include ~300 named/notable stars plus generate random field stars.

const fs = require('fs');

// Notable bright stars - name, RA (deg), Dec (deg), magnitude, spectral, constellation, bayer
const namedStars = [
  // Brightest stars
  { hip: 32349, name: "Sirius", ra: 101.287, dec: -16.716, mag: -1.46, spectral: "A1", constellation: "CMa", bayer: "α CMa" },
  { hip: 30438, name: "Canopus", ra: 95.988, dec: -52.696, mag: -0.74, spectral: "F0", constellation: "Car", bayer: "α Car" },
  { hip: 69673, name: "Arcturus", ra: 213.915, dec: 19.182, mag: -0.05, spectral: "K1", constellation: "Boo", bayer: "α Boo" },
  { hip: 71683, name: "Alpha Centauri", ra: 219.902, dec: -60.834, mag: -0.01, spectral: "G2", constellation: "Cen", bayer: "α Cen" },
  { hip: 91262, name: "Vega", ra: 279.235, dec: 38.784, mag: 0.03, spectral: "A0", constellation: "Lyr", bayer: "α Lyr" },
  { hip: 24436, name: "Capella", ra: 79.172, dec: 45.998, mag: 0.08, spectral: "G5", constellation: "Aur", bayer: "α Aur" },
  { hip: 24608, name: "Rigel", ra: 78.634, dec: -8.202, mag: 0.13, spectral: "B8", constellation: "Ori", bayer: "β Ori" },
  { hip: 37279, name: "Procyon", ra: 114.825, dec: 5.225, mag: 0.34, spectral: "F5", constellation: "CMi", bayer: "α CMi" },
  { hip: 27989, name: "Betelgeuse", ra: 88.793, dec: 7.407, mag: 0.42, spectral: "M1", constellation: "Ori", bayer: "α Ori" },
  { hip: 7588,  name: "Achernar", ra: 24.429, dec: -57.237, mag: 0.46, spectral: "B3", constellation: "Eri", bayer: "α Eri" },
  { hip: 68702, name: "Hadar", ra: 210.956, dec: -60.373, mag: 0.61, spectral: "B1", constellation: "Cen", bayer: "β Cen" },
  { hip: 97649, name: "Altair", ra: 297.696, dec: 8.868, mag: 0.76, spectral: "A7", constellation: "Aql", bayer: "α Aql" },
  { hip: 60718, name: "Acrux", ra: 186.650, dec: -63.099, mag: 0.76, spectral: "B0", constellation: "Cru", bayer: "α Cru" },
  { hip: 21421, name: "Aldebaran", ra: 68.980, dec: 16.509, mag: 0.85, spectral: "K5", constellation: "Tau", bayer: "α Tau" },
  { hip: 65474, name: "Spica", ra: 201.298, dec: -11.161, mag: 0.97, spectral: "B1", constellation: "Vir", bayer: "α Vir" },
  { hip: 80763, name: "Antares", ra: 247.352, dec: -26.432, mag: 1.04, spectral: "M1", constellation: "Sco", bayer: "α Sco" },
  { hip: 37826, name: "Pollux", ra: 116.329, dec: 28.026, mag: 1.14, spectral: "K0", constellation: "Gem", bayer: "β Gem" },
  { hip: 113368, name: "Fomalhaut", ra: 344.413, dec: -29.622, mag: 1.16, spectral: "A3", constellation: "PsA", bayer: "α PsA" },
  { hip: 49669, name: "Mimosa", ra: 191.930, dec: -59.689, mag: 1.25, spectral: "B0", constellation: "Cru", bayer: "β Cru" },
  { hip: 102098, name: "Deneb", ra: 310.358, dec: 45.280, mag: 1.25, spectral: "A2", constellation: "Cyg", bayer: "α Cyg" },
  { hip: 62434, name: "Regulus", ra: 152.093, dec: 11.967, mag: 1.35, spectral: "B7", constellation: "Leo", bayer: "α Leo" },
  { hip: 11767, name: "Polaris", ra: 37.954, dec: 89.264, mag: 1.98, spectral: "F7", constellation: "UMi", bayer: "α UMi" },

  // Orion
  { hip: 26311, name: "Bellatrix", ra: 81.283, dec: 6.350, mag: 1.64, spectral: "B2", constellation: "Ori", bayer: "γ Ori" },
  { hip: 26727, name: "Mintaka", ra: 83.002, dec: -0.299, mag: 2.23, spectral: "O9", constellation: "Ori", bayer: "δ Ori" },
  { hip: 26311, name: "Alnilam", ra: 84.053, dec: -1.202, mag: 1.70, spectral: "B0", constellation: "Ori", bayer: "ε Ori" },
  { hip: 25336, name: "Alnitak", ra: 85.190, dec: -1.943, mag: 1.77, spectral: "O9", constellation: "Ori", bayer: "ζ Ori" },
  { hip: 29426, name: "Saiph", ra: 86.939, dec: -9.670, mag: 2.09, spectral: "B0", constellation: "Ori", bayer: "κ Ori" },

  // Ursa Major (Big Dipper)
  { hip: 54061, name: "Dubhe", ra: 165.932, dec: 61.751, mag: 1.79, spectral: "K0", constellation: "UMa", bayer: "α UMa" },
  { hip: 53910, name: "Merak", ra: 165.460, dec: 56.383, mag: 2.37, spectral: "A1", constellation: "UMa", bayer: "β UMa" },
  { hip: 58001, name: "Phecda", ra: 178.458, dec: 53.695, mag: 2.44, spectral: "A0", constellation: "UMa", bayer: "γ UMa" },
  { hip: 59774, name: "Megrez", ra: 183.856, dec: 57.033, mag: 3.31, spectral: "A3", constellation: "UMa", bayer: "δ UMa" },
  { hip: 62956, name: "Alioth", ra: 193.507, dec: 55.960, mag: 1.77, spectral: "A0", constellation: "UMa", bayer: "ε UMa" },
  { hip: 65378, name: "Mizar", ra: 200.981, dec: 54.925, mag: 2.27, spectral: "A1", constellation: "UMa", bayer: "ζ UMa" },
  { hip: 67301, name: "Alkaid", ra: 206.885, dec: 49.313, mag: 1.86, spectral: "B3", constellation: "UMa", bayer: "η UMa" },

  // Cassiopeia
  { hip: 3179, name: "Schedar", ra: 10.127, dec: 56.537, mag: 2.24, spectral: "K0", constellation: "Cas", bayer: "α Cas" },
  { hip: 746, name: "Caph", ra: 2.295, dec: 59.150, mag: 2.27, spectral: "F2", constellation: "Cas", bayer: "β Cas" },
  { hip: 4427, name: "Tsih", ra: 14.177, dec: 60.717, mag: 2.47, spectral: "B0", constellation: "Cas", bayer: "γ Cas" },
  { hip: 6686, name: "Ruchbah", ra: 21.454, dec: 60.235, mag: 2.68, spectral: "A5", constellation: "Cas", bayer: "δ Cas" },
  { hip: 8886, name: "Segin", ra: 28.599, dec: 63.670, mag: 3.37, spectral: "B3", constellation: "Cas", bayer: "ε Cas" },

  // Scorpius
  { hip: 78820, name: "Dschubba", ra: 240.083, dec: -22.622, mag: 2.32, spectral: "B0", constellation: "Sco", bayer: "δ Sco" },
  { hip: 82396, name: "Sargas", ra: 252.968, dec: -42.998, mag: 1.87, spectral: "F0", constellation: "Sco", bayer: "θ Sco" },
  { hip: 86228, name: "Shaula", ra: 263.402, dec: -37.104, mag: 1.63, spectral: "B1", constellation: "Sco", bayer: "λ Sco" },

  // Leo
  { hip: 57632, name: "Denebola", ra: 177.265, dec: 14.572, mag: 2.13, spectral: "A3", constellation: "Leo", bayer: "β Leo" },
  { hip: 54872, name: "Algieba", ra: 146.462, dec: 19.842, mag: 2.28, spectral: "K0", constellation: "Leo", bayer: "γ Leo" },

  // Gemini
  { hip: 36850, name: "Castor", ra: 113.650, dec: 31.888, mag: 1.58, spectral: "A1", constellation: "Gem", bayer: "α Gem" },
  { hip: 35550, name: "Alhena", ra: 99.428, dec: 16.399, mag: 1.93, spectral: "A0", constellation: "Gem", bayer: "γ Gem" },

  // Lyra
  { hip: 91926, name: "Sheliak", ra: 282.520, dec: 33.363, mag: 3.52, spectral: "A8", constellation: "Lyr", bayer: "β Lyr" },
  { hip: 92420, name: "Sulafat", ra: 284.736, dec: 32.690, mag: 3.24, spectral: "B9", constellation: "Lyr", bayer: "γ Lyr" },

  // Cygnus
  { hip: 95947, name: "Sadr", ra: 305.557, dec: 40.257, mag: 2.20, spectral: "F8", constellation: "Cyg", bayer: "γ Cyg" },
  { hip: 100453, name: "Gienah", ra: 311.552, dec: 33.970, mag: 2.46, spectral: "K0", constellation: "Cyg", bayer: "ε Cyg" },
  { hip: 102488, name: "Albireo", ra: 292.680, dec: 27.960, mag: 3.08, spectral: "K3", constellation: "Cyg", bayer: "β Cyg" },

  // Taurus
  { hip: 25428, name: "Elnath", ra: 81.573, dec: 28.608, mag: 1.65, spectral: "B7", constellation: "Tau", bayer: "β Tau" },
  { hip: 20889, name: "Alcyone", ra: 56.871, dec: 24.105, mag: 2.87, spectral: "B7", constellation: "Tau", bayer: "η Tau" },

  // Canis Major
  { hip: 33579, name: "Adhara", ra: 104.656, dec: -28.972, mag: 1.50, spectral: "B2", constellation: "CMa", bayer: "ε CMa" },
  { hip: 34444, name: "Wezen", ra: 107.098, dec: -26.393, mag: 1.84, spectral: "F8", constellation: "CMa", bayer: "δ CMa" },
  { hip: 31592, name: "Mirzam", ra: 95.675, dec: -17.956, mag: 1.98, spectral: "B1", constellation: "CMa", bayer: "β CMa" },

  // Aquila
  { hip: 99473, name: "Tarazed", ra: 296.565, dec: 10.614, mag: 2.72, spectral: "K3", constellation: "Aql", bayer: "γ Aql" },

  // Pegasus
  { hip: 113963, name: "Markab", ra: 346.190, dec: 15.205, mag: 2.49, spectral: "B9", constellation: "Peg", bayer: "α Peg" },
  { hip: 113881, name: "Scheat", ra: 345.944, dec: 28.083, mag: 2.42, spectral: "M2", constellation: "Peg", bayer: "β Peg" },
  { hip: 112029, name: "Algenib", ra: 3.309, dec: 15.184, mag: 2.83, spectral: "B2", constellation: "Peg", bayer: "γ Peg" },

  // Andromeda
  { hip: 677, name: "Alpheratz", ra: 2.097, dec: 29.091, mag: 2.06, spectral: "B8", constellation: "And", bayer: "α And" },
  { hip: 5447, name: "Mirach", ra: 17.433, dec: 35.621, mag: 2.05, spectral: "M0", constellation: "And", bayer: "β And" },
  { hip: 9640, name: "Almach", ra: 30.975, dec: 42.330, mag: 2.26, spectral: "K3", constellation: "And", bayer: "γ And" },

  // Perseus
  { hip: 15863, name: "Mirfak", ra: 51.081, dec: 49.861, mag: 1.80, spectral: "F5", constellation: "Per", bayer: "α Per" },
  { hip: 14576, name: "Algol", ra: 47.042, dec: 40.957, mag: 2.12, spectral: "B8", constellation: "Per", bayer: "β Per" },

  // Sagittarius
  { hip: 90185, name: "Kaus Australis", ra: 276.043, dec: -34.385, mag: 1.85, spectral: "B9", constellation: "Sgr", bayer: "ε Sgr" },
  { hip: 89931, name: "Nunki", ra: 283.816, dec: -26.297, mag: 2.02, spectral: "B2", constellation: "Sgr", bayer: "σ Sgr" },

  // Virgo
  { hip: 63608, name: "Vindemiatrix", ra: 195.544, dec: 10.959, mag: 2.83, spectral: "G8", constellation: "Vir", bayer: "ε Vir" },

  // Libra
  { hip: 72622, name: "Zubenelgenubi", ra: 222.720, dec: -16.042, mag: 2.75, spectral: "A3", constellation: "Lib", bayer: "α Lib" },
  { hip: 74785, name: "Zubeneschamali", ra: 229.252, dec: -9.383, mag: 2.61, spectral: "B8", constellation: "Lib", bayer: "β Lib" },

  // Aries
  { hip: 9884, name: "Hamal", ra: 31.793, dec: 23.462, mag: 2.00, spectral: "K2", constellation: "Ari", bayer: "α Ari" },
  { hip: 8903, name: "Sheratan", ra: 28.660, dec: 20.808, mag: 2.64, spectral: "A5", constellation: "Ari", bayer: "β Ari" },

  // Corona Borealis
  { hip: 76267, name: "Alphecca", ra: 233.672, dec: 26.715, mag: 2.23, spectral: "A0", constellation: "CrB", bayer: "α CrB" },

  // Bootes
  { hip: 72105, name: "Izar", ra: 221.247, dec: 27.074, mag: 2.37, spectral: "K0", constellation: "Boo", bayer: "ε Boo" },

  // Centaurus
  { hip: 61932, name: "Menkent", ra: 211.671, dec: -36.370, mag: 2.06, spectral: "K0", constellation: "Cen", bayer: "θ Cen" },

  // Carina
  { hip: 45238, name: "Avior", ra: 125.629, dec: -59.509, mag: 1.86, spectral: "K3", constellation: "Car", bayer: "ε Car" },
  { hip: 39953, name: "Miaplacidus", ra: 138.300, dec: -69.717, mag: 1.68, spectral: "A1", constellation: "Car", bayer: "β Car" },

  // Puppis
  { hip: 39429, name: "Naos", ra: 120.896, dec: -40.003, mag: 2.25, spectral: "O5", constellation: "Pup", bayer: "ζ Pup" },

  // Vela
  { hip: 44816, name: "Regor", ra: 122.383, dec: -47.337, mag: 1.78, spectral: "O7", constellation: "Vel", bayer: "γ Vel" },

  // Piscis Austrinus
  // already have Fomalhaut

  // Aquarius
  { hip: 109074, name: "Sadalsuud", ra: 322.890, dec: -5.571, mag: 2.91, spectral: "G0", constellation: "Aqr", bayer: "β Aqr" },
  { hip: 106278, name: "Sadalmelik", ra: 331.447, dec: -0.320, mag: 2.96, spectral: "G2", constellation: "Aqr", bayer: "α Aqr" },

  // Pisces
  { hip: 7097, name: "Alrescha", ra: 30.512, dec: 2.764, mag: 3.82, spectral: "A0", constellation: "Psc", bayer: "α Psc" },

  // Capricornus
  { hip: 100345, name: "Deneb Algedi", ra: 326.760, dec: -16.127, mag: 2.87, spectral: "A5", constellation: "Cap", bayer: "δ Cap" },

  // Cancer
  { hip: 42911, name: "Acubens", ra: 134.622, dec: 11.857, mag: 4.25, spectral: "A5", constellation: "Cnc", bayer: "α Cnc" },

  // Ophiuchus
  { hip: 84012, name: "Rasalhague", ra: 263.734, dec: 12.560, mag: 2.08, spectral: "A5", constellation: "Oph", bayer: "α Oph" },

  // Draco
  { hip: 87833, name: "Eltanin", ra: 269.152, dec: 51.489, mag: 2.23, spectral: "K5", constellation: "Dra", bayer: "γ Dra" },

  // Cepheus
  { hip: 105199, name: "Alderamin", ra: 319.645, dec: 62.586, mag: 2.51, spectral: "A7", constellation: "Cep", bayer: "α Cep" },

  // Eridanus
  { hip: 23875, name: "Cursa", ra: 76.962, dec: -5.086, mag: 2.79, spectral: "A3", constellation: "Eri", bayer: "β Eri" },

  // Hydra
  { hip: 46390, name: "Alphard", ra: 141.897, dec: -8.659, mag: 1.98, spectral: "K3", constellation: "Hya", bayer: "α Hya" },

  // Auriga stars
  { hip: 23015, name: "Menkalinan", ra: 89.882, dec: 44.948, mag: 1.90, spectral: "A1", constellation: "Aur", bayer: "β Aur" },

  // Corvus
  { hip: 59803, name: "Gienah Corvi", ra: 183.952, dec: -17.542, mag: 2.59, spectral: "B8", constellation: "Crv", bayer: "γ Crv" },

  // Southern Cross
  { hip: 62434, name: "Gacrux", ra: 187.791, dec: -57.113, mag: 1.64, spectral: "M3", constellation: "Cru", bayer: "γ Cru" },

  // Triangulum Australe
  { hip: 82273, name: "Atria", ra: 252.166, dec: -69.028, mag: 1.92, spectral: "K2", constellation: "TrA", bayer: "α TrA" },

  // Lupus
  { hip: 71860, name: "Men", ra: 220.482, dec: -47.388, mag: 2.30, spectral: "B1", constellation: "Lup", bayer: "α Lup" },
];

// Generate random background field stars
function generateFieldStars(count) {
  const stars = [];
  const spectralTypes = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
  const spectralWeights = [0.01, 0.05, 0.1, 0.15, 0.25, 0.25, 0.19]; // approximate distribution

  function pickSpectral() {
    const r = Math.random();
    let cumulative = 0;
    for (let i = 0; i < spectralTypes.length; i++) {
      cumulative += spectralWeights[i];
      if (r <= cumulative) return spectralTypes[i];
    }
    return 'G';
  }

  for (let i = 0; i < count; i++) {
    // Uniform distribution on celestial sphere
    const ra = Math.random() * 360;
    const dec = Math.asin(2 * Math.random() - 1) * (180 / Math.PI);

    // Magnitude distribution: most stars are faint
    const mag = 2.5 + Math.random() * 4.0; // range ~2.5 to ~6.5

    stars.push({
      hip: 200000 + i, // fake HIP IDs for field stars
      name: null,
      ra: parseFloat(ra.toFixed(3)),
      dec: parseFloat(dec.toFixed(3)),
      mag: parseFloat(mag.toFixed(2)),
      spectral: pickSpectral(),
      constellation: null,
      bayer: null,
    });
  }
  return stars;
}

// Add a Milky Way band (denser star region)
function generateMilkyWayStars(count) {
  const stars = [];
  const spectralTypes = ['B', 'A', 'F', 'G', 'K', 'M'];

  for (let i = 0; i < count; i++) {
    // RA concentrated around galactic plane (rough approximation)
    const galacticCenter = 266; // RA of galactic center ~17h 46m
    const ra = (galacticCenter + (Math.random() - 0.5) * 180 + 360) % 360;

    // Dec: near the galactic plane with Gaussian spread
    const u1 = Math.random();
    const u2 = Math.random();
    const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const dec = Math.max(-90, Math.min(90, gaussian * 15 - 28.936)); // galactic plane offset

    const mag = 3.5 + Math.random() * 3.0;

    stars.push({
      hip: 300000 + i,
      name: null,
      ra: parseFloat(ra.toFixed(3)),
      dec: parseFloat(dec.toFixed(3)),
      mag: parseFloat(mag.toFixed(2)),
      spectral: spectralTypes[Math.floor(Math.random() * spectralTypes.length)],
      constellation: null,
      bayer: null,
    });
  }
  return stars;
}

// Combine all stars
const allStars = [
  ...namedStars,
  ...generateFieldStars(5000),
  ...generateMilkyWayStars(3000),
];

const output = JSON.stringify(allStars);
fs.writeFileSync(__dirname + '/../src/data/stars.json', output);
console.log(`Generated ${allStars.length} stars`);
