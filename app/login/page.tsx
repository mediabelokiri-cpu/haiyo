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
          if (error?.message?.toLowerCase().includes("email not confirmed")) {
            toast({
              title: "Email belum diverifikasi",
              description:
                "Silakan cek kotak masuk/spam email kamu dan klik link verifikasi terlebih dahulu.",
              variant: "error",
            });
            setIsLoading(false);
            router.push("/verify-email");
            return;
          }
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

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured()) return;
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: "select_account",
          },
        },
      });
      if (error) {
        toast({
          title: "Gagal menghubungkan ke Google",
          description: error.message,
          variant: "error",
        });
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center items-center px-4 py-10 bg-[#f9f9fa]">
      <div className="w-full max-w-[420px] rounded-[24px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6 sm:p-8 space-y-5">
        <div className="text-center space-y-2">
          <BrandLogo href="/" size="lg" />
          <h1 className="text-[26px] font-bold text-[#1d1d1d] pt-2">
            Selamat datang kembali
          </h1>
          <p className="text-[14px] text-[#6F7078]">
            Masuk untuk melihat siapa yang menarik hari ini.
          </p>
        </div>

        {/* Google OAuth Login Button */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-12 px-4 rounded-[14px] bg-white hover:bg-[#F7F7FA] active:scale-[0.99] border border-[#DCDCE4] text-[#1d1d1d] font-semibold text-[14px] flex items-center justify-center gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all cursor-pointer disabled:opacity-60"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.49 12.275c0-.85-.075-1.665-.215-2.45H12v4.635h6.445c-.28 1.495-1.125 2.765-2.395 3.615v3h3.875c2.265-2.085 3.565-5.16 3.565-8.8z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.955-1.075 7.94-2.91l-3.875-3c-1.075.72-2.45 1.145-4.065 1.145-3.125 0-5.77-2.11-6.715-4.945H1.28v3.095C3.255 21.305 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.285 14.29c-.24-.72-.375-1.49-.375-2.29s.135-1.57.375-2.29V6.615H1.28C.465 8.24 0 10.065 0 12s.465 3.76 1.28 5.385l4.005-3.095z"
              />
              <path
                fill="#EA4335"
                d="M12 4.765c1.76 0 3.34.605 4.585 1.795l3.44-3.44C17.95 1.19 15.235 0 12 0 7.31 0 3.255 2.695 1.28 6.615l4.005 3.095c.945-2.835 3.59-4.945 6.715-4.945z"
              />
            </svg>
            <span>Masuk dengan Akun Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#E9E9EE] w-full" />
            <span className="bg-white px-3 text-[12px] font-medium text-[#8C8D96] whitespace-nowrap">
              atau masuk dengan email
            </span>
            <div className="border-t border-[#E9E9EE] w-full" />
          </div>
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
