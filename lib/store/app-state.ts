"use client";

import {
  DiscoveryProfileCard,
  Gender,
  MatchRecord,
  MessageRecord,
  NotificationRecord,
  PaymentRecord,
  Profile,
  ProfilePhoto,
  ReportReason,
  ReportRecord,
  SubscriptionPlan,
  SubscriptionPlanCode,
  SubscriptionRecord,
  UserPreferences,
} from "@/types/database";
import { calculateAge } from "@/lib/utils";
import { getCityCoordinates } from "@/lib/constants/cities";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export const MASTER_INTERESTS = [
  { id: "int-coffee", name: "Coffee", slug: "coffee", emoji: "☕" },
  { id: "int-music", name: "Music", slug: "music", emoji: "🎵" },
  { id: "int-travel", name: "Travel", slug: "travel", emoji: "✈️" },
  { id: "int-gaming", name: "Gaming", slug: "gaming", emoji: "🎮" },
  { id: "int-sports", name: "Sports", slug: "sports", emoji: "⚽" },
  { id: "int-reading", name: "Reading", slug: "reading", emoji: "📚" },
  { id: "int-food", name: "Food", slug: "food", emoji: "🍜" },
  { id: "int-movies", name: "Movies", slug: "movies", emoji: "🎬" },
  { id: "int-photo", name: "Photography", slug: "photography", emoji: "📸" },
  { id: "int-fitness", name: "Fitness", slug: "fitness", emoji: "🏋️" },
];

export const MASTER_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "plan-7d",
    code: "PREMIUM_7D",
    name: "Premium 7 Hari",
    duration_days: 7,
    price: 12000,
    is_active: true,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
  },
  {
    id: "plan-1m",
    code: "PREMIUM_1M",
    name: "Premium 1 Bulan",
    duration_days: 30,
    price: 29000,
    is_active: true,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
  },
  {
    id: "plan-3m",
    code: "PREMIUM_3M",
    name: "Premium 3 Bulan",
    duration_days: 90,
    price: 69000,
    is_active: true,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
  },
];

export const SEED_CANDIDATE_PROFILES: DiscoveryProfileCard[] = [];

export interface PaymentRecipientConfig {
  qrisMerchantName: string;
  qrisNmid: string;
  qrisImageUrl: string;
  ewalletProvider: string;
  ewalletNumber: string;
  ewalletAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  whatsappConfirmationNumber: string;
  requireAdminApproval: boolean;
}

export const DEFAULT_PAYMENT_CONFIG: PaymentRecipientConfig = {
  qrisMerchantName: "HAIYO OFFICIAL INDONESIA",
  qrisNmid: "ID1026000018821",
  qrisImageUrl: "",
  ewalletProvider: "DANA / GoPay / OVO / ShopeePay",
  ewalletNumber: "0812-3456-7890",
  ewalletAccountName: "Admin HAIYO",
  bankName: "BCA",
  bankAccountNumber: "8801081299",
  bankAccountName: "Admin HAIYO",
  whatsappConfirmationNumber: "",
  requireAdminApproval: false,
};

export interface HomepageStepItem {
  step: string;
  title: string;
  description: string;
}

export interface HomepageFeatureItem {
  id: string;
  title: string;
  description: string;
}

export interface HomepageSafetyItem {
  id: string;
  title: string;
  description: string;
}

