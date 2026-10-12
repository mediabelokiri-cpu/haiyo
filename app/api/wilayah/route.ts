import { NextRequest, NextResponse } from "next/server";
import {
  FALLBACK_DISTRICTS,
  FALLBACK_PROVINCES,
  FALLBACK_REGENCIES,
  formatWilayahName,
  WilayahDistrict,
  WilayahProvince,
  WilayahRegency,
} from "@/lib/constants/cities";

const EMSIFA_BASE_URL = "https://www.emsifa.com/api-wilayah-indonesia/api";

/**
 * GET /api/wilayah
 * Query parameters:
 * - type=provinces
 * - type=regencies&provinceId=73
 * - type=districts&regencyId=7371
 *
 * Fetches real-time Indonesian administrative region data (Provinsi -> Kota/Kabupaten -> Kecamatan)
 * from the official Wilayah Indonesia API with automatic title-case formatting and fallback resilience.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "provinces";
  const provinceId = searchParams.get("provinceId") ?? "";
  const regencyId = searchParams.get("regencyId") ?? "";

  try {
    if (type === "provinces") {
      const res = await fetch(`${EMSIFA_BASE_URL}/provinces.json`, {
        next: { revalidate: 86400 },
      });
      if (!res.ok) throw new Error("Failed to fetch provinces");

      const raw = (await res.json()) as WilayahProvince[];
      const formatted: WilayahProvince[] = raw
        .map((p) => ({
          id: String(p.id),
          name: formatWilayahName(p.name),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "id"));

      return NextResponse.json({ data: formatted, source: "emsifa-api" });
    }

    if (type === "regencies" && provinceId) {
      const res = await fetch(
        `${EMSIFA_BASE_URL}/regencies/${encodeURIComponent(provinceId)}.json`,
        {
          next: { revalidate: 86400 },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch regencies");

      const raw = (await res.json()) as WilayahRegency[];
      const formatted: WilayahRegency[] = raw
        .map((r) => ({
          id: String(r.id),
          province_id: String(r.province_id),
          name: formatWilayahName(r.name),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "id"));

      return NextResponse.json({ data: formatted, source: "emsifa-api" });
    }

    if (type === "districts" && regencyId) {
      const res = await fetch(
        `${EMSIFA_BASE_URL}/districts/${encodeURIComponent(regencyId)}.json`,
        {
          next: { revalidate: 86400 },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch districts");

      const raw = (await res.json()) as WilayahDistrict[];
      const formatted: WilayahDistrict[] = raw
        .map((d) => ({
          id: String(d.id),
          regency_id: String(d.regency_id),
          name: formatWilayahName(d.name),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "id"));

      return NextResponse.json({ data: formatted, source: "emsifa-api" });
    }

    return NextResponse.json({ data: [], source: "empty" });
  } catch {
    // Graceful fallback if offline or external CDN is unreachable
    if (type === "provinces") {
      return NextResponse.json({
        data: FALLBACK_PROVINCES,
        source: "fallback",
      });
    }
    if (type === "regencies" && provinceId) {
      return NextResponse.json({
        data: FALLBACK_REGENCIES[provinceId] ?? [
          {
            id: `${provinceId}01`,
            province_id: provinceId,
            name: "Kota Utama",
          },
        ],
        source: "fallback",
      });
    }
    if (type === "districts" && regencyId) {
      return NextResponse.json({
        data: FALLBACK_DISTRICTS[regencyId] ?? [
          {
            id: `${regencyId}01`,
            regency_id: regencyId,
            name: "Pusat Kota",
          },
        ],
        source: "fallback",
      });
    }
    return NextResponse.json({ data: [], source: "fallback" });
  }
}
