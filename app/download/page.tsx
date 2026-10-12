"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Download,
  QrCode,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { BrandLogo, Button, Badge, useToast } from "@/components/ui";
import {
  DEFAULT_HOMEPAGE_CONFIG,
  HomepageConfig,
  loadAppState,
} from "@/lib/store/app-state";

function AndroidPlatformSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.523 15.341a.96.96 0 0 1-.959-.96.96.96 0 0 1 .959-.96.96.96 0 0 1 .96.96.96.96 0 0 1-.96.96Zm-11.046 0a.96.96 0 0 1-.96-.96.96.96 0 0 1 .96-.96.96.96 0 0 1 .959.96.96.96 0 0 1-.959.96Zm11.4-6.022 1.916-3.318a.4.4 0 0 0-.146-.547.4.4 0 0 0-.547.146l-1.94 3.36A11.45 11.45 0 0 0 12 7.92c-1.855 0-3.605.38-5.16.96L4.9 5.52a.4.4 0 0 0-.547-.146.4.4 0 0 0-.146.547l1.916 3.318C2.735 11.08.458 14.482.24 18.48h23.52c-.218-3.998-2.495-7.4-5.883-9.161Z" />
    </svg>
  );
}

function ApplePlatformSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83ZM15.96 6.33c.67-.81 1.12-1.94 1-3.08-.96.04-2.13.64-2.82 1.45-.61.7-.115 1.85-1.01 2.97 1.08.08 2.16-.53 2.83-1.34Z" />
    </svg>
  );
}

