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

    setIsLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          toast({
            title: "Login belum berhasil",
            description: "Periksa kembali email dan password kamu.",
            variant: "error",
          });
          setIsLoading(false);
          return;
        }
      }

      const state = loadAppState();
      if (
        state.currentUser?.profile.status === "suspended" ||
        state.currentUser?.profile.status === "banned"
      ) {
        toast({
          title: "Akun dinonaktifkan",
          description: "Akun kamu sedang ditangguhkan oleh tim moderasi HAIYO.",
          variant: "error",
        });
        setIsLoading(false);
        return;
      }

      if (state.currentUser) {
        saveAppState({
          ...state,
          currentUser: {
            ...state.currentUser,
            email: email.trim(),
          },
        });
      }

      toast({
        title: "Selamat datang kembali",
        variant: "success",
      });

      if (state.currentUser && !state.currentUser.isOnboarded) {
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
