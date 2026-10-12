/**
 * Indonesian Administrative Regions (API Wilayah Indonesia) & Privacy-Safe Coordinates
 * Supports Provinsi -> Kota/Kabupaten -> Kecamatan selection with Haversine coordinate lookup.
 */

export interface CityReference {
  name: string;
  latitude: number;
  longitude: number;
}

export interface WilayahProvince {
  id: string;
  name: string;
}

export interface WilayahRegency {
  id: string;
  province_id: string;
  name: string;
}

export interface WilayahDistrict {
  id: string;
  regency_id: string;
  name: string;
}

/**
 * Formats uppercase API Wilayah strings (e.g., "KOTA MAKASSAR", "DKI JAKARTA")
 * into clean, readable Indonesian title case ("Kota Makassar", "DKI Jakarta").
 */
export function formatWilayahName(raw: string): string {
  const upperronyms = new Set(["DKI", "DI", "NAD"]);
  return raw
    .trim()
    .split(/\s+/)
    .map((word) => {
      const upper = word.toUpperCase();
      if (upperronyms.has(upper)) return upper;
      if (upper === "KABUPATEN") return "Kab.";
      return upper.charAt(0) + upper.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Reference coordinates for major Indonesian Cities/Regencies & all Provinces.
 * Used as privacy-safe fallback coordinates when browser GPS is skipped.
 */
export const INDONESIAN_CITIES: CityReference[] = [
  // Sulawesi
  { name: "Makassar", latitude: -5.1477, longitude: 119.4327 },
  { name: "Gowa", latitude: -5.2028, longitude: 119.4526 },
  { name: "Maros", latitude: -5.0057, longitude: 119.5731 },
  { name: "Parepare", latitude: -4.0135, longitude: 119.6255 },
  { name: "Palopo", latitude: -2.9925, longitude: 120.1969 },
  { name: "Manado", latitude: 1.4748, longitude: 124.8421 },
  { name: "Palu", latitude: -0.8917, longitude: 119.8707 },
  { name: "Kendari", latitude: -3.9985, longitude: 122.513 },
  { name: "Gorontalo", latitude: 0.5435, longitude: 123.0568 },
  { name: "Mamuju", latitude: -2.6776, longitude: 118.8872 },

  // DKI Jakarta & Bodetabek
  { name: "Jakarta", latitude: -6.2088, longitude: 106.8456 },
  { name: "Jakarta Selatan", latitude: -6.2615, longitude: 106.8106 },
  { name: "Jakarta Pusat", latitude: -6.1805, longitude: 106.8284 },
  { name: "Jakarta Barat", latitude: -6.1674, longitude: 106.7637 },
  { name: "Jakarta Timur", latitude: -6.225, longitude: 106.9004 },
  { name: "Jakarta Utara", latitude: -6.1214, longitude: 106.7741 },
  { name: "Bogor", latitude: -6.5971, longitude: 106.806 },
  { name: "Depok", latitude: -6.4025, longitude: 106.7942 },
  { name: "Tangerang", latitude: -6.1783, longitude: 106.6319 },
  { name: "Tangerang Selatan", latitude: -6.2886, longitude: 106.7179 },
  { name: "Bekasi", latitude: -6.2383, longitude: 106.9756 },

  // Jawa Barat & Banten
  { name: "Bandung", latitude: -6.9175, longitude: 107.6191 },
  { name: "Cimahi", latitude: -6.8841, longitude: 107.5413 },
  { name: "Cirebon", latitude: -6.732, longitude: 108.5523 },
  { name: "Serang", latitude: -6.1104, longitude: 106.164 },

  // Jawa Tengah & DIY
  { name: "Semarang", latitude: -6.9667, longitude: 110.4167 },
  { name: "Surakarta", latitude: -7.5755, longitude: 110.8243 },
  { name: "Yogyakarta", latitude: -7.7956, longitude: 110.3695 },
  { name: "Sleman", latitude: -7.7162, longitude: 110.3556 },
  { name: "Bantul", latitude: -7.8878, longitude: 110.3289 },

  // Jawa Timur
  { name: "Surabaya", latitude: -7.2575, longitude: 112.7521 },
  { name: "Malang", latitude: -7.9666, longitude: 112.6326 },
  { name: "Sidoarjo", latitude: -7.4478, longitude: 112.7183 },
  { name: "Gresik", latitude: -7.1554, longitude: 112.6555 },

  // Bali & Nusa Tenggara
  { name: "Denpasar", latitude: -8.6705, longitude: 115.2126 },
  { name: "Badung", latitude: -8.5819, longitude: 115.1771 },
  { name: "Gianyar", latitude: -8.5449, longitude: 115.3247 },
  { name: "Mataram", latitude: -8.5833, longitude: 116.1167 },
  { name: "Kupang", latitude: -10.1772, longitude: 123.607 },

  // Sumatera
  { name: "Medan", latitude: 3.5952, longitude: 98.6722 },
  { name: "Palembang", latitude: -2.9761, longitude: 104.7754 },
  { name: "Padang", latitude: -0.9471, longitude: 100.4172 },
  { name: "Pekanbaru", latitude: 0.5071, longitude: 101.4478 },
  { name: "Batam", latitude: 1.0456, longitude: 104.0305 },
  { name: "Bandar Lampung", latitude: -5.3971, longitude: 105.2668 },
  { name: "Banda Aceh", latitude: 5.5483, longitude: 95.3238 },
  { name: "Jambi", latitude: -1.6101, longitude: 103.6131 },
  { name: "Bengkulu", latitude: -3.7928, longitude: 102.2608 },

  // Kalimantan
  { name: "Balikpapan", latitude: -1.2379, longitude: 116.8529 },
  { name: "Samarinda", latitude: -0.5022, longitude: 117.1536 },
  { name: "Banjarmasin", latitude: -3.3194, longitude: 114.5908 },
  { name: "Pontianak", latitude: -0.0263, longitude: 109.3425 },
  { name: "Palangka Raya", latitude: -2.2136, longitude: 113.9108 },

  // Maluku & Papua
  { name: "Ambon", latitude: -3.6954, longitude: 128.1814 },
  { name: "Ternate", latitude: 0.7893, longitude: 127.3754 },
  { name: "Jayapura", latitude: -2.5337, longitude: 140.7181 },
  { name: "Sorong", latitude: -0.8762, longitude: 131.2558 },
];

/**
 * Resolves approximate coordinates from any formatted address string
 * such as "Kec. Panakkukang, Kota Makassar" or "Kota Bandung".
 */
export function getCityCoordinates(locationText: string): {
  latitude: number;
  longitude: number;
} | null {
  if (!locationText) return null;
  const normalized = locationText.trim().toLowerCase();

  // 1. Exact match first
  const exact = INDONESIAN_CITIES.find(
    (c) => c.name.toLowerCase() === normalized
  );
  if (exact) {
    return { latitude: exact.latitude, longitude: exact.longitude };
  }

  // 2. Substring match (e.g., "Kec. Panakkukang, Kota Makassar" -> matches "Makassar")
  const sortedByLength = [...INDONESIAN_CITIES].sort(
    (a, b) => b.name.length - a.name.length
  );
  const partial = sortedByLength.find((c) =>
    normalized.includes(c.name.toLowerCase())
  );
  if (partial) {
    return { latitude: partial.latitude, longitude: partial.longitude };
  }

  // Default fallback to Makassar center if region is unlisted
  return { latitude: -5.1477, longitude: 119.4327 };
}

/**
 * Offline / Fallback Wilayah Dataset so dropdowns remain 100% functional
 * even if the user has no internet connection.
 */
export const FALLBACK_PROVINCES: WilayahProvince[] = [
  { id: "73", name: "Sulawesi Selatan" },
  { id: "31", name: "DKI Jakarta" },
  { id: "32", name: "Jawa Barat" },
  { id: "33", name: "Jawa Tengah" },
  { id: "34", name: "DI Yogyakarta" },
  { id: "35", name: "Jawa Timur" },
  { id: "36", name: "Banten" },
  { id: "51", name: "Bali" },
  { id: "12", name: "Sumatera Utara" },
  { id: "16", name: "Sumatera Selatan" },
  { id: "64", name: "Kalimantan Timur" },
  { id: "71", name: "Sulawesi Utara" },
];

export const FALLBACK_REGENCIES: Record<string, WilayahRegency[]> = {
  "73": [
    { id: "7371", province_id: "73", name: "Kota Makassar" },
    { id: "7306", province_id: "73", name: "Kab. Gowa" },
    { id: "7309", province_id: "73", name: "Kab. Maros" },
    { id: "7372", province_id: "73", name: "Kota Parepare" },
    { id: "7373", province_id: "73", name: "Kota Palopo" },
  ],
  "31": [
    { id: "3174", province_id: "31", name: "Kota Jakarta Selatan" },
    { id: "3171", province_id: "31", name: "Kota Jakarta Pusat" },
    { id: "3173", province_id: "31", name: "Kota Jakarta Barat" },
    { id: "3175", province_id: "31", name: "Kota Jakarta Timur" },
    { id: "3172", province_id: "31", name: "Kota Jakarta Utara" },
  ],
  "32": [
    { id: "3273", province_id: "32", name: "Kota Bandung" },
    { id: "3204", province_id: "32", name: "Kab. Bandung" },
    { id: "3276", province_id: "32", name: "Kota Depok" },
    { id: "3271", province_id: "32", name: "Kota Bogor" },
    { id: "3275", province_id: "32", name: "Kota Bekasi" },
  ],
  "34": [
    { id: "3471", province_id: "34", name: "Kota Yogyakarta" },
    { id: "3404", province_id: "34", name: "Kab. Sleman" },
    { id: "3402", province_id: "34", name: "Kab. Bantul" },
  ],
  "35": [
    { id: "3578", province_id: "35", name: "Kota Surabaya" },
    { id: "3573", province_id: "35", name: "Kota Malang" },
    { id: "3515", province_id: "35", name: "Kab. Sidoarjo" },
  ],
  "51": [
    { id: "5171", province_id: "51", name: "Kota Denpasar" },
    { id: "5103", province_id: "51", name: "Kab. Badung" },
    { id: "5104", province_id: "51", name: "Kab. Gianyar" },
  ],
};

export const FALLBACK_DISTRICTS: Record<string, WilayahDistrict[]> = {
  "7371": [
    { id: "737109", regency_id: "7371", name: "Panakkukang" },
    { id: "737110", regency_id: "7371", name: "Tamalanrea" },
    { id: "737111", regency_id: "7371", name: "Biringkanaya" },
    { id: "737112", regency_id: "7371", name: "Manggala" },
    { id: "737113", regency_id: "7371", name: "Rappocini" },
    { id: "737104", regency_id: "7371", name: "Ujung Pandang" },
    { id: "737103", regency_id: "7371", name: "Makassar" },
    { id: "737101", regency_id: "7371", name: "Mariso" },
    { id: "737102", regency_id: "7371", name: "Mamajang" },
    { id: "737107", regency_id: "7371", name: "Tallo" },
    { id: "737114", regency_id: "7371", name: "Tamalate" },
  ],
  "7306": [
    { id: "730608", regency_id: "7306", name: "Somba Opu" },
    { id: "730607", regency_id: "7306", name: "Pallangga" },
    { id: "730602", regency_id: "7306", name: "Bajeng" },
  ],
  "7309": [
    { id: "730901", regency_id: "7309", name: "Mandai" },
    { id: "730904", regency_id: "7309", name: "Maros Baru" },
    { id: "730914", regency_id: "7309", name: "Turikale" },
  ],
  "3174": [
    { id: "317407", regency_id: "3174", name: "Kebayoran Baru" },
    { id: "317405", regency_id: "3174", name: "Kebayoran Lama" },
    { id: "317406", regency_id: "3174", name: "Cilandak" },
    { id: "317401", regency_id: "3174", name: "Tebet" },
    { id: "317402", regency_id: "3174", name: "Setiabudi" },
    { id: "317404", regency_id: "3174", name: "Pasar Minggu" },
    { id: "317408", regency_id: "3174", name: "Pancoran" },
  ],
  "3273": [
    { id: "327302", regency_id: "3273", name: "Coblong" },
    { id: "327309", regency_id: "3273", name: "Bandung Wetan" },
    { id: "327307", regency_id: "3273", name: "Sumur Bandung" },
    { id: "327301", regency_id: "3273", name: "Sukasari" },
    { id: "327319", regency_id: "3273", name: "Lengkong" },
  ],
  "3578": [
    { id: "357808", regency_id: "3578", name: "Gubeng" },
    { id: "357806", regency_id: "3578", name: "Tegalsari" },
    { id: "357804", regency_id: "3578", name: "Wonokromo" },
    { id: "357809", regency_id: "3578", name: "Sukolilo" },
  ],
};