export default function DownloadAppPage() {
  const { toast } = useToast();
  const [hp, setHp] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);

  useEffect(() => {
    const sync = () => {
      const state = loadAppState();
      if (state.homepageConfig) {
        setHp(state.homepageConfig);
      }
    };
    sync();
    window.addEventListener("haiyo-state-updated", sync);
    return () => window.removeEventListener("haiyo-state-updated", sync);
  }, []);

  const handleDownloadClick = (platform: "Android" | "iOS", url: string) => {
    if (url && url.startsWith("http")) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    toast({
      title: `Mengunduh HAIYO untuk ${platform}`,
      description: `Paket instalasi HAIYO (${
        platform === "Android" ? hp.androidVersion : hp.iosVersion
      }) sedang disiapkan.`,
      variant: "success",
    });
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#f9f9fa] text-[#1d1d1d]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#E9E9EE]">
        <div className="max-w-6xl mx-auto h-full px-4 md:px-8 flex items-center justify-between">
          <BrandLogo href="/" size="md" />

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#6F7078] hover:text-[#1d1d1d] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">
                Buka Web App
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-10 md:py-16 px-4 md:px-8">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Hero Card (#267a50) */}
          <section className="rounded-[24px] bg-[#267a50] text-white p-8 md:p-12 shadow-[0_12px_32px_rgba(38,122,80,0.22)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/12 border border-white/20 text-[12px] font-semibold tracking-wide uppercase">
                <Smartphone className="w-3.5 h-3.5 text-[#67bf9a]" />
                <span>HAIYO Mobile App · Android & iOS</span>
              </div>

              <h1 className="text-[30px] md:text-[42px] font-bold leading-[1.15] tracking-tight">
                Kenalan lebih cepat langsung dari smartphone kamu.
              </h1>

              <p className="text-[15px] md:text-[17px] text-white/85 max-w-2xl leading-relaxed">
                Unduh aplikasi resmi HAIYO untuk Android dan iOS. Dapatkan
                notifikasi Match & pesan baru secara instan, performa swipe yang
                lebih mulus, dan hemat kuota data.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2 text-[13px] text-white/90 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#67bf9a]" />
                  <span>Resmi & Bebas Malware</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#67bf9a]" />
                  <span>Gratis 100 Swipe / Hari</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#67bf9a]" />
                  <span>Sinkron Otomatis dengan Akun Web</span>
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-center">
              <div className="p-6 rounded-[20px] bg-[#f9f9fa] text-[#1d1d1d] w-full max-w-[260px] text-center space-y-3 shadow-lg">
                <div className="w-16 h-16 mx-auto rounded-[16px] overflow-hidden shadow-sm border border-[#E9E9EE]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logourlbar.png"
                    alt="HAIYO App Icon"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-[16px] font-bold text-[#1d1d1d]">
                    HAIYO — Social Discovery
                  </p>
                  <p className="text-[12px] text-[#6F7078]">
                    Rating 4.9 · Khusus Pengguna 18+
                  </p>
                </div>
                <div className="pt-2 border-t border-[#E9E9EE] flex items-center justify-center gap-2 text-[12px] font-semibold text-[#267a50]">
                  <QrCode className="w-4 h-4" />
                  <span>Tersedia di Android & iOS</span>
                </div>
              </div>
            </div>
          </section>

          {/* 2 Platform Cards: Android & iOS */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Android Card */}
            <div className="p-7 md:p-8 rounded-[24px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-[16px] bg-[#267a50] text-white flex items-center justify-center shadow-sm">
                    <AndroidPlatformSvg className="w-8 h-8" />
                  </div>
                  <Badge variant="primary">{hp.androidVersion}</Badge>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-[24px] font-bold text-[#1d1d1d]">
                    HAIYO untuk Android
                  </h2>
                  <p className="text-[14px] text-[#6F7078] leading-relaxed">
                    Kompatibel untuk seluruh smartphone Android (Samsung, Xiaomi,
                    OPPO, vivo, Realme, Asus, dan lainnya).
                  </p>
                </div>

                <ul className="space-y-2 pt-2 border-t border-[#E9E9EE] text-[13px] text-[#1d1d1d]">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#267a50] stroke-[2.5]" />
                    <span>Google Play Store & Direct APK Installer (24 MB)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#267a50] stroke-[2.5]" />
                    <span>Notifikasi push realtime untuk Match & Chat</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#267a50] stroke-[2.5]" />
                    <span>Mendukung pembayaran QRIS & E-Wallet instan</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadClick("Android", hp.androidDownloadUrl)
                  }
                  className="w-full h-[52px] px-6 rounded-full bg-[#267a50] hover:bg-[#1e6340] text-[#f9f9fa] font-bold text-[15px] inline-flex items-center justify-center gap-2.5 shadow-[0_6px_18px_rgba(38,122,80,0.25)] transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>Download untuk Android (Google Play / APK)</span>
                </button>
              </div>
            </div>

            {/* iOS Card */}
            <div className="p-7 md:p-8 rounded-[24px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-[16px] bg-[#1d1d1d] text-white flex items-center justify-center shadow-sm">
                    <ApplePlatformSvg className="w-8 h-8" />
                  </div>
                  <Badge variant="secondary">{hp.iosVersion}</Badge>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-[24px] font-bold text-[#1d1d1d]">
                    HAIYO untuk iOS (iPhone)
                  </h2>
                  <p className="text-[14px] text-[#6F7078] leading-relaxed">
                    Dirancang optimal untuk pengguna iPhone dan iPad dengan
                    dukungan gestur swipe yang responsif.
                  </p>
                </div>

                <ul className="space-y-2 pt-2 border-t border-[#E9E9EE] text-[13px] text-[#1d1d1d]">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#267a50] stroke-[2.5]" />
                    <span>Tersedia melalui App Store & iOS Web App (28 MB)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#267a50] stroke-[2.5]" />
                    <span>Privasi lokasi tingkat lanjut sesuai standar iOS</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#267a50] stroke-[2.5]" />
                    <span>Bisa dipasang langsung via Safari (Add to Home Screen)</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleDownloadClick("iOS", hp.iosDownloadUrl)}
                  className="w-full h-[52px] px-6 rounded-full bg-[#1d1d1d] hover:bg-[#267a50] text-[#f9f9fa] font-bold text-[15px] inline-flex items-center justify-center gap-2.5 shadow-[0_6px_18px_rgba(29,29,29,0.2)] transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>Download untuk iOS (App Store)</span>
                </button>
              </div>
            </div>
          </section>

          {/* Direct Web App / PWA Alternative Banner */}
          <section className="p-6 md:p-8 rounded-[20px] bg-white border border-[#E9E9EE] flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-[18px] font-bold text-[#1d1d1d]">
                Ingin langsung mencoba tanpa instalasi?
              </h3>
              <p className="text-[14px] text-[#6F7078]">
                Kamu juga bisa langsung menggunakan HAIYO Web App dari browser
                HP atau laptop kamu sekarang juga.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/login">
                <Button variant="secondary">Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="primary">Buat Akun Gratis</Button>
              </Link>
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-auto bg-white border-t border-[#E9E9EE] py-8 px-4 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#6F7078]">
          <div className="flex items-center gap-2.5">
            <BrandLogo href="/" size="sm" />
            <span>· Ketemu orang baru, siapa tahu jadi sesuatu.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href="/" className="hover:text-[#267a50]">
              Beranda
            </Link>
            <span>Khusus 18+</span>
            <span>
              © 2026 HAIYO | Dikembangkan oleh{" "}
              <a
                href="https://labide.site/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#267a50] hover:text-[#1e6340] transition-colors"
              >
                LABIDE
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
