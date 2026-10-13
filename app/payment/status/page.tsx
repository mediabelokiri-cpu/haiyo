"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Crown,
  Eye,
  ImagePlus,
  QrCode,
  ShieldCheck,
  Upload,
  Wallet,
} from "lucide-react";
import { AppShell, Badge, Button, Modal, useToast } from "@/components/ui";
import {
  loadAppState,
  LocalAppState,
  resolveSubscriptionPlan,
  saveAppState,
  syncAppStateFromSupabase,
  upsertPaymentOrderInLedger,
} from "@/lib/store/app-state";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  formatKilobytes,
  uploadCompressedProfilePhoto,
} from "@/lib/supabase/photo-storage";
import { formatRupiah } from "@/lib/utils";

/**
 * Payment Status Page (/payment/status) per UI/UX Sections 55, 56 & 57:
 * - Pending: "Menunggu Pembayaran" / "Menunggu Verifikasi Admin"
 * - Success: "Pembayaran Berhasil" ("Premium kamu sudah aktif.")
 * - Failed: "Pembayaran Belum Berhasil" ("Pembayaran belum berhasil diproses.")
 */
function PaymentStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const orderId = searchParams.get("order_id") ?? "";

  const [appState, setAppState] = useState<LocalAppState | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);
  const [previewProofModalOpen, setPreviewProofModalOpen] = useState(false);

  useEffect(() => {
    setAppState(loadAppState());

    void (async () => {
      const synced = await syncAppStateFromSupabase();
      setAppState(synced);
    })();

    const onUpdated = () => setAppState(loadAppState());
    window.addEventListener("haiyo-state-updated", onUpdated);

    // Poll every 5 seconds while waiting for Admin approval
    const pollTimer = window.setInterval(async () => {
      const synced = await syncAppStateFromSupabase();
      setAppState(synced);
    }, 5000);

    return () => {
      window.removeEventListener("haiyo-state-updated", onUpdated);
      window.clearInterval(pollTimer);
    };
  }, []);

  if (!appState) return null;

  const payment =
    appState.payments.find((p) => p.order_id === orderId) ??
    appState.payments[0] ??
    null;

  if (!payment) {
    return (
      <AppShell headerProps={{ title: "Status Pembayaran", showBrand: false }}>
        <div className="p-8 rounded-[20px] bg-white border border-[#E9E9EE] text-center space-y-4">
          <h1 className="text-[20px] font-bold">Transaksi tidak ditemukan</h1>
          <Link href="/premium">
            <Button variant="primary">Kembali ke Premium</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const sub = appState.subscriptions.find(
    (s) => s.id === payment.subscription_id
  );
  const plan = resolveSubscriptionPlan(
    payment.plan_code ?? payment.plan_id ?? sub?.plan_code ?? sub?.plan_id,
    payment.amount
  );

  const proofUrl =
    payment.proof_url ??
    (payment.transaction_id?.startsWith("PROOF|")
      ? payment.transaction_id.slice(6)
      : null);
  const isWaitingAdminVerification = Boolean(
    payment.user_confirmed_at || proofUrl
  );

  // Handle uploading screenshot/photo of transfer receipt
  const handleProofFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setIsUploadingProof(true);
    try {
      const fresh = loadAppState();
      const userId = fresh.currentUser?.id ?? payment.user_id ?? "user-me";
      const uploaded = await uploadCompressedProfilePhoto(file, userId);

      const nowIso = new Date().toISOString();
      const updated: LocalAppState = {
        ...fresh,
        payments: fresh.payments.map((p) =>
          p.order_id === payment.order_id
            ? {
                ...p,
                proof_url: uploaded.publicUrl,
                transaction_id: `PROOF|${uploaded.publicUrl}`,
                updated_at: nowIso,
              }
            : p
        ),
      };
      saveAppState(updated);
      setAppState(updated);

      if (isSupabaseConfigured()) {
        await upsertPaymentOrderInLedger({
          order_id: payment.order_id,
          payment_id: payment.id,
          subscription_id: payment.subscription_id,
          user_id: userId,
          user_name:
            fresh.currentUser?.profile.name ||
            payment.user_name ||
            "Pengguna HAIYO",
          user_email: fresh.currentUser?.email || payment.user_email || "",
          plan_id: plan.id,
          plan_code: plan.code,
          plan_name: plan.name,
          duration_days: plan.duration_days,
          amount: payment.amount,
          payment_method: payment.payment_method,
          proof_url: uploaded.publicUrl,
        });

        try {
          const supabase = createClient();
          await supabase
            .from("payments")
            .update({
              transaction_id: `PROOF|${uploaded.publicUrl}`,
            })
            .eq("order_id", payment.order_id);
        } catch {
          // non-blocking
        }
      }

      toast({
        title: "Bukti transfer berhasil diupload!",
        description: `Ukuran foto: ${formatKilobytes(uploaded.compressedBytes)} (WebP). Silakan klik tombol Konfirmasi di bawah.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Gagal mengupload bukti transfer",
        description: "Pastikan file berupa gambar (JPG, PNG, atau WebP).",
        variant: "error",
      });
    } finally {
      setIsUploadingProof(false);
    }
  };

  // Handle user clicking "Saya Sudah Bayar · Kirim Konfirmasi ke Admin"
  const handleConfirmPaymentToAdmin = async () => {
    if (!proofUrl) {
      toast({
        title: "Upload bukti pembayaran dulu",
        description:
          "Mohon lampirkan screenshot/foto bukti transfer di atas agar Admin dapat memverifikasi pesananmu.",
        variant: "error",
      });
      return;
    }

    setIsSubmittingConfirm(true);
    try {
      const fresh = loadAppState();
      const userId = fresh.currentUser?.id ?? payment.user_id ?? "user-me";
      const nowIso = new Date().toISOString();

      const updated: LocalAppState = {
        ...fresh,
        payments: fresh.payments.map((p) =>
          p.order_id === payment.order_id
            ? {
                ...p,
                user_confirmed_at: nowIso,
                proof_url: proofUrl,
                updated_at: nowIso,
              }
            : p
        ),
      };
      saveAppState(updated);
      setAppState(updated);

      if (isSupabaseConfigured()) {
        await upsertPaymentOrderInLedger({
          order_id: payment.order_id,
          payment_id: payment.id,
          subscription_id: payment.subscription_id,
          user_id: userId,
          user_name:
            fresh.currentUser?.profile.name ||
            payment.user_name ||
            "Pengguna HAIYO",
          user_email: fresh.currentUser?.email || payment.user_email || "",
          plan_id: plan.id,
          plan_code: plan.code,
          plan_name: plan.name,
          duration_days: plan.duration_days,
          amount: payment.amount,
          payment_method: payment.payment_method,
          proof_url: proofUrl,
          user_confirmed_at: nowIso,
        });
      }

      toast({
        title: "Konfirmasi & bukti pembayaran terkirim!",
        description:
          "Admin HAIYO sedang memverifikasi pembayaranmu. Paket Premium akan otomatis aktif segera setelah disetujui Admin.",
        variant: "success",
      });
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

  return (
    <AppShell
      headerProps={{
        title: "Status Pembayaran",
        showBrand: false,
      }}
    >
      <div className="max-w-lg mx-auto space-y-6 pb-10">
        {/* 1. PAYMENT PENDING SCREEN (UI/UX Section 55) */}
        {payment.status === "pending" && (
          <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <Badge variant="warning">
                {isWaitingAdminVerification
                  ? "MENUNGGU VERIFIKASI ADMIN"
                  : "MENUNGGU PEMBAYARAN"}
              </Badge>
              <h1 className="text-[24px] font-bold text-[#1d1d1d] pt-1">
                {isWaitingAdminVerification
                  ? "Menunggu Verifikasi Admin"
                  : "Menunggu Pembayaran"}
              </h1>
              <p className="text-[14px] text-[#6F7078]">
                {isWaitingAdminVerification
                  ? "Bukti pembayaran sudah diterima. Admin sedang memverifikasi pesananmu untuk mengaktifkan Premium."
                  : "Selesaikan pembayaran sesuai nominal dan upload bukti transfer di bawah ini."}
              </p>
            </div>

            {/* Method-Specific Payment Instructions (QRIS / Bank Transfer / E-Wallet / Card) */}
            <div className="p-5 rounded-[20px] bg-[#f9f9fa] border border-[#E9E9EE] space-y-3">
              {payment.payment_method === "qris" && (
                <div className="space-y-2.5">
                  {appState.paymentConfig.qrisImageUrl ? (
                    <div className="w-52 h-52 mx-auto rounded-[16px] bg-white border border-[#E9E9EE] p-2.5 flex flex-col items-center justify-center shadow-sm">
                      <img
                        src={appState.paymentConfig.qrisImageUrl}
                        alt={appState.paymentConfig.qrisMerchantName}
                        className="w-full h-full object-contain rounded-[10px]"
                      />
                    </div>
                  ) : (
                    <div className="w-44 h-44 mx-auto rounded-[16px] bg-white border border-[#E9E9EE] flex flex-col items-center justify-center gap-1.5 text-[#1d1d1d] shadow-sm p-3">
                      <QrCode className="w-24 h-24 text-[#1d1d1d]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#267a50] text-center line-clamp-1">
                        {appState.paymentConfig.qrisMerchantName}
                      </span>
                      <span className="text-[9px] font-mono text-[#6F7078]">
                        NMID: {appState.paymentConfig.qrisNmid}
                      </span>
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <p className="text-[13px] font-bold text-[#1d1d1d]">
                      {appState.paymentConfig.qrisMerchantName}
                    </p>
                    <p className="text-[12px] text-[#6F7078]">
                      Scan kode QRIS di atas menggunakan GoPay, OVO, DANA,
                      ShopeePay, atau aplikasi Mobile Banking kamu.
                    </p>
                  </div>
                </div>
              )}

              {payment.payment_method === "bca_va" && (
                <div className="p-4 rounded-[16px] bg-white border border-[#E9E9EE] space-y-2 text-center">
                  <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#6F7078] uppercase">
                    <Building2 className="w-4 h-4 text-[#267a50]" />
                    <span>Transfer Bank {appState.paymentConfig.bankName}</span>
                  </div>
                  <p className="text-[20px] font-mono font-extrabold tracking-wider text-[#1d1d1d]">
                    {appState.paymentConfig.bankAccountNumber}
                  </p>
                  <p className="text-[13px] font-semibold text-[#6F7078]">
                    a.n. {appState.paymentConfig.bankAccountName}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        appState.paymentConfig.bankAccountNumber
                      );
                      toast({
                        title: "Nomor Rekening disalin",
                        description: `${appState.paymentConfig.bankName} ${appState.paymentConfig.bankAccountNumber} a.n. ${appState.paymentConfig.bankAccountName}`,
                        variant: "info",
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#eaf5ef] text-[#267a50] text-[12px] font-bold hover:bg-[#267a50] hover:text-white transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Nomor Rekening</span>
                  </button>
                </div>
              )}

              {payment.payment_method === "gopay" && (
                <div className="p-4 rounded-[16px] bg-white border border-[#E9E9EE] space-y-2 text-center">
                  <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#6F7078] uppercase">
                    <Wallet className="w-4 h-4 text-[#267a50]" />
                    <span>
                      Transfer E-Wallet ({appState.paymentConfig.ewalletProvider})
                    </span>
                  </div>
                  <p className="text-[20px] font-mono font-extrabold tracking-wider text-[#1d1d1d]">
                    {appState.paymentConfig.ewalletNumber}
                  </p>
                  <p className="text-[13px] font-semibold text-[#6F7078]">
                    a.n. {appState.paymentConfig.ewalletAccountName}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        appState.paymentConfig.ewalletNumber
                      );
                      toast({
                        title: "Nomor E-Wallet disalin",
                        description: `${appState.paymentConfig.ewalletProvider} ${appState.paymentConfig.ewalletNumber} a.n. ${appState.paymentConfig.ewalletAccountName}`,
                        variant: "info",
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#eaf5ef] text-[#267a50] text-[12px] font-bold hover:bg-[#267a50] hover:text-white transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Nomor E-Wallet</span>
                  </button>
                </div>
              )}

              {payment.payment_method === "card" && (
                <div className="p-4 rounded-[16px] bg-white border border-[#E9E9EE] space-y-2 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#eaf5ef] text-[#267a50] flex items-center justify-center mx-auto">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <p className="text-[14px] font-bold text-[#1d1d1d]">
                    Kartu Debit / Kredit (Visa / Mastercard)
                  </p>
                  <p className="text-[12px] text-[#6F7078]">
                    Otorisasi pembayaran kartu terenkripsi siap dikonfirmasi.
                  </p>
                </div>
              )}

              <div className="text-left text-[13px] space-y-2 pt-2 border-t border-[#E9E9EE]">
                <div className="flex justify-between">
                  <span className="text-[#6F7078]">Order ID</span>
                  <span className="font-mono font-semibold text-[#1d1d1d]">
                    {payment.order_id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F7078]">Paket Dipilih</span>
                  <span className="font-bold text-[#1d1d1d]">
                    {plan.name} ({plan.duration_days} Hari)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F7078]">Metode</span>
                  <span className="font-semibold uppercase text-[#1d1d1d]">
                    {payment.payment_method === "bca_va"
                      ? `Bank ${appState.paymentConfig.bankName}`
                      : payment.payment_method === "gopay"
                      ? appState.paymentConfig.ewalletProvider
                      : payment.payment_method}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6F7078]">Total Bayar</span>
                  <span className="font-extrabold text-[#267a50]">
                    {formatRupiah(payment.amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Upload Bukti Pembayaran Section */}
            <div className="p-5 rounded-[20px] bg-[#f9f9fa] border border-[#E9E9EE] text-left space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[14px] font-bold text-[#1d1d1d]">
                    Bukti Transfer / Pembayaran
                  </p>
                  <p className="text-[12px] text-[#6F7078]">
                    Upload screenshot atau foto bukti pembayaran agar Admin dapat
                    segera mengaktifkan paket Premium kamu.
                  </p>
                </div>
                {proofUrl && <Badge variant="success">TERLAMPIR</Badge>}
              </div>

              {proofUrl ? (
                <div className="p-3 rounded-[16px] bg-white border border-[#E9E9EE] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={proofUrl}
                      alt="Bukti Transfer"
                      onClick={() => setPreviewProofModalOpen(true)}
                      className="w-16 h-16 rounded-[12px] object-cover border border-[#E9E9EE] shrink-0 cursor-pointer hover:opacity-90"
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-[#16A34A] flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Foto Bukti Siap Diverifikasi</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setPreviewProofModalOpen(true)}
                        className="text-[12px] font-semibold text-[#267a50] hover:underline inline-flex items-center gap-1 mt-0.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Ukuran Penuh</span>
                      </button>
                    </div>
                  </div>

                  <label className="px-3 py-1.5 rounded-full bg-[#f9f9fa] border border-[#E9E9EE] text-[12px] font-bold text-[#1d1d1d] hover:bg-[#E9E9EE]/60 transition-colors cursor-pointer shrink-0">
                    {isUploadingProof ? "Mengupload..." : "Ganti Foto"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofFileChange}
                      disabled={isUploadingProof}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 p-5 rounded-[16px] bg-white border-2 border-dashed border-[#267a50]/45 hover:bg-[#eaf5ef]/40 transition-colors cursor-pointer text-center">
                  <div className="w-10 h-10 rounded-full bg-[#eaf5ef] text-[#267a50] flex items-center justify-center">
                    {isUploadingProof ? (
                      <Clock className="w-5 h-5 animate-spin" />
                    ) : (
                      <ImagePlus className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#267a50]">
                      {isUploadingProof
                        ? "Mengompres & Mengupload Bukti..."
                        : "Pilih Foto / Screenshot Bukti Transfer"}
                    </p>
                    <p className="text-[11px] text-[#6F7078] mt-0.5">
                      Format JPG, PNG, atau WebP · Otomatis terkompresi cepat
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProofFileChange}
                    disabled={isUploadingProof}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {payment.user_confirmed_at && (
              <div className="p-4 rounded-[16px] bg-[#eaf5ef] border border-[#267a50]/25 text-left flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#267a50] shrink-0 mt-0.5" />
                <div className="text-[12px] text-[#1d1d1d] space-y-0.5">
                  <p className="font-bold text-[#267a50]">
                    Konfirmasi Pembayaran Sudah Dikirim ke Admin
                  </p>
                  <p className="text-[#6F7078]">
                    Halaman ini akan otomatis berubah menjadi{" "}
                    <strong>BERHASIL</strong> begitu Admin menyetujui transaksi
                    kamu.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmittingConfirm || isUploadingProof}
                leftIcon={<Upload className="w-4 h-4" />}
                onClick={handleConfirmPaymentToAdmin}
              >
                {payment.user_confirmed_at
                  ? "Kirim Ulang Konfirmasi ke Admin"
                  : "Saya Sudah Bayar · Kirim Konfirmasi ke Admin"}
              </Button>

              {appState.paymentConfig.whatsappConfirmationNumber && (
                <a
                  href={`https://wa.me/${appState.paymentConfig.whatsappConfirmationNumber.replace(
                    /\D/g,
                    ""
                  )}?text=${encodeURIComponent(
                    `Halo Admin HAIYO, saya (${
                      appState.currentUser?.profile.name ?? "User"
                    }) sudah melakukan pembayaran dan upload bukti untuk Order ID ${
                      payment.order_id
                    } (${plan.name} - ${formatRupiah(
                      payment.amount
                    )}). Mohon diverifikasi ya, terima kasih!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="secondary" fullWidth>
                    Hubungi Admin via WhatsApp
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}

        {/* 2. PAYMENT SUCCESS SCREEN (UI/UX Section 56) */}
        {payment.status === "paid" && (
          <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#22C55E]/15 text-[#22C55E] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <Badge variant="success">BERHASIL</Badge>
              <h1 className="text-[26px] font-bold text-[#1d1d1d] pt-1">
                Pembayaran Berhasil
              </h1>
              <p className="text-[14px] text-[#6F7078]">
                Premium kamu sudah aktif.
              </p>
            </div>

            <div className="p-5 rounded-[20px] bg-[#f9f9fa] border border-[#E9E9EE] text-left text-[13px] space-y-2.5">
              <div className="flex justify-between">
                <span className="text-[#6F7078]">Paket</span>
                <span className="font-bold text-[#1d1d1d]">
                  {plan.name} ({plan.duration_days} Hari)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F7078]">Tanggal Mulai</span>
                <span className="font-semibold text-[#1d1d1d]">
                  {sub?.started_at
                    ? new Date(sub.started_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F7078]">Berlaku Hingga</span>
                <span className="font-bold text-[#267a50]">
                  {sub?.expires_at
                    ? new Date(sub.expires_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "-"}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => router.push("/discover")}
                leftIcon={<Crown className="w-5 h-5" />}
              >
                Mulai Kenalan
              </Button>
            </div>
          </div>
        )}

        {/* 3. PAYMENT FAILED SCREEN (UI/UX Section 57) */}
        {(payment.status === "failed" ||
          payment.status === "expired" ||
          payment.status === "cancelled") && (
          <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center mx-auto">
              <AlertCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <Badge variant="danger">GAGAL</Badge>
              <h1 className="text-[24px] font-bold text-[#1d1d1d] pt-1">
                Pembayaran Belum Berhasil
              </h1>
              <p className="text-[14px] text-[#6F7078]">
                Pembayaran belum berhasil diproses.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                variant="primary"
                fullWidth
                onClick={() =>
                  router.push(`/checkout?plan=${plan?.code ?? "PREMIUM_1M"}`)
                }
              >
                Coba Lagi
              </Button>
              <Link href="/premium" className="block">
                <Button variant="secondary" fullWidth>
                  Kembali ke Premium
                </Button>
              </Link>
            </div>
          </div>
        )}

        {proofUrl && (
          <Modal
            isOpen={previewProofModalOpen}
            onClose={() => setPreviewProofModalOpen(false)}
            title="Bukti Transfer Pembayaran"
            description={`Order ID: ${payment.order_id} · ${plan.name}`}
          >
            <div className="space-y-4">
              <div className="rounded-[16px] overflow-hidden border border-[#E9E9EE] bg-[#f9f9fa] max-h-[65dvh] flex items-center justify-center">
                <img
                  src={proofUrl}
                  alt="Bukti Transfer"
                  className="max-w-full max-h-[65dvh] object-contain"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setPreviewProofModalOpen(false)}
                >
                  Tutup
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#f9f9fa]" />}>
      <PaymentStatusContent />
    </Suspense>
  );
}
