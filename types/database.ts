/**
 * HAIYO Database Types — ERD V1.0 (17 Core Tables + Server RPC Results)
 */

export type UserStatus = "active" | "suspended" | "banned" | "deleted";
export type Gender = "male" | "female";
export type MatchStatus = "active" | "unmatched";
export type ReportReason =
  | "fake_account"
  | "harassment"
  | "spam"
  | "scam"
  | "inappropriate_content"
  | "sexual_content"
  | "other";
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";
export type SubscriptionPlanCode = "PREMIUM_7D" | "PREMIUM_1M" | "PREMIUM_3M";
export type SubscriptionStatus = "pending" | "active" | "expired" | "cancelled";
export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "cancelled";
export type NotificationType =
  | "new_like"
  | "new_match"
  | "new_message"
  | "subscription_active"
  | "payment_success"
  | "payment_failed"
  | "subscription_expiring"
  | "subscription_expired";

/** 1. profiles */
export interface Profile {
  id: string;
  name: string;
  date_of_birth: string;
  gender: Gender;
  city: string;
  bio: string;
  /** Internal only — never exposed to other users in client responses */
  latitude?: number | null;
  /** Internal only — never exposed to other users in client responses */
  longitude?: number | null;
  status: UserStatus;
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
}

/** 2. profile_photos */
export interface ProfilePhoto {
  id: string;
  user_id: string;
  storage_path: string;
  public_url?: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

/** 3. user_preferences */
export interface UserPreferences {
  user_id: string;
  preferred_gender: Gender;
  min_age: number;
  max_age: number;
  /** 0 km to 500 km continuous range */
  radius_km: number;
  updated_at: string;
}

/** 4. interests */
export interface Interest {
  id: string;
  name: string;
  slug: string;
  emoji?: string;
  created_at: string;
}

/** 5. user_interests */
export interface UserInterest {
  user_id: string;
  interest_id: string;
  created_at: string;
}

/** 6. likes */
export interface LikeRecord {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
}

/** 7. passes */
export interface PassRecord {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
}

/** 8. matches */
export interface MatchRecord {
  id: string;
  user_a_id: string;
  user_b_id: string;
  status: MatchStatus;
  matched_at: string;
  unmatched_at: string | null;
  created_at: string;
}

/** 9. messages */
export interface MessageRecord {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

/** 10. blocks */
export interface BlockRecord {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

/** 11. reports */
export interface ReportRecord {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

/** 12. subscription_plans */
export interface SubscriptionPlan {
  id: string;
  code: SubscriptionPlanCode;
  name: string;
  duration_days: number;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** 13. subscriptions */
export interface SubscriptionRecord {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  plan_code?: SubscriptionPlanCode;
  plan_name?: string;
  duration_days?: number;
}

/** 14. payments */
export interface PaymentRecord {
  id: string;
  user_id: string;
  subscription_id: string;
  order_id: string;
  transaction_id: string | null;
  gateway: string;
  payment_method: string;
  amount: number;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  plan_id?: string;
  plan_code?: SubscriptionPlanCode;
  plan_name?: string;
  duration_days?: number;
  proof_url?: string | null;
  user_confirmed_at?: string | null;
}

/** 15. notifications */
export interface NotificationRecord {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

/** 16. swipe_usage */
export interface SwipeUsageRecord {
  id: string;
  user_id: string;
  usage_date: string;
  swipe_count: number;
  created_at: string;
  updated_at: string;
}

/** 17. analytics_events */
export interface AnalyticsEventRecord {
  id: string;
  user_id: string | null;
  event_name: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Privacy-Safe Discovery Profile returned by PostgreSQL RPC `get_discovery_profiles()`
 * (Never contains exact latitude/longitude, email, or sensitive fields).
 */
export interface DiscoveryProfileCard {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  city: string;
  /** Rounded approximate distance e.g. 8 for "±8 km away" */
  approx_distance_km: number | null;
  bio: string;
  is_premium: boolean;
  /** True when user was active within the last ~90 seconds */
  is_online?: boolean;
  /** ISO timestamp of last activity */
  last_active_at?: string;
  photos: Array<{
    id: string;
    storage_path: string;
    public_url: string;
    is_primary: boolean;
    display_order: number;
  }>;
  interests: Array<{
    id: string;
    name: string;
    slug: string;
    emoji?: string;
  }>;
}
