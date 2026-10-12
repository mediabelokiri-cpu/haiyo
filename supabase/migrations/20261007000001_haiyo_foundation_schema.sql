-- ============================================================================
-- HAIYO — DATABASE / ERD V1.0 COMPLETE MIGRATION
-- ============================================================================
-- Mencakup:
-- 1. 17 Tabel Utama sesuai ERD HAIYO V1.0
-- 2. 21+ Indexes sesuai ERD Bagian 24
-- 3. Row Level Security (RLS) ketat sesuai ERD Bagian 23
-- 4. Supabase Storage Bucket (profile-photos) + Storage Policies
-- 5. PostgreSQL Server Functions / RPC:
--    - calculate_distance_km()
--    - is_user_premium()
--    - get_discovery_profiles() (Privacy-safe, 100% di DB, Ranking V1)
--    - record_swipe_action() (Atomic Like/Pass + Swipe Limit + Mutual Match + Server Notification)
--    - activate_or_extend_subscription() (Idempotent Webhook + Akumulasi Masa Aktif)
--    - delete_user_account() (Full Delete Account lifecycle)
-- 6. Seed Data: 10 Master Interests & 3 Master Subscription Plans
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- HELPER TRIGGER FUNCTION: updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- GROUP A: IDENTITY (2 TABEL: profiles, user_preferences)
-- ============================================================================

-- 1. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  city TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '' CHECK (char_length(bio) <= 500),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'deleted')),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_onboarded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_minimum_age_18 CHECK (
    date_of_birth IS NULL OR date_of_birth <= (CURRENT_DATE - INTERVAL '18 years')
  )
);

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_gender TEXT NOT NULL DEFAULT 'female' CHECK (preferred_gender IN ('male', 'female')),
  min_age INTEGER NOT NULL DEFAULT 18 CHECK (min_age >= 18),
  max_age INTEGER NOT NULL DEFAULT 35 CHECK (max_age >= min_age AND max_age <= 99),
  radius_km INTEGER NOT NULL DEFAULT 25 CHECK (radius_km >= 0 AND radius_km <= 500),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- GROUP B: PROFILE & DISCOVERY (3 TABEL: profile_photos, interests, user_interests)
-- ============================================================================

-- 3. profile_photos
CREATE TABLE IF NOT EXISTS public.profile_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 1 CHECK (display_order BETWEEN 1 AND 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. interests
CREATE TABLE IF NOT EXISTS public.interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  emoji TEXT NOT NULL DEFAULT '✨',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. user_interests
CREATE TABLE IF NOT EXISTS public.user_interests (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES public.interests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, interest_id)
);

-- ============================================================================
-- GROUP C: MATCHING (3 TABEL: likes, passes, matches)
-- ============================================================================

-- 6. likes
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT likes_no_self_like CHECK (from_user_id <> to_user_id),
  CONSTRAINT likes_unique_pair UNIQUE (from_user_id, to_user_id)
);

-- 7. passes
CREATE TABLE IF NOT EXISTS public.passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT passes_no_self_pass CHECK (from_user_id <> to_user_id),
  CONSTRAINT passes_unique_pair UNIQUE (from_user_id, to_user_id)
);

-- 8. matches
-- Pasangan A + B dianggap sama dengan B + A menggunakan normalized order (user_a_id < user_b_id)
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unmatched')),
  matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unmatched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT matches_no_self_match CHECK (user_a_id <> user_b_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_unique_unordered_pair
ON public.matches (LEAST(user_a_id, user_b_id), GREATEST(user_a_id, user_b_id));

-- ============================================================================
-- GROUP D: COMMUNICATION (1 TABEL: messages)
-- ============================================================================

-- 9. messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 2000),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- GROUP E: SAFETY (2 TABEL: blocks, reports)
-- ============================================================================

-- 10. blocks
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT blocks_no_self_block CHECK (blocker_id <> blocked_id),
  CONSTRAINT blocks_unique_pair UNIQUE (blocker_id, blocked_id)
);

-- 11. reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (
    reason IN (
      'fake_account',
      'harassment',
      'spam',
      'scam',
      'inappropriate_content',
      'sexual_content',
      'other'
    )
  ),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reports_no_self_report CHECK (reporter_id <> reported_user_id)
);

