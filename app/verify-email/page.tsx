"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck, ArrowRight } from "lucide-react";
import { BrandLogo, Button, useToast } from "@/components/ui";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { loadAppState, saveAppState } from "@/lib/store/app-state";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const email = searchParams.get("email") ?? "";
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    try {
      if (isSupabaseConfigured() && email) {
        const supabase = createClient();
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
        });
        if (error) {
          toast({
            title: "Gagal mengirim ulang email",
            description: error.message,
            variant: "error",
          });
          return;
        }
      }
      toast({
        title: "Email verifikasi dikirim ulang",
        description: "Silakan cek kotak masuk atau folder spam kamu.",
        variant: "success",
      });
    } finally {
      setIsResending(false);
    }
  };

  const [isChecking, setIsChecking] = useState(false);

  const handleContinueOnboarding = async () => {
    setIsChecking(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || !user.email_confirmed_at) {
          toast({
            title: "Email belum terverifikasi",
            description:
              "Silakan buka inbox email kamu dan klik link verifikasi terlebih dahulu. Jika sudah klik di perangkat/aplikasi lain, silakan klik tombol Login di bawah.",
            variant: "error",
          });
          return;
        }

        const state = loadAppState();
        if (state.currentUser) {
          saveAppState({
            ...state,
            currentUser: {
              ...state.currentUser,
              id: user.id,
              email: (user.email ?? email).trim().toLowerCase(),
              emailVerified: true,
            },
          });
        }
        router.push("/onboarding");
        return;
      }
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center items-center px-4 py-10 bg-[#f9f9fa]">
      <div className="w-full max-w-[420px] rounded-[24px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6 sm:p-8 text-center space-y-6">
        <div className="flex justify-center">
          <BrandLogo href="/" size="lg" />
        </div>

        <div className="w-16 h-16 rounded-full bg-[#eaf5ef] text-[#267a50] flex items-center justify-center mx-auto">
          <MailCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-[26px] font-bold text-[#1d1d1d]">
            Cek email kamu
          </h1>
          <p className="text-[14px] text-[#6F7078] leading-relaxed">
            Kami sudah mengirim link verifikasi ke email kamu
            {email ? (
              <span className="font-semibold text-[#1d1d1d]"> ({email})</span>
            ) : (
              ""
            )}
            . Klik link di dalam email tersebut untuk mengaktifkan akun dan lanjut mengisi profil.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            variant="primary"
            fullWidth
            isLoading={isChecking}
            onClick={handleContinueOnboarding}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Saya Sudah Verifikasi Email
          </Button>

          <Button
            variant="secondary"
            fullWidth
            isLoading={isResending}
            onClick={handleResend}
          >
            Kirim Ulang Email Verifikasi
          </Button>
        </div>

        <div className="pt-4 border-t border-[#E9E9EE]">
          <Link
            href="/login"
            className="text-[14px] font-semibold text-[#6F7078] hover:text-[#1d1d1d]"
          >
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#f9f9fa]" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