export interface HomepageConfig {
  heroBadge: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroCardName: string;
  heroCardLocation: string;
  heroCardBio: string;
  heroCardPhotoUrl: string;
  howItWorksBadge: string;
  howItWorksTitle: string;
  howItWorksSubtitle: string;
  howItWorksSteps: HomepageStepItem[];
  featuresBadge: string;
  featuresTitle: string;
  featuresItems: HomepageFeatureItem[];
  safetyBadge: string;
  safetyTitle: string;
  safetySubtitle: string;
  safetyItems: HomepageSafetyItem[];
  premiumTitle: string;
  premiumSubtitle: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonText: string;
  androidDownloadUrl: string;
  androidVersion: string;
  iosDownloadUrl: string;
  iosVersion: string;
}

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfig = {
  heroBadge: "Tempat santai buat ketemu orang baru (18+)",
  heroTitle: "Ketemu orang baru,",
  heroHighlight: "siapa tahu jadi sesuatu.",
  heroSubtitle:
    "Kenalan, ngobrol, dan lihat ke mana ceritanya berjalan. Dari teman baru, teman ngopi, sampai hubungan yang lebih dekat—semuanya dimulai dari satu sapaan santai.",
  heroPrimaryCta: "Mulai Kenalan",
  heroSecondaryCta: "Sudah punya akun? Login",
  heroCardName: "Sarah, 24",
  heroCardLocation: "Makassar · ±8 km away",
  heroCardBio: "Suka kopi, musik dan jalan malam. Cari teman ngobrol yang asik!",
  heroCardPhotoUrl:
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80",
  howItWorksBadge: "Cara Kerja HAIYO",
  howItWorksTitle: "Mulai kenalan dalam 4 langkah mudah",
  howItWorksSubtitle:
    "Tidak perlu bingung harus mulai dari mana. Cukup buat profil dan temukan teman ngobrol baru.",
  howItWorksSteps: [
    {
      step: "01",
      title: "Buat Profil",
      description: "Lengkapi profil dan ceritakan sedikit tentang dirimu.",
    },
    {
      step: "02",
      title: "Temukan Orang Baru",
      description: "Lihat profil yang sesuai dengan preferensimu.",
    },
    {
      step: "03",
      title: "Saling Suka",
      description: "Like seseorang. Kalau dia juga Like kamu...",
    },
    {
      step: "04",
      title: "It's a Match!",
      description: "Mulai ngobrol dan lihat ke mana ceritanya berjalan.",
    },
  ],
  featuresBadge: "Fitur Utama",
  featuresTitle: "Dirancang santai, fokus pada manusia & percakapan",
  featuresItems: [
    {
      id: "nearby",
      title: "Temukan di Sekitarmu",
      description:
        "Atur radius 0 km hingga 500 km untuk mengenal orang baru di kotamu tanpa mengekspos lokasi presisi.",
    },
    {
      id: "matching",
      title: "Matching yang Simpel",
      description:
        "Geser kanan kalau tertarik, geser kiri kalau belum cocok. Tanpa formulir rumit yang melelahkan.",
    },
    {
      id: "chat",
      title: "Ngobrol Realtime",
      description:
        "Begitu saling suka (Match!), langsung mulai obrolan santai secara instan tanpa hambatan.",
    },
    {
      id: "filter",
      title: "Sesuai Preferensimu",
      description:
        "Filter usia, jarak, dan minat yang sama—mulai dari Coffee, Music, hingga Travel.",
    },
  ],
  safetyBadge: "Keamanan & Privasi",
  safetyTitle: "Kenalan dengan aman dan nyaman",
  safetySubtitle:
    "Di HAIYO, keamanan lebih penting daripada sekadar keramaian. Kami menjaga privasi lokasi dan memberikan kendali penuh di tanganmu.",
  safetyItems: [
    {
      id: "privacy",
      title: "Tanpa GPS Eksak",
      description:
        "Koordinat asli tidak pernah ditampilkan. Hanya nama kota dan perkiraan jarak.",
    },
    {
      id: "control",
      title: "Kendali Penuh",
      description:
        "Unmatch, Block, dan Report selalu mudah dijangkau kapan saja.",
    },
    {
      id: "moderation",
      title: "Moderasi Aktif",
      description:
        "Tim moderasi HAIYO siap meninjau laporan akun palsu, spam, atau pelecehan.",
    },
  ],
  premiumTitle: "Kenalan tanpa batas dengan HAIYO Premium",
  premiumSubtitle:
    "Buka lebih banyak kesempatan untuk menemukan orang yang cocok. Tanpa perpanjangan otomatis (Manual Renewal).",
  ctaTitle: "Siap ketemu orang baru hari ini?",
  ctaSubtitle:
    "Download aplikasi HAIYO di Android & iOS sekarang. Gratis 100 swipe setiap hari—siapa tahu obrolan seru berikutnya dimulai dari sini.",
  ctaButtonText: "Download App",
  androidDownloadUrl: "#download-android-apk",
  androidVersion: "v1.2.0 · Android 8.0+",
  iosDownloadUrl: "#download-ios-appstore",
  iosVersion: "v1.2.0 · iOS 15.0+",
};

export interface LocalAppState {
  currentUser: {
    id: string;
    email: string;
    emailVerified: boolean;
    isOnboarded: boolean;
    profile: Profile;
    photos: ProfilePhoto[];
    interests: string[]; // slugs
    preferences: UserPreferences;
  } | null;
  likedByUserIds: string[]; // Users who already liked currentUser (for reciprocal match & Who Likes You)
  myLikedUserIds: string[];
  myPassedUserIds: string[];
  blockedUserIds: string[];
  matches: Array<
    MatchRecord & {
      partner: DiscoveryProfileCard;
    }
  >;
  messages: MessageRecord[];
  notifications: NotificationRecord[];
  reports: ReportRecord[];
  subscriptions: SubscriptionRecord[];
  payments: PaymentRecord[];
  paymentConfig: PaymentRecipientConfig;
  homepageConfig: HomepageConfig;
  swipeUsageToday: {
    usage_date: string;
    swipe_count: number;
  };
}

