"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { BrandLogo, Button, Input, useToast } from "@/components/ui";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    setError(undefined);
    setIsLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${window.location.origin}/settings`,
          }
        );
        if (resetErr) {
          toast({
            title: "Gagal mengirim link reset",
            description: resetErr.message,
            variant: "error",
          });
          setIsLoading(false);
          return;
        }
      }

      setIsSent(true);
      toast({
        title: "Link reset terkirim",
        description: "Cek email kamu untuk membuat password baru.",
        variant: "success",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center items-center px-4 py-10 bg-[#f9f9fa]">
      <div className="w-full max-w-[420px] rounded-[24px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6 sm:p-8 space-y-6">
        <div className="space-y-2 text-center">
          <BrandLogo href="/" size="lg" />
          <h1 className="text-[26px] font-bold text-[#1d1d1d] pt-2">
            Lupa password?
          </h1>
          <p className="text-[14px] text-[#6F7078] leading-relaxed">
            Masukkan email kamu dan kami akan mengirim link untuk membuat
            password baru.
          </p>
        </div>

        {isSent ? (
          <div className="p-4 rounded-[16px] bg-[#eaf5ef] border border-[#267a50]/20 text-center space-y-2">
            <p className="text-[14px] font-semibold text-[#1d1d1d]">
              Link reset sudah dikirim ke {email}
            </p>
            <p className="text-[13px] text-[#6F7078]">
              Silakan periksa kotak masuk email kamu.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              error={error}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
            >
              Kirim Link Reset
            </Button>
          </form>
        )}

        <div className="pt-4 border-t border-[#E9E9EE] text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#6F7078] hover:text-[#1d1d1d]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
