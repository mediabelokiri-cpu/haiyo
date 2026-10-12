"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Star, Trash2 } from "lucide-react";
import {
  AppShell,
  Button,
  IndonesiaRegionSelector,
  Input,
  InterestChip,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";
import {
  completeOnboardingInState,
  loadAppState,
  MASTER_INTERESTS,
} from "@/lib/store/app-state";
import { calculateAge } from "@/lib/utils";
import {
  cleanupOrphanProfilePhotos,
  deleteStoragePhotoIfPresent,
  formatKilobytes,
  uploadCompressedProfilePhoto,
} from "@/lib/supabase/photo-storage";
import { Gender } from "@/types/database";

/**
 * Edit Profile Page (/profile/edit) per UI/UX Sections 43 & 70:
 * - Manage up to 6 photos (upload, delete, reorder/set primary)
 * - Basic Information (Name, DOB, Gender, City)
 * - Bio (Textarea max 500)
 * - Interests selector (min 3)
 * - CTA: "Simpan Perubahan" -> Toast: "Profil berhasil diperbarui."
 */
export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [dob, setDob] = useState("2001-05-14");
  const [gender, setGender] = useState<Gender>("male");
  const [city, setCity] = useState("Makassar");
  const [bio, setBio] = useState("");
  const [initialPhotos, setInitialPhotos] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [prefGender, setPrefGender] = useState<Gender>("female");
  const [minAge, setMinAge] = useState(20);
  const [maxAge, setMaxAge] = useState(30);
  const [radiusKm, setRadiusKm] = useState<number>(25);

  useEffect(() => {
    const state = loadAppState();
    if (state.currentUser) {
      setName(state.currentUser.profile.name);
      setDob(state.currentUser.profile.date_of_birth);
      setGender(state.currentUser.profile.gender);
      setCity(state.currentUser.profile.city);
      setBio(state.currentUser.profile.bio);
      const currentUrls = state.currentUser.photos
        .map((p) => p.public_url ?? "")
        .filter(Boolean);
      setInitialPhotos(currentUrls);
      setPhotos(currentUrls);
      setInterests(state.currentUser.interests);
      setPrefGender(state.currentUser.preferences.preferred_gender);
      setMinAge(state.currentUser.preferences.min_age);
      setMaxAge(state.currentUser.preferences.max_age);
      setRadiusKm(state.currentUser.preferences.radius_km);
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files).slice(0, 6 - photos.length);
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
              ? `Dikompres menjadi ${formatKilobytes(result.compressedBytes)} (hemat ${savedPct}% ruang penyimpanan).`
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

  const handleRemovePhoto = (idx: number) => {
    const targetUrl = photos[idx];
    // If this photo was uploaded during this editing session (not in initialPhotos), delete immediately from Storage
    if (targetUrl && !initialPhotos.includes(targetUrl)) {
      void deleteStoragePhotoIfPresent(targetUrl);
    }
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSetPrimary = (idx: number) => {
    if (idx === 0) return;
    setPhotos((prev) => {
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      return [item, ...next];
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Nama tidak boleh kosong.", variant: "error" });
      return;
    }
    if (calculateAge(dob) < 18) {
      toast({ title: "Usia minimal harus 18 tahun.", variant: "error" });
      return;
    }
    if (photos.length < 1) {
      toast({ title: "Minimal harus ada 1 foto profil.", variant: "error" });
      return;
    }
    if (interests.length < 3) {
      toast({ title: "Pilih minimal 3 minat.", variant: "error" });
      return;
    }

    // Automatically delete any removed/replaced old photos from Supabase Storage (Zero Orphan Files)
    await cleanupOrphanProfilePhotos(initialPhotos, photos);

    completeOnboardingInState({
      name,
      dateOfBirth: dob,
      gender,
      city,
      bio,
      photoUrls: photos,
      interestSlugs: interests,
      preferredGender: prefGender,
      minAge,
      maxAge,
      radiusKm,
    });

    toast({
      title: "Profil berhasil diperbarui.",
      variant: "success",
    });
    router.push("/profile");
  };

  return (
    <AppShell
      headerProps={{
        title: "Edit Profile",
        showBrand: false,
      }}
    >
      <form onSubmit={handleSave} className="space-y-6 pb-10">
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#6F7078] hover:text-[#1d1d1d]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Profil</span>
          </Link>
        </div>

        {/* 1. Foto Section */}
        <section className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] space-y-4">
          <div>
            <h2 className="text-[18px] font-bold text-[#1d1d1d]">Foto</h2>
            <p className="text-[13px] text-[#6F7078]">
              Kelola hingga 6 foto (otomatis dioptimasi ke WebP hemat kuota). Foto pertama menjadi foto utama.
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

          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, idx) => {
              const url = photos[idx];
              return (
                <div
                  key={idx}
                  className="relative aspect-[3/4] rounded-[16px] overflow-hidden border border-[#E9E9EE] bg-[#f9f9fa] flex items-center justify-center"
                >
                  {url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 ? (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#267a50] text-white text-[10px] font-bold">
                          Foto utama
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(idx)}
                          className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/55 text-white text-[10px] font-medium hover:bg-[#267a50] flex items-center gap-1 cursor-pointer"
                        >
                          <Star className="w-2.5 h-2.5" />
                          <span>Utama</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        aria-label="Hapus foto"
                        className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white hover:bg-[#EF4444] flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-full flex flex-col items-center justify-center gap-1 text-[#6F7078] hover:text-[#267a50] cursor-pointer"
                    >
                      <Camera className="w-6 h-6" />
                      <span className="text-[11px] font-semibold">Tambah</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. Basic Information */}
        <section className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] space-y-4">
          <h2 className="text-[18px] font-bold text-[#1d1d1d]">
            Informasi Dasar
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Nama"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Tanggal Lahir"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
            <Select
              label="Gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              options={[
                { value: "male", label: "Laki-laki" },
                { value: "female", label: "Perempuan" },
              ]}
            />
          </div>

          <IndonesiaRegionSelector
            label="Alamat Domisili (Kota/Kabupaten & Kecamatan)"
            value={city}
            onChange={(formatted) => setCity(formatted)}
          />
        </section>

        {/* 3. Bio */}
        <section className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] space-y-4">
          <h2 className="text-[18px] font-bold text-[#1d1d1d]">Bio</h2>
          <Textarea
            placeholder="Contoh: Suka kopi, jalan sore, dan ngobrol sampai lupa waktu."
            maxLength={500}
            showCount
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </section>

        {/* 4. Interests */}
        <section className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] space-y-4">
          <div>
            <h2 className="text-[18px] font-bold text-[#1d1d1d]">Interests</h2>
            <p className="text-[13px] text-[#6F7078]">
              Pilih minimal 3 minat yang menggambarkan dirimu.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {MASTER_INTERESTS.map((item) => (
              <InterestChip
                key={item.slug}
                label={item.name}
                emoji={item.emoji}
                selected={interests.includes(item.slug)}
                onClick={() =>
                  setInterests((prev) =>
                    prev.includes(item.slug)
                      ? prev.filter((s) => s !== item.slug)
                      : [...prev, item.slug]
                  )
                }
              />
            ))}
          </div>
        </section>

        <Button type="submit" variant="primary" size="lg" fullWidth>
          Simpan Perubahan
        </Button>
      </form>
    </AppShell>
  );
}