const STORAGE_KEY = "haiyo_live_state_v2";
const LEGACY_DEMO_STORAGE_KEY = "haiyo_app_state_v1";

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDefaultAppState(): LocalAppState {
  const today = getTodayDateString();
  return {
    currentUser: null,
    likedByUserIds: [],
    myLikedUserIds: [],
    myPassedUserIds: [],
    blockedUserIds: [],
    matches: [],
    messages: [],
    notifications: [],
    reports: [],
    subscriptions: [],
    payments: [],
    paymentConfig: DEFAULT_PAYMENT_CONFIG,
    homepageConfig: DEFAULT_HOMEPAGE_CONFIG,
    swipeUsageToday: {
      usage_date: today,
      swipe_count: 0,
    },
  };
}

export function logoutUserInState(): void {
  if (typeof window === "undefined") return;
  const current = loadAppState();
  const next: LocalAppState = {
    ...getDefaultAppState(),
    paymentConfig: current.paymentConfig,
    homepageConfig: current.homepageConfig,
    currentUser: null,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("haiyo-state-updated"));
}

export function loadAppState(): LocalAppState {
  if (typeof window === "undefined") {
    return getDefaultAppState();
  }
  try {
    // Purge legacy demo/dummy state (Alex, Sarah, etc.) from older sessions
    if (window.localStorage.getItem(LEGACY_DEMO_STORAGE_KEY)) {
      window.localStorage.removeItem(LEGACY_DEMO_STORAGE_KEY);
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getDefaultAppState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      if (isSupabaseConfigured() && !hasSyncedSiteSettings) {
        hasSyncedSiteSettings = true;
        void pullSiteSettingsFromSupabase();
      }
      return initial;
    }
    const parsed = JSON.parse(raw) as LocalAppState;

    // Reset daily swipe counter automatically if date changed
    const today = getTodayDateString();
    if (parsed.swipeUsageToday?.usage_date !== today) {
      parsed.swipeUsageToday = { usage_date: today, swipe_count: 0 };
    }

    // Backfill paymentConfig if missing
    parsed.paymentConfig = {
      ...DEFAULT_PAYMENT_CONFIG,
      ...(parsed.paymentConfig ?? {}),
    };

    // Backfill homepageConfig if missing
    parsed.homepageConfig = {
      ...DEFAULT_HOMEPAGE_CONFIG,
      ...(parsed.homepageConfig ?? {}),
      howItWorksSteps:
        parsed.homepageConfig?.howItWorksSteps?.length === 4
          ? parsed.homepageConfig.howItWorksSteps
          : DEFAULT_HOMEPAGE_CONFIG.howItWorksSteps,
      featuresItems:
        parsed.homepageConfig?.featuresItems?.length === 4
          ? parsed.homepageConfig.featuresItems
          : DEFAULT_HOMEPAGE_CONFIG.featuresItems,
      safetyItems:
        parsed.homepageConfig?.safetyItems?.length === 3
          ? parsed.homepageConfig.safetyItems
          : DEFAULT_HOMEPAGE_CONFIG.safetyItems,
    };

    // Wipe any leftover demo user "Alex" if ever present
    if (
      parsed.currentUser &&
      (parsed.currentUser.id === "user-me" ||
        parsed.currentUser.email.trim().toLowerCase() === "alex@haiyo.id")
    ) {
      parsed.currentUser = null;
    }

    // Strict Admin Role Enforcement: only admin@haiyo.id is Super Admin by default
    if (
      parsed.currentUser &&
      parsed.currentUser.email.trim().toLowerCase() !== "admin@haiyo.id"
    ) {
      parsed.currentUser.profile.is_admin = false;
    }

    // Trigger one-time background fetch from Supabase public.site_settings per page session
    if (isSupabaseConfigured() && !hasSyncedSiteSettings) {
      hasSyncedSiteSettings = true;
      void pullSiteSettingsFromSupabase();
    }

    return parsed;
  } catch {
    return getDefaultAppState();
  }
}

let hasSyncedSiteSettings = false;

function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(1, Math.round(R * c));
}