-- ============================================================================
-- GROUP F: SUBSCRIPTION & PAYMENT (3 TABEL: subscription_plans, subscriptions, payments)
-- ============================================================================

-- 12. subscription_plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 13. subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 14. payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL UNIQUE,
  transaction_id TEXT,
  gateway TEXT NOT NULL DEFAULT 'sandbox',
  payment_method TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- GROUP G: NOTIFICATION (1 TABEL: notifications)
-- ============================================================================

-- 15. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN (
      'new_like',
      'new_match',
      'new_message',
      'subscription_active',
      'payment_success',
      'payment_failed',
      'subscription_expiring',
      'subscription_expired'
    )
  ),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- GROUP H: ANALYTICS & USAGE (2 TABEL: swipe_usage, analytics_events)
-- ============================================================================

-- 16. swipe_usage
CREATE TABLE IF NOT EXISTS public.swipe_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  swipe_count INTEGER NOT NULL DEFAULT 0 CHECK (swipe_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT swipe_usage_unique_user_date UNIQUE (user_id, usage_date)
);

CREATE TRIGGER trg_swipe_usage_updated_at
BEFORE UPDATE ON public.swipe_usage
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 17. analytics_events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 24 ERD: REQUIRED INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON public.profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_lat_lng ON public.profiles(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_profile_photos_user_id ON public.profile_photos(user_id, display_order);

CREATE INDEX IF NOT EXISTS idx_likes_from_user ON public.likes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_likes_to_user ON public.likes(to_user_id);

CREATE INDEX IF NOT EXISTS idx_passes_from_user ON public.passes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_passes_to_user ON public.passes(to_user_id);

CREATE INDEX IF NOT EXISTS idx_matches_user_a ON public.matches(user_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_b ON public.matches(user_b_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);

CREATE INDEX IF NOT EXISTS idx_messages_match_created ON public.messages(match_id, created_at);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks(blocked_id);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON public.subscriptions(expires_at);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

CREATE INDEX IF NOT EXISTS idx_swipe_usage_user_date ON public.swipe_usage(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);

-- ============================================================================
-- HELPER FUNCTIONS: ADMIN CHECK, PREMIUM CHECK, DISTANCE CALCULATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_user_premium(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = target_user_id
      AND s.status = 'active'
      AND s.expires_at > NOW()
  );
$$;

-- Server-side Haversine distance (km) — coordinates never leave PostgreSQL
CREATE OR REPLACE FUNCTION public.calculate_distance_km(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN NULL
    ELSE (
      6371.0 * 2.0 * ASIN(
        SQRT(
          POWER(SIN(RADIANS(lat2 - lat1) / 2.0), 2) +
          COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
          POWER(SIN(RADIANS(lon2 - lon1) / 2.0), 2)
        )
      )
    )
  END;
$$;

-- ============================================================================
-- CORE RPC 1: get_discovery_profiles (Privacy-Safe, 100% Server-Side)
-- ============================================================================
-- Flow: Client -> get_discovery_profiles() -> PostgreSQL Filter + Distance + Ranking V1 -> Safe Result
CREATE OR REPLACE FUNCTION public.get_discovery_profiles(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  name TEXT,
  age INTEGER,
  gender TEXT,
  city TEXT,
  approx_distance_km INTEGER,
  bio TEXT,
  is_premium BOOLEAN,
  photos JSONB,
  interests JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_my_lat DOUBLE PRECISION;
  v_my_lon DOUBLE PRECISION;
  v_my_city TEXT;
  v_my_age INTEGER;
  v_pref_gender TEXT;
  v_min_age INTEGER;
  v_max_age INTEGER;
  v_radius_km INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT
    p.latitude,
    p.longitude,
    p.city,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth))::INTEGER,
    COALESCE(up.preferred_gender, CASE WHEN p.gender = 'male' THEN 'female' ELSE 'male' END),
    COALESCE(up.min_age, 18),
    COALESCE(up.max_age, 40),
    COALESCE(up.radius_km, 25)
  INTO
    v_my_lat,
    v_my_lon,
    v_my_city,
    v_my_age,
    v_pref_gender,
    v_min_age,
    v_max_age,
    v_radius_km
  FROM public.profiles p
  LEFT JOIN public.user_preferences up ON up.user_id = p.id
  WHERE p.id = v_uid AND p.status = 'active';

  RETURN QUERY
  WITH candidate_profiles AS (
    SELECT
      c.id,
      c.name,
      EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.date_of_birth))::INTEGER AS candidate_age,
      c.gender,
      c.city,
      c.bio,
      c.updated_at,
      public.calculate_distance_km(v_my_lat, v_my_lon, c.latitude, c.longitude) AS raw_distance_km,
      public.is_user_premium(c.id) AS candidate_premium,
      (
        SELECT COUNT(*)::INTEGER
        FROM public.user_interests ui_c
        INNER JOIN public.user_interests ui_me
          ON ui_me.interest_id = ui_c.interest_id
         AND ui_me.user_id = v_uid
        WHERE ui_c.user_id = c.id
      ) AS shared_interest_count
    FROM public.profiles c
    WHERE c.id <> v_uid
      AND c.status = 'active'
      AND c.is_onboarded = TRUE
      AND c.date_of_birth IS NOT NULL
      AND c.gender = v_pref_gender
      AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.date_of_birth))::INTEGER BETWEEN v_min_age AND v_max_age
      -- Exclude already liked
      AND NOT EXISTS (
        SELECT 1 FROM public.likes l
        WHERE l.from_user_id = v_uid AND l.to_user_id = c.id
      )
      -- Exclude already passed
      AND NOT EXISTS (
        SELECT 1 FROM public.passes pa
        WHERE pa.from_user_id = v_uid AND pa.to_user_id = c.id
      )
      -- Exclude blocked either way (A blocks B or B blocks A)
      AND NOT EXISTS (
        SELECT 1 FROM public.blocks b
        WHERE (b.blocker_id = v_uid AND b.blocked_id = c.id)
           OR (b.blocker_id = c.id AND b.blocked_id = v_uid)
      )
  )
  SELECT
    cp.id,
    cp.name,
    cp.candidate_age AS age,
    cp.gender,
    cp.city,
    CASE
      WHEN cp.raw_distance_km IS NOT NULL THEN GREATEST(1, ROUND(cp.raw_distance_km)::INTEGER)
      ELSE NULL
    END AS approx_distance_km,
    cp.bio,
    cp.candidate_premium AS is_premium,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', pp.id,
            'storage_path', pp.storage_path,
            'is_primary', pp.is_primary,
            'display_order', pp.display_order
          )
          ORDER BY pp.is_primary DESC, pp.display_order ASC
        )
        FROM public.profile_photos pp
        WHERE pp.user_id = cp.id
      ),
      '[]'::jsonb
    ) AS photos,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', i.id,
            'name', i.name,
            'slug', i.slug,
            'emoji', i.emoji
          )
        )
        FROM public.user_interests ui
        INNER JOIN public.interests i ON i.id = ui.interest_id
        WHERE ui.user_id = cp.id
      ),
      '[]'::jsonb
    ) AS interests
  FROM candidate_profiles cp
  WHERE (
    -- If both users have coordinates, enforce radius_km; otherwise match same city or fallback
    (cp.raw_distance_km IS NOT NULL AND cp.raw_distance_km <= v_radius_km)
    OR (cp.raw_distance_km IS NULL AND (LOWER(cp.city) = LOWER(v_my_city) OR v_my_city = ''))
  )
  ORDER BY
    cp.shared_interest_count DESC,
    COALESCE(cp.raw_distance_km, 50.0) ASC,
    ABS(cp.candidate_age - COALESCE(v_my_age, 25)) ASC,
    cp.updated_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 50);
