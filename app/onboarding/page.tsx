"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  MapPin,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";
import {
  Badge,
  BrandLogo,
  Button,
  IndonesiaRegionSelector,
  Input,
  InterestChip,
  RadiusSlider,
  Textarea,
  useToast,
} from "@/components/ui";
import { calculateAge, cn } from "@/lib/utils";
import { getCityCoordinates } from "@/lib/constants/cities";
import {
  MASTER_INTERESTS,
  completeOnboardingInState,
} from "@/lib/store/app-state";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  deleteStoragePhotoIfPresent,
  formatKilobytes,
  uploadCompressedProfilePhoto,
} from "@/lib/supabase/photo-storage";
import { Gender } from "@/types/database";

const TOTAL_STEPS = 5;

const SAMPLE_AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 — Basic Info
  const [name, setName] = useState("Alex");
  const [dob, setDob] = useState("2001-05-14");
  const [gender, setGender] = useState<Gender>("male");
  const [city, setCity] = useState("Kec. Panakkukang, Kota Makassar");
  const [coords, setCoords] = useState<{
    lat: number | null;
    lng: number | null;
    status: "idle" | "granted" | "skipped";
  }>({ lat: null, lng: null, status: "idle" });
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // Step 2 — Photos (min 1, max 6)
  const [photos, setPhotos] = useState<string[]>([SAMPLE_AVATAR_PRESETS[0]]);

  // Step 3 — Bio (max 500 chars)
  const [bio, setBio] = useState(
    "Suka kopi, jalan sore, dan ngobrol sampai lupa waktu."
  );

  // Step 4 — Interests (min 3)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "coffee",
    "music",
    "travel",
  ]);

  // Step 5 — Preferences
  const [preferredGender, setPreferredGender] = useState<Gender>("female");
  const [minAge, setMinAge] = useState<number>(20);
  const [maxAge, setMaxAge] = useState<number>(30);
  const [radiusKm, setRadiusKm] = useState<number>(25);

  const calculatedAge = dob ? calculateAge(dob) : 0;

  // Optional/Conditional Location Permission (Non-blocking per Roadmap Rule #3)
  const handleRequestOptionalLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setCoords({ lat: null, lng: null, status: "skipped" });
      toast({
        title: "Menggunakan lokasi kota",
        description: `Jarak akan dihitung berdasarkan kota ${city}.`,
        variant: "info",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          status: "granted",
        });
        toast({
          title: "Perkiraan lokasi berhasil disesuaikan",
          description:
            "Koordinat disimpan secara internal dan tidak pernah ditampilkan ke publik.",
          variant: "success",
        });
      },
      () => {
        setCoords({ lat: null, lng: null, status: "skipped" });
        toast({
          title: "Tetap aman tanpa izin GPS",
          description: `HAIYO menggunakan referensi kota ${city} untuk mencari teman di sekitar.`,
          variant: "info",
        });
      },
      { enableHighAccuracy: false, timeout: 6000 }
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 6 - photos.length;
    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    e.target.value = "";

    for (const file of selectedFiles) {
      try {
        const result = await uploadCompressedProfilePhoto(file);
        setPhotos((prev) =>
          prev.length < 6 ? [...prev, result.publicUrl] : prev
        );
        const savedPct =
          result.originalBytes > result.compressedBytes
            ? Math.round(
                ((result.originalBytes - result.compressedBytes) /
                  result.originalBytes) *
                  100
              )
            : 0;
        toast({
          title: "Foto berhasil dioptimasi (WebP)",
          description:
            savedPct > 0
              ? `Ukuran dikompres menjadi ${formatKilobytes(result.compressedBytes)} (hemat ${savedPct}% ruang penyimpanan).`
              : `Ukuran foto ${formatKilobytes(result.compressedBytes)}.`,
          variant: "success",
        });
      } catch {
        toast({
          title: "Gagal memproses foto",
          description: "Pastikan file gambar berformat JPG, PNG, atau WebP.",
          variant: "error",
        });
      }
    }
  };

  const handleSetPrimaryPhoto = (idx: number) => {
    if (idx === 0) return;
    setPhotos((prev) => {
      const next = [...prev];
      const [chosen] = next.splice(idx, 1);
      return [chosen, ...next];
    });
    toast({ title: "Foto utama diperbarui.", variant: "success" });
  };

  const handleRemovePhoto = (idx: number) => {
    const targetUrl = photos[idx];
    if (targetUrl) {
      void deleteStoragePhotoIfPresent(targetUrl);
    }
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleInterest = (slug: string) => {
    setSelectedInterests((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]
    );
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!name.trim()) {
        setStep1Error("Masukkan nama panggilanmu terlebih dahulu.");
        return;
      }
      if (!dob || calculatedAge < 18) {
        setStep1Error(
          "HAIYO hanya untuk pengguna berusia 18 tahun ke atas."
        );
        return;
      }
      if (!city.trim()) {
        setStep1Error("Pilih kota tempat tinggalmu.");
        return;
      }
      setStep1Error(null);
      setPreferredGender(gender === "male" ? "female" : "male");
      setStep(2);
      return;
    }

    if (step === 2) {
      if (photos.length < 1) {
        toast({
          title: "Tambahkan minimal 1 foto",
          description: "Profil dengan foto lebih mudah dikenali.",
          variant: "error",
        });
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!bio.trim()) {
        toast({
          title: "Isi bio singkatmu dulu",
          description: "Ceritakan sedikit tentang dirimu.",
          variant: "error",
        });
        return;
      }
      setStep(4);
      return;
    }

    if (step === 4) {
      if (selectedInterests.length < 3) {
        toast({
          title: "Pilih minimal 3 minat",
          description: "Ini membantu kami menemukan orang yang nyambung denganmu.",
          variant: "error",
        });
        return;
      }
      setStep(5);
      return;
    }
  };

  const handleFinishOnboarding = async () => {
    if (minAge < 18 || maxAge < minAge) {
      toast({
        title: "Rentang usia belum sesuai",
        description: "Usia minimum adalah 18 tahun dan tidak boleh melebihi usia maksimum.",
        variant: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const fallbackCityCoords = getCityCoordinates(city);
      const finalLat = coords.lat ?? fallbackCityCoords?.latitude ?? null;
      const finalLng = coords.lng ?? fallbackCityCoords?.longitude ?? null;

      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase.from("profiles").upsert({
            id: user.id,
            name: name.trim(),
            date_of_birth: dob,
            gender,
            city,
            bio: bio.trim(),
            latitude: finalLat,
            longitude: finalLng,
            status: "active",
            is_onboarded: true,
          });

          await supabase.from("user_preferences").upsert({
            user_id: user.id,
            preferred_gender: preferredGender,
            min_age: minAge,
            max_age: maxAge,
            radius_km: radiusKm,
          });

          await supabase.from("analytics_events").insert({
            user_id: user.id,
            event_name: "profile_completed",
            metadata: { city, interests_count: selectedInterests.length },
          });
        }
      }

      completeOnboardingInState({
        name,
        dateOfBirth: dob,
        gender,
        city,
        latitude: finalLat,
        longitude: finalLng,
        bio,
        photoUrls: photos,
        interestSlugs: selectedInterests,
        preferredGender,
        minAge,
        maxAge,
        radiusKm,
      });

      toast({
        title: "Profil siap!",
        description: "Saatnya mulai kenalan dengan orang baru.",
        variant: "success",
      });
      router.push("/discover");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-between bg-[#f9f9fa] px-4 py-6 md:py-12">
      <div className="w-full max-w-[460px] mx-auto space-y-6">
        {/* Progress Header (UI/UX Section 20) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#6F7078] hover:text-[#1d1d1d] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
            ) : (
              <BrandLogo href="/" size="sm" />
            )}

            {step > 1 && <BrandLogo href="/" size="sm" />}

            <span className="text-[13px] font-bold text-[#6F7078]">
              {step} / {TOTAL_STEPS}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-[#E9E9EE] overflow-hidden">
            <div
              className="h-full bg-[#267a50] rounded-full transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/*Onboarding Card Surface*/}
        <div className="rounded-[24px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6 sm:p-7 space-y-6">
          {/* STEP 1 — BASIC INFO */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h1 className="text-[24px] font-bold text-[#1d1d1d] tracking-tight">
                  Kenalan dulu
                </h1>
                <p className="text-[14px] text-[#6F7078]">
                  Isi info dasar kamu supaya teman baru bisa mengenalmu.
                </p>
              </div>

              <Input
                label="Nama Panggilan"
                placeholder="Contoh: Sarah"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="dob-input"
                    className="text-[14px] font-semibold text-[#1d1d1d]"
                  >
                    Tanggal Lahir
                  </label>
                  {dob && (
                    <Badge
                      variant={calculatedAge >= 18 ? "primary" : "danger"}
                    >
                      {calculatedAge} tahun
                    </Badge>
                  )}
                </div>
                <Input
                  id="dob-input"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  helperText="Usia dihitung otomatis dari tanggal lahir (minimal 18 tahun)."
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[14px] font-semibold text-[#1d1d1d]">
                  Gender
                </span>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {[
                    { value: "male" as Gender, label: "Laki-laki" },
                    { value: "female" as Gender, label: "Perempuan" },
                  ].map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGender(g.value)}
                      className={cn(
                        "h-[50px] rounded-[12px] font-semibold text-[14px] border transition-all cursor-pointer",
                        gender === g.value
                          ? "bg-[#eaf5ef] border-[#267a50] text-[#267a50]"
                          : "bg-white border-[#E9E9EE] text-[#1d1d1d] hover:border-[#267a50]/40"
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <IndonesiaRegionSelector
                label="Alamat Domisili (Kota/Kabupaten & Kecamatan)"
                value={city}
                onChange={(formatted) => setCity(formatted)}
              />

              {/* Privacy-Safe Optional Location Helper */}
              <div className="p-4 rounded-[16px] bg-[#f9f9fa] border border-[#E9E9EE] space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-[13px] font-semibold text-[#1d1d1d] flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#267a50]" />
                      <span>Bantu akurasi radius sekitar (Opsional)</span>
                    </p>
                    <p className="text-[12px] text-[#6F7078] leading-relaxed">
                      HAIYO tidak pernah menampilkan koordinat GPS eksak. Yang
                      tampil hanya kota atau perkiraan jarak (contoh: ±8 km
                      away).
                    </p>
                  </div>
                </div>

                {coords.status === "granted" ? (
                  <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#16A34A]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Perkiraan jarak sekitar berhasil diaktifkan</span>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleRequestOptionalLocation}
                  >
                    Sesuaikan Perkiraan Jarak (Opsional)
                  </Button>
                )}
              </div>

              {step1Error && (
                <p
                  role="alert"
                  className="text-[13px] font-medium text-[#EF4444]"
                >
                  {step1Error}
                </p>
              )}

              <Button variant="primary" fullWidth onClick={handleNextStep}>
                Lanjut
              </Button>
            </div>
          )}

          {/* STEP 2 — FOTO (UI/UX Section 21) */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h1 className="text-[24px] font-bold text-[#1d1d1d] tracking-tight">
                  Pasang foto terbaikmu
                </h1>
                <p className="text-[14px] text-[#6F7078]">
                  Profil dengan foto biasanya lebih mudah dikenali. Maksimal 6
                  foto (minimal 1 foto).
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* 6-Slot Photo Grid */}
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, index) => {
                  const photoUrl = photos[index];
                  return (
                    <div
                      key={index}
                      className="relative aspect-[3/4] rounded-[16px] overflow-hidden border border-[#E9E9EE] bg-[#f9f9fa] flex flex-col items-center justify-center group"
                    >
                      {photoUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photoUrl}
                            alt={`Foto profil ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {index === 0 ? (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#267a50] text-white text-[10px] font-bold shadow-sm">
                              Foto utama
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryPhoto(index)}
                              className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/55 text-white text-[10px] font-medium hover:bg-[#267a50] transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Star className="w-2.5 h-2.5" />
                              <span>Utama</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            aria-label={`Hapus foto ${index + 1}`}
                            className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white hover:bg-[#EF4444] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-[#6F7078] hover:text-[#267a50] hover:bg-[#eaf5ef]/50 transition-colors cursor-pointer"
                        >
                          <Camera className="w-6 h-6" />
                          <span className="text-[11px] font-semibold">
                            Tambah
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#6F7078]">
                <span>{photos.length} / 6 foto terpasang</span>
                {photos.length < 6 && (
                  <button
                    type="button"
                    onClick={() =>
                      setPhotos((prev) => [
                        ...prev,
                        SAMPLE_AVATAR_PRESETS[
                          prev.length % SAMPLE_AVATAR_PRESETS.length
                        ],
                      ])
                    }
                    className="font-semibold text-[#267a50] hover:underline cursor-pointer"
                  >
                    + Tambah Foto Contoh Cepat
                  </button>
                )}
              </div>

              <Button variant="primary" fullWidth onClick={handleNextStep}>
                Lanjut
              </Button>
            </div>
          )}

          {/* STEP 3 — BIO (UI/UX Section 22) */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h1 className="text-[24px] font-bold text-[#1d1d1d]">
                  Ceritakan sedikit tentang kamu
                </h1>
                <p className="text-[14px] text-[#6F7078]">
                  Tidak perlu formal—tulis saja hal seru yang bikin obrolan
                  gampang dimulai.
                </p>
              </div>

              <Textarea
                label="Bio Singkat"
                placeholder="Contoh: Suka kopi, jalan sore, dan ngobrol sampai lupa waktu."
                maxLength={500}
                showCount
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />

              <Button variant="primary" fullWidth onClick={handleNextStep}>
                Lanjut
              </Button>
            </div>
          )}

          {/* STEP 4 — INTERESTS (UI/UX Section 23) */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h1 className="text-[24px] font-bold text-[#1d1d1d]">
                    Apa yang kamu suka?
                  </h1>
                  <Badge
                    variant={
                      selectedInterests.length >= 3 ? "primary" : "default"
                    }
                  >
                    {selectedInterests.length} dipilih
                  </Badge>
                </div>
                <p className="text-[14px] text-[#6F7078]">
                  Pilih minimal 3 minat supaya rekomendasi teman baru makin
                  nyambung.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                {MASTER_INTERESTS.map((item) => (
                  <InterestChip
                    key={item.slug}
                    label={item.name}
                    emoji={item.emoji}
                    selected={selectedInterests.includes(item.slug)}
                    onClick={() => toggleInterest(item.slug)}
                  />
                ))}
              </div>

              <Button variant="primary" fullWidth onClick={handleNextStep}>
                Lanjut
              </Button>
            </div>
          )}

          {/* STEP 5 — PREFERENCES (UI/UX Section 24) */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h1 className="text-[24px] font-bold text-[#1d1d1d]">
                  Kamu ingin kenalan dengan siapa?
                </h1>
                <p className="text-[14px] text-[#6F7078]">
                  Kamu selalu bisa mengubah preferensi ini kapan saja di
                  Discover.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[14px] font-semibold text-[#1d1d1d]">
                  Ingin kenalan dengan
                </span>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {[
                    { value: "female" as Gender, label: "Perempuan" },
                    { value: "male" as Gender, label: "Laki-laki" },
                  ].map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setPreferredGender(g.value)}
                      className={cn(
                        "h-[50px] rounded-[12px] font-semibold text-[14px] border transition-all cursor-pointer",
                        preferredGender === g.value
                          ? "bg-[#eaf5ef] border-[#267a50] text-[#267a50]"
                          : "bg-white border-[#E9E9EE] text-[#1d1d1d] hover:border-[#267a50]/40"
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Usia Minimum"
                  type="number"
                  min={18}
                  max={80}
                  value={minAge}
                  onChange={(e) =>
                    setMinAge(Math.max(18, Number(e.target.value) || 18))
                  }
                />
                <Input
                  label="Usia Maksimum"
                  type="number"
                  min={18}
                  max={90}
                  value={maxAge}
                  onChange={(e) =>
                    setMaxAge(Math.max(minAge, Number(e.target.value) || 30))
                  }
                />
              </div>

              <RadiusSlider
                label="Radius Lokasi"
                value={radiusKm}
                min={0}
                max={500}
                onChange={setRadiusKm}
                helperText="Geser dari 0 km (dalam kota) hingga 500 km."
              />

              <div className="pt-2">
                <Button
                  variant="primary"
                  fullWidth
                  isLoading={isSubmitting}
                  onClick={handleFinishOnboarding}
                  leftIcon={<Check className="w-5 h-5" />}
                >
                  Mulai Kenalan
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
