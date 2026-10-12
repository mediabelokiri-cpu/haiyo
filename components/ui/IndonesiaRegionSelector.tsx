"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2, MapPin } from "lucide-react";
import {
  FALLBACK_DISTRICTS,
  FALLBACK_PROVINCES,
  FALLBACK_REGENCIES,
  WilayahDistrict,
  WilayahProvince,
  WilayahRegency,
} from "@/lib/constants/cities";
import { cn } from "@/lib/utils";

export interface IndonesiaRegionSelectorProps {
  label?: string;
  value: string;
  onChange: (
    formattedLocation: string,
    details?: {
      provinceName: string;
      regencyName: string;
      districtName: string;
    }
  ) => void;
  error?: string;
  helperText?: string;
}

/**
 * Cascading Indonesian Administrative Region Selector (API Wilayah Indonesia)
 * Allows users to select:
 * 1. Provinsi (38 Provinsi se-Indonesia)
 * 2. Kota / Kabupaten (514 Kota/Kabupaten)
 * 3. Kecamatan (7.200+ Kecamatan)
 */
export function IndonesiaRegionSelector({
  label = "Alamat Domisili (Wilayah Indonesia)",
  value,
  onChange,
  error,
  helperText,
}: IndonesiaRegionSelectorProps) {
  const [provinces, setProvinces] =
    useState<WilayahProvince[]>(FALLBACK_PROVINCES);
  const [regencies, setRegencies] = useState<WilayahRegency[]>(
    FALLBACK_REGENCIES["73"] ?? []
  );
  const [districts, setDistricts] = useState<WilayahDistrict[]>(
    FALLBACK_DISTRICTS["7371"] ?? []
  );

  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("73");
  const [selectedRegencyId, setSelectedRegencyId] = useState<string>("7371");
  const [selectedDistrictId, setSelectedDistrictId] =
    useState<string>("737109");

  const [loadingProvinces, setLoadingProvinces] = useState<boolean>(false);
  const [loadingRegencies, setLoadingRegencies] = useState<boolean>(false);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);

  // Keep latest onChange ref to avoid infinite effect loops
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const initialValueParsedRef = useRef(false);

  // 1. Load Provinces on mount & match initial value if possible
  useEffect(() => {
    let isMounted = true;
    setLoadingProvinces(true);

    fetch("/api/wilayah?type=provinces")
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        const list: WilayahProvince[] =
          Array.isArray(json?.data) && json.data.length > 0
            ? json.data
            : FALLBACK_PROVINCES;
        setProvinces(list);

        if (!initialValueParsedRef.current && value) {
          initialValueParsedRef.current = true;
          const lowerVal = value.toLowerCase();
          if (lowerVal.includes("jakarta")) {
            const jkt = list.find((p) =>
              p.name.toLowerCase().includes("jakarta")
            );
            if (jkt) setSelectedProvinceId(jkt.id);
          } else if (
            lowerVal.includes("bandung") ||
            lowerVal.includes("depok") ||
            lowerVal.includes("bogor") ||
            lowerVal.includes("bekasi")
          ) {
            const jabar = list.find((p) =>
              p.name.toLowerCase().includes("jawa barat")
            );
            if (jabar) setSelectedProvinceId(jabar.id);
          } else if (
            lowerVal.includes("surabaya") ||
            lowerVal.includes("malang")
          ) {
            const jatim = list.find((p) =>
              p.name.toLowerCase().includes("jawa timur")
            );
            if (jatim) setSelectedProvinceId(jatim.id);
          } else if (lowerVal.includes("yogyakarta")) {
            const diy = list.find((p) =>
              p.name.toLowerCase().includes("yogyakarta")
            );
            if (diy) setSelectedProvinceId(diy.id);
          } else if (lowerVal.includes("denpasar") || lowerVal.includes("bali")) {
            const bali = list.find((p) =>
              p.name.toLowerCase().includes("bali")
            );
            if (bali) setSelectedProvinceId(bali.id);
          }
        }
      })
      .catch(() => {
        if (isMounted) setProvinces(FALLBACK_PROVINCES);
      })
      .finally(() => {
        if (isMounted) setLoadingProvinces(false);
      });

    return () => {
      isMounted = false;
    };
  }, [value]);

  // 2. Load Regencies (Kota/Kabupaten) whenever selectedProvinceId changes
  useEffect(() => {
    if (!selectedProvinceId) return;
    let isMounted = true;
    setLoadingRegencies(true);

    fetch(
      `/api/wilayah?type=regencies&provinceId=${encodeURIComponent(
        selectedProvinceId
      )}`
    )
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        const list: WilayahRegency[] =
          Array.isArray(json?.data) && json.data.length > 0
            ? json.data
            : FALLBACK_REGENCIES[selectedProvinceId] ?? [];
        setRegencies(list);

        if (list.length > 0) {
          // Try matching current value or default to Makassar / first regency
          const lowerVal = (value || "").toLowerCase();
          const matchedRegency =
            list.find((r) => {
              const cleanName = r.name
                .toLowerCase()
                .replace(/^kota\s+/i, "")
                .replace(/^kab\.\s+/i, "");
              return lowerVal.includes(cleanName);
            }) ?? list[0];

          setSelectedRegencyId(matchedRegency.id);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        const fallback = FALLBACK_REGENCIES[selectedProvinceId] ?? [];
        setRegencies(fallback);
        if (fallback[0]) setSelectedRegencyId(fallback[0].id);
      })
      .finally(() => {
        if (isMounted) setLoadingRegencies(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvinceId]);

  // 3. Load Districts (Kecamatan) whenever selectedRegencyId changes
  useEffect(() => {
    if (!selectedRegencyId) return;
    let isMounted = true;
    setLoadingDistricts(true);

    fetch(
      `/api/wilayah?type=districts&regencyId=${encodeURIComponent(
        selectedRegencyId
      )}`
    )
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        const list: WilayahDistrict[] =
          Array.isArray(json?.data) && json.data.length > 0
            ? json.data
            : FALLBACK_DISTRICTS[selectedRegencyId] ?? [];
        setDistricts(list);

        if (list.length > 0) {
          const lowerVal = (value || "").toLowerCase();
          const matchedDistrict =
            list.find((d) => lowerVal.includes(d.name.toLowerCase())) ??
            list[0];

          setSelectedDistrictId(matchedDistrict.id);

          const provObj = provinces.find((p) => p.id === selectedProvinceId);
          const regObj = regencies.find((r) => r.id === selectedRegencyId);

          if (regObj && matchedDistrict) {
            const formatted = `Kec. ${matchedDistrict.name}, ${regObj.name}`;
            onChangeRef.current(formatted, {
              provinceName: provObj?.name ?? "",
              regencyName: regObj.name,
              districtName: matchedDistrict.name,
            });
          }
        }
      })
      .catch(() => {
        if (!isMounted) return;
        const fallback = FALLBACK_DISTRICTS[selectedRegencyId] ?? [];
        setDistricts(fallback);
        if (fallback[0]) setSelectedDistrictId(fallback[0].id);
      })
      .finally(() => {
        if (isMounted) setLoadingDistricts(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegencyId]);

  const currentProvince = provinces.find((p) => p.id === selectedProvinceId);
  const currentRegency = regencies.find((r) => r.id === selectedRegencyId);
  const currentDistrict = districts.find((d) => d.id === selectedDistrictId);

  const handleDistrictChange = (newDistrictId: string) => {
    setSelectedDistrictId(newDistrictId);
    const distObj = districts.find((d) => d.id === newDistrictId);
    if (currentRegency && distObj) {
      const formatted = `Kec. ${distObj.name}, ${currentRegency.name}`;
      onChange(formatted, {
        provinceName: currentProvince?.name ?? "",
        regencyName: currentRegency.name,
        districtName: distObj.name,
      });
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-semibold text-[#1d1d1d]">
          {label}
        </span>
        <span className="text-[11px] font-medium text-[#6F7078]">
          API Wilayah Indonesia
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 p-3.5 rounded-[16px] bg-[#f9f9fa] border border-[#E9E9EE]">
        {/* 1. Provinsi */}
        <div className="space-y-1">
          <label
            htmlFor="wilayah-provinsi"
            className="text-[12px] font-semibold text-[#6F7078] flex items-center justify-between"
          >
            <span>Provinsi</span>
            {loadingProvinces && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#267a50]" />
            )}
          </label>
          <div className="relative">
            <select
              id="wilayah-provinsi"
              value={selectedProvinceId}
              onChange={(e) => setSelectedProvinceId(e.target.value)}
              className="w-full h-[46px] pl-3.5 pr-9 rounded-[12px] bg-white border border-[#E9E9EE] text-[#1d1d1d] text-[14px] font-medium appearance-none transition-all focus:outline-none focus:border-[#267a50] focus:ring-2 focus:ring-[#267a50]/15 cursor-pointer"
            >
              {provinces.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {prov.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#6F7078] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 2. Kota / Kabupaten */}
        <div className="space-y-1">
          <label
            htmlFor="wilayah-regency"
            className="text-[12px] font-semibold text-[#6F7078] flex items-center justify-between"
          >
            <span>Kota / Kabupaten</span>
            {loadingRegencies && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#267a50]" />
            )}
          </label>
          <div className="relative">
            <select
              id="wilayah-regency"
              value={selectedRegencyId}
              onChange={(e) => setSelectedRegencyId(e.target.value)}
              disabled={loadingRegencies || regencies.length === 0}
              className="w-full h-[46px] pl-3.5 pr-9 rounded-[12px] bg-white border border-[#E9E9EE] text-[#1d1d1d] text-[14px] font-medium appearance-none transition-all focus:outline-none focus:border-[#267a50] focus:ring-2 focus:ring-[#267a50]/15 disabled:opacity-60 cursor-pointer"
            >
              {regencies.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#6F7078] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 3. Kecamatan */}
        <div className="space-y-1">
          <label
            htmlFor="wilayah-district"
            className="text-[12px] font-semibold text-[#6F7078] flex items-center justify-between"
          >
            <span>Kecamatan</span>
            {loadingDistricts && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#267a50]" />
            )}
          </label>
          <div className="relative">
            <select
              id="wilayah-district"
              value={selectedDistrictId}
              onChange={(e) => handleDistrictChange(e.target.value)}
              disabled={loadingDistricts || districts.length === 0}
              className={cn(
                "w-full h-[46px] pl-3.5 pr-9 rounded-[12px] bg-white border border-[#E9E9EE] text-[#1d1d1d] text-[14px] font-medium appearance-none transition-all focus:outline-none focus:border-[#267a50] focus:ring-2 focus:ring-[#267a50]/15 disabled:opacity-60 cursor-pointer",
                error && "border-[#EF4444]"
              )}
            >
              {districts.map((dist) => (
                <option key={dist.id} value={dist.id}>
                  Kec. {dist.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#6F7078] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Selected Address Summary Badge */}
        <div className="pt-1 flex items-center gap-2 text-[12px] text-[#1d1d1d] font-medium">
          <MapPin className="w-3.5 h-3.5 text-[#267a50] shrink-0" />
          <span className="truncate">
            {currentDistrict && currentRegency
              ? `Kec. ${currentDistrict.name}, ${currentRegency.name}${
                  currentProvince ? `, ${currentProvince.name}` : ""
                }`
              : value || "Pilih wilayah tempat tinggalmu"}
          </span>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-[12px] font-medium text-[#EF4444]">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-[12px] text-[#6F7078]">{helperText}</p>
      ) : null}
    </div>
  );
}
