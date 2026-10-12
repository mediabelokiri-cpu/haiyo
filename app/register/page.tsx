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
      let createdUserId = `user-${Date.now()}`;
      let isEmailConfirmed = false;

      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
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
        if (signUpData.user?.id) {
          createdUserId = signUpData.user.id;
          isEmailConfirmed = Boolean(signUpData.user.email_confirmed_at);
        }
      }

      const state = loadAppState();
      saveAppState({
        ...state,
        currentUser: {
          id: createdUserId,
          email: email.trim().toLowerCase(),
          emailVerified: isEmailConfirmed,
          isOnboarded: false,
          profile: {
            id: createdUserId,
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
            user_id: createdUserId,
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

  const handleGoogleSignUp = async () => {
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
            Yuk, mulai kenalan.
          </h1>
          <p className="text-[14px] text-[#6F7078]">
            Buat akunmu dalam hitungan detik dan temukan teman baru.
          </p>
        </div>

        {/* Google OAuth Sign-Up Button */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignUp}
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
            <span>Daftar dengan Akun Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#E9E9EE] w-full" />
            <span className="bg-white px-3 text-[12px] font-medium text-[#8C8D96] whitespace-nowrap">
              atau daftar dengan email
            </span>
            <div className="border-t border-[#E9E9EE] w-full" />
          </div>
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
