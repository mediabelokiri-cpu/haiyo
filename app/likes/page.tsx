"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Lock, MapPin } from "lucide-react";
import {
  AppShell,
  Badge,
  Button,
  EmptyState,
  PremiumBadge,
  useToast,
} from "@/components/ui";
import { MatchModal } from "@/components/match/MatchModal";
import { ProfileDetailSheet } from "@/components/discover/ProfileDetailSheet";
import {
  isCurrentUserPremium,
  loadAppState,
  LocalAppState,
  saveAppState,
  SEED_CANDIDATE_PROFILES,
  syncAppStateFromSupabase,
} from "@/lib/store/app-state";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { DiscoveryProfileCard } from "@/types/database";

/**
 * Likes Page (/likes — "Yang Menyukaimu") per UI/UX Section 36:
 * - Free user: Blurred profile cards + 🔒 "Lihat siapa yang menyukaimu" + CTA "Upgrade Premium"
 * - Premium user: Actual profile cards (clickable photo & name to open ProfileDetailSheet) + "Like Back" button (instant Match!)
 */
export default function LikesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [appState, setAppState] = useState<LocalAppState | null>(null);
  const [detailProfile, setDetailProfile] =
    useState<DiscoveryProfileCard | null>(null);
  const [matchedPartner, setMatchedPartner] =
    useState<DiscoveryProfileCard | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);

  useEffect(() => {
    setAppState(loadAppState());
    if (isSupabaseConfigured()) {
      void syncAppStateFromSupabase().then((synced) => {
        setAppState(synced);
      });
    }
  }, []);

  if (!appState || !appState.currentUser) return null;

  const isPremium = isCurrentUserPremium(appState);

  // Profiles who liked currentUser and haven't been matched/blocked yet
  const incomingLikeProfiles = appState.likedByUserIds
    .filter(
      (id) =>
        !appState.myLikedUserIds.includes(id) &&
        !appState.myPassedUserIds.includes(id) &&
        !appState.blockedUserIds.includes(id)
    )
    .map((id) => SEED_CANDIDATE_PROFILES.find((p) => p.id === id))
    .filter((p): p is DiscoveryProfileCard => Boolean(p));

  const myPrimaryPhoto =
    appState.currentUser.photos.find((p) => p.is_primary)?.public_url ??
    appState.currentUser.photos[0]?.public_url ??
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80";

  const handleLikeBack = async (target: DiscoveryProfileCard) => {
    let serverMatchId: string | null = null;
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { data: rpcData } = await supabase.rpc("record_swipe_action", {
        p_target_user_id: target.id,
        p_action: "like",
      });
      if (rpcData && typeof rpcData === "object") {
        serverMatchId =
          (rpcData as { match_id?: string | null }).match_id ?? null;
      }
    }

    const fresh = loadAppState();
    const myId = fresh.currentUser?.id ?? "user-me";
    const normalizedA = myId < target.id ? myId : target.id;
    const normalizedB = myId < target.id ? target.id : myId;
    const newMatchId = serverMatchId ?? `match-${Date.now()}`;

    const updated: LocalAppState = {
      ...fresh,
      myLikedUserIds: [...fresh.myLikedUserIds, target.id],
      matches: [
        {
          id: newMatchId,
          user_a_id: normalizedA,
          user_b_id: normalizedB,
          status: "active",
          matched_at: new Date().toISOString(),
          unmatched_at: null,
          created_at: new Date().toISOString(),
          partner: target,
        },
        ...fresh.matches,
      ],
      notifications: [
        {
          id: `notif-match-${Date.now()}`,
          user_id: myId,
          type: "new_match",
          title: "It's a Match!",
          message: `Wah, kamu dan ${target.name} saling menyukai!`,
          reference_id: newMatchId,
          is_read: false,
          created_at: new Date().toISOString(),
        },
        ...fresh.notifications,
      ],
    };

    saveAppState(updated);
    setAppState(updated);
    setActiveMatchId(newMatchId);
    setMatchedPartner(target);
    toast({
      title: "It's a Match!",
      variant: "match",
    });
  };

  const handlePassFromLikes = async (target: DiscoveryProfileCard) => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.rpc("record_swipe_action", {
        p_target_user_id: target.id,
        p_action: "pass",
      });
    }
    const fresh = loadAppState();
    const updated: LocalAppState = {
      ...fresh,
      myPassedUserIds: [...fresh.myPassedUserIds, target.id],
    };
    saveAppState(updated);
    setAppState(updated);
  };

  return (
    <AppShell
      headerProps={{
        title: "Yang Menyukaimu",
        showBrand: false,
      }}
      unreadLikesCount={incomingLikeProfiles.length}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold text-[#1d1d1d]">
              Yang Menyukaimu
            </h1>
            <p className="text-[14px] text-[#6F7078]">
              Orang-orang yang sudah memberikan Like pada profilmu.
            </p>
          </div>
          <Badge variant="primary">{incomingLikeProfiles.length} Suka</Badge>
        </div>

        {incomingLikeProfiles.length === 0 ? (
          /* Friendly Likes Empty State (UI/UX Section 59) */
          <EmptyState
            icon={<Heart className="w-8 h-8" />}
            title="Belum ada yang menyukaimu."
            description="Tenang, mungkin sebentar lagi. Terus aktif di Discover supaya profilmu makin sering dilihat."
            actionLabel="Mulai Discover"
            onAction={() => router.push("/discover")}
          />
        ) : !isPremium ? (
          /* FREE USER: Blurred Profile Cards + Upgrade Overlay (UI/UX Section 36) */
          <div className="space-y-6">
            <div className="p-6 rounded-[24px] bg-gradient-to-r from-[#eaf5ef] to-[#eaf5ef] border border-[#267a50]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#267a50]">
                  <Lock className="w-4 h-4" />
                  <span>Lihat siapa yang menyukaimu</span>
                </div>
                <p className="text-[13px] text-[#6F7078]">
                  Ada {incomingLikeProfiles.length} orang yang sudah menyukai
                  profilmu. Buka kunci foto mereka dengan HAIYO Premium!
                </p>
              </div>
              <Link href="/premium" className="shrink-0">
                <Button variant="primary">Upgrade Premium</Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {incomingLikeProfiles.map((person) => (
                <div
                  key={person.id}
                  className="relative aspect-[3/4] rounded-[20px] overflow-hidden border border-[#E9E9EE] bg-[#1d1d1d] shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={person.photos[0]?.public_url}
                    alt="Profil terkunci"
                    className="absolute inset-0 w-full h-full object-cover object-center blur-lg scale-110"
                  />
                  <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center p-4 text-center text-white space-y-2">
                    <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                    <p className="text-[13px] font-bold flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-[#267a50] text-[#267a50]" />
                      <span>Menyukaimu</span>
                    </p>
                    <p className="text-[11px] text-white/85">{person.city}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* PREMIUM USER: Actual Unblurred Profiles + Instant Like Back (UI/UX Section 36) */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {incomingLikeProfiles.map((person) => (
              <div
                key={person.id}
                className="rounded-[20px] overflow-hidden bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.06)] flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => setDetailProfile(person)}
                  aria-label={`Lihat profil ${person.name}`}
                  className="relative aspect-[3/4] w-full bg-[#1d1d1d] text-left group cursor-pointer overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={person.photos[0]?.public_url}
                    alt={person.name}
                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    {person.is_premium ? <PremiumBadge /> : <span />}
                    {person.photos.length > 1 && (
                      <span className="px-2 py-0.5 rounded-full bg-black/45 backdrop-blur-sm text-white text-[10px] font-bold">
                        {person.photos.length} Foto
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="text-[18px] font-bold group-hover:underline">
                      {person.name}, {person.age}
                    </h3>
                    <p className="text-[12px] text-white/85 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#267a50]" />
                      <span>{person.city}</span>
                    </p>
                  </div>
                </button>

                <div className="p-3.5">
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => handleLikeBack(person)}
                    leftIcon={<Heart className="w-4 h-4 fill-white" />}
                  >
                    Like Back (Match!)
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Profile Detail Sheet on Likes page */}
      <ProfileDetailSheet
        profile={detailProfile}
        isOpen={Boolean(detailProfile)}
        onClose={() => setDetailProfile(null)}
        onLike={(p) => handleLikeBack(p)}
        onPass={(p) => handlePassFromLikes(p)}
      />

      <MatchModal
        isOpen={Boolean(matchedPartner)}
        onClose={() => setMatchedPartner(null)}
        onSendMessage={() => {
          const id = activeMatchId;
          setMatchedPartner(null);
          if (id) router.push(`/chat/${id}`);
        }}
        myName={appState.currentUser.profile.name}
        myPhotoUrl={myPrimaryPhoto}
        partner={matchedPartner}
      />
    </AppShell>
  );
}
