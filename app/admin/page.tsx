"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  CreditCard,
  Crown,
  Eye,
  Flag,
  Heart,
  LayoutTemplate,
  LogOut,
  MessageCircle,
  QrCode,
  RotateCcw,
  Search,
  ShieldCheck,
  Upload,
  UserPlus,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  Avatar,
  Badge,
  BrandLogo,
  Button,
  Input,
  Modal,
  PremiumBadge,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";
import {
  DEFAULT_HOMEPAGE_CONFIG,
  DEFAULT_PAYMENT_CONFIG,
  fetchPaymentConfigFromServer,
  fetchPaymentOrdersLedger,
  HomepageConfig,
  loadAppState,
  LocalAppState,
  logoutUserInState,
  MASTER_SUBSCRIPTION_PLANS,
  PaymentRecipientConfig,
  resolveSubscriptionPlan,
  saveAppState,
  upsertPaymentOrderInLedger,
} from "@/lib/store/app-state";
import { calculateAge, formatRupiah } from "@/lib/utils";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  compressImageToWebP,
  formatKilobytes,
} from "@/lib/supabase/photo-storage";
import {
  PaymentRecord,
  ReportRecord,
  ReportStatus,
  SubscriptionRecord,
  UserStatus,
} from "@/types/database";

type AdminTab =
  | "dashboard"
  | "homepage"
  | "users"
  | "reports"
  | "subscriptions"
  | "payments";

interface ManagedUserRow {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: "male" | "female";
  city: string;
  status: UserStatus;
  is_premium: boolean;
  created_at: string;
  avatar_url?: string;
  bio?: string;
}

/**
 * Admin Dashboard & Moderation Panel (/admin) per PRD Section 39 & UI/UX Sections 77–83:
 * Separate from normal user experience with sidebar navigation:
 * - Dashboard (8 Metric Cards + Growth/Revenue Charts)
 * - Homepage (CMS pengelolaan seluruh section di Homepage & halaman Download App)
 * - Users (Search, Status/Premium Filter, View, Suspend, Ban, Activate, Delete)
 * - Reports (View, Review, Resolve, Dismiss)
 * - Subscriptions (Filter Active, Expired, Cancelled, Pending)
 * - Payments (Pengaturan Rekening/E-Wallet/QRIS Pribadi + Verifikasi Pembayaran Paid/Pending/Failed)
 */
