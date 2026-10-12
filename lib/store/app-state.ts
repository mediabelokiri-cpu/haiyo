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

export const SEED_CANDIDATE_PROFILES: DiscoveryProfileCard[] = [
  {
    id: "user-sarah",
    name: "Sarah",
    age: 24,
    gender: "female",
    city: "Kec. Panakkukang, Kota Makassar",
    approx_distance_km: 8,
    bio: "Suka kopi, musik dan jalan malam. Kalau kamu tahu coffee shop tenang di Makassar, kasih tahu ya!",
    is_premium: true,
    photos: [
      {
        id: "ph-sarah-1",
        storage_path: "profile-photos/user-sarah/photo-1",
        public_url:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80",
        is_primary: true,
        display_order: 1,
      },
      {
        id: "ph-sarah-2",
        storage_path: "profile-photos/user-sarah/photo-2",
        public_url:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
        is_primary: false,
        display_order: 2,
      },
      {
        id: "ph-sarah-3",
        storage_path: "profile-photos/user-sarah/photo-3",
        public_url:
          "https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?auto=format&fit=crop&w=900&q=80",
        is_primary: false,
        display_order: 3,
      },
    ],
    interests: [
      { id: "int-coffee", name: "Coffee", slug: "coffee", emoji: "☕" },
      { id: "int-music", name: "Music", slug: "music", emoji: "🎵" },
      { id: "int-travel", name: "Travel", slug: "travel", emoji: "✈️" },
    ],
  },
  {
    id: "user-nadia",
    name: "Nadia",
    age: 23,
    gender: "female",
    city: "Kec. Ujung Pandang, Kota Makassar",
    approx_distance_km: 5,
    bio: "Anak desain yang hobi motret sunset di Pantai Losari dan berburu kuliner lokal.",
    is_premium: false,
    photos: [
      {
        id: "ph-nadia-1",
        storage_path: "profile-photos/user-nadia/photo-1",
        public_url:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
        is_primary: true,
        display_order: 1,
      },
      {
        id: "ph-nadia-2",
        storage_path: "profile-photos/user-nadia/photo-2",
        public_url:
          "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=80",
        is_primary: false,
        display_order: 2,
      },
      {
        id: "ph-nadia-3",
        storage_path: "profile-photos/user-nadia/photo-3",
        public_url:
          "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=900&q=80",
        is_primary: false,
        display_order: 3,
      },
    ],
    interests: [
      { id: "int-photo", name: "Photography", slug: "photography", emoji: "📸" },
      { id: "int-food", name: "Food", slug: "food", emoji: "🍜" },
      { id: "int-coffee", name: "Coffee", slug: "coffee", emoji: "☕" },
    ],
  },
  {
    id: "user-ayu",
    name: "Ayu",
    age: 26,
    gender: "female",
    city: "Kec. Kebayoran Baru, Kota Jakarta Selatan",
    approx_distance_km: 12,
    bio: "Weekend biasanya lari pagi di GBK lanjut baca buku di kafe. Yuk ngobrol santai!",
    is_premium: true,
    photos: [
      {
        id: "ph-ayu-1",
        storage_path: "profile-photos/user-ayu/photo-1",
        public_url:
          "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=80",
        is_primary: true,
        display_order: 1,
      },
      {
        id: "ph-ayu-2",
        storage_path: "profile-photos/user-ayu/photo-2",
        public_url:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80",
        is_primary: false,
        display_order: 2,
      },
      {
        id: "ph-ayu-3",
        storage_path: "profile-photos/user-ayu/photo-3",
        public_url:
          "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=900&q=80",
        is_primary: false,
        display_order: 3,
      },
    ],
    interests: [
      { id: "int-fitness", name: "Fitness", slug: "fitness", emoji: "🏋️" },
      { id: "int-reading", name: "Reading", slug: "reading", emoji: "📚" },
      { id: "int-movies", name: "Movies", slug: "movies", emoji: "🎬" },
    ],
  },
  {
    id: "user-kirana",
    name: "Kirana",
    age: 25,
    gender: "female",
    city: "Kec. Coblong, Kota Bandung",
    approx_distance_km: 15,
    bio: "Suka nonton film thriller, main game co-op, dan kulineran malam di Braga.",
    is_premium: false,
    photos: [
      {
        id: "ph-kirana-1",
        storage_path: "profile-photos/user-kirana/photo-1",
        public_url:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
        is_primary: true,
        display_order: 1,
      },
      {
        id: "ph-kirana-2",
        storage_path: "profile-photos/user-kirana/photo-2",
        public_url:
          "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=900&q=80",
        is_primary: false,
        display_order: 2,
      },
      {
        id: "ph-kirana-3",
        storage_path: "profile-photos/user-kirana/photo-3",
        public_url:
          "https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=900&q=80",
        is_primary: false,
        display_order: 3,
      },
    ],
    interests: [
      { id: "int-gaming", name: "Gaming", slug: "gaming", emoji: "🎮" },
      { id: "int-movies", name: "Movies", slug: "movies", emoji: "🎬" },
      { id: "int-food", name: "Food", slug: "food", emoji: "🍜" },
    ],
  },
  {
    id: "user-reza",
    name: "Reza",
    age: 26,
    gender: "male",
    city: "Kec. Rappocini, Kota Makassar",
    approx_distance_km: 6,
    bio: "Software engineer yang suka seduh kopi manual brew dan main futsal tiap minggu.",
    is_premium: true,
    photos: [
      {
        id: "ph-reza-1",
        storage_path: "profile-photos/user-reza/photo-1",
        public_url:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
        is_primary: true,
        display_order: 1,
      },
      {
        id: "ph-reza-2",
        storage_path: "profile-photos/user-reza/photo-2",
        public_url:
          "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=900&q=80",
        is_primary: false,
        display_order: 2,
      },
      {
        id: "ph-reza-3",
        storage_path: "profile-photos/user-reza/photo-3",
        public_url:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80",
        is_primary: false,
        display_order: 3,
      },
    ],
    interests: [
      { id: "int-coffee", name: "Coffee", slug: "coffee", emoji: "☕" },
      { id: "int-sports", name: "Sports", slug: "sports", emoji: "⚽" },
      { id: "int-music", name: "Music", slug: "music", emoji: "🎵" },
    ],
  },
  {
    id: "user-dimas",
    name: "Dimas",
    age: 27,
    gender: "male",
    city: "Kec. Tebet, Kota Jakarta Selatan",
    approx_distance_km: 10,
    bio: "Hobi traveling ke pantai, fotografi analog, dan berburu mie ayam enak.",
    is_premium: false,
    photos: [
      {
        id: "ph-dimas-1",
        storage_path: "profile-photos/user-dimas/photo-1",
        public_url:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80",
        is_primary: true,
        display_order: 1,
      },
      {
        id: "ph-dimas-2",
        storage_path: "profile-photos/user-dimas/photo-2",
        public_url:
          "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80",
        is_primary: false,
        display_order: 2,
      },
      {
        id: "ph-dimas-3",
        storage_path: "profile-photos/user-dimas/photo-3",
        public_url:
          "https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?auto=format&fit=crop&w=900&q=80",
        is_primary: false,
        display_order: 3,
      },
    ],
    interests: [
      { id: "int-travel", name: "Travel", slug: "travel", emoji: "✈️" },
      { id: "int-photo", name: "Photography", slug: "photography", emoji: "📸" },
      { id: "int-food", name: "Food", slug: "food", emoji: "🍜" },
    ],
  },
];

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

