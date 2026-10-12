"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { BrandLogo, Button, Checkbox, Input, useToast } from "@/components/ui";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { loadAppState, saveAppState } from "@/lib/store/app-state";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAdultConfirmed, setIsAdultConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    adult?: string;
  }>({});

  const validate = () => {
    const nextErrors: typeof errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim() || !emailRegex.test(email.trim())) {
      nextErrors.email = "Masukkan alamat email yang valid.";
    }
    if (password.length < 8) {
      nextErrors.password = "Password minimal 8 karakter.";
    }
    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Konfirmasi password tidak cocok.";
    }
    if (!isAdultConfirmed) {
      nextErrors.adult = "Kamu harus berusia minimal 18 tahun untuk mendaftar.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          toast({
            title: "Gagal membuat akun",
            description: error.message,
            variant: "error",
          });
          setIsLoading(false);
          return;
        }
      }

      const state = loadAppState();
      const newUserId = `user-${Date.now()}`;
      saveAppState({
        ...state,
        currentUser: {
          id: newUserId,
          email: email.trim().toLowerCase(),
          emailVerified: false,
          isOnboarded: false,
          profile: {
            id: newUserId,
            name: "",
            date_of_birth: "2002-01-01",
            gender: "male",
            city: "Kec. Panakkukang, Kota Makassar",
            bio: "",
            status: "active",
            is_admin: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          photos: [],
          interests: [],
          preferences: {
            user_id: newUserId,
            preferred_gender: "female",
            min_age: 20,
            max_age: 30,
            radius_km: 25,
            updated_at: new Date().toISOString(),
          },
        },
      });

      toast({
        title: "Akun berhasil dibuat",
        description: "Silakan cek email kamu untuk verifikasi.",
        variant: "success",
      });
      router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
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
            Yuk, mulai kenalan.
          </h1>
          <p className="text-[14px] text-[#6F7078]">
            Buat akunmu dalam hitungan detik dan temukan teman baru.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
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

          <Input
            label="Konfirmasi Password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Ulangi password kamu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.confirmPassword}
          />

          <div className="pt-1">
            <Checkbox
              checked={isAdultConfirmed}
              onChange={(e) => setIsAdultConfirmed(e.target.checked)}
              label="Saya berusia 18 tahun atau lebih."
              description="HAIYO hanya diperuntukkan bagi pengguna dewasa (18+)."
              error={errors.adult}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
            >
              Buat Akun
            </Button>
          </div>
        </form>

        <div className="pt-4 border-t border-[#E9E9EE] text-center text-[14px] text-[#6F7078]">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#267a50] hover:underline"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