export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [appState, setAppState] = useState<LocalAppState | null>(null);
  const [paymentConfigDraft, setPaymentConfigDraft] =
    useState<PaymentRecipientConfig>(DEFAULT_PAYMENT_CONFIG);
  const [homepageDraft, setHomepageDraft] = useState<HomepageConfig>(
    DEFAULT_HOMEPAGE_CONFIG
  );

  const [managedUsers, setManagedUsers] = useState<ManagedUserRow[]>([]);
  const [dbMatchesCount, setDbMatchesCount] = useState<number>(0);
  const [dbMessagesCount, setDbMessagesCount] = useState<number>(0);

  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("all");
  const [userPremiumFilter, setUserPremiumFilter] = useState<string>("all");
  const [subFilter, setSubFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [inspectedUser, setInspectedUser] = useState<ManagedUserRow | null>(
    null
  );
  const [inspectedProof, setInspectedProof] = useState<{
    proofUrl: string;
    orderId: string;
    userId: string;
    userName: string;
    userEmail: string;
    planName: string;
    durationDays: number;
    amount: number;
    paymentMethod: string;
    status: string;
    userConfirmedAt?: string | null;
    createdAt: string;
  } | null>(null);
  const [isSavingPaymentConfig, setIsSavingPaymentConfig] =
    useState<boolean>(false);

  useEffect(() => {
    const loaded = loadAppState();
    const isAdmin = Boolean(
      loaded.currentUser &&
        (loaded.currentUser.email.trim().toLowerCase() === "admin@haiyo.id" ||
          loaded.currentUser.profile.is_admin)
    );

    if (!isAdmin) {
      router.replace("/login");
      return;
    }

    setAppState(loaded);
    setPaymentConfigDraft({
      ...(loaded.paymentConfig ?? DEFAULT_PAYMENT_CONFIG),
      requireAdminApproval: true,
    });
    setHomepageDraft(loaded.homepageConfig ?? DEFAULT_HOMEPAGE_CONFIG);

    // Fetch live payment config from server (service role) to populate form with real values
    void fetchPaymentConfigFromServer().then((serverConfig) => {
      setPaymentConfigDraft({ ...serverConfig, requireAdminApproval: true });
    });

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as AdminTab | null;
      if (
        tabParam &&
        [
          "dashboard",
          "homepage",
          "users",
          "reports",
          "subscriptions",
          "payments",
        ].includes(tabParam)
      ) {
        setActiveTab(tabParam);
      }
    }

    const fetchOperationalData = async () => {
      if (!isSupabaseConfigured()) return;
      const supabase = createClient();
      try {
        const [
          { data: profileRows },
          { data: photoRows },
          { data: subRows },
          { data: payRows },
          { data: repRows },
          { count: matchesCnt },
          { count: messagesCnt },
          ledgerRows,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("profile_photos")
            .select("*")
            .order("display_order", { ascending: true }),
          supabase
            .from("subscriptions")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("payments")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("reports")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("matches")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("messages")
            .select("*", { count: "exact", head: true }),
          fetchPaymentOrdersLedger(),
        ]);

        if (typeof matchesCnt === "number") setDbMatchesCount(matchesCnt);
        if (typeof messagesCnt === "number") setDbMessagesCount(messagesCnt);

        const nowMs = Date.now();
        const activeSubUserIds = new Set(
          (subRows ?? [])
            .filter(
              (s) =>
                s.status === "active" &&
                (!s.expires_at || new Date(s.expires_at).getTime() > nowMs)
            )
            .map((s) => s.user_id)
        );
        for (const entry of ledgerRows) {
          if (
            entry.status === "paid" &&
            (!entry.expires_at || new Date(entry.expires_at).getTime() > nowMs)
          ) {
            activeSubUserIds.add(entry.user_id);
          }
        }

        if (Array.isArray(profileRows)) {
          const mapped: ManagedUserRow[] = profileRows
            .filter((p) => !p.is_admin)
            .map((p) => {
              const primaryPhoto =
                (photoRows ?? []).find(
                  (ph) => ph.user_id === p.id && ph.is_primary
                ) ?? (photoRows ?? []).find((ph) => ph.user_id === p.id);

              let avatarUrl: string | undefined;
              if (primaryPhoto?.storage_path) {
                avatarUrl =
                  primaryPhoto.storage_path.startsWith("http") ||
                  primaryPhoto.storage_path.startsWith("data:")
                    ? primaryPhoto.storage_path
                    : supabase.storage
                        .from("profile-photos")
                        .getPublicUrl(
                          primaryPhoto.storage_path.replace(
                            /^profile-photos\//,
                            ""
                          )
                        ).data.publicUrl;
              }

              return {
                id: p.id,
                name: p.name || "User",
                email: `${(p.name || "user")
                  .toLowerCase()
                  .replace(/\s+/g, ".")}@user.haiyo`,
                age: p.date_of_birth ? calculateAge(p.date_of_birth) : 20,
                gender: (p.gender === "female" ? "female" : "male") as
                  | "male"
                  | "female",
                city: p.city || "-",
                status: (p.status as UserStatus) || "active",
                is_premium: activeSubUserIds.has(p.id),
                created_at: (p.created_at || "").slice(0, 10),
                avatar_url: avatarUrl,
                bio: p.bio ?? "",
              };
            });

          setManagedUsers(mapped);
        }

        setAppState((prev) => {
          if (!prev) return prev;
          const payMap = new Map<string, PaymentRecord>();
          for (const p of prev.payments) {
            payMap.set(p.order_id, p);
          }
          for (const p of payRows ?? []) {
            payMap.set(p.order_id, p as PaymentRecord);
          }
          for (const entry of ledgerRows) {
            const existing = payMap.get(entry.order_id);
            const plan = resolveSubscriptionPlan(
              entry.plan_code ?? entry.plan_id,
              entry.amount
            );
            payMap.set(entry.order_id, {
              id: existing?.id ?? entry.payment_id,
              user_id: entry.user_id,
              subscription_id:
                existing?.subscription_id ?? entry.subscription_id,
              order_id: entry.order_id,
              transaction_id:
                entry.transaction_id ?? existing?.transaction_id ?? null,
              gateway: entry.gateway || "direct",
              payment_method: entry.payment_method,
              amount: entry.amount,
              status: entry.status,
              paid_at: entry.paid_at ?? existing?.paid_at ?? null,
              created_at: entry.created_at,
              updated_at: entry.updated_at,
              user_name: entry.user_name,
              user_email: entry.user_email,
              plan_id: plan.id,
              plan_code: plan.code,
              plan_name: plan.name,
              duration_days: plan.duration_days,
              proof_url: entry.proof_url ?? existing?.proof_url ?? null,
              user_confirmed_at:
                entry.user_confirmed_at ?? existing?.user_confirmed_at ?? null,
            });
          }

          const subMap = new Map<string, SubscriptionRecord>();
          for (const s of prev.subscriptions) {
            subMap.set(s.id, s);
          }
          for (const s of subRows ?? []) {
            subMap.set(s.id, s as SubscriptionRecord);
          }
          for (const entry of ledgerRows) {
            const existing = subMap.get(entry.subscription_id);
            const plan = resolveSubscriptionPlan(
              entry.plan_code ?? entry.plan_id,
              entry.amount
            );
            const subStatus =
              entry.status === "paid"
                ? "active"
                : entry.status === "failed" || entry.status === "cancelled"
                ? "cancelled"
                : existing?.status ?? "pending";

            subMap.set(entry.subscription_id, {
              id: entry.subscription_id,
              user_id: entry.user_id,
              plan_id: plan.id,
              plan_code: plan.code,
              plan_name: plan.name,
              duration_days: plan.duration_days,
              user_name: entry.user_name,
              user_email: entry.user_email,
              status: subStatus,
              started_at: entry.started_at ?? existing?.started_at ?? null,
              expires_at: entry.expires_at ?? existing?.expires_at ?? null,
              created_at: entry.created_at,
              updated_at: entry.updated_at,
            });
          }

          return {
            ...prev,
            payments: Array.from(payMap.values()).sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            ),
            subscriptions: Array.from(subMap.values()).sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            ),
            reports:
              Array.isArray(repRows) && repRows.length > 0
                ? (repRows as ReportRecord[])
                : prev.reports,
          };
        });
      } catch {
        // Non-blocking fallback
      }
    };

    void fetchOperationalData();
    const timer = window.setInterval(fetchOperationalData, 8000);
    return () => window.clearInterval(timer);
  }, []);

  if (!appState) return null;

  // Enforce strict Admin authorization check (redirects to unified /login)
  const isAuthorizedAdmin = Boolean(
    appState.currentUser &&
      (appState.currentUser.email.trim().toLowerCase() === "admin@haiyo.id" ||
        appState.currentUser.profile.is_admin)
  );

  if (!isAuthorizedAdmin) {
    return null;
  }

  // Handle User Moderation Action (Suspend, Ban, Activate, Delete) via Server API
  const handleUserStatusChange = async (
    targetId: string,
    nextStatus: UserStatus
  ) => {
    await fetch("/api/admin/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "user_status",
        targetId,
        status: nextStatus,
      }),
    });

    setManagedUsers((prev) =>
      prev.map((u) => (u.id === targetId ? { ...u, status: nextStatus } : u))
    );

    toast({
      title: `Status pengguna diubah menjadi ${nextStatus.toUpperCase()}.`,
      variant: "success",
    });
  };

  // Handle Report Moderation Action (Review, Resolve, Dismiss) via Server API
  const handleReportStatusChange = async (
    reportId: string,
    nextStatus: ReportStatus
  ) => {
    await fetch("/api/admin/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "report_status",
        targetId: reportId,
        status: nextStatus,
      }),
    });

    const fresh = loadAppState();
    const updated: LocalAppState = {
      ...fresh,
      reports: fresh.reports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: nextStatus,
              reviewed_by: fresh.currentUser?.id ?? "admin",
              reviewed_at: new Date().toISOString(),
            }
          : r
      ),
    };
    saveAppState(updated);
    setAppState(updated);
    toast({
      title: `Laporan diperbarui ke status ${nextStatus.toUpperCase()}.`,
      variant: "success",
    });
  };

  // Handle QRIS Image Upload — keep raw file for server-side Storage upload on save
  const handleQrisFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const compressed = await compressImageToWebP(file, {
        maxDimension: 900,
        quality: 0.85,
      });
      // Show preview locally via data URL, but store the blob for server upload
      (
        (window as unknown as Record<string, unknown>)
          .__haiyoQrisFile as unknown
      );
      // Attach compressed blob to window for FormData pickup in save handler
      (window as unknown as Record<string, File>).__haiyoQrisFile = new File(
        [compressed.blob],
        `qris-${Date.now()}.webp`,
        { type: "image/webp" }
      );
      setPaymentConfigDraft((prev) => ({
        ...prev,
        qrisImageUrl: compressed.dataUrl, // local preview only
      }));
      toast({
        title: "Gambar QRIS siap diunggah",
        description: `Ukuran: ${formatKilobytes(compressed.compressedBytes)}. Klik Simpan Pengaturan Pembayaran untuk menyimpan ke server.`,
        variant: "info",
      });
    } catch {
      toast({
        title: "Gagal memproses gambar QRIS",
        description: "Pastikan file gambar berformat JPG, PNG, atau WebP.",
        variant: "error",
      });
    }
  };

  // Save Personal Bank / E-Wallet / QRIS Recipient Settings via Server API
  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPaymentConfig(true);
    try {
      const finalConfig: PaymentRecipientConfig = {
        ...paymentConfigDraft,
        qrisMerchantName:
          paymentConfigDraft.qrisMerchantName.trim() ||
          "HAIYO OFFICIAL INDONESIA",
        ewalletProvider:
          paymentConfigDraft.ewalletProvider.trim() ||
          "DANA / GoPay / OVO / ShopeePay",
        ewalletNumber: paymentConfigDraft.ewalletNumber.trim(),
        ewalletAccountName: paymentConfigDraft.ewalletAccountName.trim(),
        bankName: paymentConfigDraft.bankName.trim() || "BCA",
        bankAccountNumber: paymentConfigDraft.bankAccountNumber.trim(),
        bankAccountName: paymentConfigDraft.bankAccountName.trim(),
        whatsappConfirmationNumber:
          paymentConfigDraft.whatsappConfirmationNumber.trim(),
        requireAdminApproval: true,
      };

      // Build multipart form — include QRIS file if one was selected
      const pendingQrisFile = (
        window as unknown as Record<string, File | undefined>
      ).__haiyoQrisFile;

      let savedQrisUrl = finalConfig.qrisImageUrl;

      if (pendingQrisFile) {
        // Upload via multipart
        const formData = new FormData();
        // Strip local dataUrl from config before sending (server will return real URL)
        const configForServer = { ...finalConfig, qrisImageUrl: finalConfig.qrisImageUrl.startsWith("data:") ? "" : finalConfig.qrisImageUrl };
        formData.append("config", JSON.stringify(configForServer));
        formData.append("qrisFile", pendingQrisFile);

        const res = await fetch("/api/admin/payment-settings", {
          method: "POST",
          headers: {
            "x-admin-secret": "admin@haiyo.id",
          },
          body: formData,
        });

        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? "Server error");
        }
        const result = (await res.json()) as {
          success: boolean;
          qrisImageUrl?: string | null;
        };
        if (result.qrisImageUrl) {
          savedQrisUrl = result.qrisImageUrl;
          finalConfig.qrisImageUrl = savedQrisUrl;
        }
        // Clear the pending file reference
        delete (window as unknown as Record<string, unknown>).__haiyoQrisFile;
      } else {
        // No new file — JSON POST only (existing URL or empty)
        const configForServer = {
          ...finalConfig,
          // Don't send large base64 data URLs as JSON — keep existing storage URL
          qrisImageUrl: finalConfig.qrisImageUrl.startsWith("data:")
            ? ""
            : finalConfig.qrisImageUrl,
        };
        const res = await fetch("/api/admin/payment-settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-secret": "admin@haiyo.id",
          },
          body: JSON.stringify(configForServer),
        });
        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? "Server error");
        }
      }

      // Persist to local state / localStorage as well (optimistic UI)
      const fresh = loadAppState();
      const updated: LocalAppState = {
        ...fresh,
        paymentConfig: { ...finalConfig, qrisImageUrl: savedQrisUrl },
      };
      saveAppState(updated);
      setAppState(updated);
      setPaymentConfigDraft({ ...finalConfig, qrisImageUrl: savedQrisUrl });

      toast({
        title: "Pengaturan Pembayaran Disimpan!",
        description:
          "Rekening Bank, E-Wallet, dan QRIS kamu sekarang aktif di halaman Checkout & Status Pembayaran.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Gagal menyimpan pengaturan pembayaran",
        description:
          err instanceof Error ? err.message : "Coba lagi beberapa saat.",
        variant: "error",
      });
    } finally {
      setIsSavingPaymentConfig(false);
    }
  };


  // Helper to resolve user's display name, email, avatar
  const resolveUserDisplay = (
    userId: string,
    fallbackName?: string,
    fallbackEmail?: string
  ) => {
    const matched = managedUsers.find((u) => u.id === userId);
    return {
      name: fallbackName || matched?.name || "Pengguna HAIYO",
      email:
        fallbackEmail ||
        matched?.email ||
        `${(fallbackName || matched?.name || "user")
          .toLowerCase()
          .replace(/\s+/g, ".")}@user.haiyo`,
      avatar_url: matched?.avatar_url,
      city: matched?.city || "-",
    };
  };

  // Admin Direct Payment Approval / Rejection
  const handleAdminVerifyPayment = async (
    orderId: string,
    targetStatus: "paid" | "failed"
  ) => {
    const fresh = loadAppState();
    const payment =
      fresh.payments.find((p) => p.order_id === orderId) ??
      appState?.payments.find((p) => p.order_id === orderId);

    if (!payment) {
      toast({
        title: "Transaksi tidak ditemukan",
        variant: "error",
      });
      return;
    }

    if (payment.status === "paid" && targetStatus === "paid") {
      toast({
        title: "Transaksi sudah berstatus PAID",
        description: "Masa aktif tidak digandakan (Idempotent).",
        variant: "info",
      });
      return;
    }

    const targetUserId = payment.user_id;
    const resolvedPlan = resolveSubscriptionPlan(
      payment.plan_code ?? payment.plan_id,
      payment.amount
    );
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();

    if (targetStatus === "failed") {
      await upsertPaymentOrderInLedger({
        order_id: orderId,
        status: "failed",
      });

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          await supabase
            .from("payments")
            .update({ status: "failed" })
            .eq("order_id", orderId);
        } catch {
          // non-blocking
        }
      }

      const updated: LocalAppState = {
        ...fresh,
        payments: fresh.payments.map((p) =>
          p.order_id === orderId ? { ...p, status: "failed" } : p
        ),
        subscriptions: fresh.subscriptions.map((s) =>
          s.id === payment.subscription_id ? { ...s, status: "cancelled" } : s
        ),
      };
      saveAppState(updated);
      setAppState(updated);
      if (inspectedProof?.orderId === orderId) {
        setInspectedProof(null);
      }
      toast({
        title: `Transaksi ${orderId} Ditolak (FAILED).`,
        variant: "error",
      });
      return;
    }

    // Cumulative Renewal calculation (PRD Section 31):
    // Add plan duration to current active unexpired subscription for this user
    const existingActiveExpiryMs = (appState?.subscriptions ?? fresh.subscriptions)
      .filter(
        (s) =>
          s.user_id === targetUserId &&
          s.status === "active" &&
          s.expires_at &&
          new Date(s.expires_at).getTime() > nowMs
      )
      .reduce(
        (max, s) => Math.max(max, new Date(s.expires_at!).getTime()),
        nowMs
      );

    const durationMs = resolvedPlan.duration_days * 24 * 60 * 60 * 1000;
    const newExpiryIso = new Date(existingActiveExpiryMs + durationMs).toISOString();
    const adminTrxId = `ADM-${Date.now()}`;

    // 1. Update in site_settings payment_orders_ledger
    await upsertPaymentOrderInLedger({
      order_id: orderId,
      status: "paid",
      transaction_id: adminTrxId,
      paid_at: nowIso,
      started_at: nowIso,
      expires_at: newExpiryIso,
    });

    // 2. Update Supabase tables if reachable
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase
          .from("payments")
          .update({
            status: "paid",
            paid_at: nowIso,
            transaction_id: adminTrxId,
          })
          .eq("order_id", orderId);

        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            started_at: nowIso,
            expires_at: newExpiryIso,
          })
          .eq("id", payment.subscription_id);

        await supabase.from("notifications").insert([
          {
            user_id: targetUserId,
            type: "subscription_active",
            title: "HAIYO Premium Aktif",
            message: `${resolvedPlan.name} aktif hingga ${new Date(
              newExpiryIso
            ).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}.`,
            reference_id: payment.subscription_id,
            is_read: false,
          },
          {
            user_id: targetUserId,
            type: "payment_success",
            title: "Pembayaran Diverifikasi Admin",
            message: `Pembayaran ${formatRupiah(
              payment.amount
            )} untuk ${resolvedPlan.name} telah disetujui Admin.`,
            reference_id: payment.id,
            is_read: false,
          },
        ]);
      } catch {
        // non-blocking
      }
    }

    // 3. Update local state & active subscriptions
    const updated: LocalAppState = {
      ...fresh,
      payments: fresh.payments.map((p) =>
        p.order_id === orderId
          ? {
              ...p,
              status: "paid",
              transaction_id: adminTrxId,
              paid_at: nowIso,
            }
          : p
      ),
      subscriptions: fresh.subscriptions.map((s) =>
        s.id === payment.subscription_id
          ? {
              ...s,
              status: "active",
              started_at: nowIso,
              expires_at: newExpiryIso,
            }
          : s
      ),
      notifications: [
        {
          id: `notif-sub-${Date.now()}`,
          user_id: targetUserId,
          type: "subscription_active",
          title: "HAIYO Premium Aktif",
          message: `${resolvedPlan.name} aktif hingga ${new Date(
            newExpiryIso
          ).toLocaleDateString("id-ID")}.`,
          reference_id: payment.subscription_id,
          is_read: false,
          created_at: nowIso,
        },
        {
          id: `notif-pay-${Date.now()}`,
          user_id: targetUserId,
          type: "payment_success",
          title: "Pembayaran Diverifikasi Admin",
          message: `Pembayaran ${formatRupiah(
            payment.amount
          )} telah disetujui Admin.`,
          reference_id: payment.id,
          is_read: false,
          created_at: nowIso,
        },
        ...fresh.notifications,
      ],
    };

    saveAppState(updated);
    setAppState(updated);

    // Update user row in Users tab
    setManagedUsers((prev) =>
      prev.map((u) => (u.id === targetUserId ? { ...u, is_premium: true } : u))
    );

    if (inspectedProof?.orderId === orderId) {
      setInspectedProof(null);
    }

    toast({
      title: `Pembayaran Disetujui (PAID)!`,
      description: `${resolvedPlan.name} (${resolvedPlan.duration_days} Hari) untuk ${payment.user_name || "pengguna"} sekarang telah aktif.`,
      variant: "success",
    });
  };

  // Real Metrics calculation (0 dummy/sample offsets)
  const totalUsersCount = managedUsers.length;
  const activeUsersCount = managedUsers.filter(
    (u) => u.status === "active"
  ).length;
  const newUsers7dCount = managedUsers.filter((u) => {
    const createdMs = new Date(u.created_at).getTime();
    return (
      !Number.isNaN(createdMs) &&
      Date.now() - createdMs <= 7 * 24 * 60 * 60 * 1000
    );
  }).length;
  const totalMatchesCount = Math.max(dbMatchesCount, appState.matches.length);
  const totalMessagesCount = Math.max(
    dbMessagesCount,
    appState.messages.length
  );
  const premiumUsersCount = managedUsers.filter((u) => u.is_premium).length;
  const totalPaidRevenue = appState.payments
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => acc + p.amount, 0);

  const filteredUsers = managedUsers.filter((u) => {
    const matchesQuery =
      !userSearch.trim() ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesStatus =
      userStatusFilter === "all" || u.status === userStatusFilter;
    const matchesPremium =
      userPremiumFilter === "all" ||
      (userPremiumFilter === "premium" ? u.is_premium : !u.is_premium);
    return matchesQuery && matchesStatus && matchesPremium;
  });

  const allReports = appState.reports;
  const allSubscriptions = appState.subscriptions;
  const allPayments = appState.payments;

  const totalActiveSubs = allSubscriptions.length;
  const sub1mPct =
    totalActiveSubs > 0
      ? Math.round(
          (allSubscriptions.filter((s) => s.plan_id === "plan-1m").length /
            totalActiveSubs) *
            100
        )
      : 0;
  const sub3mPct =
    totalActiveSubs > 0
      ? Math.round(
          (allSubscriptions.filter((s) => s.plan_id === "plan-3m").length /
            totalActiveSubs) *
            100
        )
      : 0;
  const sub7dPct =
    totalActiveSubs > 0
      ? Math.max(0, 100 - sub1mPct - sub3mPct)
      : 0;

  const handleAdminLogout = async () => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.auth.signOut().catch(() => null);
    }
    logoutUserInState();
    toast({
      title: "Admin berhasil keluar.",
      variant: "info",
    });
    router.replace("/login");
  };

  const handleSaveHomepageConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const fresh = loadAppState();
    const updated: LocalAppState = {
      ...fresh,
      homepageConfig: homepageDraft,
    };
    saveAppState(updated);
    setAppState(updated);
    toast({
      title: "Konten Homepage & Download App Disimpan!",
      description:
        "Seluruh perubahan section sudah tayang langsung di halaman utama (/) dan halaman Download (/download).",
      variant: "success",
    });
  };

  const handleResetHomepageConfig = () => {
    const fresh = loadAppState();
    const updated: LocalAppState = {
      ...fresh,
      homepageConfig: DEFAULT_HOMEPAGE_CONFIG,
    };
    saveAppState(updated);
    setAppState(updated);
    setHomepageDraft(DEFAULT_HOMEPAGE_CONFIG);
    toast({
      title: "Konten Homepage dikembalikan ke default.",
      variant: "info",
    });
  };

  const sidebarItems: Array<{
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "homepage", label: "Homepage", icon: LayoutTemplate },
    { id: "users", label: "Users", icon: Users },
    { id: "reports", label: "Reports", icon: Flag },
    { id: "subscriptions", label: "Subscriptions", icon: Crown },
    { id: "payments", label: "Payments", icon: CreditCard },
  ];

  return (
    <div className="min-h-dvh flex flex-col md:flex-row bg-[#f9f9fa] text-[#1d1d1d]">
      {/* Admin Sidebar (UI/UX Section 77) */}
      <aside className="w-full md:w-[250px] md:h-dvh md:sticky md:top-0 bg-white border-b md:border-b-0 md:border-r border-[#E9E9EE] p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-2">
            <BrandLogo href="/admin" size="md" />
            <Badge variant="primary">ADMIN</Badge>
          </div>

          <nav className="flex md:flex-col gap-1.5 overflow-x-auto">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-4 h-11 rounded-[12px] text-[14px] font-semibold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-[#267a50] text-white shadow-sm"
                      : "text-[#6F7078] hover:text-[#1d1d1d] hover:bg-[#f9f9fa]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-[#E9E9EE] flex md:flex-col items-center md:items-stretch justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] text-[13px] font-semibold text-[#6F7078] hover:text-[#267a50] hover:bg-[#f9f9fa] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Lihat Beranda Web</span>
          </Link>
          <button
            type="button"
            onClick={handleAdminLogout}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] text-[13px] font-semibold text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto space-y-6">
        {/* 1. DASHBOARD TAB (UI/UX Section 78) */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-[26px] font-bold text-[#1d1d1d]">
                Admin Dashboard
              </h1>
              <p className="text-[14px] text-[#6F7078]">
                Ringkasan operasional real-time pengguna, percakapan, moderasi
                laporan, dan pendapatan langganan HAIYO.
              </p>
            </div>

            {/* 8 KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Users",
                  val: totalUsersCount,
                  icon: Users,
                  tone: "text-[#267a50] bg-[#eaf5ef]",
                },
                {
                  label: "Active Users",
                  val: activeUsersCount,
                  icon: ShieldCheck,
                  tone: "text-[#22C55E] bg-[#22C55E]/10",
                },
                {
                  label: "New Users (7d)",
                  val: newUsers7dCount,
                  icon: UserPlus,
                  tone: "text-[#67bf9a] bg-[#eaf5ef]",
                },
                {
                  label: "Total Matches",
                  val: totalMatchesCount,
                  icon: Heart,
                  tone: "text-[#267a50] bg-[#eaf5ef]",
                },
                {
                  label: "Total Messages",
                  val: totalMessagesCount,
                  icon: MessageCircle,
                  tone: "text-[#67bf9a] bg-[#eaf5ef]",
                },
                {
                  label: "Premium Users",
                  val: premiumUsersCount,
                  icon: Crown,
                  tone: "text-[#67bf9a] bg-[#eaf5ef]",
                },
                {
                  label: "Reports",
                  val: allReports.length,
                  icon: Flag,
                  tone: "text-[#F59E0B] bg-[#F59E0B]/10",
                },
                {
                  label: "Subscription Revenue",
                  val: formatRupiah(totalPaidRevenue),
                  icon: CreditCard,
                  tone: "text-[#16A34A] bg-[#22C55E]/10",
                },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="p-5 rounded-[20px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-3"
                  >
                    <div
                      className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${card.tone}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-[#6F7078]">
                        {card.label}
                      </p>
                      <p className="text-[22px] font-extrabold text-[#1d1d1d] mt-0.5">
                        {card.val}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Growth & Revenue Charts (UI/UX Section 78) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[16px] font-bold">
                    User & Premium Growth
                  </h2>
                  <Badge variant="primary">Real-Time</Badge>
                </div>
                <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
                  {[
                    {
                      label: "Total User",
                      u: Math.min(100, totalUsersCount * 10),
                      count: totalUsersCount,
                    },
                    {
                      label: "User Aktif",
                      u: Math.min(100, activeUsersCount * 10),
                      count: activeUsersCount,
                    },
                    {
                      label: "User Baru (7d)",
                      u: Math.min(100, newUsers7dCount * 10),
                      count: newUsers7dCount,
                    },
                    {
                      label: "Premium",
                      u: Math.min(100, premiumUsersCount * 10),
                      count: premiumUsersCount,
                    },
                  ].map((bar) => (
                    <div
                      key={bar.label}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <span className="text-[12px] font-bold text-[#1d1d1d]">
                        {bar.count}
                      </span>
                      <div className="w-full flex items-end justify-center gap-1.5 h-28 bg-[#f9f9fa] rounded-[10px] p-1.5">
                        <div
                          className="w-8 rounded-t-[6px] bg-[#267a50] transition-all"
                          style={{ height: `${Math.max(6, bar.u)}%` }}
                          title={`${bar.label}: ${bar.count}`}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-[#6F7078] text-center">
                        {bar.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[16px] font-bold">
                    Distribusi Paket Premium
                  </h2>
                  <Badge variant="secondary">
                    {totalActiveSubs} Langganan
                  </Badge>
                </div>
                <div className="space-y-3 pt-2 text-[13px]">
                  {[
                    {
                      name: "Premium 1 Bulan (Rp29.000)",
                      pct: sub1mPct,
                      color: "bg-[#267a50]",
                    },
                    {
                      name: "Premium 3 Bulan (Rp69.000)",
                      pct: sub3mPct,
                      color: "bg-[#67bf9a]",
                    },
                    {
                      name: "Premium 7 Hari (Rp12.000)",
                      pct: sub7dPct,
                      color: "bg-[#22C55E]",
                    },
                  ].map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between font-medium">
                        <span>{item.name}</span>
                        <span className="font-bold">{item.pct}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-[#E9E9EE] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. USERS TAB (UI/UX Section 79) */}
        {activeTab === "users" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-[24px] font-bold text-[#1d1d1d]">
                Manage Users
              </h1>
              <p className="text-[14px] text-[#6F7078]">
                Cari, lihat profil, suspend, ban, aktifkan kembali, atau hapus
                pengguna.
              </p>
            </div>

            <div className="p-4 rounded-[20px] bg-white border border-[#E9E9EE] grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Cari nama atau email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
              <Select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                options={[
                  { value: "all", label: "Semua Status" },
                  { value: "active", label: "Active" },
                  { value: "suspended", label: "Suspended" },
                  { value: "banned", label: "Banned" },
                  { value: "deleted", label: "Deleted" },
                ]}
              />
              <Select
                value={userPremiumFilter}
                onChange={(e) => setUserPremiumFilter(e.target.value)}
                options={[
                  { value: "all", label: "Semua Tier (Free & Premium)" },
                  { value: "premium", label: "Premium Only" },
                  { value: "free", label: "Free Only" },
                ]}
              />
            </div>

            <div className="rounded-[20px] bg-white border border-[#E9E9EE] overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#f9f9fa] border-b border-[#E9E9EE] text-[#6F7078] font-bold">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Age / Gender</th>
                    <th className="p-4">City</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Premium</th>
                    <th className="p-4">Created</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E9EE]">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#f9f9fa]/60">
                      <td className="p-4 font-bold text-[#1d1d1d] flex items-center gap-2.5">
                        <Avatar
                          name={u.name}
                          src={u.avatar_url}
                          size="sm"
                        />
                        <span>{u.name}</span>
                      </td>
                      <td className="p-4 text-[#6F7078]">{u.email}</td>
                      <td className="p-4">
                        {u.age} · {u.gender}
                      </td>
                      <td className="p-4">{u.city}</td>
                      <td className="p-4">
                        <Badge
                          variant={
                            u.status === "active"
                              ? "success"
                              : u.status === "suspended"
                              ? "warning"
                              : "danger"
                          }
                        >
                          {u.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {u.is_premium ? (
                          <PremiumBadge />
                        ) : (
                          <Badge variant="default">FREE</Badge>
                        )}
                      </td>
                      <td className="p-4 text-[#6F7078]">{u.created_at}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectedUser(u)}
                            className="px-2.5 py-1 rounded-full bg-[#F4F4F8] hover:bg-[#E9E9EE] font-semibold text-[11px] cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUserStatusChange(u.id, "suspended")
                            }
                            className="px-2.5 py-1 rounded-full bg-[#F59E0B]/15 text-[#D97706] font-semibold text-[11px] cursor-pointer"
                          >
                            Suspend
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUserStatusChange(u.id, "banned")
                            }
                            className="px-2.5 py-1 rounded-full bg-[#EF4444]/15 text-[#EF4444] font-semibold text-[11px] cursor-pointer"
                          >
                            Ban
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUserStatusChange(u.id, "active")
                            }
                            className="px-2.5 py-1 rounded-full bg-[#22C55E]/15 text-[#16A34A] font-semibold text-[11px] cursor-pointer"
                          >
                            Activate
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUserStatusChange(u.id, "deleted")
                            }
                            className="px-2.5 py-1 rounded-full bg-[#1d1d1d]/10 text-[#1d1d1d] font-semibold text-[11px] cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. REPORTS TAB (UI/UX Section 80) */}
        {activeTab === "reports" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-[24px] font-bold text-[#1d1d1d]">
                User Reports Moderation
              </h1>
              <p className="text-[14px] text-[#6F7078]">
                Tinjau dan selesaikan laporan pelanggaran dari pengguna.
              </p>
            </div>

            <div className="rounded-[20px] bg-white border border-[#E9E9EE] overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#f9f9fa] border-b border-[#E9E9EE] text-[#6F7078] font-bold">
                  <tr>
                    <th className="p-4">Reporter</th>
                    <th className="p-4">Reported User</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Created</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E9EE]">
                  {allReports.map((rep) => (
                    <tr key={rep.id}>
                      <td className="p-4 font-mono text-[12px]">
                        {rep.reporter_id}
                      </td>
                      <td className="p-4 font-bold text-[#1d1d1d]">
                        {rep.reported_user_id}
                      </td>
                      <td className="p-4">
                        <Badge variant="warning">{rep.reason}</Badge>
                      </td>
                      <td className="p-4 text-[#6F7078]">
                        {rep.description ?? "-"}
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            rep.status === "resolved"
                              ? "success"
                              : rep.status === "pending"
                              ? "warning"
                              : "default"
                          }
                        >
                          {rep.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-4 text-[#6F7078]">
                        {new Date(rep.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleReportStatusChange(rep.id, "reviewed")
                            }
                            className="px-2.5 py-1 rounded-full bg-[#eaf5ef] text-[#67bf9a] font-semibold text-[11px] cursor-pointer"
                          >
                            Review
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleReportStatusChange(rep.id, "resolved")
                            }
                            className="px-2.5 py-1 rounded-full bg-[#22C55E]/15 text-[#16A34A] font-semibold text-[11px] cursor-pointer"
                          >
                            Resolve
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleReportStatusChange(rep.id, "dismissed")
                            }
                            className="px-2.5 py-1 rounded-full bg-[#F4F4F8] text-[#6F7078] font-semibold text-[11px] cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. SUBSCRIPTIONS TAB (UI/UX Section 81) */}
        {activeTab === "subscriptions" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-[24px] font-bold text-[#1d1d1d]">
                  Subscriptions
                </h1>
                <p className="text-[14px] text-[#6F7078]">
                  Pantau status paket langganan Premium pengguna.
                </p>
              </div>
              <div className="w-56">
                <Select
                  value={subFilter}
                  onChange={(e) => setSubFilter(e.target.value)}
                  options={[
                    { value: "all", label: "Semua Status" },
                    { value: "active", label: "Active" },
                    { value: "expired", label: "Expired" },
                    { value: "cancelled", label: "Cancelled" },
                    { value: "pending", label: "Pending" },
                  ]}
                />
              </div>
            </div>

            <div className="rounded-[20px] bg-white border border-[#E9E9EE] overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#f9f9fa] border-b border-[#E9E9EE] text-[#6F7078] font-bold">
                  <tr>
                    <th className="p-4">Pengguna</th>
                    <th className="p-4">Paket & Durasi</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Mulai Aktif</th>
                    <th className="p-4">Berakhir Pada</th>
                    <th className="p-4">Dibuat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E9EE]">
                  {allSubscriptions
                    .filter((s) => subFilter === "all" || s.status === subFilter)
                    .map((sub) => {
                      const plan = resolveSubscriptionPlan(
                        sub.plan_code ?? sub.plan_id,
                        undefined
                      );
                      const uInfo = resolveUserDisplay(
                        sub.user_id,
                        sub.user_name,
                        sub.user_email
                      );
                      return (
                        <tr key={sub.id} className="hover:bg-[#f9f9fa]/60">
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar
                                name={uInfo.name}
                                src={uInfo.avatar_url}
                                size="sm"
                              />
                              <div>
                                <p className="font-bold text-[#1d1d1d]">
                                  {uInfo.name}
                                </p>
                                <p className="text-[11px] text-[#6F7078]">
                                  {uInfo.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <p className="font-bold text-[#1d1d1d]">
                                {sub.plan_name || plan.name}
                              </p>
                              <span className="inline-block px-2 py-0.5 rounded-full bg-[#eaf5ef] text-[#267a50] text-[11px] font-bold">
                                {sub.duration_days ?? plan.duration_days} Hari
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={
                                sub.status === "active"
                                  ? "success"
                                  : sub.status === "pending"
                                  ? "warning"
                                  : "default"
                              }
                            >
                              {sub.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-4 text-[#6F7078]">
                            {sub.started_at
                              ? new Date(sub.started_at).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : "-"}
                          </td>
                          <td className="p-4 font-semibold text-[#267a50]">
                            {sub.expires_at
                              ? new Date(sub.expires_at).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : "-"}
                          </td>
                          <td className="p-4 text-[#6F7078]">
                            {new Date(sub.created_at).toLocaleDateString(
                              "id-ID"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. PAYMENTS TAB (UI/UX Section 82 + Personal Recipient Settings) */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-[24px] font-bold text-[#1d1d1d]">
                Payments & Pengaturan Rekening Penerima
              </h1>
              <p className="text-[14px] text-[#6F7078]">
                Atur nomor Rekening Bank, E-Wallet, dan kode QRIS milikmu agar
                pembayaran paket HAIYO Premium langsung masuk ke akunmu.
              </p>
            </div>

            {/* Pengaturan Rekening, E-Wallet & QRIS Pribadi */}
            <form
              onSubmit={handleSavePaymentConfig}
              className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E9E9EE]">
                <div>
                  <h2 className="text-[18px] font-bold text-[#1d1d1d]">
                    1. Pengaturan Rekening Bank, E-Wallet & QRIS Kamu
                  </h2>
                  <p className="text-[13px] text-[#6F7078]">
                    Data di bawah ini akan otomatis ditampilkan kepada user saat
                    mereka memilih metode pembayaran di halaman Checkout & Status
                    Pembayaran.
                  </p>
                </div>
                <Badge variant="primary">DIRECT PAYOUT</Badge>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* A. QRIS Pribadi / Toko */}
                <div className="p-4 rounded-[16px] bg-[#f9f9fa] border border-[#E9E9EE] space-y-3.5">
                  <div className="flex items-center gap-2 text-[14px] font-bold text-[#1d1d1d]">
                    <QrCode className="w-4 h-4 text-[#267a50]" />
                    <span>QRIS Pribadi / Toko</span>
                  </div>

                  <Input
                    label="Nama Merchant / Toko QRIS"
                    placeholder="Contoh: HAIYO OFFICIAL / NAMA KAMU"
                    value={paymentConfigDraft.qrisMerchantName}
                    onChange={(e) =>
                      setPaymentConfigDraft((prev) => ({
                        ...prev,
                        qrisMerchantName: e.target.value,
                      }))
                    }
                  />

                  <Input
                    label="NMID QRIS (Opsional)"
                    placeholder="Contoh: ID1026000018821"
                    value={paymentConfigDraft.qrisNmid}
                    onChange={(e) =>
                      setPaymentConfigDraft((prev) => ({
                        ...prev,
                        qrisNmid: e.target.value,
                      }))
                    }
                  />

                  <div className="space-y-2">
                    <label className="block text-[13px] font-semibold text-[#1d1d1d]">
                      Gambar Kode QRIS Asli Kamu
                    </label>
                    {paymentConfigDraft.qrisImageUrl ? (
                      <div className="p-3 rounded-[14px] bg-white border border-[#E9E9EE] text-center space-y-2">
                        <img
                          src={paymentConfigDraft.qrisImageUrl}
                          alt="Preview QRIS"
                          className="w-36 h-36 object-contain mx-auto rounded-[8px]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPaymentConfigDraft((prev) => ({
                              ...prev,
                              qrisImageUrl: "",
                            }))
                          }
                          className="text-[12px] font-bold text-[#EF4444] hover:underline cursor-pointer"
                        >
                          Hapus / Ganti Gambar QRIS
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-[14px] bg-white border border-dashed border-[#267a50]/50 hover:bg-[#eaf5ef]/40 transition-colors cursor-pointer text-center">
                        <Upload className="w-5 h-5 text-[#267a50]" />
                        <span className="text-[12px] font-bold text-[#267a50]">
                          Upload Gambar QRIS (PNG / JPG)
                        </span>
                        <span className="text-[11px] text-[#6F7078]">
                          Jika kosong, sistem menampilkan ikon QRIS standar
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrisFileUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* B. E-Wallet Pribadi (DANA / GoPay / OVO / ShopeePay) */}
                <div className="p-4 rounded-[16px] bg-[#f9f9fa] border border-[#E9E9EE] space-y-3.5">
                  <div className="flex items-center gap-2 text-[14px] font-bold text-[#1d1d1d]">
                    <Wallet className="w-4 h-4 text-[#267a50]" />
                    <span>E-Wallet Kamu</span>
                  </div>

                  <Input
                    label="Jenis E-Wallet"
                    placeholder="Contoh: DANA / GoPay / OVO / ShopeePay"
                    value={paymentConfigDraft.ewalletProvider}
                    onChange={(e) =>
                      setPaymentConfigDraft((prev) => ({
                        ...prev,
                        ewalletProvider: e.target.value,
                      }))
                    }
                  />

                  <Input
                    label="Nomor HP E-Wallet"
                    placeholder="Contoh: 0812-3456-7890"
                    value={paymentConfigDraft.ewalletNumber}
                    onChange={(e) =>
                      setPaymentConfigDraft((prev) => ({
                        ...prev,
                        ewalletNumber: e.target.value,
                      }))
                    }
                  />

                  <Input
                    label="Atas Nama Akun E-Wallet"
                    placeholder="Contoh: Nama Lengkap Kamu"
                    value={paymentConfigDraft.ewalletAccountName}
                    onChange={(e) =>
                      setPaymentConfigDraft((prev) => ({
                        ...prev,
                        ewalletAccountName: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* C. Rekening Bank Pribadi */}
                <div className="p-4 rounded-[16px] bg-[#f9f9fa] border border-[#E9E9EE] space-y-3.5">
                  <div className="flex items-center gap-2 text-[14px] font-bold text-[#1d1d1d]">
                    <Building2 className="w-4 h-4 text-[#267a50]" />
                    <span>Rekening Bank Kamu</span>
                  </div>

                  <Input
                    label="Nama Bank"
                    placeholder="Contoh: BCA / BRI / Mandiri / BNI / SeaBank"
                    value={paymentConfigDraft.bankName}
                    onChange={(e) =>
                      setPaymentConfigDraft((prev) => ({
                        ...prev,
                        bankName: e.target.value,
                      }))
                    }
                  />

                  <Input
                    label="Nomor Rekening"
                    placeholder="Contoh: 8801081299"
                    value={paymentConfigDraft.bankAccountNumber}
                    onChange={(e) =>
                      setPaymentConfigDraft((prev) => ({
                        ...prev,
                        bankAccountNumber: e.target.value,
                      }))
                    }
                  />

                  <Input
                    label="Atas Nama Rekening"
                    placeholder="Contoh: Nama Lengkap Kamu"
                    value={paymentConfigDraft.bankAccountName}
                    onChange={(e) =>
                      setPaymentConfigDraft((prev) => ({
                        ...prev,
                        bankAccountName: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Mode Verifikasi & Nomor WhatsApp Konfirmasi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#E9E9EE]">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-semibold text-[#1d1d1d]">
                    Mode Aktivasi Pembayaran
                  </label>
                  <div className="px-4 py-3 rounded-[14px] bg-[#eaf5ef] border border-[#267a50]/30 flex items-center gap-2.5 text-[13px] font-bold text-[#267a50]">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>
                      Verifikasi Manual Admin (Wajib Bukti Transfer & Klik
                      Setujui)
                    </span>
                  </div>
                </div>

                <Input
                  label="Nomor WhatsApp Konfirmasi Bukti Transfer (Opsional)"
                  placeholder="Contoh: 6281234567890 (Kosongkan jika tidak perlu)"
                  value={paymentConfigDraft.whatsappConfirmationNumber}
                  onChange={(e) =>
                    setPaymentConfigDraft((prev) => ({
                      ...prev,
                      whatsappConfirmationNumber: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Link
                  href="/checkout?plan=PREMIUM_1M"
                  className="text-[13px] font-semibold text-[#267a50] hover:underline"
                >
                  Lihat Preview di Halaman Checkout →
                </Link>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSavingPaymentConfig}
                >
                  Simpan Pengaturan Rekening & E-Wallet
                </Button>
              </div>
            </form>

            {/* Daftar Transaksi & Verifikasi Pembayaran */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-[20px] font-bold text-[#1d1d1d]">
                    2. Daftar Transaksi & Persetujuan Pembayaran
                  </h2>
                  <p className="text-[13px] text-[#6F7078]">
                    Periksa foto bukti transfer atau mutasi Rekening/E-Wallet
                    kamu, lalu klik <strong>Setujui (PAID)</strong> untuk
                    mengaktifkan paket HAIYO Premium yang dipilih user.
                  </p>
                </div>
                <div className="w-56">
                  <Select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    options={[
                      { value: "all", label: "Semua Status" },
                      { value: "paid", label: "Paid (Disetujui)" },
                      { value: "pending", label: "Pending (Menunggu)" },
                      { value: "failed", label: "Failed (Ditolak)" },
                      { value: "expired", label: "Expired" },
                      { value: "cancelled", label: "Cancelled" },
                    ]}
                  />
                </div>
              </div>

              <div className="rounded-[20px] bg-white border border-[#E9E9EE] overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-[#f9f9fa] border-b border-[#E9E9EE] text-[#6F7078] font-bold">
                    <tr>
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Pengguna</th>
                      <th className="p-4">Paket Dipilih</th>
                      <th className="p-4">Nominal & Metode</th>
                      <th className="p-4">Bukti Transfer</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9E9EE]">
                    {allPayments
                      .filter(
                        (p) =>
                          paymentFilter === "all" || p.status === paymentFilter
                      )
                      .map((p) => {
                        const subRecord = allSubscriptions.find(
                          (s) => s.id === p.subscription_id
                        );
                        const resolvedPlan = resolveSubscriptionPlan(
                          p.plan_code ??
                            p.plan_id ??
                            subRecord?.plan_code ??
                            subRecord?.plan_id,
                          p.amount
                        );
                        const uInfo = resolveUserDisplay(
                          p.user_id,
                          p.user_name ?? subRecord?.user_name,
                          p.user_email ?? subRecord?.user_email
                        );
                        const proofUrl =
                          p.proof_url ??
                          (p.transaction_id?.startsWith("PROOF|")
                            ? p.transaction_id.slice(6)
                            : null);

                        return (
                          <tr key={p.id} className="hover:bg-[#f9f9fa]/60">
                            <td className="p-4">
                              <p className="font-mono font-bold text-[#1d1d1d]">
                                {p.order_id}
                              </p>
                              <p className="text-[11px] text-[#6F7078]">
                                {new Date(p.created_at).toLocaleString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2.5">
                                <Avatar
                                  name={uInfo.name}
                                  src={uInfo.avatar_url}
                                  size="sm"
                                />
                                <div>
                                  <p className="font-bold text-[#1d1d1d]">
                                    {uInfo.name}
                                  </p>
                                  <p className="text-[11px] text-[#6F7078]">
                                    {uInfo.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-[#1d1d1d]">
                                {p.plan_name || resolvedPlan.name}
                              </p>
                              <span className="inline-block px-2 py-0.5 rounded-full bg-[#eaf5ef] text-[#267a50] text-[11px] font-bold mt-0.5">
                                {p.duration_days ?? resolvedPlan.duration_days}{" "}
                                Hari
                              </span>
                            </td>
                            <td className="p-4">
                              <p className="font-extrabold text-[#267a50]">
                                {formatRupiah(p.amount)}
                              </p>
                              <p className="text-[11px] font-semibold uppercase text-[#6F7078]">
                                {p.payment_method === "bca_va"
                                  ? `Bank ${appState.paymentConfig.bankName}`
                                  : p.payment_method === "gopay"
                                  ? "E-Wallet"
                                  : p.payment_method}
                              </p>
                            </td>
                            <td className="p-4">
                              {proofUrl ? (
                                <div className="flex items-center gap-2">
                                  <img
                                    src={proofUrl}
                                    alt="Bukti Transfer"
                                    onClick={() =>
                                      setInspectedProof({
                                        proofUrl,
                                        orderId: p.order_id,
                                        userId: p.user_id,
                                        userName: uInfo.name,
                                        userEmail: uInfo.email,
                                        planName:
                                          p.plan_name || resolvedPlan.name,
                                        durationDays:
                                          p.duration_days ??
                                          resolvedPlan.duration_days,
                                        amount: p.amount,
                                        paymentMethod: p.payment_method,
                                        status: p.status,
                                        userConfirmedAt: p.user_confirmed_at,
                                        createdAt: p.created_at,
                                      })
                                    }
                                    className="w-10 h-10 rounded-[8px] object-cover border border-[#E9E9EE] cursor-pointer hover:opacity-80 shrink-0"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setInspectedProof({
                                        proofUrl,
                                        orderId: p.order_id,
                                        userId: p.user_id,
                                        userName: uInfo.name,
                                        userEmail: uInfo.email,
                                        planName:
                                          p.plan_name || resolvedPlan.name,
                                        durationDays:
                                          p.duration_days ??
                                          resolvedPlan.duration_days,
                                        amount: p.amount,
                                        paymentMethod: p.payment_method,
                                        status: p.status,
                                        userConfirmedAt: p.user_confirmed_at,
                                        createdAt: p.created_at,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#eaf5ef] text-[#267a50] hover:bg-[#267a50] hover:text-white font-bold text-[11px] transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Lihat Bukti</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-[#6F7078] italic">
                                  Belum upload bukti
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                <Badge
                                  variant={
                                    p.status === "paid"
                                      ? "success"
                                      : p.status === "pending"
                                      ? "warning"
                                      : "danger"
                                  }
                                >
                                  {p.status === "pending" &&
                                  (proofUrl || p.user_confirmed_at)
                                    ? "SIAP VERIFIKASI"
                                    : p.status.toUpperCase()}
                                </Badge>
                                {p.paid_at && (
                                  <p className="text-[10px] text-[#6F7078]">
                                    {new Date(p.paid_at).toLocaleString(
                                      "id-ID"
                                    )}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              {p.status === "paid" ? (
                                <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#16A34A]">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Aktif</span>
                                </span>
                              ) : (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdminVerifyPayment(
                                        p.order_id,
                                        "paid"
                                      )
                                    }
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#22C55E] text-white hover:bg-[#16A34A] font-bold text-[11px] shadow-sm transition-colors cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Setujui (PAID)</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAdminVerifyPayment(
                                        p.order_id,
                                        "failed"
                                      )
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#EF4444]/15 text-[#EF4444] hover:bg-[#EF4444] hover:text-white font-semibold text-[11px] transition-colors cursor-pointer"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Tolak</span>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. HOMEPAGE CMS TAB — Manage All Homepage Sections & Download App Links */}
        {activeTab === "homepage" && (
          <form onSubmit={handleSaveHomepageConfig} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-[24px] font-bold text-[#1d1d1d]">
                  Homepage & Download App CMS
                </h1>
                <p className="text-[14px] text-[#6F7078]">
                  Kelola teks, judul, kartu fitur utama, hingga link download
                  Android & iOS untuk setiap section di halaman depan (/).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleResetHomepageConfig}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                >
                  Reset Default
                </Button>
                <Link href="/" target="_blank">
                  <Button type="button" variant="secondary" size="sm">
                    Lihat Homepage
                  </Button>
                </Link>
                <Button type="submit" variant="primary" size="sm">
                  Simpan Semua Perubahan
                </Button>
              </div>
            </div>

            {/* Section 1: Hero Section */}
            <section className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E9E9EE]">
                <h2 className="text-[18px] font-bold text-[#1d1d1d]">
                  Section 1 · Hero Banner & Kartu Preview Profil
                </h2>
                <Badge variant="primary">HERO</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Teks Badge Atas"
                  value={homepageDraft.heroBadge}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      heroBadge: e.target.value,
                    }))
                  }
                />
                <Input
                  label="Headline Utama (Hitam)"
                  value={homepageDraft.heroTitle}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      heroTitle: e.target.value,
                    }))
                  }
                />
                <Input
                  label="Headline Highlight (Hijau #267a50)"
                  value={homepageDraft.heroHighlight}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      heroHighlight: e.target.value,
                    }))
                  }
                />
              </div>

              <Textarea
                label="Deskripsi Hero"
                value={homepageDraft.heroSubtitle}
                onChange={(e) =>
                  setHomepageDraft((prev) => ({
                    ...prev,
                    heroSubtitle: e.target.value,
                  }))
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Teks Tombol Utama (Primary CTA)"
                  value={homepageDraft.heroPrimaryCta}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      heroPrimaryCta: e.target.value,
                    }))
                  }
                />
                <Input
                  label="Teks Tombol Kedua (Secondary CTA)"
                  value={homepageDraft.heroSecondaryCta}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      heroSecondaryCta: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="pt-3 border-t border-[#E9E9EE] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  label="Nama & Usia Kartu Preview"
                  value={homepageDraft.heroCardName}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      heroCardName: e.target.value,
                    }))
                  }
                />
                <Input
                  label="Lokasi Kartu Preview"
                  value={homepageDraft.heroCardLocation}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      heroCardLocation: e.target.value,
                    }))
                  }
                />
                <Input
                  label="Bio Singkat Kartu Preview"
                  value={homepageDraft.heroCardBio}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      heroCardBio: e.target.value,
                    }))
                  }
                />
                <Input
                  label="URL Foto Kartu Preview"
                  value={homepageDraft.heroCardPhotoUrl}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      heroCardPhotoUrl: e.target.value,
                    }))
                  }
                />
              </div>
            </section>

            {/* Section 2: Cara Kerja (4 Langkah) */}
            <section className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E9E9EE]">
                <h2 className="text-[18px] font-bold text-[#1d1d1d]">
                  Section 2 · Cara Kerja HAIYO (4 Langkah)
                </h2>
                <Badge variant="primary">HOW IT WORKS</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Badge Section"
                  value={homepageDraft.howItWorksBadge}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      howItWorksBadge: e.target.value,
                    }))
                  }
                />
                <Input
                  label="Judul Section"
                  value={homepageDraft.howItWorksTitle}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      howItWorksTitle: e.target.value,
                    }))
                  }
                />
                <Input
                  label="Subjudul Section"
                  value={homepageDraft.howItWorksSubtitle}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      howItWorksSubtitle: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {homepageDraft.howItWorksSteps.map((stepItem, idx) => (
                  <div
                    key={stepItem.step}
                    className="p-4 rounded-[16px] bg-[#f9f9fa] border border-[#E9E9EE] space-y-3"
                  >
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#267a50] text-white font-bold text-[12px]">
                      {stepItem.step}
                    </span>
                    <Input
                      label={`Judul Langkah ${stepItem.step}`}
                      value={stepItem.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHomepageDraft((prev) => ({
                          ...prev,
                          howItWorksSteps: prev.howItWorksSteps.map((s, i) =>
                            i === idx ? { ...s, title: val } : s
                          ),
                        }));
                      }}
                    />
                    <Textarea
                      label="Deskripsi"
                      value={stepItem.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHomepageDraft((prev) => ({
                          ...prev,
                          howItWorksSteps: prev.howItWorksSteps.map((s, i) =>
                            i === idx ? { ...s, description: val } : s
                          ),
                        }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3: Fitur Utama (4 Green Cards) */}
            <section className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E9E9EE]">
                <h2 className="text-[18px] font-bold text-[#1d1d1d]">
                  Section 3 · Fitur Utama (4 Card Hijau #267a50)
                </h2>
                <Badge variant="secondary">FEATURES</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Badge Section"
                  value={homepageDraft.featuresBadge}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      featuresBadge: e.target.value,
                    }))
                  }
                />
                <Input
                  label="Judul Section Fitur Utama"
                  value={homepageDraft.featuresTitle}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      featuresTitle: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {homepageDraft.featuresItems.map((feat, idx) => (
                  <div
                    key={feat.id || idx}
                    className="p-4 rounded-[16px] bg-[#f9f9fa] border border-[#E9E9EE] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-[#267a50] uppercase">
                        Card Fitur 0{idx + 1}
                      </span>
                    </div>
                    <Input
                      label="Judul Fitur"
                      value={feat.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHomepageDraft((prev) => ({
                          ...prev,
                          featuresItems: prev.featuresItems.map((f, i) =>
                            i === idx ? { ...f, title: val } : f
                          ),
                        }));
                      }}
                    />
                    <Textarea
                      label="Deskripsi Fitur"
                      value={feat.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHomepageDraft((prev) => ({
                          ...prev,
                          featuresItems: prev.featuresItems.map((f, i) =>
                            i === idx ? { ...f, description: val } : f
                          ),
                        }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Section 4: Keamanan & Privasi */}
            <section className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E9E9EE]">
                <h2 className="text-[18px] font-bold text-[#1d1d1d]">
                  Section 4 · Keamanan & Privasi (3 Pilar)
                </h2>
                <Badge variant="success">SAFETY</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Badge Section"
                  value={homepageDraft.safetyBadge}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      safetyBadge: e.target.value,
                    }))
                  }
                />
                <Input
                  label="Judul Section Keamanan"
                  value={homepageDraft.safetyTitle}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      safetyTitle: e.target.value,
                    }))
                  }
                />
                <Input
                  label="Deskripsi Section Keamanan"
                  value={homepageDraft.safetySubtitle}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      safetySubtitle: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {homepageDraft.safetyItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-[16px] bg-[#f9f9fa] border border-[#E9E9EE] space-y-3"
                  >
                    <Input
                      label={`Judul Pilar 0${idx + 1}`}
                      value={item.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHomepageDraft((prev) => ({
                          ...prev,
                          safetyItems: prev.safetyItems.map((s, i) =>
                            i === idx ? { ...s, title: val } : s
                          ),
                        }));
                      }}
                    />
                    <Textarea
                      label="Deskripsi"
                      value={item.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setHomepageDraft((prev) => ({
                          ...prev,
                          safetyItems: prev.safetyItems.map((s, i) =>
                            i === idx ? { ...s, description: val } : s
                          ),
                        }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Section 5 & 6: Premium Header + Final CTA Download App (Android & iOS) */}
            <section className="p-6 rounded-[20px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E9E9EE]">
                <h2 className="text-[18px] font-bold text-[#1d1d1d]">
                  Section 5 & 6 · Premium Header, Final CTA (#267a50) & Halaman Download App (/download)
                </h2>
                <Badge variant="primary">CTA & DOWNLOAD APP</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Judul Section Premium"
                  value={homepageDraft.premiumTitle}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      premiumTitle: e.target.value,
                    }))
                  }
                />
                <Input
                  label="Subjudul Section Premium"
                  value={homepageDraft.premiumSubtitle}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      premiumSubtitle: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="pt-3 border-t border-[#E9E9EE] grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Judul Kotak CTA Hijau (#267a50)"
                  value={homepageDraft.ctaTitle}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      ctaTitle: e.target.value,
                    }))
                  }
                />
                <Input
                  label="Teks Tombol Putih (#f9f9fa)"
                  value={homepageDraft.ctaButtonText}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      ctaButtonText: e.target.value,
                    }))
                  }
                />
                <Input
                  label="Deskripsi Kotak CTA Hijau"
                  value={homepageDraft.ctaSubtitle}
                  onChange={(e) =>
                    setHomepageDraft((prev) => ({
                      ...prev,
                      ctaSubtitle: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="pt-3 border-t border-[#E9E9EE] grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-[16px] bg-[#f9f9fa] border border-[#E9E9EE] space-y-3">
                  <p className="text-[13px] font-bold text-[#267a50] uppercase">
                    Konfigurasi Download Android (/download)
                  </p>
                  <Input
                    label="URL Download Google Play / File APK"
                    placeholder="https://play.google.com/store/apps/..."
                    value={homepageDraft.androidDownloadUrl}
                    onChange={(e) =>
                      setHomepageDraft((prev) => ({
                        ...prev,
                        androidDownloadUrl: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label="Info Versi Android"
                    placeholder="v1.2.0 · Android 8.0+"
                    value={homepageDraft.androidVersion}
                    onChange={(e) =>
                      setHomepageDraft((prev) => ({
                        ...prev,
                        androidVersion: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="p-4 rounded-[16px] bg-[#f9f9fa] border border-[#E9E9EE] space-y-3">
                  <p className="text-[13px] font-bold text-[#1d1d1d] uppercase">
                    Konfigurasi Download iOS (/download)
                  </p>
                  <Input
                    label="URL Download Apple App Store"
                    placeholder="https://apps.apple.com/id/app/..."
                    value={homepageDraft.iosDownloadUrl}
                    onChange={(e) =>
                      setHomepageDraft((prev) => ({
                        ...prev,
                        iosDownloadUrl: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label="Info Versi iOS"
                    placeholder="v1.2.0 · iOS 15.0+"
                    value={homepageDraft.iosVersion}
                    onChange={(e) =>
                      setHomepageDraft((prev) => ({
                        ...prev,
                        iosVersion: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Link
                  href="/download"
                  target="_blank"
                  className="text-[13px] font-semibold text-[#267a50] hover:underline"
                >
                  Lihat Halaman Download App (/download) →
                </Link>
                <Button type="submit" variant="primary">
                  Simpan Semua Perubahan Homepage
                </Button>
              </div>
            </section>
          </form>
        )}

        <footer className="pt-6 border-t border-[#E9E9EE] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#6F7078]">
          <BrandLogo href="/admin" size="sm" />
          <span>© {new Date().getFullYear()} HAIYO Admin Portal</span>
        </footer>
      </main>

      {/* Inspect User Profile Modal */}
      {inspectedUser && (
        <Modal
          isOpen={Boolean(inspectedUser)}
          onClose={() => setInspectedUser(null)}
          title={`${inspectedUser.name}, ${inspectedUser.age}`}
          description={`${inspectedUser.email} · ${inspectedUser.city}`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar
                name={inspectedUser.name}
                src={inspectedUser.avatar_url}
                size="lg"
              />
              <div className="space-y-1 text-[13px]">
                <p>
                  <strong>Status:</strong> {inspectedUser.status.toUpperCase()}
                </p>
                <p>
                  <strong>Tier:</strong>{" "}
                  {inspectedUser.is_premium ? "Premium" : "Free"}
                </p>
                <p className="text-[#6F7078]">{inspectedUser.bio}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setInspectedUser(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Inspect Payment Proof Modal */}
      {inspectedProof && (
        <Modal
          isOpen={Boolean(inspectedProof)}
          onClose={() => setInspectedProof(null)}
          title="Bukti Transfer Pembayaran"
          description={`${inspectedProof.orderId} · ${inspectedProof.userName}`}
        >
          <div className="space-y-4">
            <div className="rounded-[16px] overflow-hidden border border-[#E9E9EE] bg-[#f9f9fa] max-h-[60dvh] flex items-center justify-center p-2">
              <img
                src={inspectedProof.proofUrl}
                alt="Bukti Transfer"
                className="max-w-full max-h-[58dvh] object-contain rounded-[10px]"
              />
            </div>

            <div className="p-4 rounded-[16px] bg-[#f9f9fa] border border-[#E9E9EE] text-[13px] space-y-2">
              <div className="flex justify-between">
                <span className="text-[#6F7078]">Nama Pengguna</span>
                <span className="font-bold text-[#1d1d1d]">
                  {inspectedProof.userName} ({inspectedProof.userEmail})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F7078]">Paket Dipilih</span>
                <span className="font-bold text-[#267a50]">
                  {inspectedProof.planName} ({inspectedProof.durationDays} Hari)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6F7078]">Nominal & Metode</span>
                <span className="font-extrabold text-[#1d1d1d] uppercase">
                  {formatRupiah(inspectedProof.amount)} ·{" "}
                  {inspectedProof.paymentMethod}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              {inspectedProof.status !== "paid" && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      handleAdminVerifyPayment(inspectedProof.orderId, "failed")
                    }
                  >
                    Tolak
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() =>
                      handleAdminVerifyPayment(inspectedProof.orderId, "paid")
                    }
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Setujui & Aktifkan Premium (PAID)
                  </Button>
                </>
              )}
              <Button
                variant="secondary"
                onClick={() => setInspectedProof(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
