"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  CreditCard,
  Crown,
  Edit3,
  Eye,
  HelpCircle,
  LogOut,
  MapPin,
  Settings,
  ShieldBan,
  ShieldCheck,
} from "lucide-react";
import {
  AppShell,
  Avatar,
  Button,
  InterestChip,
  PremiumBadge,
  useToast,
} from "@/components/ui";
import { ProfileDetailSheet } from "@/components/discover/ProfileDetailSheet";
import {
  getActiveSubscription,
  isCurrentUserPremium,
  loadAppState,
  LocalAppState,
  logoutUserInState,
  MASTER_INTERESTS,
} from "@/lib/store/app-state";
import { calculateAge } from "@/lib/utils";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { DiscoveryProfileCard } from "@/types/database";

/**
 * Profile Page (/profile) per UI/UX Section 42:
 * - Top: Profile photo, Name, Age, City, Bio, Interests, Multi-photo preview
 * - Actions: Edit Profile, Premium
 * - Sections: Edit Profile, Subscription, Payment History, Blocked Users, Settings, Help, Logout
 */
export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [appState, setAppState] = useState<LocalAppState | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    const state = loadAppState();
    if (!state.currentUser) {
      router.replace("/login");
      return;
    }
    setAppState(state);
  }, [router]);

  if (!appState || !appState.currentUser) return null;

  const { profile, photos, interests } = appState.currentUser;
  const age = calculateAge(profile.date_of_birth);
  const isPremium = isCurrentUserPremium(appState);
  const activeSub = getActiveSubscription(appState);
  const primaryPhoto =
    photos.find((p) => p.is_primary)?.public_url ?? photos[0]?.public_url;

  const myProfileCard: DiscoveryProfileCard = {
    id: profile.id,
    name: profile.name,
    age,
    gender: profile.gender,
    city: profile.city,
    approx_distance_km: null,
    bio: profile.bio,
    is_premium: isPremium,
    photos: photos.map((p) => ({
      id: p.id,
      storage_path: p.storage_path,
      public_url: p.public_url ?? "",
      is_primary: p.is_primary,
      display_order: p.display_order,
    })),
    interests: interests.map((slug) => {
      const found = MASTER_INTERESTS.find((i) => i.slug === slug);
      return {
        id: found?.id ?? slug,
        name: found?.name ?? slug,
        slug,
        emoji: found?.emoji,
      };
    }),
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.auth.signOut().catch(() => null);
    }
    logoutUserInState();
    toast({
      title: "Kamu telah keluar dari akun.",
      variant: "info",
    });
    router.replace("/login");
  };

  const menuItems = [
    {
      href: "/profile/edit",
      label: "Edit Profile",
      desc: "Ubah foto (hingga 6 foto), bio, dan minat kamu",
      icon: Edit3,
    },
    {
      href: "/premium",
      label: "Subscription (HAIYO Premium)",
      desc: isPremium
        ? `Premium Aktif hingga ${new Date(
            activeSub!.expires_at!
          ).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}`
        : "Upgrade untuk Unlimited Swipe & lihat siapa yang menyukaimu",
      icon: Crown,
    },
    {
      href: "/profile/payment-history",
      label: "Payment History",
      desc: "Lihat riwayat transaksi paket Premium",
      icon: CreditCard,
    },
    {
      href: "/settings/blocked",
      label: "Blocked Users",
      desc: `${appState.blockedUserIds.length} pengguna diblokir`,
      icon: ShieldBan,
    },
    {
      href: "/settings",
      label: "Settings",
      desc: "Pengaturan akun, preferensi discovery, dan privasi",
      icon: Settings,
    },
    ...(profile.is_admin
      ? [
          {
            href: "/admin",
            label: "Admin Dashboard",
            desc: "Moderasi pengguna, laporan, dan pantau transaksi",
            icon: ShieldCheck,
          },
        ]
      : []),
  ];

  return (
    <AppShell
      headerProps={{
        title: "Profil Saya",
        showBrand: false,
      }}
      onLogout={handleLogout}
    >
      <div className="space-y-6 pb-8">
        {/* Top Profile Summary Card */}
        <div className="p-6 rounded-[24px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.06)] space-y-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              aria-label="Lihat preview card profil saya"
              title="Klik untuk melihat tampilan card profil kamu"
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-[#267a50] transition-transform hover:scale-105 cursor-pointer"
            >
              <Avatar
                name={profile.name}
                src={primaryPhoto}
                size="xl"
                isOnline
              />
            </button>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="text-[24px] font-bold text-[#1d1d1d] hover:text-[#267a50] hover:underline transition-colors cursor-pointer"
                >
                  {profile.name}, {age}
                </button>
                {isPremium && <PremiumBadge />}
              </div>

              <p className="text-[14px] text-[#6F7078] flex items-center justify-center sm:justify-start gap-1">
                <MapPin className="w-4 h-4 text-[#267a50]" />
                <span>{profile.city}</span>
              </p>

              <p className="text-[14px] text-[#1d1d1d] leading-relaxed pt-1">
                {profile.bio}
              </p>

              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#267a50] hover:text-[#1e6340] pt-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>
                  Lihat Tampilan Card Profil ({photos.length} Foto)
                </span>
              </button>
            </div>
          </div>

          {/* Interests */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E9E9EE]">
            {interests.map((slug) => {
              const found = MASTER_INTERESTS.find((i) => i.slug === slug);
              return (
                <InterestChip
                  key={slug}
                  label={found?.name ?? slug}
                  emoji={found?.emoji}
                  interactive={false}
                />
              );
            })}
          </div>

          {/* Primary Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link href="/profile/edit">
              <Button variant="secondary" fullWidth>
                Edit Profile
              </Button>
            </Link>
            <Link href="/premium">
              <Button
                variant="premium"
                fullWidth
                leftIcon={<Crown className="w-4 h-4" />}
              >
                {isPremium ? "Kelola Premium" : "Upgrade Premium"}
              </Button>
            </Link>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="rounded-[20px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.04)] divide-y divide-[#E9E9EE] overflow-hidden">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="p-4 sm:px-5 flex items-center justify-between gap-4 hover:bg-[#f9f9fa] transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-[12px] bg-[#eaf5ef] text-[#267a50] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-[#1d1d1d]">
                      {item.label}
                    </p>
                    <p className="text-[12px] text-[#6F7078] truncate">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#6F7078] shrink-0" />
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() =>
              toast({
                title: "Pusat Bantuan HAIYO",
                description:
                  "Gunakan fitur Report pada profil/chat jika menemukan aktivitas mencurigakan.",
                variant: "info",
              })
            }
            className="w-full p-4 sm:px-5 flex items-center justify-between gap-4 hover:bg-[#f9f9fa] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-[12px] bg-[#eaf5ef] text-[#267a50] flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[#1d1d1d]">
                  Help & Panduan Keamanan
                </p>
                <p className="text-[12px] text-[#6F7078]">
                  Tips kenalan aman di HAIYO
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6F7078]" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full p-4 sm:px-5 flex items-center justify-between gap-4 hover:bg-[#EF4444]/5 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-[12px] bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[#EF4444]">
                  Logout
                </p>
                <p className="text-[12px] text-[#6F7078]">
                  Keluar dari sesi perangkat ini
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Preview Own Profile Card Sheet */}
      <ProfileDetailSheet
        profile={myProfileCard}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </AppShell>
  );
}
