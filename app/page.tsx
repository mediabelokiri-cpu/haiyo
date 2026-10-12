"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  MapPin,
  Check,
  UserCheck,
  Eye,
  Compass,
  Star,
  Zap,
  Users,
  Download,
  ArrowLeft,
  X,
} from "lucide-react";
import {
  BrandLogo,
  Button,
  Badge,
  PremiumBadge,
  InterestChip,
  PassButton,
  LikeButton,
} from "@/components/ui";
import {
  DEFAULT_HOMEPAGE_CONFIG,
  HomepageConfig,
  loadAppState,
} from "@/lib/store/app-state";

type MobileSectionView =
  | "beranda"
  | "cara-kerja"
  | "fitur"
  | "keamanan"
  | "premium";

const PREMIUM_PLANS = [
  {
    code: "PREMIUM_7D",
    duration: "7 HARI",
    price: "Rp12.000",
    subtitle: "Cocok untuk mencoba fitur Premium lebih dulu.",
    badge: null,
    badgeIcon: null,
    cta: "Coba Premium",
    highlighted: false,
  },
  {
    code: "PREMIUM_1M",
    duration: "1 BULAN",
    price: "Rp29.000",
    subtitle: "± Rp967 / hari · Pilihan favorit pengguna reguler.",
    badge: "PALING POPULER",
    badgeIcon: Star,
    cta: "Pilih Paket",
    highlighted: true,
  },
  {
    code: "PREMIUM_3M",
    duration: "3 BULAN",
    price: "Rp69.000",
    subtitle: "± Rp767 / hari · Lebih hemat untuk kenalan lebih lama.",
    badge: "BEST VALUE",
    badgeIcon: Zap,
    cta: "Pilih Paket",
    highlighted: false,
  },
];

/**
 * Bespoke architectural vector icons for the 4 core features.
 * Designed with clean geometric lines to avoid any generic/AI-generated look.
 */
function FeatureProfessionalIcon({ index }: { index: number }) {
  switch (index) {
    case 0:
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" strokeOpacity="0.4" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
        </svg>
      );
    case 1:
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
          aria-hidden="true"
        >
          <rect x="4" y="5" width="11" height="14" rx="2.5" />
          <path d="M9 3h9a2.5 2.5 0 0 1 2.5 2.5v11" strokeOpacity="0.55" />
          <path d="m7.5 12 2 2 3.5-3.5" />
        </svg>
      );
    case 2:
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
          aria-hidden="true"
        >
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H9l-4 3.5V16A2.5 2.5 0 0 1 4 13.5v-7Z" />
          <path d="M8 9h8M8 12h5" />
        </svg>
      );
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
          aria-hidden="true"
        >
          <path d="M4 7h10M18 7h2" />
          <circle cx="16" cy="7" r="2" />
          <path d="M4 12h4M12 12h8" />
          <circle cx="10" cy="12" r="2" />
          <path d="M4 17h12M20 17h0" />
          <circle cx="18" cy="17" r="2" />
        </svg>
      );
  }
}

