"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  CreditCard,
  Crown,
  Lock,
  LogOut,
  ShieldBan,
  Trash2,
} from "lucide-react";
import {
  AppShell,
  Button,
  Input,
  Modal,
  RadiusSlider,
  Select,
  useToast,
} from "@/components/ui";
import {
  getDefaultAppState,
  loadAppState,
  LocalAppState,
  logoutUserInState,
  saveAppState,
} from "@/lib/store/app-state";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Gender } from "@/types/database";

/**
 * Settings Page (/settings) per UI/UX Sections 44 & 76:
 * - Account (Email, Change Password)
 * - Discovery (Gender preference, Age range, Radius 0–500 km)
 * - Privacy (Profile visibility & GPS privacy note)
 * - Subscription (Premium, Payment history)
 * - Safety (Blocked users, Report help)
 * - Account Actions (Logout, Delete account with complete lifecycle)
 */
export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [appState, setAppState] = useState<LocalAppState | null>(null);
  const [prefGender, setPrefGender] = useState<Gender>("female");
  const [minAge, setMinAge] = useState(20);
  const [maxAge, setMaxAge] = useState(30);
  const [radiusKm, setRadiusKm] = useState<number>(25);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const state = loadAppState();
    if (!state.currentUser) {
      router.replace("/login");
      return;
    }
    setAppState(state);
    setPrefGender(state.currentUser.preferences.preferred_gender);
    setMinAge(state.currentUser.preferences.min_age);
    setMaxAge(state.currentUser.preferences.max_age);
    setRadiusKm(state.currentUser.preferences.radius_km);
  }, [router]);

  if (!appState || !appState.currentUser) return null;

  const handleSaveDiscovery = () => {
    const fresh = loadAppState();
    if (!fresh.currentUser) return;
    const updated: LocalAppState = {
      ...fresh,
      currentUser: {
        ...fresh.currentUser,
        preferences: {
          ...fresh.currentUser.preferences,
          preferred_gender: prefGender,
          min_age: Math.max(18, minAge),
          max_age: Math.max(minAge, maxAge),
          radius_km: radiusKm,
          updated_at: new Date().toISOString(),
        },
      },
    };
    saveAppState(updated);
    setAppState(updated);
    toast({
      title: "Preferensi Discovery disimpan.",
      variant: "success",
    });
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast({
        title: "Password minimal 8 karakter.",
        variant: "error",
      });
      return;
    }

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        toast({
          title: "Gagal mengubah password",
          description: error.message,
          variant: "error",
        });
        return;
      }
    }

    setNewPassword("");
    setIsPasswordModalOpen(false);
    toast({
      title: "Password berhasil diperbarui.",
      variant: "success",
    });
  };

  // Complete Delete Account Lifecycle (UI/UX Section 76 & Roadmap Rule #11)
  const handleConfirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await fetch("/api/account/delete", {
        method: "POST",
      });

      const resetState = getDefaultAppState();
      saveAppState({
        ...resetState,
        currentUser: null,
        matches: [],
        messages: [],
      });

      setIsDeleteModalOpen(false);
      toast({
        title: "Akun berhasil dihapus",
        description:
          "Profil telah dihapus dari Discover, Match aktif dihentikan, dan sesi ditutup.",
        variant: "info",
      });
      router.push("/");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppShell
      headerProps={{
        title: "Settings",
        showBrand: false,
      }}
    >
      <div className="space-y-6 pb-10">
        {/* 1. Account Section */}
        <section className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] space-y-4">
          <h2 className="text-[18px] font-bold text-[#1d1d1d]">Account</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <Input
              label="Email Terdaftar"
              value={appState.currentUser.email}
              disabled
            />
            <Button
              variant="secondary"
              onClick={() => setIsPasswordModalOpen(true)}
              leftIcon={<Lock className="w-4 h-4" />}
            >
              Ubah Password
            </Button>
          </div>
        </section>

        {/* 2. Discovery Preferences */}
        <section className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] space-y-5">
          <h2 className="text-[18px] font-bold text-[#1d1d1d]">
            Preferensi Discovery
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Gender Preference"
              value={prefGender}
              onChange={(e) => setPrefGender(e.target.value as Gender)}
              options={[
                { value: "female", label: "Perempuan" },
                { value: "male", label: "Laki-laki" },
              ]}
            />
            <Input
              label="Usia Minimum"
              type="number"
              min={18}
              max={80}
              value={minAge}
              onChange={(e) =>
                setMinAge(Math.max(18, Number(e.target.value) || 18))
              }
            />
            <Input
              label="Usia Maksimum"
              type="number"
              min={18}
              max={90}
              value={maxAge}
              onChange={(e) =>
                setMaxAge(Math.max(minAge, Number(e.target.value) || 30))
              }
            />
          </div>

          <RadiusSlider
            label="Radius Pencarian"
            value={radiusKm}
            min={0}
            max={500}
            onChange={setRadiusKm}
          />

          <Button variant="primary" onClick={handleSaveDiscovery}>
            Simpan Preferensi
          </Button>
        </section>

        {/* 3. Subscription & Safety Links */}
        <section className="rounded-[20px] bg-white border border-[#E9E9EE] divide-y divide-[#E9E9EE] overflow-hidden">
          <Link
            href="/premium"
            className="p-4 sm:px-5 flex items-center justify-between hover:bg-[#f9f9fa] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-[#267a50]" />
              <span className="text-[15px] font-semibold">HAIYO Premium</span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6F7078]" />
          </Link>

          <Link
            href="/profile/payment-history"
            className="p-4 sm:px-5 flex items-center justify-between hover:bg-[#f9f9fa] transition-colors"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-[#67bf9a]" />
              <span className="text-[15px] font-semibold">
                Riwayat Pembayaran
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6F7078]" />
          </Link>

          <Link
            href="/settings/blocked"
            className="p-4 sm:px-5 flex items-center justify-between hover:bg-[#f9f9fa] transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShieldBan className="w-5 h-5 text-[#6F7078]" />
              <span className="text-[15px] font-semibold">
                Pengguna yang Diblokir ({appState.blockedUserIds.length})
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6F7078]" />
          </Link>
        </section>

        {/* 4. Danger Zone: Logout & Delete Account */}
        <section className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] space-y-4">
          <h2 className="text-[18px] font-bold text-[#1d1d1d]">
            Tindakan Akun
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="secondary"
              onClick={async () => {
                if (isSupabaseConfigured()) {
                  const supabase = createClient();
                  await supabase.auth.signOut().catch(() => null);
                }
                logoutUserInState();
                router.replace("/login");
              }}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Logout
            </Button>
            <Button
              variant="danger"
              onClick={() => setIsDeleteModalOpen(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Hapus Akun (Delete Account)
            </Button>
          </div>
        </section>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Ubah Password"
        description="Masukkan password baru minimal 8 karakter."
      >
        <div className="space-y-4">
          <Input
            label="Password Baru"
            type="password"
            placeholder="Minimal 8 karakter"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Batal
            </Button>
            <Button variant="primary" onClick={handleChangePassword}>
              Simpan Password
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Confirmation Modal (UI/UX Section 76) */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus akun?"
        description="Semua data terkait akun akan diproses sesuai kebijakan penghapusan HAIYO."
      >
        <div className="space-y-4">
          <ul className="text-[13px] text-[#6F7078] space-y-1.5 list-disc pl-5">
            <li>Profil kamu langsung dihapus dari halaman Discover.</li>
            <li>Seluruh Match dan percakapan aktif dihentikan.</li>
            <li>Foto profil dihapus dari penyimpanan HAIYO.</li>
            <li>Akses login akun ini akan dinonaktifkan secara permanen.</li>
          </ul>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              isLoading={isDeleting}
              onClick={handleConfirmDeleteAccount}
            >
              Hapus Akun
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