export function computeCandidateDistanceKm(
  myCity: string,
  myLat: number | null | undefined,
  myLon: number | null | undefined,
  candCity: string,
  candLat: number | null | undefined,
  candLon: number | null | undefined
): number {
  const normMy = (myCity || "").trim().toLowerCase();
  const normCand = (candCity || "").trim().toLowerCase();

  // Exact same Kecamatan / Kota string -> ~2 km
  if (normMy && normCand && normMy === normCand) {
    return 2;
  }

  const myParts = normMy
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const candParts = normCand
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Same Kecamatan name (first segment)
  if (myParts[0] && candParts[0] && myParts[0] === candParts[0]) {
    return 3;
  }

  // Same Kabupaten / Kota (second segment)
  if (
    myParts.length >= 2 &&
    candParts.length >= 2 &&
    myParts[1] === candParts[1]
  ) {
    return 8;
  }

  // If both have valid coordinates, use Haversine formula
  if (
    typeof myLat === "number" &&
    typeof myLon === "number" &&
    typeof candLat === "number" &&
    typeof candLon === "number"
  ) {
    return haversineDistanceKm(myLat, myLon, candLat, candLon);
  }

  // Fallback coordinate lookup from city strings
  const myFallback = getCityCoordinates(myCity);
  const candFallback = getCityCoordinates(candCity);
  if (myFallback && candFallback) {
    return haversineDistanceKm(
      myFallback.latitude,
      myFallback.longitude,
      candFallback.latitude,
      candFallback.longitude
    );
  }

  return 15;
}

export function isUserOnline(lastActiveAt?: string | null): boolean {
  if (!lastActiveAt) return false;
  const ts = new Date(lastActiveAt).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= 90 * 1000;
}

export function formatOnlineStatusLabel(
  lastActiveAt?: string | null,
  isOnlineFlag?: boolean
): string {
  if (isOnlineFlag || isUserOnline(lastActiveAt)) {
    return "Online";
  }
  if (!lastActiveAt) return "Offline";
  const ts = new Date(lastActiveAt).getTime();
  if (Number.isNaN(ts)) return "Offline";
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return "Online";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Aktif ${diffMin} mnt lalu`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Aktif ${diffHr} jam lalu`;
  return "Offline";
}

let lastHeartbeatSentAt = 0;
let lastGeoLocationSentAt = 0;