END;
$$;

-- ============================================================================
-- CORE RPC 2: record_swipe_action (Atomic Like/Pass + Match + Notification)
-- ============================================================================
-- Wajib 1 transaksi database:
-- Validasi Swipe Limit -> Insert Like/Pass -> Check Reciprocal Like -> Create Normalized Match -> Create Server Notification
CREATE OR REPLACE FUNCTION public.record_swipe_action(
  p_target_user_id UUID,
  p_action TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_is_premium BOOLEAN;
  v_current_swipes INTEGER := 0;
  v_is_mutual BOOLEAN := FALSE;
  v_match_id UUID := NULL;
  v_user_a UUID;
  v_user_b UUID;
  v_actor_name TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF v_uid = p_target_user_id THEN
    RAISE EXCEPTION 'Cannot swipe on yourself';
  END IF;

  IF p_action NOT IN ('like', 'pass') THEN
    RAISE EXCEPTION 'Invalid swipe action: %', p_action;
  END IF;

  -- Check user active status
  SELECT name INTO v_actor_name
  FROM public.profiles
  WHERE id = v_uid AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active profile required';
  END IF;

  -- Check Premium status & Daily Swipe Limit (100/day for Free)
  v_is_premium := public.is_user_premium(v_uid);

  INSERT INTO public.swipe_usage (user_id, usage_date, swipe_count)
  VALUES (v_uid, CURRENT_DATE, 0)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  SELECT swipe_count INTO v_current_swipes
  FROM public.swipe_usage
  WHERE user_id = v_uid AND usage_date = CURRENT_DATE
  FOR UPDATE;

  IF NOT v_is_premium AND v_current_swipes >= 100 THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'reason', 'SWIPE_LIMIT_REACHED',
      'swipe_count', v_current_swipes,
      'daily_limit', 100,
      'is_premium', FALSE
    );
  END IF;

  -- Increment daily swipe usage
  UPDATE public.swipe_usage
  SET swipe_count = swipe_count + 1
  WHERE user_id = v_uid AND usage_date = CURRENT_DATE
  RETURNING swipe_count INTO v_current_swipes;

  IF p_action = 'pass' THEN
    INSERT INTO public.passes (from_user_id, to_user_id)
    VALUES (v_uid, p_target_user_id)
    ON CONFLICT (from_user_id, to_user_id) DO NOTHING;

    INSERT INTO public.analytics_events (user_id, event_name, metadata)
    VALUES (v_uid, 'pass_created', jsonb_build_object('target_user_id', p_target_user_id));

    RETURN jsonb_build_object(
      'success', TRUE,
      'action', 'pass',
      'is_match', FALSE,
      'swipe_count', v_current_swipes,
      'is_premium', v_is_premium
    );
  END IF;

  -- Action = 'like'
  INSERT INTO public.likes (from_user_id, to_user_id)
  VALUES (v_uid, p_target_user_id)
  ON CONFLICT (from_user_id, to_user_id) DO NOTHING;

  INSERT INTO public.analytics_events (user_id, event_name, metadata)
  VALUES (v_uid, 'like_created', jsonb_build_object('target_user_id', p_target_user_id));

  -- Check reciprocal like (Did target_user already like current user?)
  SELECT EXISTS (
    SELECT 1
    FROM public.likes l
    WHERE l.from_user_id = p_target_user_id
      AND l.to_user_id = v_uid
  ) INTO v_is_mutual;

  IF v_is_mutual THEN
    v_user_a := LEAST(v_uid, p_target_user_id);
    v_user_b := GREATEST(v_uid, p_target_user_id);

    INSERT INTO public.matches (user_a_id, user_b_id, status, matched_at)
    VALUES (v_user_a, v_user_b, 'active', NOW())
    ON CONFLICT (LEAST(user_a_id, user_b_id), GREATEST(user_a_id, user_b_id))
    DO UPDATE SET
      status = 'active',
      matched_at = NOW(),
      unmatched_at = NULL
    RETURNING id INTO v_match_id;

    -- Server-side notifications for both matched users
    INSERT INTO public.notifications (user_id, type, title, message, reference_id)
    VALUES
      (
        v_uid,
        'new_match',
        'It''s a Match! 💕',
        'Wah, kalian saling suka! Saatnya mulai kenalan.',
        v_match_id
      ),
      (
        p_target_user_id,
        'new_match',
        'It''s a Match! 💕',
        'Wah, kamu dan ' || COALESCE(NULLIF(v_actor_name, ''), 'seseorang') || ' saling suka!',
        v_match_id
      );

    INSERT INTO public.analytics_events (user_id, event_name, metadata)
    VALUES (v_uid, 'match_created', jsonb_build_object('match_id', v_match_id, 'partner_id', p_target_user_id));
  ELSE
    -- Server-side notification for new like
    INSERT INTO public.notifications (user_id, type, title, message, reference_id)
    VALUES (
      p_target_user_id,
      'new_like',
      'Ada yang menyukaimu ❤️',
      'Seseorang baru saja menyukai profilmu di HAIYO.',
      v_uid
    );
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'action', 'like',
    'is_match', v_is_mutual,
    'match_id', v_match_id,
    'swipe_count', v_current_swipes,
    'is_premium', v_is_premium
  );