export default function LandingPage() {
  const [hp, setHp] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSection, setMobileSection] =
    useState<MobileSectionView>("beranda");

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

  const handleSelectMobileSection = (target: MobileSectionView) => {
    setMobileSection(target);
    setMobileMenuOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#f9f9fa] text-[#1d1d1d]">
      {/* Top Navbar — Compact on Mobile (h-[44px]) so it fits phone screens cleanly */}
      <header className="sticky top-0 z-40 h-[44px] lg:h-16 bg-white lg:bg-white/90 lg:backdrop-blur-md lg:border-b lg:border-[#E9E9EE]">
        <div className="max-w-6xl mx-auto h-full px-4 md:px-8 flex items-center justify-between">
          <div
            onClick={() => handleSelectMobileSection("beranda")}
            className="cursor-pointer flex items-center"
          >
            <BrandLogo href="/" size="md" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-[14px] font-medium text-[#6F7078]">
            <a href="#cara-kerja" className="hover:text-[#1d1d1d] transition-colors">
              Cara Kerja
            </a>
            <a href="#fitur" className="hover:text-[#1d1d1d] transition-colors">
              Fitur
            </a>
            <a href="#keamanan" className="hover:text-[#1d1d1d] transition-colors">
              Keamanan
            </a>
            <a href="#premium" className="hover:text-[#1d1d1d] transition-colors">
              Premium
            </a>
            <Link
              href="/download"
              className="text-[#267a50] font-semibold hover:underline"
            >
              Download App
            </Link>
          </nav>

          {/* Desktop Auth CTAs */}
          <div className="hidden lg:flex items-center gap-2.5">
            <Link href="/login">
              <Button variant="secondary" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">
                {hp.heroPrimaryCta}
              </Button>
            </Link>
          </div>

          {/* Compact Mobile Hamburger Menu Button (#267a50 3 bars) */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-1.5 -mr-1.5 text-[#267a50] focus-visible:outline-none cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 stroke-[2.4]" />
            ) : (
              <svg
                viewBox="0 0 24 18"
                fill="none"
                className="w-[20px] h-[14px] text-[#267a50]"
                aria-hidden="true"
              >
                <rect x="0" y="0" width="24" height="2.6" rx="1.3" fill="currentColor" />
                <rect x="0" y="7.6" width="24" height="2.6" rx="1.3" fill="currentColor" />
                <rect x="0" y="15.2" width="24" height="2.6" rx="1.3" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Dropdown Navigation Drawer (Burger Menu) */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-[#E9E9EE] shadow-[0_12px_28px_rgba(0,0,0,0.12)] px-5 py-4 space-y-3.5">
            <nav className="flex flex-col space-y-2 text-[14px] font-semibold text-[#1d1d1d]">
              <button
                type="button"
                onClick={() => handleSelectMobileSection("beranda")}
                className={`text-left py-1.5 cursor-pointer ${
                  mobileSection === "beranda"
                    ? "text-[#267a50] font-bold"
                    : "hover:text-[#267a50]"
                }`}
              >
                Beranda
              </button>
              <button
                type="button"
                onClick={() => handleSelectMobileSection("cara-kerja")}
                className={`text-left py-1.5 cursor-pointer ${
                  mobileSection === "cara-kerja"
                    ? "text-[#267a50] font-bold"
                    : "hover:text-[#267a50]"
                }`}
              >
                Cara Kerja
              </button>
              <button
                type="button"
                onClick={() => handleSelectMobileSection("fitur")}
                className={`text-left py-1.5 cursor-pointer ${
                  mobileSection === "fitur"
                    ? "text-[#267a50] font-bold"
                    : "hover:text-[#267a50]"
                }`}
              >
                Fitur Utama
              </button>
              <button
                type="button"
                onClick={() => handleSelectMobileSection("keamanan")}
                className={`text-left py-1.5 cursor-pointer ${
                  mobileSection === "keamanan"
                    ? "text-[#267a50] font-bold"
                    : "hover:text-[#267a50]"
                }`}
              >
                Keamanan & Privasi
              </button>
              <button
                type="button"
                onClick={() => handleSelectMobileSection("premium")}
                className={`text-left py-1.5 cursor-pointer ${
                  mobileSection === "premium"
                    ? "text-[#267a50] font-bold"
                    : "hover:text-[#267a50]"
                }`}
              >
                Paket Premium
              </button>
              <Link
                href="/download"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 text-[#267a50] font-bold"
              >
                Install Aplikasi (Android & iOS)
              </Link>
            </nav>

            <div className="pt-3 border-t border-[#E9E9EE] grid grid-cols-2 gap-2.5">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" size="sm" fullWidth>
                  Login
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="sm" fullWidth>
                  {hp.heroPrimaryCta}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Back-to-Beranda Bar when viewing a Burger Menu section on mobile */}
      {mobileSection !== "beranda" && (
        <div className="lg:hidden bg-white border-b border-[#E9E9EE] px-4 py-2.5">
          <button
            type="button"
            onClick={() => handleSelectMobileSection("beranda")}
            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#267a50] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      )}

      {/* =====================================================================
          1A. MOBILE BERANDA (< lg) — Single-Screen per UIUX/haiyomobile1.jpg
          ===================================================================== */}
      {mobileSection === "beranda" && (
        <section className="lg:hidden flex-1 flex flex-col bg-white pt-2 overflow-hidden">
          {/* Profile Card on White Top Canvas */}
          <div className="px-6 flex justify-center relative z-20">
            <div className="w-full max-w-[268px] sm:max-w-[300px]">
              <div className="relative rounded-[22px] overflow-hidden bg-[#1d1d1d] shadow-[0_14px_34px_rgba(0,0,0,0.26)] aspect-[3/4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hp.heroCardPhotoUrl}
                  alt={`Preview profil ${hp.heroCardName} di HAIYO`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                  <PremiumBadge />
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/45 backdrop-blur-sm text-white text-[10px] font-medium border border-white/15">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                    <span>Aktif di sekitar</span>
                  </span>
                </div>

                <div className="absolute bottom-0 inset-x-0 p-4 pb-7 text-white space-y-1.5">
                  <div>
                    <h2 className="text-[21px] font-bold leading-tight">
                      {hp.heroCardName}
                    </h2>
                    <p className="text-[11px] text-white/85 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#67bf9a]" />
                      <span>{hp.heroCardLocation}</span>
                    </p>
                  </div>

                  <p className="text-[12px] text-white/95 line-clamp-2 leading-snug">
                    &ldquo;{hp.heroCardBio}&rdquo;
                  </p>

                  <div className="flex flex-wrap gap-1 pt-0.5">
                    <InterestChip label="Coffee" slug="coffee" interactive={false} />
                    <InterestChip label="Music" slug="music" interactive={false} />
                    <InterestChip label="Travel" slug="travel" interactive={false} />
                  </div>
                </div>
              </div>

              {/* Docked Pass & Like Pill Capsule */}
              <div className="relative z-30 -mt-6 flex justify-center">
                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.20)]">
                  <PassButton aria-label="Contoh tombol Pass" />
                  <LikeButton aria-label="Contoh tombol Like" />
                </div>
              </div>
            </div>
          </div>

          {/* Curved Green Wave Arch (#267a50) Filling the Rest of the Mobile Screen */}
          <div className="relative z-10 -mt-20 flex-1 flex flex-col">
            <svg
              viewBox="0 0 400 72"
              preserveAspectRatio="none"
              shapeRendering="geometricPrecision"
              className="w-full h-[52px] sm:h-[64px] -mb-[3px] block text-[#267a50] shrink-0"
              aria-hidden="true"
            >
              <path
                d="M0,0 Q200,68 400,0 L400,72 L0,72 Z"
                fill="currentColor"
              />
            </svg>

            <div className="flex-1 bg-[#267a50] text-white px-5 pt-12 sm:pt-16 pb-6 text-center flex flex-col items-center justify-between gap-5">
              <div className="space-y-3.5 flex flex-col items-center">
                <h1 className="text-[25px] sm:text-[30px] font-bold leading-[1.2] tracking-tight text-white">
                  {hp.heroTitle}
                  <br />
                  {hp.heroHighlight}
                </h1>

                <p className="text-[13px] sm:text-[14px] text-white/90 max-w-[300px] mx-auto leading-[1.5]">
                  Kenalan, ngobrol, dan lihat ke mana ceritanya berjalan.{" "}
                  <span className="italic">
                    semuanya dimulai dari satu sapaan santai.
                  </span>
                </p>

                <div className="pt-1">
                  <Link
                    href="/download"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-white hover:bg-[#f9f9fa] text-[#267a50] text-[17px] font-extrabold tracking-tight shadow-[0_8px_24px_rgba(0,0,0,0.16)] active:scale-[0.97] transition-all"
                  >
                    <Download className="w-4 h-4 stroke-[2.5] text-[#267a50]" />
                    <span>{hp.ctaButtonText || "Download App"}</span>
                  </Link>
                </div>
              </div>

              <p className="text-[11px] text-white/80 tracking-wide pt-1">
                © 2026 HAIYO | Dikembangkan oleh{" "}
                <a
                  href="https://labide.site/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-white hover:text-[#67bf9a] transition-colors"
                >
                  LABIDE
                </a>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          1B. DESKTOP HERO SECTION (lg:block)
          ===================================================================== */}
      <section className="hidden lg:block relative overflow-hidden py-20 px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-12 gap-10 items-center">
          <div className="col-span-7 space-y-6 text-left">
            <Badge variant="primary" className="px-3.5 py-1.5 text-[13px]">
              <Users className="w-3.5 h-3.5 text-[#267a50]" />
              <span>{hp.heroBadge}</span>
            </Badge>

            <h1 className="text-[48px] font-bold leading-[1.15] tracking-tight text-[#1d1d1d]">
              {hp.heroTitle}{" "}
              <span className="text-[#267a50]">{hp.heroHighlight}</span>
            </h1>

            <p className="text-[18px] text-[#6F7078] max-w-xl leading-relaxed">
              {hp.heroSubtitle}
            </p>

            <div className="flex items-center gap-3.5 pt-2">
              <Link href="/download">
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<Download className="w-5 h-5" />}
                >
                  {hp.ctaButtonText || "Download App"}
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary" size="lg">
                  {hp.heroPrimaryCta}
                </Button>
              </Link>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-5 text-[13px] font-medium text-[#6F7078]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
                <span>Khusus 18+ Terverifikasi</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#267a50]" />
                <span>Privasi Lokasi Terjaga</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#67bf9a]" />
                <span>100 Swipe Gratis / Hari</span>
              </span>
            </div>
          </div>

          {/* Interactive Discover Profile Card Preview */}
          <div className="col-span-5 flex justify-center">
            <div className="w-full max-w-[360px]">
              <div className="relative rounded-[24px] overflow-hidden bg-white border border-[#E9E9EE] shadow-[0_8px_24px_rgba(0,0,0,0.10)] aspect-[3/4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hp.heroCardPhotoUrl}
                  alt={`Preview profil ${hp.heroCardName} di HAIYO`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <PremiumBadge />
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-sm text-white text-[12px] font-medium border border-white/15">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    <span>Aktif di sekitar</span>
                  </span>
                </div>

                <div className="absolute bottom-0 inset-x-0 p-5 pb-9 text-white space-y-2">
                  <div>
                    <h2 className="text-[24px] font-bold leading-tight">
                      {hp.heroCardName}
                    </h2>
                    <p className="text-[13px] text-white/85 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#67bf9a]" />
                      <span>{hp.heroCardLocation}</span>
                    </p>
                  </div>

                  <p className="text-[14px] text-white/95 line-clamp-2">
                    &ldquo;{hp.heroCardBio}&rdquo;
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <InterestChip label="Coffee" slug="coffee" interactive={false} />
                    <InterestChip label="Music" slug="music" interactive={false} />
                    <InterestChip label="Travel" slug="travel" interactive={false} />
                  </div>
                </div>
              </div>

              {/* Compact Docked Action Buttons Preview */}
              <div className="relative z-10 -mt-6 flex justify-center">
                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#E9E9EE] shadow-[0_8px_24px_rgba(29,29,29,0.10)]">
                  <PassButton aria-label="Contoh tombol Pass" />
                  <LikeButton aria-label="Contoh tombol Like" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW HAIYO WORKS — Hidden on Mobile Beranda, shown when selected in Burger Menu or on Desktop */}
      <section
        id="cara-kerja"
        className={`${
          mobileSection === "cara-kerja" ? "block flex-1" : "hidden"
        } lg:block py-14 lg:py-16 px-4 md:px-8 bg-white border-y border-[#E9E9EE]`}
      >
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <Badge variant="primary">{hp.howItWorksBadge}</Badge>
            <h2 className="text-[26px] md:text-[32px] font-bold text-[#1d1d1d]">
              {hp.howItWorksTitle}
            </h2>
            <p className="text-[15px] text-[#6F7078]">
              {hp.howItWorksSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {hp.howItWorksSteps.map((item) => (
              <div
                key={item.step}
                className="p-6 rounded-[20px] bg-[#f9f9fa] border border-[#E9E9EE] space-y-3"
              >
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#267a50] text-white font-bold text-[15px]">
                  {item.step}
                </span>
                <h3 className="text-[18px] font-bold text-[#1d1d1d]">
                  {item.title}
                </h3>
                <p className="text-[14px] text-[#6F7078] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION — Hidden on Mobile Beranda, shown when selected in Burger Menu or on Desktop */}
      <section
        id="fitur"
        className={`${
          mobileSection === "fitur" ? "block flex-1" : "hidden"
        } lg:block py-14 lg:py-16 px-4 md:px-8`}
      >
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <Badge variant="secondary">{hp.featuresBadge}</Badge>
            <h2 className="text-[26px] md:text-[32px] font-bold text-[#1d1d1d]">
              {hp.featuresTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {hp.featuresItems.map((feat, idx) => (
              <div
                key={feat.id || idx}
                className="p-7 rounded-[20px] bg-[#267a50] text-[#f9f9fa] border border-[#1e6340] shadow-[0_8px_24px_rgba(38,122,80,0.16)] flex flex-col justify-between space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-[12px] bg-white/12 border border-white/20 text-[#f9f9fa] flex items-center justify-center">
                    <FeatureProfessionalIcon index={idx} />
                  </div>
                  <span className="font-mono text-[12px] font-semibold tracking-widest text-[#67bf9a]">
                    0{idx + 1}
                  </span>
                </div>

                <div className="space-y-2 pt-3 border-t border-white/15">
                  <h3 className="text-[20px] font-bold tracking-tight text-[#f9f9fa]">
                    {feat.title}
                  </h3>
                  <p className="text-[14px] text-white/85 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SAFETY SECTION — Hidden on Mobile Beranda, shown when selected in Burger Menu or on Desktop */}
      <section
        id="keamanan"
        className={`${
          mobileSection === "keamanan" ? "block flex-1" : "hidden"
        } lg:block py-14 lg:py-16 px-4 md:px-8 bg-white border-y border-[#E9E9EE]`}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <Badge variant="success">{hp.safetyBadge}</Badge>
            <h2 className="text-[26px] md:text-[32px] font-bold text-[#1d1d1d]">
              {hp.safetyTitle}
            </h2>
            <p className="text-[15px] text-[#6F7078] leading-relaxed">
              {hp.safetySubtitle}
            </p>
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {hp.safetyItems.map((sItem, idx) => {
              const Icon =
                idx === 0 ? Eye : idx === 1 ? UserCheck : ShieldCheck;
              return (
                <div
                  key={sItem.id || idx}
                  className="p-5 rounded-[20px] bg-[#f9f9fa] border border-[#E9E9EE] space-y-2"
                >
                  <Icon className="w-6 h-6 text-[#267a50]" />
                  <h3 className="text-[15px] font-bold">{sItem.title}</h3>
                  <p className="text-[13px] text-[#6F7078]">
                    {sItem.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. PREMIUM SECTION — Hidden on Mobile Beranda, shown when selected in Burger Menu or on Desktop */}
      <section
        id="premium"
        className={`${
          mobileSection === "premium" ? "block flex-1" : "hidden"
        } lg:block py-14 lg:py-16 px-4 md:px-8`}
      >
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <PremiumBadge />
            <h2 className="text-[26px] md:text-[32px] font-bold text-[#1d1d1d]">
              {hp.premiumTitle}
            </h2>
            <p className="text-[15px] text-[#6F7078]">
              {hp.premiumSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PREMIUM_PLANS.map((plan) => {
              const BadgeIcon = plan.badgeIcon;
              return (
                <div
                  key={plan.code}
                  className={
                    plan.highlighted
                      ? "relative p-6 rounded-[20px] bg-white border-2 border-[#267a50] shadow-[0_8px_24px_rgba(38,122,80,0.14)] flex flex-col justify-between"
                      : "relative p-6 rounded-[20px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col justify-between"
                  }
                >
                  {plan.badge && BadgeIcon && (
                    <span className="absolute -top-3.5 left-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#267a50] text-white shadow-sm">
                      <BadgeIcon className="w-3 h-3 fill-white" />
                      <span>{plan.badge}</span>
                    </span>
                  )}

                  <div className="space-y-4">
                    <div>
                      <p className="text-[13px] font-bold tracking-wider text-[#6F7078]">
                        PREMIUM {plan.duration}
                      </p>
                      <p className="text-[32px] font-extrabold text-[#1d1d1d] mt-1">
                        {plan.price}
                      </p>
                      <p className="text-[13px] text-[#6F7078] mt-1">
                        {plan.subtitle}
                      </p>
                    </div>

                    <ul className="space-y-2.5 pt-2 border-t border-[#E9E9EE] text-[14px] text-[#1d1d1d]">
                      {[
                        "Unlimited Swipe sepuasnya",
                        "Lihat siapa yang menyukaimu (Who Likes You)",
                        "Undo / kembali ke profil sebelumnya",
                        "Filter pencarian lebih lengkap & radius luas",
                        "Bebas iklan (No Ads)",
                      ].map((benefit) => (
                        <li key={benefit} className="flex items-center gap-2.5">
                          <Check className="w-4 h-4 text-[#267a50] shrink-0 stroke-[2.5]" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Link href="/register">
                      <Button
                        variant={plan.highlighted ? "primary" : "secondary"}
                        fullWidth
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA SECTION — Desktop Only (since Mobile Beranda already has the green Download App CTA) */}
      <section className="hidden lg:block py-14 px-4 md:px-8">
        <div className="max-w-4xl mx-auto rounded-[24px] bg-[#267a50] p-8 md:p-12 text-center text-white space-y-5 shadow-[0_12px_32px_rgba(38,122,80,0.24)]">
          <h2 className="text-[26px] md:text-[34px] font-bold leading-tight text-[#f9f9fa]">
            {hp.ctaTitle}
          </h2>
          <p className="text-[15px] md:text-[16px] text-white/90 max-w-lg mx-auto leading-relaxed">
            {hp.ctaSubtitle}
          </p>
          <div className="pt-2">
            <Link
              href="/download"
              className="inline-flex items-center justify-center gap-2.5 h-[52px] px-8 rounded-full bg-[#f9f9fa] hover:bg-white text-[#267a50] font-bold text-[16px] shadow-[0_6px_18px_rgba(0,0,0,0.12)] transition-all duration-150 active:scale-[0.97]"
            >
              <Download className="w-5 h-5 text-[#267a50]" />
              <span>{hp.ctaButtonText}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. FOOTER — Shown on Desktop or when viewing a sub-section on Mobile */}
      <footer
        className={`${
          mobileSection !== "beranda" ? "block" : "hidden"
        } lg:block mt-auto bg-white border-t border-[#E9E9EE] py-8 px-4 md:px-8`}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#6F7078]">
          <div className="flex items-center gap-2.5">
            <BrandLogo href="/" size="sm" />
            <span>· Ketemu orang baru, siapa tahu jadi sesuatu.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href="/download" className="hover:text-[#267a50] font-semibold">
              Install Web App (Android & iOS)
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