async function reverseGeocodeToCityLabel(
  lat: number,
  lon: number
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=id`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data?.address;
    if (!addr) return null;

    const rawDistrict =
      addr.city_district ||
      addr.municipality ||
      addr.town ||
      addr.suburb ||
      addr.village ||
      addr.hamlet ||
      "";
    const rawCity = addr.city || "";
    const rawRegency =
      addr.county || addr.regency || addr.state_district || "";

    let part1 = "";
    if (rawDistrict) {
      part1 = /^kec(\.|amatan)?\s+/i.test(rawDistrict)
        ? rawDistrict.replace(/^kecamatan\s+/i, "Kec. ")
        : `Kec. ${rawDistrict}`;
    }

    let part2 = "";
    if (rawCity) {
      part2 = /^kota\s+/i.test(rawCity) ? rawCity : `Kota ${rawCity}`;
    } else if (rawRegency) {
      part2 = /^kab(\.|upaten)?\s+/i.test(rawRegency)
        ? rawRegency.replace(/^kabupaten\s+/i, "Kab. ")
        : `Kab. ${rawRegency}`;
    } else if (addr.state) {
      part2 = String(addr.state);
    }

    if (part1 && part2) return `${part1}, ${part2}`;
    if (part2) return part2;
    if (part1) return part1;
    return null;
  } catch {
    return null;
  }
}

async function touchLivePresenceAndLocation(userId: string): Promise<void> {
  if (typeof window === "undefined" || !isSupabaseConfigured()) return;
  const now = Date.now();
  const supabase = createClient();

  // 1. Update online heartbeat timestamp every 18 seconds
  if (now - lastHeartbeatSentAt >= 18000) {
    lastHeartbeatSentAt = now;
    void supabase
      .from("profiles")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", userId);
  }

  // 2. Sync live active GPS location -> Kecamatan & Kabupaten/Kota every 2 minutes
  if (
    now - lastGeoLocationSentAt >= 120000 &&
    typeof navigator !== "undefined" &&
    "geolocation" in navigator
  ) {
    lastGeoLocationSentAt = now;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lon = Number(pos.coords.longitude.toFixed(6));
        const liveCity = await reverseGeocodeToCityLabel(lat, lon);

        const updatePayload: Record<string, unknown> = {
          latitude: lat,
          longitude: lon,
          updated_at: new Date().toISOString(),
        };
        if (liveCity) {
          updatePayload.city = liveCity;
        }

        await supabase.from("profiles").update(updatePayload).eq("id", userId);
      },
      () => {
        // User denied or GPS unavailable: keep existing saved location
      },
      {
        enableHighAccuracy: false,
        timeout: 7000,
        maximumAge: 60000,
      }
    );
  }
}

export async function syncAppStateFromSupabase(): Promise<LocalAppState> {
  if (typeof window === "undefined" || !isSupabaseConfigured()) {
    return loadAppState();
  }
  try {
    const supabase = createClient();
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const current = raw
      ? (JSON.parse(raw) as LocalAppState)
      : getDefaultAppState();

    let changed = false;

    // 1. Pull site_settings (non-blocking if empty)
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["payment_config", "homepage_config"]);

    if (Array.isArray(settingsData) && settingsData.length > 0) {
      for (const row of settingsData) {
        if (row.key === "payment_config" && row.value) {
          current.paymentConfig = {
            ...DEFAULT_PAYMENT_CONFIG,
            ...(row.value as Partial<PaymentRecipientConfig>),
          };
          changed = true;
        } else if (row.key === "homepage_config" && row.value) {
          current.homepageConfig = {
            ...DEFAULT_HOMEPAGE_CONFIG,
            ...(row.value as Partial<HomepageConfig>),
          };
          changed = true;
        }
      }
    }

    // 2. Sync authenticated user profile, preferences, photos, interests, likes, passes, blocks, matches
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      void touchLivePresenceAndLocation(user.id);
      const [
        { data: profileRow },
        { data: prefRow },
        { data: photoRows },
        { data: userInterestRows },
        { data: subRows },
        { data: payRows },
        { data: myLikesRows },
        { data: likedByRows },
        { data: myPassesRows },
        { data: blockRows },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("profile_photos")
          .select("*")
          .eq("user_id", user.id)
          .order("display_order", { ascending: true }),
        supabase
          .from("user_interests")
          .select("interests(slug)")
          .eq("user_id", user.id),
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("payments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("likes")
          .select("to_user_id")
          .eq("from_user_id", user.id),
        supabase
          .from("likes")
          .select("from_user_id")
          .eq("to_user_id", user.id),
        supabase
          .from("passes")
          .select("to_user_id")
          .eq("from_user_id", user.id),
        supabase
          .from("blocks")
          .select("blocker_id, blocked_id")
          .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`),
      ]);

      if (profileRow) {
        const mappedPhotos: ProfilePhoto[] =
          Array.isArray(photoRows) && photoRows.length > 0
            ? photoRows.map((p) => ({
                id: p.id,
                user_id: p.user_id,
                storage_path: p.storage_path,
                public_url:
                  p.storage_path.startsWith("http") ||
                  p.storage_path.startsWith("data:")
                    ? p.storage_path
                    : supabase.storage
                        .from("profile-photos")
                        .getPublicUrl(
                          p.storage_path.replace(/^profile-photos\//, "")
                        ).data.publicUrl,
                is_primary: p.is_primary,
                display_order: p.display_order,
                created_at: p.created_at,
              }))
            : current.currentUser?.photos ?? [];

        const mappedInterests: string[] =
          Array.isArray(userInterestRows) && userInterestRows.length > 0
            ? userInterestRows
                .map(
                  (row: {
                    interests?:
                      | { slug?: string }
                      | Array<{ slug?: string }>
                      | null;
                  }) => {
                    if (Array.isArray(row.interests)) {
                      return row.interests[0]?.slug ?? "";
                    }
                    return row.interests?.slug ?? "";
                  }
                )
                .filter(Boolean)
            : current.currentUser?.interests ?? ["coffee", "music", "travel"];

        current.currentUser = {
          id: user.id,
          email: user.email ?? current.currentUser?.email ?? "",
          emailVerified: Boolean(user.email_confirmed_at),
          isOnboarded: Boolean(profileRow.is_onboarded),
          profile: {
            id: user.id,
            name:
              profileRow.name || current.currentUser?.profile.name || "User",
            date_of_birth:
              profileRow.date_of_birth ||
              current.currentUser?.profile.date_of_birth ||
              "2001-05-14",
            gender:
              (profileRow.gender as Gender) ||
              current.currentUser?.profile.gender ||
              "male",
            city:
              profileRow.city ||
              current.currentUser?.profile.city ||
              "Kec. Panakkukang, Kota Makassar",
            bio: profileRow.bio ?? current.currentUser?.profile.bio ?? "",
            latitude: profileRow.latitude,
            longitude: profileRow.longitude,
            status: profileRow.status,
            is_admin: Boolean(profileRow.is_admin),
            created_at: profileRow.created_at,
            updated_at: profileRow.updated_at,
          },
          photos: mappedPhotos,
          interests: mappedInterests,
          preferences: prefRow
            ? {
                user_id: user.id,
                preferred_gender: prefRow.preferred_gender as Gender,
                min_age: prefRow.min_age,
                max_age: prefRow.max_age,
                radius_km: prefRow.radius_km,
                updated_at: prefRow.updated_at,
              }
            : current.currentUser?.preferences ?? {
                user_id: user.id,
                preferred_gender:
                  profileRow.gender === "female" ? "male" : "female",
                min_age: 18,
                max_age: 35,
                radius_km: 25,
                updated_at: new Date().toISOString(),
              },
        };
        changed = true;
      }

      if (Array.isArray(subRows)) {
        current.subscriptions = subRows as SubscriptionRecord[];
        changed = true;
      }
      if (Array.isArray(payRows)) {
        current.payments = payRows as PaymentRecord[];
        changed = true;
      }
      if (Array.isArray(myLikesRows)) {
        current.myLikedUserIds = Array.from(
          new Set(myLikesRows.map((r) => r.to_user_id))
        );
        changed = true;
      }
      if (Array.isArray(likedByRows)) {
        current.likedByUserIds = Array.from(
          new Set(likedByRows.map((r) => r.from_user_id))
        );
        changed = true;
      }
      if (Array.isArray(myPassesRows)) {
        current.myPassedUserIds = Array.from(
          new Set(myPassesRows.map((r) => r.to_user_id))
        );
        changed = true;
      }
      if (Array.isArray(blockRows)) {
        current.blockedUserIds = Array.from(
          new Set(
            blockRows.map((b) =>
              b.blocker_id === user.id ? b.blocked_id : b.blocker_id
            )
          )
        );
        changed = true;
      }
    }

    // 3. Fetch all active onboarded candidate profiles from Supabase
    const myId = user?.id ?? current.currentUser?.id ?? "";
    const myCity = current.currentUser?.profile.city ?? "";
    const myLat = current.currentUser?.profile.latitude ?? null;
    const myLon = current.currentUser?.profile.longitude ?? null;

    const { data: candidateRows } = await supabase
      .from("profiles")
      .select("*")
      .eq("status", "active")
      .eq("is_onboarded", true)
      .eq("is_admin", false)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (Array.isArray(candidateRows)) {
      const otherProfiles = candidateRows.filter((p) => p.id !== myId);
      const otherIds = otherProfiles.map((p) => p.id);

      const [
        { data: allPhotos },
        { data: allUserInterests },
        { data: allActiveSubs },
      ] =
        otherIds.length > 0
          ? await Promise.all([
              supabase
                .from("profile_photos")
                .select("*")
                .in("user_id", otherIds)
                .order("is_primary", { ascending: false })
                .order("display_order", { ascending: true }),
              supabase
                .from("user_interests")
                .select("user_id, interests(id, name, slug, emoji)")
                .in("user_id", otherIds),
              supabase
                .from("subscriptions")
                .select("user_id, status, expires_at")
                .in("user_id", otherIds)
                .eq("status", "active"),
            ])
          : [{ data: [] }, { data: [] }, { data: [] }];

      const nowMs = Date.now();
      const premiumUserSet = new Set(
        (allActiveSubs ?? [])
          .filter(
            (s) => s.expires_at && new Date(s.expires_at).getTime() > nowMs
          )
          .map((s) => s.user_id)
      );

      const mappedCandidates: DiscoveryProfileCard[] = otherProfiles.map(
        (prof) => {
          const rawPhotos = (allPhotos ?? []).filter(
            (ph) => ph.user_id === prof.id
          );
          const resolvedPhotos: DiscoveryProfileCard["photos"] =
            rawPhotos.length > 0
              ? rawPhotos.map((ph, idx) => ({
                  id: String(ph.id),
                  storage_path: String(ph.storage_path),
                  public_url:
                    ph.storage_path.startsWith("http") ||
                    ph.storage_path.startsWith("data:")
                      ? String(ph.storage_path)
                      : supabase.storage
                          .from("profile-photos")
                          .getPublicUrl(
                            ph.storage_path.replace(/^profile-photos\//, "")
                          ).data.publicUrl,
                  is_primary: Boolean(ph.is_primary ?? idx === 0),
                  display_order: Number(ph.display_order ?? idx + 1),
                }))
              : [
                  {
                    id: `fallback-${prof.id}`,
                    storage_path:
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
                    public_url:
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
                    is_primary: true,
                    display_order: 1,
                  },
                ];

          const rawInterests = (allUserInterests ?? []).filter(
            (ui: { user_id: string }) => ui.user_id === prof.id
          );
          const resolvedInterests = rawInterests
            .map(
              (ui: {
                interests?:
                  | { id: string; name: string; slug: string; emoji?: string }
                  | Array<{
                      id: string;
                      name: string;
                      slug: string;
                      emoji?: string;
                    }>
                  | null;
              }) => {
                const item = Array.isArray(ui.interests)
                  ? ui.interests[0]
                  : ui.interests;
                if (!item) return null;
                return {
                  id: item.id,
                  name: item.name,
                  slug: item.slug,
                  emoji: item.emoji ?? "✨",
                };
              }
            )
            .filter(
              (
                x
              ): x is {
                id: string;
                name: string;
                slug: string;
                emoji: string;
              } => Boolean(x)
            );

          const distKm = computeCandidateDistanceKm(
            myCity,
            myLat,
            myLon,
            prof.city || "",
            prof.latitude,
            prof.longitude
          );

          return {
            id: prof.id,
            name: prof.name || "Pengguna HAIYO",
            age: calculateAge(prof.date_of_birth || "2000-01-01"),
            gender: (prof.gender as Gender) || "female",
            city: prof.city || "Indonesia",
            approx_distance_km: distKm,
            bio: prof.bio || "Halo! Salam kenal di HAIYO.",
            is_premium: premiumUserSet.has(prof.id),
            is_online: isUserOnline(prof.updated_at),
            last_active_at: prof.updated_at,
            photos: resolvedPhotos,
            interests:
              resolvedInterests.length > 0
                ? resolvedInterests
                : MASTER_INTERESTS.slice(0, 3),
          };
        }
      );

      SEED_CANDIDATE_PROFILES.splice(
        0,
        SEED_CANDIDATE_PROFILES.length,
        ...mappedCandidates
      );
      changed = true;

      // Also sync active matches, messages, and notifications for authenticated user
      if (user) {
        const [{ data: matchRows }, { data: notifRows }] = await Promise.all([
          supabase
            .from("matches")
            .select("*")
            .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
            .order("matched_at", { ascending: false }),
          supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(60),
        ]);

        if (Array.isArray(notifRows)) {
          current.notifications = notifRows as NotificationRecord[];
          changed = true;
        }

        if (Array.isArray(matchRows)) {
          const syncedMatches = matchRows
            .map((m) => {
              const partnerId =
                m.user_a_id === user.id ? m.user_b_id : m.user_a_id;
              const partnerCard = mappedCandidates.find(
                (c) => c.id === partnerId
              );
              if (!partnerCard) return null;
              return {
                id: m.id,
                user_a_id: m.user_a_id,
                user_b_id: m.user_b_id,
                status: m.status,
                matched_at: m.matched_at,
                unmatched_at: m.unmatched_at,
                created_at: m.created_at,
                partner: partnerCard,
              };
            })
            .filter((m): m is NonNullable<typeof m> => Boolean(m));

          current.matches = syncedMatches;

          const matchIds = syncedMatches.map((m) => m.id);
          if (matchIds.length > 0) {
            const { data: msgRows } = await supabase
              .from("messages")
              .select("*")
              .in("match_id", matchIds)
              .order("created_at", { ascending: true });

            if (Array.isArray(msgRows)) {
              current.messages = (msgRows as MessageRecord[]).filter(
                (msg) =>
                  msg.content !== "[DELETED_IMG]" &&
                  msg.content !== "[DELETED_MSG]"
              );
              changed = true;
            }
          } else {
            current.messages = [];
          }
        }
      }
    }

    if (changed) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      window.dispatchEvent(new Event("haiyo-state-updated"));
    }
    return current;
  } catch {
    return loadAppState();
  }
}