END;
$$;

-- ============================================================================
-- CORE RPC 3: Server-Side Notification Trigger on New Chat Message
-- ============================================================================
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recipient_id UUID;
  v_sender_name TEXT;
  v_match_status TEXT;
BEGIN
  SELECT
    CASE WHEN m.user_a_id = NEW.sender_id THEN m.user_b_id ELSE m.user_a_id END,
    m.status
  INTO v_recipient_id, v_match_status
  FROM public.matches m
  WHERE m.id = NEW.match_id;

  IF v_match_status <> 'active' THEN
    RAISE EXCEPTION 'Cannot send message to an inactive match';
  END IF;

  SELECT name INTO v_sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  INSERT INTO public.notifications (user_id, type, title, message, reference_id)
  VALUES (
    v_recipient_id,
    'new_message',
    'Pesan baru dari ' || COALESCE(NULLIF(v_sender_name, ''), 'Match kamu') || ' 💬',
    LEFT(NEW.content, 120),
    NEW.match_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_messages_notify
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_message();

-- ============================================================================
-- CORE RPC 4: Idempotent Payment Webhook Activation & Cumulative Renewal
-- ============================================================================
CREATE OR REPLACE FUNCTION public.activate_or_extend_subscription(
  p_order_id TEXT,
  p_transaction_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_sub public.subscriptions%ROWTYPE;
  v_plan public.subscription_plans%ROWTYPE;
  v_current_max_expiry TIMESTAMPTZ;
  v_base_start TIMESTAMPTZ;
  v_new_expiry TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_payment
  FROM public.payments
  WHERE order_id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order ID not found: %', p_order_id;
  END IF;

  -- Idempotency check: if already paid, return existing state without duplicating duration
  IF v_payment.status = 'paid' THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'idempotent', TRUE,
      'order_id', p_order_id,
      'subscription_id', v_payment.subscription_id
    );
  END IF;

  SELECT * INTO v_sub
  FROM public.subscriptions
  WHERE id = v_payment.subscription_id
  FOR UPDATE;

  SELECT * INTO v_plan
  FROM public.subscription_plans
  WHERE id = v_sub.plan_id;

  -- Check if user already has an active subscription whose expires_at > NOW() (PRD Section 31)
  SELECT MAX(s.expires_at) INTO v_current_max_expiry
  FROM public.subscriptions s
  WHERE s.user_id = v_payment.user_id
    AND s.status = 'active'
    AND s.expires_at > NOW();

  v_base_start := GREATEST(NOW(), COALESCE(v_current_max_expiry, NOW()));
  v_new_expiry := v_base_start + (v_plan.duration_days || ' days')::INTERVAL;

  UPDATE public.payments
  SET
    status = 'paid',
    transaction_id = COALESCE(p_transaction_id, transaction_id),
    paid_at = NOW()
  WHERE id = v_payment.id;

  UPDATE public.subscriptions
  SET
    status = 'active',
    started_at = COALESCE(started_at, NOW()),
    expires_at = v_new_expiry
  WHERE id = v_sub.id;

  INSERT INTO public.notifications (user_id, type, title, message, reference_id)
  VALUES
    (
      v_payment.user_id,
      'payment_success',
      'Pembayaran Berhasil 💳',
      'Pembayaran paket ' || v_plan.name || ' berhasil dikonfirmasi.',
      v_payment.id
    ),
    (
      v_payment.user_id,
      'subscription_active',
      'HAIYO Premium Aktif ✨',
      'Selamat! Paket ' || v_plan.name || ' kamu sudah aktif.',
      v_sub.id
    );

  INSERT INTO public.analytics_events (user_id, event_name, metadata)
  VALUES
    (v_payment.user_id, 'payment_completed', jsonb_build_object('order_id', p_order_id, 'amount', v_payment.amount)),
    (v_payment.user_id, 'subscription_started', jsonb_build_object('plan_code', v_plan.code, 'expires_at', v_new_expiry));

  RETURN jsonb_build_object(
    'success', TRUE,
    'idempotent', FALSE,
    'order_id', p_order_id,
    'subscription_id', v_sub.id,
    'expires_at', v_new_expiry
  );
END;
$$;

-- ============================================================================
-- CORE RPC 5: Complete Delete Account Lifecycle
-- ============================================================================
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 1. Terminate all active matches
  UPDATE public.matches
  SET status = 'unmatched', unmatched_at = NOW()
  WHERE (user_a_id = v_uid OR user_b_id = v_uid)
    AND status = 'active';

  -- 2. Cancel active subscriptions
  UPDATE public.subscriptions
  SET status = 'cancelled'
  WHERE user_id = v_uid AND status IN ('active', 'pending');

  -- 3. Remove profile photos records (storage files cleaned up by server action)
  DELETE FROM public.profile_photos WHERE user_id = v_uid;

  -- 4. Anonymize public PII & mark profile as deleted while keeping transactional foreign keys intact
  UPDATE public.profiles
  SET
    name = 'Pengguna HAIYO',
    bio = '',
    latitude = NULL,
    longitude = NULL,
    is_onboarded = FALSE,
    status = 'deleted'
  WHERE id = v_uid;

  RETURN jsonb_build_object('success', TRUE, 'user_id', v_uid);
END;
$$;

-- ============================================================================
-- SECTION 23 ERD: ROW LEVEL SECURITY (RLS) POLICIES FOR ALL 17 TABLES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipe_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 1. profiles RLS
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
  auth.uid() = id
  OR status = 'active'
  OR public.is_admin()
);

CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- 2. user_preferences RLS
CREATE POLICY "preferences_select_own" ON public.user_preferences
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "preferences_insert_own" ON public.user_preferences
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "preferences_update_own" ON public.user_preferences
FOR UPDATE USING (auth.uid() = user_id);

-- 3. profile_photos RLS
CREATE POLICY "photos_select_public_or_own" ON public.profile_photos
FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.status = 'active')
  OR public.is_admin()
);

CREATE POLICY "photos_insert_own" ON public.profile_photos
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "photos_update_own" ON public.profile_photos
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "photos_delete_own" ON public.profile_photos
FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- 4. interests RLS
CREATE POLICY "interests_select_all" ON public.interests
FOR SELECT USING (TRUE);

-- 5. user_interests RLS
CREATE POLICY "user_interests_select_all" ON public.user_interests
FOR SELECT USING (TRUE);

CREATE POLICY "user_interests_insert_own" ON public.user_interests
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_interests_delete_own" ON public.user_interests
FOR DELETE USING (auth.uid() = user_id);

-- 6. likes RLS
CREATE POLICY "likes_select_related" ON public.likes
FOR SELECT USING (
  auth.uid() = from_user_id
  OR auth.uid() = to_user_id
  OR public.is_admin()
);

CREATE POLICY "likes_insert_own" ON public.likes
FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- 7. passes RLS
CREATE POLICY "passes_select_own" ON public.passes
FOR SELECT USING (auth.uid() = from_user_id OR public.is_admin());