const STORAGE_KEY = "haiyo_app_state_v1";

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDefaultAppState(): LocalAppState {
  const today = getTodayDateString();
  return {
    currentUser: {
      id: "user-me",
      email: "alex@haiyo.id",
      emailVerified: true,
      isOnboarded: true,
      profile: {
        id: "user-me",
        name: "Alex",
        date_of_birth: "2001-05-14",
        gender: "male",
        city: "Kec. Panakkukang, Kota Makassar",
        bio: "Suka kopi, jalan sore, dan ngobrol sampai lupa waktu.",
        latitude: -5.1477,
        longitude: 119.4327,
        status: "active",
        is_admin: false,
        created_at: "2026-10-01T08:00:00Z",
        updated_at: "2026-10-06T12:00:00Z",
      },
      photos: [
        {
          id: "ph-me-1",
          user_id: "user-me",
          storage_path: "profile-photos/user-me/photo-1",
          public_url:
            "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
          is_primary: true,
          display_order: 1,
          created_at: "2026-10-01T08:00:00Z",
        },
        {
          id: "ph-me-2",
          user_id: "user-me",
          storage_path: "profile-photos/user-me/photo-2",
          public_url:
            "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=800&q=80",
          is_primary: false,
          display_order: 2,
          created_at: "2026-10-01T08:05:00Z",
        },
      ],
      interests: ["coffee", "music", "travel"],
      preferences: {
        user_id: "user-me",
        preferred_gender: "female",
        min_age: 20,
        max_age: 30,
        radius_km: 25,
        updated_at: "2026-10-06T12:00:00Z",
      },
    },
    // Sarah and Ayu already liked the current user so liking them triggers an instant atomic Match!
    likedByUserIds: ["user-sarah", "user-ayu", "user-nadia"],
    myLikedUserIds: [],
    myPassedUserIds: [],
    blockedUserIds: [],
    matches: [],
    messages: [],
    notifications: [
      {
        id: "notif-1",
        user_id: "user-me",
        type: "new_like",
        title: "Ada yang menyukaimu",
        message: "Seseorang di Makassar baru saja menyukai profilmu.",
        reference_id: "user-sarah",
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      },
    ],
    reports: [],
    subscriptions: [],
    payments: [],
    paymentConfig: DEFAULT_PAYMENT_CONFIG,
    homepageConfig: DEFAULT_HOMEPAGE_CONFIG,
    swipeUsageToday: {
      usage_date: today,
      swipe_count: 5,
    },
  };
}

