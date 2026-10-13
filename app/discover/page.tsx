"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Crown,
  Heart,
  Info,
  Lock,
  MapPin,
  RotateCcw,
  X,
  Zap,
} from "lucide-react";
import {
  AppShell,
  BottomSheet,
  Button,
  EmptyState,
  Input,
  InterestChip,
  LikeButton,
  PassButton,
  PremiumBadge,
  ProfileCardSkeleton,
  RadiusSlider,
  Select,
  useToast,
} from "@/components/ui";
import { MatchModal } from "@/components/match/MatchModal";
import { ProfileDetailSheet } from "@/components/discover/ProfileDetailSheet";
import {
  BlockConfirmModal,
  ReportBottomSheet,
} from "@/components/safety/SafetyModals";
import {
  getFilteredDiscoveryCandidates,
  isCurrentUserPremium,
  loadAppState,
  LocalAppState,
  saveAppState,
  syncAppStateFromSupabase,
} from "@/lib/store/app-state";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { DiscoveryProfileCard, Gender } from "@/types/database";

const SWIPE_THRESHOLD_PX = 90;

export default function DiscoverPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [appState, setAppState] = useState<LocalAppState | null>(null);
  const [candidates, setCandidates] = useState<DiscoveryProfileCard[]>([]);
  const [swipeAnim, setSwipeAnim] = useState<"left" | "right" | null>(null);
  const [lastPassedProfile, setLastPassedProfile] =
    useState<DiscoveryProfileCard | null>(null);
  const [cardPhotoIndex, setCardPhotoIndex] = useState<number>(0);

  // Interactive Pointer Drag / Swipe State
  const [dragX, setDragX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartXRef = useRef<number | null>(null);

  // Modals & BottomSheets
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [detailProfile, setDetailProfile] =
    useState<DiscoveryProfileCard | null>(null);
  const [matchedPartner, setMatchedPartner] =
    useState<DiscoveryProfileCard | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [reportTarget, setReportTarget] =
    useState<DiscoveryProfileCard | null>(null);
  const [blockTarget, setBlockTarget] =
    useState<DiscoveryProfileCard | null>(null);

  // Filter form state
  const [filterGender, setFilterGender] = useState<Gender>("female");
  const [filterMinAge, setFilterMinAge] = useState<number>(18);
  const [filterMaxAge, setFilterMaxAge] = useState<number>(35);
  const [filterRadius, setFilterRadius] = useState<number>(25);

  useEffect(() => {
    const state = loadAppState();
    setAppState(state);
    if (state.currentUser) {
      setFilterGender(state.currentUser.preferences.preferred_gender);
      setFilterMinAge(state.currentUser.preferences.min_age);
      setFilterMaxAge(state.currentUser.preferences.max_age);
      setFilterRadius(state.currentUser.preferences.radius_km);
    }
    setCandidates(getFilteredDiscoveryCandidates(state));

    if (isSupabaseConfigured()) {
      void syncAppStateFromSupabase().then((synced) => {
        setAppState(synced);
        if (synced.currentUser) {
          setFilterGender(synced.currentUser.preferences.preferred_gender);
          setFilterMinAge(synced.currentUser.preferences.min_age);
          setFilterMaxAge(synced.currentUser.preferences.max_age);
          setFilterRadius(synced.currentUser.preferences.radius_km);
        }
        setCandidates(getFilteredDiscoveryCandidates(synced));
      });
    }
  }, []);

  const topCandidateId = candidates[0]?.id;
  useEffect(() => {
    setCardPhotoIndex(0);
  }, [topCandidateId]);

  if (!appState || !appState.currentUser) {
    return (
      <AppShell>
        <div className="py-6">
          <ProfileCardSkeleton />
        </div>
      </AppShell>
    );
  }

  const isPremium = isCurrentUserPremium(appState);
  const swipeCount = appState.swipeUsageToday.swipe_count;
  const isAtSwipeLimit = !isPremium && swipeCount >= 100;
  const isNearSwipeLimit = !isPremium && swipeCount >= 90 && swipeCount < 100;

  const currentProfile = candidates[0] ?? null;
  const nextProfile = candidates[1] ?? null;

  const myPrimaryPhoto =
    appState.currentUser.photos.find((p) => p.is_primary)?.public_url ??
    appState.currentUser.photos[0]?.public_url ??
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80";

  const unreadNotifications = appState.notifications.filter(
    (n) => !n.is_read
  ).length;
  const unreadMessages = appState.messages.filter(
    (m) => !m.is_read && m.sender_id !== appState.currentUser?.id
  ).length;

  const handleSwipe = async (
    target: DiscoveryProfileCard,
    action: "like" | "pass"
  ) => {
    if (isAtSwipeLimit) {
      toast({
        title: "Swipe harian kamu sudah habis.",
        description: "Upgrade Premium untuk Unlimited Swipe!",
        variant: "error",
      });
      return;
    }

    // Optimistic UI card animation (UI/UX Section 72)
    setSwipeAnim(action === "like" ? "right" : "left");

    setTimeout(async () => {
      setSwipeAnim(null);

      let serverIsMatch = false;
      let serverMatchId: string | null = null;

      // Call PostgreSQL atomic RPC record_swipe_action() when Supabase is configured
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "record_swipe_action",
          {
            p_target_user_id: target.id,
            p_action: action,
          }
        );

        if (!rpcError && rpcData && typeof rpcData === "object") {
          const parsedRpc = rpcData as {
            is_match?: boolean;
            match_id?: string | null;
          };
          serverIsMatch = Boolean(parsedRpc.is_match);
          serverMatchId = parsedRpc.match_id ?? null;
        } else {
          // Direct table fallback if RPC fails
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            if (action === "pass") {
              await supabase.from("passes").upsert({
                from_user_id: user.id,
                to_user_id: target.id,
              });
            } else {
              await supabase.from("likes").upsert({
                from_user_id: user.id,
                to_user_id: target.id,
              });
            }
          }
        }
      }

      const fresh = loadAppState();
      const nextSwipeCount = fresh.swipeUsageToday.swipe_count + 1;

      if (action === "pass") {
        setLastPassedProfile(target);
        const updated: LocalAppState = {
          ...fresh,
          myPassedUserIds: [...fresh.myPassedUserIds, target.id],
          swipeUsageToday: {
            ...fresh.swipeUsageToday,
            swipe_count: nextSwipeCount,
          },
        };
        saveAppState(updated);
        setAppState(updated);
        setCandidates(getFilteredDiscoveryCandidates(updated));
        return;
      }

      // Action === "like" -> Atomic reciprocal check
      const isMutual =
        serverIsMatch || fresh.likedByUserIds.includes(target.id);
      const myId = fresh.currentUser?.id ?? "user-me";
      const normalizedUserA = myId < target.id ? myId : target.id;
      const normalizedUserB = myId < target.id ? target.id : myId;

      let updatedMatches = [...fresh.matches];
      let updatedNotifications = [...fresh.notifications];
      let createdMatchId: string | null = serverMatchId;

      if (isMutual) {
        const existingMatch = updatedMatches.find(
          (m) =>
            (m.user_a_id === normalizedUserA &&
              m.user_b_id === normalizedUserB) ||
            m.partner.id === target.id
        );

        if (existingMatch) {
          createdMatchId = serverMatchId ?? existingMatch.id;
          updatedMatches = updatedMatches.map((m) =>
            m.id === existingMatch.id
              ? { ...m, id: createdMatchId!, status: "active" }
              : m
          );
        } else {
          createdMatchId = serverMatchId ?? `match-${Date.now()}`;
          updatedMatches = [
            {
              id: createdMatchId,
              user_a_id: normalizedUserA,
              user_b_id: normalizedUserB,
              status: "active",
              matched_at: new Date().toISOString(),
              unmatched_at: null,
              created_at: new Date().toISOString(),
              partner: target,
            },
            ...updatedMatches,
          ];
        }

        updatedNotifications = [
          {
            id: `notif-match-${Date.now()}`,
            user_id: myId,
            type: "new_match",
            title: "It's a Match!",
            message: `Wah, kamu dan ${target.name} saling menyukai! Saatnya mulai kenalan.`,
            reference_id: createdMatchId,
            is_read: false,
            created_at: new Date().toISOString(),
          },
          ...updatedNotifications,
        ];
      } else {
        toast({
          title: `Kamu menyukai ${target.name}.`,
          variant: "like",
        });
      }

      const updated: LocalAppState = {
        ...fresh,
        myLikedUserIds: [...fresh.myLikedUserIds, target.id],
        matches: updatedMatches,
        notifications: updatedNotifications,
        swipeUsageToday: {
          ...fresh.swipeUsageToday,
          swipe_count: nextSwipeCount,
        },
      };

      saveAppState(updated);
      setAppState(updated);
      setCandidates(getFilteredDiscoveryCandidates(updated));

      if (isMutual && createdMatchId) {
        setActiveMatchId(createdMatchId);
        setMatchedPartner(target);
      }
    }, 180);
  };

  const handleUndoPass = async () => {
    if (!isPremium) {
      toast({
        title: "Fitur HAIYO Premium",
        description: "Upgrade ke Premium untuk mengembalikan profil sebelumnya (Undo).",
        variant: "info",
      });
      router.push("/premium");
      return;
    }
    if (!lastPassedProfile) {
      toast({
        title: "Belum ada profil yang dilewati",
        variant: "info",
      });
      return;
    }

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("passes")
          .delete()
          .eq("from_user_id", user.id)
          .eq("to_user_id", lastPassedProfile.id);
      }
    }

    const fresh = loadAppState();
    const updated: LocalAppState = {
      ...fresh,
      myPassedUserIds: fresh.myPassedUserIds.filter(
        (id) => id !== lastPassedProfile.id
      ),
    };
    saveAppState(updated);
    setAppState(updated);
    setCandidates(getFilteredDiscoveryCandidates(updated));
    setLastPassedProfile(null);
    toast({
      title: `Profil ${lastPassedProfile.name} dikembalikan.`,
      variant: "success",
    });
  };

  const handleApplyFilter = async () => {
    const fresh = loadAppState();
    if (!fresh.currentUser) return;

    const cleanMinAge = Math.max(18, filterMinAge);
    const cleanMaxAge = Math.max(cleanMinAge, filterMaxAge);

    const updated: LocalAppState = {
      ...fresh,
      currentUser: {
        ...fresh.currentUser,
        preferences: {
          ...fresh.currentUser.preferences,
          preferred_gender: filterGender,
          min_age: cleanMinAge,
          max_age: cleanMaxAge,
          radius_km: filterRadius,
          updated_at: new Date().toISOString(),
        },
      },
    };
    saveAppState(updated);
    setAppState(updated);
    setCandidates(getFilteredDiscoveryCandidates(updated));
    setIsFilterOpen(false);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("user_preferences").upsert({
            user_id: user.id,
            preferred_gender: filterGender,
            min_age: cleanMinAge,
            max_age: cleanMaxAge,
            radius_km: filterRadius,
            updated_at: new Date().toISOString(),
          });
        }
        const synced = await syncAppStateFromSupabase();
        setAppState(synced);
        setCandidates(getFilteredDiscoveryCandidates(synced));
      } catch {
        // non-blocking
      }
    }

    toast({
      title: "Filter pencarian diperbarui.",
      variant: "success",
    });
  };

  const handleConfirmBlock = async () => {
    if (!blockTarget) return;
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("blocks").insert({
          blocker_id: user.id,
          blocked_id: blockTarget.id,
        });
      }
    }

    const fresh = loadAppState();
    const updated: LocalAppState = {
      ...fresh,
      blockedUserIds: [...fresh.blockedUserIds, blockTarget.id],
      matches: fresh.matches.map((m) =>
        m.partner.id === blockTarget.id
          ? { ...m, status: "unmatched", unmatched_at: new Date().toISOString() }
          : m
      ),
    };
    saveAppState(updated);
    setAppState(updated);
    setCandidates(getFilteredDiscoveryCandidates(updated));
    setBlockTarget(null);
    setDetailProfile(null);
    toast({
      title: "Pengguna berhasil diblokir.",
      variant: "info",
    });
  };

  return (
    <AppShell
      headerProps={{
        showBrand: true,
        hasUnreadNotifications: unreadNotifications > 0,
        onOpenFilter: () => setIsFilterOpen(true),
      }}
      unreadChatCount={unreadMessages}
      unreadLikesCount={appState.likedByUserIds.length}
    >
      {/* Preload next candidate's primary photo (UI/UX Section 72) */}
      {nextProfile?.photos?.[0]?.public_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={nextProfile.photos[0].public_url}
          alt=""
          aria-hidden="true"
          className="hidden"
        />
      )}

      <div className="w-full max-w-[420px] mx-auto flex-1 flex flex-col space-y-3">
        {/* Top Status Bar: Swipe Counter or Unlimited Badge (UI/UX Section 29) */}
        <div className="flex items-center justify-between px-1">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6F7078]">
            <Compass className="w-3.5 h-3.5 text-[#267a50]" />
            <span>Rekomendasi di sekitar kamu</span>
          </span>

          {isPremium ? (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#1d1d1d]">
              <Crown className="w-3.5 h-3.5 text-[#267a50]" />
              <span>Unlimited Swipe</span>
            </span>
          ) : (
            <Link
              href="/premium"
              className="text-[12px] font-semibold text-[#6F7078] hover:text-[#267a50] transition-colors"
            >
              {swipeCount} / 100 Swipe
            </Link>
          )}
        </div>

        {/* Near Limit Warning Banner (UI/UX Section 29) */}
        {isNearSwipeLimit && (
          <div className="p-3.5 rounded-[16px] bg-[#eaf5ef] border border-[#267a50]/30 flex items-center justify-between gap-3">
            <span className="text-[13px] font-semibold text-[#1d1d1d]">
              Kuota swipe tersisa {100 - swipeCount} hari ini
            </span>
            <Link href="/premium">
              <Button variant="primary" size="sm">
                Upgrade Premium
              </Button>
            </Link>
          </div>
        )}

        {/* At Swipe Limit Screen (UI/UX Section 29) */}
        {isAtSwipeLimit ? (
          <div className="rounded-[24px] bg-white border border-[#E9E9EE] shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#eaf5ef] text-[#267a50] flex items-center justify-center mx-auto">
              <Zap className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-[22px] font-bold text-[#1d1d1d]">
                Swipe kamu habis!
              </h2>
              <p className="text-[14px] text-[#6F7078]">
                Kamu sudah menggunakan 100 swipe hari ini. Upgrade ke HAIYO
                Premium untuk kenalan tanpa batas!
              </p>
            </div>
            <div className="space-y-2.5 pt-2">
              <Link href="/premium" className="block">
                <Button variant="primary" fullWidth>
                  Upgrade Premium
                </Button>
              </Link>
              <Button
                variant="secondary"
                fullWidth
                onClick={() =>
                  toast({
                    title: "Kuota swipe gratis akan di-reset besok pagi.",
                    variant: "info",
                  })
                }
              >
                Kembali besok
              </Button>
            </div>
          </div>
        ) : currentProfile ? (
          /* Main Discover Profile Card (UI/UX Sections 26-28) */
          <div className="relative flex-1 flex flex-col pb-1">
            <div
              onPointerDown={(e) => {
                if ((e.target as HTMLElement).closest("button")) return;
                dragStartXRef.current = e.clientX;
                setIsDragging(true);
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!isDragging || dragStartXRef.current === null) return;
                setDragX(e.clientX - dragStartXRef.current);
              }}
              onPointerUp={() => {
                if (!isDragging) return;
                const finalDelta = dragX;
                setIsDragging(false);
                dragStartXRef.current = null;
                setDragX(0);

                if (finalDelta > SWIPE_THRESHOLD_PX) {
                  handleSwipe(currentProfile, "like");
                } else if (finalDelta < -SWIPE_THRESHOLD_PX) {
                  handleSwipe(currentProfile, "pass");
                } else if (Math.abs(finalDelta) < 8) {
                  setDetailProfile(currentProfile);
                }
              }}
              onPointerCancel={() => {
                setIsDragging(false);
                dragStartXRef.current = null;
                setDragX(0);
              }}
              style={
                isDragging && dragX !== 0
                  ? {
                      transform: `translateX(${dragX}px) rotate(${
                        dragX * 0.045
                      }deg)`,
                    }
                  : undefined
              }
              className={`relative rounded-[24px] overflow-hidden bg-[#1d1d1d] border border-[#E9E9EE] shadow-[0_8px_24px_rgba(0,0,0,0.08)] h-[calc(100dvh-205px)] min-h-[460px] max-h-[680px] w-full cursor-grab active:cursor-grabbing select-none touch-pan-y ${
                isDragging ? "" : "transition-all duration-200"
              } ${
                swipeAnim === "right"
                  ? "translate-x-20 rotate-6 opacity-0"
                  : swipeAnim === "left"
                  ? "-translate-x-20 -rotate-6 opacity-0"
                  : "translate-x-0 rotate-0 opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  currentProfile.photos[
                    cardPhotoIndex % Math.max(1, currentProfile.photos.length)
                  ]?.public_url ??
                  currentProfile.photos.find((p) => p.is_primary)?.public_url ??
                  currentProfile.photos[0]?.public_url
                }
                alt={`${currentProfile.name} foto ${cardPhotoIndex + 1}`}
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none transition-all duration-200"
              />

              {/* Bottom Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />

              {/* Top Segmented Photo Slide Progress Bars */}
              {currentProfile.photos.length > 1 && (
                <div className="absolute top-3 inset-x-4 z-20 flex gap-1.5">
                  {currentProfile.photos.map((photo, idx) => {
                    const isCurrentPhoto =
                      idx === cardPhotoIndex % currentProfile.photos.length;
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCardPhotoIndex(idx);
                        }}
                        aria-label={`Slide foto ${idx + 1}`}
                        className={`h-1.5 flex-1 rounded-full transition-all cursor-pointer ${
                          isCurrentPhoto
                            ? "bg-white shadow-sm"
                            : "bg-white/40 hover:bg-white/70"
                        }`}
                      />
                    );
                  })}
                </div>
              )}

              {/* Left & Right Photo Slide Buttons on Discover Card */}
              {currentProfile.photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardPhotoIndex(
                        (prev) =>
                          (prev - 1 + currentProfile.photos.length) %
                          currentProfile.photos.length
                      );
                    }}
                    aria-label="Foto sebelumnya"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/35 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCardPhotoIndex(
                        (prev) => (prev + 1) % currentProfile.photos.length
                      );
                    }}
                    aria-label="Foto berikutnya"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/35 hover:bg-black/60 backdrop-blur-sm text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Drag Swipe Stamp Indicators (LIKE / PASS) */}
              {dragX > 30 && (
                <div className="absolute top-16 left-5 z-20 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#267a50] text-white text-[13px] font-extrabold tracking-wider uppercase shadow-md -rotate-6 pointer-events-none">
                  <Heart className="w-4 h-4 fill-white" />
                  <span>LIKE</span>
                </div>
              )}
              {dragX < -30 && (
                <div className="absolute top-16 right-5 z-20 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1d1d1d]/90 text-white text-[13px] font-extrabold tracking-wider uppercase shadow-md rotate-6 pointer-events-none">
                  <X className="w-4 h-4 stroke-[2.5]" />
                  <span>PASS</span>
                </div>
              )}

              {/* Top Card Badges */}
              <div
                className={`absolute ${
                  currentProfile.photos.length > 1 ? "top-7" : "top-4"
                } left-4 right-4 z-20 flex items-center justify-between`}
              >
                <div className="flex items-center gap-2">
                  {currentProfile.is_premium && <PremiumBadge />}
                  {currentProfile.photos.length > 1 && (
                    <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-[11px] font-bold">
                      {(cardPhotoIndex % currentProfile.photos.length) + 1} /{" "}
                      {currentProfile.photos.length} Foto
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailProfile(currentProfile);
                  }}
                  aria-label="Lihat detail profil"
                  title="Lihat profil lengkap"
                  className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              {/* Card Bottom Content (leaves compact space for docked action bar) */}
              <div className="absolute bottom-0 inset-x-0 p-5 pb-9 text-white space-y-2 pointer-events-none">
                <div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailProfile(currentProfile);
                    }}
                    className="pointer-events-auto text-left group cursor-pointer"
                  >
                    <h2 className="text-[25px] font-bold leading-tight tracking-tight group-hover:underline flex items-center gap-2">
                      <span>
                        {currentProfile.name}, {currentProfile.age}
                      </span>
                      {currentProfile.is_online && (
                        <span
                          title="Sedang Online"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#22C55E]/25 border border-[#22C55E]/50 text-[#4ADE80] text-[11px] font-bold tracking-normal"
                        >
                          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                          <span>Online</span>
                        </span>
                      )}
                    </h2>
                  </button>
                  <p className="text-[13px] text-white/85 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#267a50] shrink-0" />
                    <span className="truncate">
                      {currentProfile.city}
                      {currentProfile.approx_distance_km
                        ? ` · ±${currentProfile.approx_distance_km} km away`
                        : ""}
                    </span>
                  </p>
                </div>

                <p className="text-[13.5px] text-white/90 line-clamp-2 leading-snug">
                  &ldquo;{currentProfile.bio}&rdquo;
                </p>

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {currentProfile.interests.slice(0, 4).map((interest) => (
                    <InterestChip
                      key={interest.id}
                      label={interest.name}
                      interactive={false}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Compact Docked Action Bar overlapping the card bottom edge */}
            <div className="relative z-10 -mt-6 flex justify-center">
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#E9E9EE] shadow-[0_8px_24px_rgba(29, 29, 29,0.10)]">
                <button
                  type="button"
                  onClick={handleUndoPass}
                  aria-label="Undo profil sebelumnya"
                  title="Undo / Kembali (Fitur Premium)"
                  className="w-10 h-10 rounded-full bg-[#F7F7FA] hover:bg-[#eaf5ef] text-[#6F7078] hover:text-[#67bf9a] border border-[#E9E9EE] flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 stroke-[2.2]" />
                </button>

                <PassButton
                  onClick={() => handleSwipe(currentProfile, "pass")}
                />

                <LikeButton
                  onClick={() => handleSwipe(currentProfile, "like")}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Friendly Discover Empty State (UI/UX Section 59) */
          <EmptyState
            icon={<Compass className="w-8 h-8" />}
            title="Belum ada profil yang cocok di sekitar kamu."
            description="Coba perluas radius pencarian atau sesuaikan rentang usia untuk bertemu lebih banyak orang baru."
            actionLabel="Perluas Radius"
            onAction={() => setIsFilterOpen(true)}
          />
        )}
      </div>

      {/* Profile Detail Sheet (UI/UX Section 32) */}
      <ProfileDetailSheet
        profile={detailProfile}
        isOpen={Boolean(detailProfile)}
        onClose={() => setDetailProfile(null)}
        onLike={(p) => handleSwipe(p, "like")}
        onPass={(p) => handleSwipe(p, "pass")}
        onReport={(p) => {
          setDetailProfile(null);
          setReportTarget(p);
        }}
        onBlock={(p) => {
          setDetailProfile(null);
          setBlockTarget(p);
        }}
      />

      {/* Full-Screen Match Celebration Modal (UI/UX Section 35) */}
      <MatchModal
        isOpen={Boolean(matchedPartner)}
        onClose={() => setMatchedPartner(null)}
        onSendMessage={() => {
          const targetMatchId = activeMatchId;
          setMatchedPartner(null);
          if (targetMatchId) {
            router.push(`/chat/${targetMatchId}`);
          } else {
            router.push("/matches");
          }
        }}
        myName={appState.currentUser.profile.name}
        myPhotoUrl={myPrimaryPhoto}
        partner={matchedPartner}
      />

      {/* Filter BottomSheet (UI/UX Sections 30 & 31) */}
      <BottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter"
        description="Sesuaikan preferensi orang baru yang ingin kamu temui."
      >
        <div className="space-y-5">
          <Select
            label="Gender"
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value as Gender)}
            options={[
              { value: "female", label: "Perempuan" },
              { value: "male", label: "Laki-laki" },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Usia Minimum"
              type="number"
              min={18}
              max={80}
              value={filterMinAge}
              onChange={(e) =>
                setFilterMinAge(Math.max(18, Number(e.target.value) || 18))
              }
            />
            <Input
              label="Usia Maksimum"
              type="number"
              min={18}
              max={90}
              value={filterMaxAge}
              onChange={(e) =>
                setFilterMaxAge(
                  Math.max(filterMinAge, Number(e.target.value) || 35)
                )
              }
            />
          </div>

          <RadiusSlider
            label="Radius Lokasi"
            value={filterRadius}
            min={0}
            max={500}
            onChange={setFilterRadius}
          />

          {/* Premium Filter Section (UI/UX Section 31) */}
          <div className="p-4 rounded-[16px] bg-[#f9f9fa] border border-[#E9E9EE] flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-[14px] font-semibold text-[#1d1d1d] flex items-center gap-1.5">
                {!isPremium && <Lock className="w-4 h-4 text-[#67bf9a]" />}
                <span>Fitur Premium</span>
              </p>
              <p className="text-[12px] text-[#6F7078]">
                Gunakan filter lebih lengkap dengan HAIYO Premium.
              </p>
            </div>
            {!isPremium && (
              <Link href="/premium">
                <Button variant="premium" size="sm">
                  Lihat Premium
                </Button>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setFilterMinAge(18);
                setFilterMaxAge(40);
                setFilterRadius(250);
              }}
            >
              Reset
            </Button>
            <Button variant="primary" fullWidth onClick={handleApplyFilter}>
              Tampilkan Profil
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Report & Block Modals */}
      {reportTarget && (
        <ReportBottomSheet
          isOpen={Boolean(reportTarget)}
          onClose={() => setReportTarget(null)}
          targetUserId={reportTarget.id}
          targetUserName={reportTarget.name}
        />
      )}

      {blockTarget && (
        <BlockConfirmModal
          isOpen={Boolean(blockTarget)}
          onClose={() => setBlockTarget(null)}
          onConfirm={handleConfirmBlock}
          targetUserName={blockTarget.name}
        />
      )}
    </AppShell>
  );
}