CREATE POLICY "passes_insert_own" ON public.passes
FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "passes_delete_own" ON public.passes
FOR DELETE USING (auth.uid() = from_user_id);

-- 8. matches RLS
CREATE POLICY "matches_select_member" ON public.matches
FOR SELECT USING (
  auth.uid() = user_a_id
  OR auth.uid() = user_b_id
  OR public.is_admin()
);

CREATE POLICY "matches_update_member" ON public.matches
FOR UPDATE USING (
  auth.uid() = user_a_id
  OR auth.uid() = user_b_id
  OR public.is_admin()
);

-- 9. messages RLS (Only active match members can send/read)
CREATE POLICY "messages_select_match_member" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id
      AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
  )
  OR public.is_admin()
);

CREATE POLICY "messages_insert_active_match_member" ON public.messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id
      AND m.status = 'active'
      AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
  )
);

CREATE POLICY "messages_update_read_status" ON public.messages
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id
      AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
  )
);

-- 10. blocks RLS
CREATE POLICY "blocks_select_own" ON public.blocks
FOR SELECT USING (auth.uid() = blocker_id OR public.is_admin());

CREATE POLICY "blocks_insert_own" ON public.blocks
FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "blocks_delete_own" ON public.blocks
FOR DELETE USING (auth.uid() = blocker_id);

