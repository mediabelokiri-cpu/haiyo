"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  MoreVertical,
  PlusSquare,
  Share,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { BrandLogo, Button, Badge, Modal, useToast } from "@/components/ui";
import {
  DEFAULT_HOMEPAGE_CONFIG,
  HomepageConfig,
  loadAppState,
} from "@/lib/store/app-state";
import {
  getDeferredPwaPrompt,
  isAppInstalledStandalone,
  triggerBrowserPwaInstall,
} from "@/lib/pwa-install";

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
  const [canPromptInstall, setCanPromptInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<"android" | "ios" | null>(
    null
  );

  useEffect(() => {
    const sync = () => {
      const state = loadAppState();
      if (state.homepageConfig) {
        setHp(state.homepageConfig);
      }
      setCanPromptInstall(Boolean(getDeferredPwaPrompt()));
      setIsInstalled(isAppInstalledStandalone());
    };
    sync();

    const handlePwaReady = () => setCanPromptInstall(true);
    const handlePwaInstalled = () => {
      setCanPromptInstall(false);
      setIsInstalled(true);
      toast({
        title: "Aplikasi HAIYO berhasil terpasang!",
        description: "Ikon HAIYO kini sudah muncul di layar utama HP kamu.",
        variant: "success",
      });
    };

    window.addEventListener("haiyo-state-updated", sync);
    window.addEventListener("haiyo-pwa-ready", handlePwaReady);
    window.addEventListener("haiyo-pwa-installed", handlePwaInstalled);
    return () => {
      window.removeEventListener("haiyo-state-updated", sync);
      window.removeEventListener("haiyo-pwa-ready", handlePwaReady);
      window.removeEventListener("haiyo-pwa-installed", handlePwaInstalled);
    };
  }, [toast]);

  const handleInstallAction = async (
    platform: "android" | "ios",
    customUrl?: string
  ) => {
    // 1. If Admin provided an external direct installer URL in CMS, open it
    if (customUrl && customUrl.startsWith("http")) {
      window.open(customUrl, "_blank", "noopener,noreferrer");
      return;
    }

    // 2. If already installed as standalone PWA
    if (isAppInstalledStandalone()) {
      toast({
        title: "HAIYO sudah terpasang di HP kamu!",
        description: "Kamu sedang membuka HAIYO langsung dari aplikasi.",
        variant: "success",
      });
      return;
    }

    // 3. Trigger native Browser PWA Install Prompt (Chrome / Edge / Samsung Internet on Android & Desktop)
    const outcome = await triggerBrowserPwaInstall();
    if (outcome === "accepted") {
      setIsInstalled(true);
      setCanPromptInstall(false);
      toast({
        title: "Menginstal aplikasi HAIYO...",
        description: "Cek layar utama HP kamu setelah instalasi selesai.",
        variant: "success",
      });
      return;
    }

    if (outcome === "dismissed") {
      return;
    }

    // 4. If browser requires manual "Add to Home Screen / Install App" (e.g. iOS Safari or in-app browser), open visual step-by-step modal
    setGuidePlatform(platform);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#f9f9fa] text-[#1d1d1d]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 h-14 md:h-16 bg-white/95 backdrop-blur-md border-b border-[#E9E9EE]">
        <div className="max-w-6xl mx-auto h-full px-4 md:px-8 flex items-center justify-between">
          <BrandLogo href="/" size="sm" className="md:hidden" />
          <BrandLogo href="/" size="md" className="hidden md:inline-flex" />

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] md:text-[14px] font-semibold text-[#6F7078] hover:text-[#1d1d1d] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Beranda</span>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">
                Daftar / Masuk
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 md:py-14 px-4 md:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Hero Card (#267a50) */}
          <section className="rounded-[24px] bg-[#267a50] text-white p-6 sm:p-8 md:p-12 shadow-[0_12px_32px_rgba(38,122,80,0.22)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/12 border border-white/20 text-[12px] font-semibold tracking-wide uppercase">
                <Smartphone className="w-3.5 h-3.5 text-[#67bf9a]" />
                <span>Install Langsung dari Browser · Tanpa Play Store / App Store</span>
              </div>

              <h1 className="text-[28px] md:text-[40px] font-bold leading-[1.15] tracking-tight">
                Pasang aplikasi HAIYO langsung ke layar utama HP kamu.
              </h1>

              <p className="text-[14px] md:text-[16px] text-white/90 max-w-2xl leading-relaxed">
                HAIYO menggunakan teknologi <strong>Web App (PWA)</strong> modern
                yang bisa langsung di-install dari browser <strong>Chrome</strong>{" "}
                maupun <strong>Safari</strong> tanpa perlu membuka Play Store
                atau App Store. Sangat ringan (~1 MB), hemat baterai, dan
                tampil layar penuh seperti aplikasi native.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-[13px] text-white/90 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#67bf9a]" />
                  <span>Resmi & Aman Tanpa File APK Luar</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#67bf9a]" />
                  <span>Ukuran Super Ringan (~1 MB)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#67bf9a]" />
                  <span>Gratis 100 Swipe / Hari</span>
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-center">
              <div className="p-6 rounded-[20px] bg-[#f9f9fa] text-[#1d1d1d] w-full max-w-[260px] text-center space-y-3.5 shadow-lg">
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
                    HAIYO Web App
                  </p>
                  <p className="text-[12px] text-[#6F7078]">
                    Instant Browser Install · 18+
                  </p>
                </div>
                {isInstalled ? (
                  <div className="pt-2 border-t border-[#E9E9EE] inline-flex items-center justify-center gap-1.5 text-[12px] font-bold text-[#267a50]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sudah Terpasang di HP Ini</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleInstallAction("android")}
                    className="w-full py-2.5 px-4 rounded-full bg-[#267a50] hover:bg-[#1e6340] text-white text-[13px] font-bold inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {canPromptInstall
                        ? "Install Otomatis Sekarang"
                        : "Install ke Layar Utama"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* 2 Platform Cards: Android Browser & iOS Safari Browser */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Android Card */}
            <div className="p-6 md:p-8 rounded-[24px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-[16px] bg-[#267a50] text-white flex items-center justify-center shadow-sm">
                    <AndroidPlatformSvg className="w-8 h-8" />
                  </div>
                  <Badge variant="primary">Chrome / Browser Android</Badge>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-[22px] md:text-[24px] font-bold text-[#1d1d1d]">
                    Install di HP Android
                  </h2>
                  <p className="text-[14px] text-[#6F7078] leading-relaxed">
                    Pasang langsung dari browser <strong>Google Chrome</strong>{" "}
                    di HP Android kamu (Samsung, Xiaomi, OPPO, vivo, Realme,
                    Infinix, dll) tanpa lewat Play Store.
                  </p>
                </div>

                <ul className="space-y-2.5 pt-2 border-t border-[#E9E9EE] text-[13px] text-[#1d1d1d]">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#eaf5ef] text-[#267a50] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Klik tombol <strong>Install di HP Android</strong> di bawah
                      untuk memunculkan pop-up instalasi otomatis.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#eaf5ef] text-[#267a50] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Atau ketuk ikon menu titik tiga <strong>(⋮)</strong> di
                      pojok kanan atas Chrome lalu pilih{" "}
                      <strong>&ldquo;Install aplikasi&rdquo;</strong> /{" "}
                      <strong>&ldquo;Tambahkan ke Layar utama&rdquo;</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#eaf5ef] text-[#267a50] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Ikon aplikasi <strong>HAIYO</strong> langsung muncul di menu
                      HP Android kamu.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleInstallAction("android", hp.androidDownloadUrl)
                  }
                  className="w-full h-[52px] px-6 rounded-full bg-[#267a50] hover:bg-[#1e6340] text-[#f9f9fa] font-bold text-[15px] inline-flex items-center justify-center gap-2.5 shadow-[0_6px_18px_rgba(38,122,80,0.25)] transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>Install di HP Android (via Browser)</span>
                </button>
              </div>
            </div>

            {/* iOS Card */}
            <div className="p-6 md:p-8 rounded-[24px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-[16px] bg-[#1d1d1d] text-white flex items-center justify-center shadow-sm">
                    <ApplePlatformSvg className="w-8 h-8" />
                  </div>
                  <Badge variant="secondary">Safari / Browser iPhone</Badge>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-[22px] md:text-[24px] font-bold text-[#1d1d1d]">
                    Install di iPhone (iOS)
                  </h2>
                  <p className="text-[14px] text-[#6F7078] leading-relaxed">
                    Pasang langsung dari browser <strong>Safari</strong> atau{" "}
                    <strong>Chrome</strong> di iPhone/iPad kamu ke layar utama
                    (*Home Screen*) tanpa lewat App Store.
                  </p>
                </div>

                <ul className="space-y-2.5 pt-2 border-t border-[#E9E9EE] text-[13px] text-[#1d1d1d]">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#eaf5ef] text-[#267a50] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Buka <strong>haiyoid.vercel.app</strong> menggunakan browser{" "}
                      <strong>Safari</strong> di iPhone kamu.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#eaf5ef] text-[#267a50] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Ketuk tombol <strong>Bagikan (Share)</strong> di bagian
                      bawah layar Safari.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#eaf5ef] text-[#267a50] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Pilih menu{" "}
                      <strong>
                        &ldquo;Tambahkan ke Layar Utama&rdquo; (Add to Home
                        Screen)
                      </strong>{" "}
                      lalu ketuk <strong>Tambah</strong>.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleInstallAction("ios", hp.iosDownloadUrl)}
                  className="w-full h-[52px] px-6 rounded-full bg-[#1d1d1d] hover:bg-[#267a50] text-[#f9f9fa] font-bold text-[15px] inline-flex items-center justify-center gap-2.5 shadow-[0_6px_18px_rgba(29,29,29,0.2)] transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>Install di iPhone / iOS (via Browser)</span>
                </button>
              </div>
            </div>
          </section>

          {/* Direct Web App Launch Banner */}
          <section className="p-6 md:p-8 rounded-[20px] bg-white border border-[#E9E9EE] flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-[18px] font-bold text-[#1d1d1d]">
                Ingin langsung pakai sekarang di browser ini?
              </h3>
              <p className="text-[14px] text-[#6F7078]">
                Kamu juga bisa langsung membuat akun atau login dan mulai swipe
                sekarang juga langsung dari browser.
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

      {/* Interactive Browser Install Guide Modal */}
      <Modal
        isOpen={guidePlatform !== null}
        onClose={() => setGuidePlatform(null)}
        title={
          guidePlatform === "ios"
            ? "Cara Install HAIYO di iPhone (Safari)"
            : "Cara Install HAIYO di HP Android (Chrome)"
        }
        description="Ikuti 3 langkah cepat ini di browser HP kamu (hanya butuh 5 detik):"
      >
        <div className="space-y-4">
          {/* Switch tabs between Android & iOS inside modal */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-[12px] bg-[#f9f9fa] border border-[#E9E9EE]">
            <button
              type="button"
              onClick={() => setGuidePlatform("android")}
              className={`py-2 px-3 rounded-[9px] text-[13px] font-bold transition-colors cursor-pointer ${
                guidePlatform === "android"
                  ? "bg-[#267a50] text-white"
                  : "text-[#6F7078] hover:text-[#1d1d1d]"
              }`}
            >
              HP Android (Chrome)
            </button>
            <button
              type="button"
              onClick={() => setGuidePlatform("ios")}
              className={`py-2 px-3 rounded-[9px] text-[13px] font-bold transition-colors cursor-pointer ${
                guidePlatform === "ios"
                  ? "bg-[#1d1d1d] text-white"
                  : "text-[#6F7078] hover:text-[#1d1d1d]"
              }`}
            >
              iPhone / iOS (Safari)
            </button>
          </div>

          {guidePlatform === "android" ? (
            <div className="space-y-3 text-[13px] text-[#1d1d1d]">
              <div className="p-3.5 rounded-[14px] bg-[#f9f9fa] border border-[#E9E9EE] flex items-start gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-[#eaf5ef] text-[#267a50] flex items-center justify-center shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold">
                    1. Ketuk Ikon Menu Titik Tiga (⋮) di Browser
                  </p>
                  <p className="text-[#6F7078] mt-0.5">
                    Terletak di pojok kanan atas layar browser Google Chrome
                    kamu.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-[14px] bg-[#f9f9fa] border border-[#E9E9EE] flex items-start gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-[#eaf5ef] text-[#267a50] flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold">
                    2. Pilih &ldquo;Install aplikasi&rdquo; atau &ldquo;Tambahkan ke Layar utama&rdquo;
                  </p>
                  <p className="text-[#6F7078] mt-0.5">
                    Konfirmasi dengan menekan tombol <strong>Install</strong>{" "}
                    pada pop-up yang muncul.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-[14px] bg-[#eaf5ef]/70 border border-[#67bf9a]/40 flex items-start gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-[#267a50] text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[#1e6340]">
                    3. Selesai! Buka dari Layar Utama HP
                  </p>
                  <p className="text-[#1e6340]/85 mt-0.5">
                    Ikon aplikasi <strong>HAIYO</strong> akan muncul di daftar
                    aplikasi HP Android kamu.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-[13px] text-[#1d1d1d]">
              <div className="p-3.5 rounded-[14px] bg-[#f9f9fa] border border-[#E9E9EE] flex items-start gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-[#eaf5ef] text-[#267a50] flex items-center justify-center shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold">
                    1. Ketuk Tombol Bagikan (Share) di Bawah Safari
                  </p>
                  <p className="text-[#6F7078] mt-0.5">
                    Ikon kotak dengan panah ke atas di bagian bar bawah browser
                    Safari iPhone.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-[14px] bg-[#f9f9fa] border border-[#E9E9EE] flex items-start gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-[#eaf5ef] text-[#267a50] flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold">
                    2. Pilih &ldquo;Tambahkan ke Layar Utama&rdquo; (Add to Home Screen)
                  </p>
                  <p className="text-[#6F7078] mt-0.5">
                    Gulir sedikit ke bawah pada menu Share lalu ketuk pilihan
                    tersebut.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-[14px] bg-[#eaf5ef]/70 border border-[#67bf9a]/40 flex items-start gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-[#267a50] text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[#1e6340]">
                    3. Ketuk &ldquo;Tambah&rdquo; (Add) di Pojok Kanan Atas
                  </p>
                  <p className="text-[#1e6340]/85 mt-0.5">
                    Aplikasi <strong>HAIYO</strong> langsung terpasang di Home
                    Screen iPhone kamu!
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <Link href="/register" className="flex-1">
              <Button
                variant="primary"
                fullWidth
                rightIcon={<ExternalLink className="w-4 h-4" />}
              >
                Langsung Buat Akun Sekarang
              </Button>
            </Link>
            <Button variant="secondary" onClick={() => setGuidePlatform(null)}>
              Tutup Panduan
            </Button>
          </div>
        </div>
      </Modal>

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