export function loadAppState(): LocalAppState {
  if (typeof window === "undefined") {
    return getDefaultAppState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getDefaultAppState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as LocalAppState;
    // Reset daily swipe counter automatically if date changed
    const today = getTodayDateString();
    if (parsed.swipeUsageToday?.usage_date !== today) {
      parsed.swipeUsageToday = { usage_date: today, swipe_count: 0 };
    }

    // Backfill paymentConfig if missing from older localStorage
    parsed.paymentConfig = {
      ...DEFAULT_PAYMENT_CONFIG,
      ...(parsed.paymentConfig ?? {}),
    };

    // Backfill homepageConfig if missing from older localStorage
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

    // Backfill multi-photo galleries & updated Kecamatan/Kota format for existing matched partners in localStorage
    if (Array.isArray(parsed.matches)) {
      parsed.matches = parsed.matches.map((m) => {
        const seedPartner = SEED_CANDIDATE_PROFILES.find(
          (p) => p.id === m.partner?.id
        );
        if (seedPartner) {
          return {
            ...m,
            partner: {
              ...m.partner,
              city: seedPartner.city,
              photos:
                !m.partner.photos ||
                m.partner.photos.length < seedPartner.photos.length
                  ? seedPartner.photos
                  : m.partner.photos,
            },
          };
        }
        return m;
      });
    }

    // Ensure only admin@haiyo.id (or verified DB Admin) retains Admin privileges
    if (
      parsed.currentUser &&
      parsed.currentUser.email.trim().toLowerCase() === "alex@haiyo.id"
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