-- 11. reports RLS
CREATE POLICY "reports_select_own_or_admin" ON public.reports
FOR SELECT USING (auth.uid() = reporter_id OR public.is_admin());

CREATE POLICY "reports_insert_own" ON public.reports
FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports_update_admin_only" ON public.reports
FOR UPDATE USING (public.is_admin());

-- 12. subscription_plans RLS
CREATE POLICY "subscription_plans_select_all" ON public.subscription_plans
FOR SELECT USING (TRUE);

-- 13. subscriptions RLS
CREATE POLICY "subscriptions_select_own_or_admin" ON public.subscriptions
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- 14. payments RLS
CREATE POLICY "payments_select_own_or_admin" ON public.payments
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- 15. notifications RLS (Created server-side; user can read & mark as read)
CREATE POLICY "notifications_select_own" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

-- 16. swipe_usage RLS
CREATE POLICY "swipe_usage_select_own" ON public.swipe_usage
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- 17. analytics_events RLS
CREATE POLICY "analytics_insert_authenticated" ON public.analytics_events
FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "analytics_select_admin" ON public.analytics_events
FOR SELECT USING (public.is_admin());

-- ============================================================================
-- SUPABASE STORAGE BUCKET: profile-photos (PRD Section 42)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  TRUE,
  5242880, -- 5MB per photo
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_profile_photos_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "storage_profile_photos_user_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "storage_profile_photos_user_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "storage_profile_photos_user_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- SEED DATA: 10 INTERESTS & 3 SUBSCRIPTION PLANS (ERD Sections 6 & 14)
-- ============================================================================
INSERT INTO public.interests (name, slug, emoji)
VALUES
  ('Coffee', 'coffee', '☕'),
  ('Music', 'music', '🎵'),
  ('Travel', 'travel', '✈️'),
  ('Gaming', 'gaming', '🎮'),
  ('Sports', 'sports', '⚽'),
  ('Reading', 'reading', '📚'),
  ('Food', 'food', '🍜'),
  ('Movies', 'movies', '🎬'),
  ('Photography', 'photography', '📸'),
  ('Fitness', 'fitness', '🏋️')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.subscription_plans (code, name, duration_days, price, is_active)
VALUES
  ('PREMIUM_7D', 'Premium 7 Hari', 7, 12000, TRUE),
  ('PREMIUM_1M', 'Premium 1 Bulan', 30, 29000, TRUE),
  ('PREMIUM_3M', 'Premium 3 Bulan', 90, 69000, TRUE)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  duration_days = EXCLUDED.duration_days,
  price = EXCLUDED.price,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- 18. SITE SETTINGS (CMS Homepage & Payment Recipient Config for Admin)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings_select_all"
ON public.site_settings FOR SELECT
USING (TRUE);

CREATE POLICY "site_settings_upsert_admin"
ON public.site_settings FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================================
-- AUTO-CREATE PROFILE ON SUPABASE AUTH SIGNUP (First User = Admin)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_first_user BOOLEAN;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO v_is_first_user;

  INSERT INTO public.profiles (id, name, status, is_admin, is_onboarded)
  VALUES (
    NEW.id,
    COALESCE(SPLIT_PART(NEW.email, '@', 1), 'User'),
    'active',
    v_is_first_user,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_preferences (user_id, preferred_gender, min_age, max_age, radius_km)
  VALUES (NEW.id, 'female', 20, 30, 25)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