async function pullSiteSettingsFromSupabase(): Promise<void> {
  await syncAppStateFromSupabase();
}

export function saveAppState(state: LocalAppState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event("haiyo-state-updated"));

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      void supabase.from("site_settings").upsert([
        {
          key: "payment_config",
          value: state.paymentConfig,
        },
        {
          key: "homepage_config",
          value: state.homepageConfig,
        },
      ]);
    }
  } catch {
    // ignore storage quota errors
  }
}

export function isCurrentUserPremium(state: LocalAppState): boolean {
  const now = Date.now();
  return state.subscriptions.some(
    (s) =>
      s.status === "active" &&
      s.expires_at !== null &&
      new Date(s.expires_at).getTime() > now
  );
}

export function getActiveSubscription(
  state: LocalAppState
): (SubscriptionRecord & { plan?: SubscriptionPlan }) | null {
  const now = Date.now();
  const active = state.subscriptions
    .filter(
      (s) =>
        s.status === "active" &&
        s.expires_at !== null &&
        new Date(s.expires_at).getTime() > now
    )
    .sort(
      (a, b) =>
        new Date(b.expires_at!).getTime() - new Date(a.expires_at!).getTime()
    )[0];

  if (!active) return null;
  const plan = MASTER_SUBSCRIPTION_PLANS.find((p) => p.id === active.plan_id);
  return { ...active, plan };
}

