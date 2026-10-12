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

async function pullSiteSettingsFromSupabase(): Promise<void> {
  if (typeof window === "undefined" || !isSupabaseConfigured()) return;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["payment_config", "homepage_config"]);

    if (error || !Array.isArray(data) || data.length === 0) return;

    const raw = window.localStorage.getItem(STORAGE_KEY);
    const current = raw
      ? (JSON.parse(raw) as LocalAppState)
      : getDefaultAppState();

    let changed = false;
    for (const row of data) {
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

    // Also sync authenticated user profile, photos, preferences, subscriptions, and payments from Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const [
        { data: profileRow },
        { data: prefRow },
        { data: photoRows },
        { data: userInterestRows },
        { data: subRows },
        { data: payRows },
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
      ]);

      if (profileRow) {
        const mappedPhotos: ProfilePhoto[] =
          Array.isArray(photoRows) && photoRows.length > 0
            ? photoRows.map((p) => ({
                id: p.id,
                user_id: p.user_id,
                storage_path: p.storage_path,
                public_url: p.storage_path.startsWith("http") || p.storage_path.startsWith("data:")
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
                .map((row: { interests?: { slug?: string } | Array<{ slug?: string }> | null }) => {
                  if (Array.isArray(row.interests)) {
                    return row.interests[0]?.slug ?? "";
                  }
                  return row.interests?.slug ?? "";
                })
                .filter(Boolean)
            : current.currentUser?.interests ?? ["coffee", "music", "travel"];

        current.currentUser = {
          id: user.id,
          email: user.email ?? current.currentUser?.email ?? "",
          emailVerified: Boolean(user.email_confirmed_at ?? true),
          isOnboarded: Boolean(profileRow.is_onboarded),
          profile: {
            id: user.id,
            name: profileRow.name || current.currentUser?.profile.name || "User",
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
                preferred_gender: "female",
                min_age: 20,
                max_age: 30,
                radius_km: 25,
                updated_at: new Date().toISOString(),
              },
        };
        changed = true;
      }

      if (Array.isArray(subRows) && subRows.length > 0) {
        current.subscriptions = subRows as SubscriptionRecord[];
        changed = true;
      }
      if (Array.isArray(payRows) && payRows.length > 0) {
        current.payments = payRows as PaymentRecord[];
        changed = true;
      }
    }

    if (changed) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      window.dispatchEvent(new Event("haiyo-state-updated"));
    }
  } catch {
    // Non-blocking fallback when offline
  }
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
  const userId = state.currentUser?.id ?? "user-me";
  const email = state.currentUser?.email ?? "user@haiyo.id";
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
