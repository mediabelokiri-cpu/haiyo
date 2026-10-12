"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Heart,
  Lock,
  Mail,
  Search,
  SlidersHorizontal,
  Star,
  Zap,
} from "lucide-react";
import {
  AppShell,
  Avatar,
  Badge,
  BottomSheet,
  Button,
  Checkbox,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  InterestChip,
  LikeButton,
  Modal,
  PassButton,
  PremiumBadge,
  ProfileCardSkeleton,
  Radio,
  RadiusSlider,
  Select,
  Skeleton,
  Textarea,
  useToast,
} from "@/components/ui";

const SAMPLE_INTERESTS = [
  { label: "Coffee" },
  { label: "Music" },
  { label: "Travel" },
  { label: "Gaming" },
  { label: "Sports" },
  { label: "Reading" },
  { label: "Food" },
  { label: "Movies" },
  { label: "Photography" },
  { label: "Fitness" },
];

export default function DesignSystemPage() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [demoRadius, setDemoRadius] = useState(25);
  const [bio, setBio] = useState(
    "Suka kopi, jalan sore, dan ngobrol sampai lupa waktu."
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "Coffee",
    "Music",
    "Travel",
  ]);
  const [ageConfirmed, setAgeConfirmed] = useState(true);
  const [reportReason, setReportReason] = useState("fake_account");

  const toggleInterest = (label: string) => {
    setSelectedInterests((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  return (
    <AppShell
      headerProps={{
        showBrand: true,
        hasUnreadNotifications: true,
        onOpenFilter: () => setIsSheetOpen(true),
      }}
      unreadChatCount={3}
      unreadLikesCount={5}
    >
      <div className="space-y-8 pb-10">
        {/* Intro Banner */}
        <div className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Badge variant="primary">Phase 1 Verification</Badge>
            <h1 className="text-[24px] font-bold text-[#1d1d1d] mt-2">
              HAIYO Design System & Core UI Kit
            </h1>
            <p className="text-[14px] text-[#6F7078] mt-1">
              Seluruh komponen dasar dari spesifikasi UI/UX V1.0 (Section 4–13 &
              91–92).
            </p>
          </div>
          <Link href="/">
            <Button variant="secondary" size="sm">
              ← Kembali ke Landing
            </Button>
          </Link>
        </div>

        {/* 1. Color Palette */}
        <section className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] space-y-4">
          <h2 className="text-[18px] font-bold">1. Color System</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
            {[
              { name: "Primary Green", hex: "#267a50", bg: "bg-[#267a50] text-white" },
              { name: "Secondary Mint", hex: "#67bf9a", bg: "bg-[#67bf9a] text-[#1d1d1d]" },
              { name: "Charcoal Dark", hex: "#1d1d1d", bg: "bg-[#1d1d1d] text-white" },
              { name: "Surface Off-White", hex: "#f9f9fa", bg: "bg-[#f9f9fa] text-[#1d1d1d] border border-[#E9E9EE]" },
            ].map((c) => (
              <div
                key={c.name}
                className={`p-3.5 rounded-[12px] font-semibold flex flex-col justify-between h-20 ${c.bg}`}
              >
                <span>{c.name}</span>
                <span className="opacity-85 font-mono">{c.hex}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Buttons & Discover Actions */}
        <section className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] space-y-4">
          <h2 className="text-[18px] font-bold">
            2. Buttons & Discover Actions
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              onClick={() =>
                toast({
                  title: "Profil berhasil diperbarui.",
                  variant: "success",
                })
              }
            >
              Mulai Kenalan (Primary)
            </Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="premium">Upgrade Premium</Button>
            <Button variant="danger">Hapus Akun (Danger)</Button>
            <Button variant="primary" isLoading>
              Loading...
            </Button>
          </div>

          <div className="pt-3 border-t border-[#E9E9EE] flex items-center gap-4">
            <span className="text-[13px] text-[#6F7078] font-medium">
              Discover Action Buttons (48px Pass / 52px Like):
            </span>
            <PassButton
              onClick={() =>
                toast({ title: "Kamu melewati profil ini.", variant: "info" })
              }
            />
            <LikeButton
              onClick={() =>
                toast({ title: "Kamu menyukai Sarah.", variant: "like" })
              }
            />
            <IconButton
              label="Filter"
              onClick={() => setIsSheetOpen(true)}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </IconButton>
          </div>
        </section>

        {/* 3. Inputs, Textarea, Select, Checkbox & Radio */}
        <section className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] space-y-5">
          <h2 className="text-[18px] font-bold">3. Form Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              placeholder="nama@email.com"
              leftIcon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="Cari Pengguna"
              placeholder="Ketik nama atau kota..."
              leftIcon={<Search className="w-4 h-4" />}
              error="Contoh pesan validasi error berwarna merah"
            />
            <RadiusSlider
              label="Radius Lokasi (0 – 500 km)"
              value={demoRadius}
              min={0}
              max={500}
              onChange={setDemoRadius}
            />
            <div className="flex items-end pb-2">
              <Checkbox
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                label="Saya berusia 18 tahun atau lebih."
                description="Wajib dicentang saat registrasi akun HAIYO."
              />
            </div>
          </div>

          <Textarea
            label="Bio Singkat"
            placeholder="Contoh: Suka kopi, jalan sore, dan ngobrol sampai lupa waktu."
            maxLength={500}
            showCount
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />

          <div className="space-y-2">
            <p className="text-[14px] font-semibold">
              Contoh Radio Selection (Report Flow):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { val: "fake_account", label: "Fake Account" },
                { val: "harassment", label: "Harassment" },
                { val: "spam", label: "Spam" },
                { val: "scam", label: "Scam" },
              ].map((r) => (
                <Radio
                  key={r.val}
                  name="report_reason"
                  checked={reportReason === r.val}
                  onChange={() => setReportReason(r.val)}
                  label={r.label}
                />
              ))}
            </div>
          </div>
        </section>

        {/* 4. Interest Chips, Badges & Avatars */}
        <section className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] space-y-5">
          <h2 className="text-[18px] font-bold">
            4. Interest Chips, Badges & Avatars
          </h2>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_INTERESTS.map((item) => (
              <InterestChip
                key={item.label}
                label={item.label}
                selected={selectedInterests.includes(item.label)}
                onClick={() => toggleInterest(item.label)}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <PremiumBadge />
            <Badge variant="primary" className="gap-1">
              <Star className="w-3 h-3 fill-current" />
              <span>Paling Populer</span>
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Zap className="w-3 h-3 fill-current" />
              <span>Hemat</span>
            </Badge>
            <Badge variant="success">BERHASIL</Badge>
            <Badge variant="warning">MENUNGGU PEMBAYARAN</Badge>
            <Badge variant="danger">DIBLOKIR</Badge>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Avatar name="Sarah Putri" size="sm" isOnline />
            <Avatar name="Budi Santoso" size="md" isOnline />
            <Avatar
              name="Nadia"
              size="lg"
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
              isOnline
            />
          </div>
        </section>

        {/* 5. Overlays (Modal, BottomSheet & Toast) */}
        <section className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] space-y-4">
          <h2 className="text-[18px] font-bold">
            5. Modal, BottomSheet & Toast Feedback
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
              Buka Modal Konfirmasi (Unmatch)
            </Button>
            <Button variant="secondary" onClick={() => setIsSheetOpen(true)}>
              Buka BottomSheet (Filter Discover)
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                toast({
                  title: "It's a Match!",
                  description: "Kamu dan Sarah saling menyukai.",
                  variant: "match",
                })
              }
            >
              Trigger Toast Match
            </Button>
          </div>
        </section>

        {/* 6. Empty, Error & Skeleton States */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <EmptyState
            icon={<Heart className="w-8 h-8" />}
            title="Belum ada Match"
            description="Terus kenalan. Siapa tahu sebentar lagi ada yang cocok."
            actionLabel="Cari Orang Baru"
            onAction={() =>
              toast({ title: "Menuju halaman Discover...", variant: "info" })
            }
          />
          <ErrorState
            onRetry={() =>
              toast({ title: "Memuat ulang data...", variant: "info" })
            }
          />
        </section>

        <section className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] space-y-4">
          <h2 className="text-[18px] font-bold">
            7. Skeleton Loading State (UI/UX Section 60)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <ProfileCardSkeleton />
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-[16px]" />
              <Skeleton className="h-14 w-full rounded-[16px]" />
              <Skeleton className="h-14 w-4/5 rounded-[16px]" />
            </div>
          </div>
        </section>
      </div>

      {/* Confirmation Modal Demo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Hapus Match?"
        description="Percakapan ini akan berakhir dan kalian tidak bisa melanjutkan chat."
      >
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
            Batal
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setIsModalOpen(false);
              toast({
                title: "Match telah dihentikan.",
                variant: "info",
              });
            }}
          >
            Unmatch
          </Button>
        </div>
      </Modal>

      {/* Filter BottomSheet Demo */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Filter"
        description="Sesuaikan profil yang ingin kamu temui di sekitar."
      >
        <div className="space-y-5">
          <Select
            label="Ingin kenalan dengan"
            defaultValue="female"
            options={[
              { value: "female", label: "Perempuan" },
              { value: "male", label: "Laki-laki" },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Usia Minimum" type="number" defaultValue={21} />
            <Input label="Usia Maksimum" type="number" defaultValue={30} />
          </div>
          <RadiusSlider
            label="Radius Jarak"
            value={demoRadius}
            min={0}
            max={500}
            onChange={setDemoRadius}
          />

          {/* Locked Premium Filter Preview (UI/UX Section 31) */}
          <div className="p-4 rounded-[16px] bg-[#f9f9fa] border border-[#E9E9EE] flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-[14px] font-semibold text-[#1d1d1d] flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#1d1d1d]" />
                <span>Filter Lebih Lengkap</span>
              </p>
              <p className="text-[12px] text-[#6F7078]">
                Gunakan filter lebih lengkap dengan HAIYO Premium.
              </p>
            </div>
            <Button variant="premium" size="sm">
              Lihat Premium
            </Button>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setIsSheetOpen(false)}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                setIsSheetOpen(false);
                toast({
                  title: "Filter pencarian disimpan.",
                  variant: "success",
                });
              }}
            >
              Tampilkan Profil
            </Button>
          </div>
        </div>
      </BottomSheet>
    </AppShell>
  );
}