export function completeOnboardingInState(params: {
  userId?: string;
  email?: string;
  name: string;
  dateOfBirth: string;
  gender: Gender;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  bio: string;
  photoUrls: string[];
  interestSlugs: string[];
  preferredGender: Gender;
  minAge: number;
  maxAge: number;
  radiusKm: number;
}): LocalAppState {
  const state = loadAppState();
  const userId = params.userId ?? state.currentUser?.id ?? "user-me";
  const email = params.email ?? state.currentUser?.email ?? "user@haiyo.id";
  const fallbackCoords = getCityCoordinates(params.city);
  const finalLat = params.latitude ?? fallbackCoords?.latitude ?? null;
  const finalLng = params.longitude ?? fallbackCoords?.longitude ?? null;

  const photos: ProfilePhoto[] = params.photoUrls.slice(0, 6).map((url, idx) => ({
    id: `photo-${idx + 1}-${Date.now()}`,
    user_id: userId,
    storage_path: url,
    public_url: url,
    is_primary: idx === 0,
    display_order: idx + 1,
    created_at: new Date().toISOString(),
  }));

  const updated: LocalAppState = {
    ...state,
    currentUser: {
      id: userId,
      email,
      emailVerified: true,
      isOnboarded: true,
      profile: {
        id: userId,
        name: params.name.trim(),
        date_of_birth: params.dateOfBirth,
        gender: params.gender,
        city: params.city.trim(),
        bio: params.bio.trim(),
        latitude: finalLat,
        longitude: finalLng,
        status: "active",
        is_admin:
          email.trim().toLowerCase() === "admin@haiyo.id" ||
          Boolean(state.currentUser?.profile.is_admin),
        created_at:
          state.currentUser?.profile.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      photos,
      interests: params.interestSlugs,
      preferences: {
        user_id: userId,
        preferred_gender: params.preferredGender,
        min_age: params.minAge,
        max_age: params.maxAge,
        radius_km: params.radiusKm,
        updated_at: new Date().toISOString(),
      },
    },
  };

  saveAppState(updated);

  // Also persist profile, preferences, photos, and interests to live Supabase DB
  if (isSupabaseConfigured()) {
    void (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from("profiles").upsert({
          id: user.id,
          name: params.name.trim(),
          date_of_birth: params.dateOfBirth,
          gender: params.gender,
          city: params.city.trim(),
          bio: params.bio.trim(),
          latitude: finalLat,
          longitude: finalLng,
          status: "active",
          is_onboarded: true,
        });

        await supabase.from("user_preferences").upsert({
          user_id: user.id,
          preferred_gender: params.preferredGender,
          min_age: params.minAge,
          max_age: params.maxAge,
          radius_km: params.radiusKm,
        });

        // Sync profile_photos rows
        await supabase.from("profile_photos").delete().eq("user_id", user.id);
        if (params.photoUrls.length > 0) {
          await supabase.from("profile_photos").insert(
            params.photoUrls.slice(0, 6).map((url, idx) => ({
              user_id: user.id,
              storage_path: url,
              is_primary: idx === 0,
              display_order: idx + 1,
            }))
          );
        }

        // Sync user_interests rows
        const { data: masterInterests } = await supabase
          .from("interests")
          .select("id, slug")
          .in("slug", params.interestSlugs);

        if (Array.isArray(masterInterests) && masterInterests.length > 0) {
          await supabase.from("user_interests").delete().eq("user_id", user.id);
          await supabase.from("user_interests").insert(
            masterInterests.map((item) => ({
              user_id: user.id,
              interest_id: item.id,
            }))
          );
        }
      } catch {
        // Non-blocking sync
      }
    })();
  }

  return updated;
}

