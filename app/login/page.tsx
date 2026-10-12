"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { BrandLogo, Button, Input, useToast } from "@/components/ui";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { loadAppState, saveAppState } from "@/lib/store/app-state";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!email.trim()) nextErrors.email = "Masukkan email kamu.";
    if (!password) nextErrors.password = "Masukkan password kamu.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const normalizedEmail = email.trim().toLowerCase();

    setIsLoading(true);
    try {
      // Dedicated Super Admin Account (admin@haiyo.id / Brip@l007)
      if (normalizedEmail === "admin@haiyo.id") {
        if (password !== "Brip@l007") {
          toast({
            title: "Login Admin gagal",
            description: "Password untuk akun admin@haiyo.id tidak sesuai.",
            variant: "error",
          });
          setIsLoading(false);
          return;
        }

        // Also sign in to Supabase Auth if admin@haiyo.id was added in Supabase Dashboard
        if (isSupabaseConfigured()) {
          const supabase = createClient();
          await supabase.auth
            .signInWithPassword({
              email: normalizedEmail,
              password,
            })
            .catch(() => null);
        }

        const state = loadAppState();
        saveAppState({
          ...state,
          currentUser: {
            ...(state.currentUser ?? {
              id: "admin-haiyo",
              email: "admin@haiyo.id",
              emailVerified: true,
              isOnboarded: true,
              profile: {
                id: "admin-haiyo",
                name: "Admin HAIYO",
                date_of_birth: "1998-05-14",
                gender: "male",
                city: "Kec. Panakkukang, Kota Makassar",
                bio: "Official Administrator HAIYO Indonesia.",
                status: "active",
                is_admin: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              photos: [],
              interests: ["coffee", "music", "travel"],
              preferences: {
                user_id: "admin-haiyo",
                preferred_gender: "female",
                min_age: 20,
                max_age: 30,
                radius_km: 25,
                updated_at: new Date().toISOString(),
              },
            }),
            email: "admin@haiyo.id",
            emailVerified: true,
            isOnboarded: true,
            profile: {
              ...(state.currentUser?.profile ?? {
                id: "admin-haiyo",
                name: "Admin HAIYO",
                date_of_birth: "1998-05-14",
                gender: "male",
                city: "Kec. Panakkukang, Kota Makassar",
                bio: "Official Administrator HAIYO Indonesia.",
                status: "active",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }),
              name: state.currentUser?.profile.name || "Admin HAIYO",
              status: "active",
              is_admin: true,
            },
          },
        });

        toast({
          title: "Selamat datang, Admin HAIYO!",
          description: "Akses penuh Portal Admin telah diaktifkan.",
          variant: "success",
        });
        router.push("/admin");
        return;
      }

      // Regular User / DB Admin Login via Supabase Auth
      let isUserAdmin = false;
      let isUserOnboarded = false;
      const state = loadAppState();

      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { data: authData, error } =
          await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });
        if (error || !authData.user) {
          toast({
            title: "Login belum berhasil",
            description: "Periksa kembali email dan password kamu.",
            variant: "error",
          });
          setIsLoading(false);
          return;
        }

        const userId = authData.user.id;
        const [
          { data: profileRow },
          { data: photoRows },
          { data: prefRow },
        ] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
          supabase
            .from("profile_photos")
            .select("*")
            .eq("user_id", userId)
            .order("display_order", { ascending: true }),
          supabase
            .from("user_preferences")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle(),
        ]);

        if (
          profileRow?.status === "suspended" ||
          profileRow?.status === "banned"
        ) {
          toast({
            title: "Akun dinonaktifkan",
            description:
              "Akun kamu sedang ditangguhkan oleh tim moderasi HAIYO.",
            variant: "error",
          });
          setIsLoading(false);
          return;
        }

        isUserAdmin = Boolean(profileRow?.is_admin);
        isUserOnboarded = Boolean(profileRow?.name && profileRow?.city);

        const mappedPhotos = (photoRows ?? []).map((ph, idx) => ({
          id: ph.id ?? `ph-${idx}`,
          user_id: userId,
          storage_path: ph.storage_path,
          public_url:
            ph.storage_path.startsWith("http") ||
            ph.storage_path.startsWith("data:")
              ? ph.storage_path
              : supabase.storage
                  .from("profile-photos")
                  .getPublicUrl(
                    ph.storage_path.replace(/^profile-photos\//, "")
                  ).data.publicUrl,
          is_primary: Boolean(ph.is_primary ?? idx === 0),
          display_order: ph.display_order ?? idx,
          created_at: ph.created_at ?? new Date().toISOString(),
        }));

        saveAppState({
          ...state,
          currentUser: {
            id: userId,
            email: normalizedEmail,
            emailVerified: Boolean(authData.user.email_confirmed_at ?? true),
            isOnboarded: isUserOnboarded,
            profile: {
              id: userId,
              name: profileRow?.name ?? "",
              date_of_birth: profileRow?.date_of_birth ?? "",
              gender: profileRow?.gender === "female" ? "female" : "male",
              city: profileRow?.city ?? "",
              bio: profileRow?.bio ?? "",
              latitude: profileRow?.latitude ?? null,
              longitude: profileRow?.longitude ?? null,
              status: profileRow?.status ?? "active",
              is_admin: isUserAdmin,
              created_at: profileRow?.created_at ?? new Date().toISOString(),
              updated_at: profileRow?.updated_at ?? new Date().toISOString(),
            },
            photos: mappedPhotos,
            interests: state.currentUser?.interests ?? [],
            preferences: {
              user_id: userId,
              preferred_gender:
                prefRow?.preferred_gender === "male" ? "male" : "female",
              min_age: prefRow?.min_age ?? 20,
              max_age: prefRow?.max_age ?? 30,
              radius_km: prefRow?.radius_km ?? 25,
              updated_at: prefRow?.updated_at ?? new Date().toISOString(),
            },
          },
        });
      }

      toast({
        title: "Selamat datang kembali",
        variant: "success",
      });

      if (isUserAdmin) {
        router.push("/admin");
      } else if (!isUserOnboarded) {
        router.push("/onboarding");
      } else {
        router.push("/discover");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center items-center px-4 py-10 bg-[#f9f9fa]">
      <div className="w-full max-w-[420px] rounded-[24px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <BrandLogo href="/" size="lg" />
          <h1 className="text-[26px] font-bold text-[#1d1d1d] pt-2">
            Selamat datang kembali
          </h1>
          <p className="text-[14px] text-[#6F7078]">
            Masuk untuk melihat siapa yang menarik hari ini.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email}
          />

          <div className="space-y-1.5">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Lihat password"
                  }
                  className="p-1.5 text-[#6F7078] hover:text-[#1d1d1d] cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
              error={errors.password}
            />
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-[13px] font-semibold text-[#267a50] hover:underline"
              >
                Lupa password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
          >
            Login
          </Button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-[#E9E9EE]" />
          <span className="bg-white px-3 text-[12px] text-[#6F7078] uppercase tracking-wider">
            atau
          </span>
          <div className="w-full border-t border-[#E9E9EE]" />
        </div>

        <Link href="/register" className="block">
          <Button variant="secondary" fullWidth>
            Buat akun baru
          </Button>
        </Link>
      </div>
    </div>
  );
}