export function getFilteredDiscoveryCandidates(
  state: LocalAppState
): DiscoveryProfileCard[] {
  const user = state.currentUser;
  if (!user) return [];
  const { preferences, interests: myInterestSlugs } = user;

  return SEED_CANDIDATE_PROFILES.filter((candidate) => {
    if (candidate.id === user.id) return false;
    if (state.myLikedUserIds.includes(candidate.id)) return false;
    if (state.myPassedUserIds.includes(candidate.id)) return false;
    if (state.blockedUserIds.includes(candidate.id)) return false;
    if (candidate.gender !== preferences.preferred_gender) return false;
    if (
      candidate.age < preferences.min_age ||
      candidate.age > preferences.max_age
    ) {
      return false;
    }
    if (
      candidate.approx_distance_km !== null &&
      candidate.approx_distance_km > preferences.radius_km
    ) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    // Ranking V1: Shared interests -> Distance -> Age proximity
    const sharedA = a.interests.filter((i) =>
      myInterestSlugs.includes(i.slug)
    ).length;
    const sharedB = b.interests.filter((i) =>
      myInterestSlugs.includes(i.slug)
    ).length;
    if (sharedB !== sharedA) return sharedB - sharedA;

    const distA = a.approx_distance_km ?? 50;
    const distB = b.approx_distance_km ?? 50;
    if (distA !== distB) return distA - distB;

    const myAge = calculateAge(user.profile.date_of_birth);
    return Math.abs(a.age - myAge) - Math.abs(b.age - myAge);
  });
}
