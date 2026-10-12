"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Users } from "lucide-react";
import {
  AppShell,
  Avatar,
  Badge,
  EmptyState,
  PremiumBadge,
  useToast,
} from "@/components/ui";
import { ProfileDetailSheet } from "@/components/discover/ProfileDetailSheet";
import {
  BlockConfirmModal,
  ReportBottomSheet,
  UnmatchConfirmModal,
} from "@/components/safety/SafetyModals";
import {
  loadAppState,
  LocalAppState,
  saveAppState,
  syncAppStateFromSupabase,
} from "@/lib/store/app-state";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { DiscoveryProfileCard } from "@/types/database";

/**
 * Matches Page (/matches) per UI/UX Section 37:
 * - Heading: "Match Kamu"
 * - Grouping: Hari ini, Kemarin, Sebelumnya
 * - Displays: Clickable Avatar & Name (opens ProfileDetailSheet), Last message, Timestamp, Unread badge
 */
export default function MatchesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [appState, setAppState] = useState<LocalAppState | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<{
    matchId: string;
    partner: DiscoveryProfileCard;
  } | null>(null);
  const [unmatchTarget, setUnmatchTarget] = useState<{
    matchId: string;
    partner: DiscoveryProfileCard;
  } | null>(null);
  const [reportTarget, setReportTarget] =
    useState<DiscoveryProfileCard | null>(null);
  const [blockTarget, setBlockTarget] = useState<{
    matchId: string;
    partner: DiscoveryProfileCard;
  } | null>(null);

  useEffect(() => {
    setAppState(loadAppState());
    if (isSupabaseConfigured()) {
      void syncAppStateFromSupabase().then((synced) => {
        setAppState(synced);
      });
    }
    const handleStateUpdated = () => {
      setAppState(loadAppState());
    };
    window.addEventListener("haiyo-state-updated", handleStateUpdated);
    return () => {
      window.removeEventListener("haiyo-state-updated", handleStateUpdated);
    };
  }, []);

  if (!appState) return null;

  const activeMatches = appState.matches.filter(
    (m) =>
      m.status === "active" &&
      !appState.blockedUserIds.includes(m.partner.id)
  );

  const getMatchGroup = (
    isoDate: string
  ): "Hari ini" | "Kemarin" | "Sebelumnya" => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return "Hari ini";
    if (diffDays === 1) return "Kemarin";
    return "Sebelumnya";
  };

  const groups: Array<"Hari ini" | "Kemarin" | "Sebelumnya"> = [
    "Hari ini",
    "Kemarin",
    "Sebelumnya",
  ];

  const handleConfirmUnmatch = () => {
    if (!unmatchTarget) return;
    const fresh = loadAppState();
    const updated: LocalAppState = {
      ...fresh,
      matches: fresh.matches.map((m) =>
        m.id === unmatchTarget.matchId
          ? { ...m, status: "unmatched", unmatched_at: new Date().toISOString() }
          : m
      ),
    };
    saveAppState(updated);
    setAppState(updated);
    toast({
      title: `Match dengan ${unmatchTarget.partner.name} telah diakhiri.`,
      variant: "info",
    });
    setUnmatchTarget(null);
  };

  const handleConfirmBlock = () => {
    if (!blockTarget) return;
    const fresh = loadAppState();
    const updated: LocalAppState = {
      ...fresh,
      blockedUserIds: [...fresh.blockedUserIds, blockTarget.partner.id],
      matches: fresh.matches.map((m) =>
        m.id === blockTarget.matchId
          ? { ...m, status: "unmatched", unmatched_at: new Date().toISOString() }
          : m
      ),
    };
    saveAppState(updated);
    setAppState(updated);
    toast({
      title: "Pengguna berhasil diblokir.",
      variant: "info",
    });
    setBlockTarget(null);
  };

  return (
    <AppShell
      headerProps={{
        title: "Match Kamu",
        showBrand: false,
      }}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[24px] font-bold text-[#1d1d1d]">
              Match Kamu
            </h1>
            <p className="text-[14px] text-[#6F7078]">
              Klik foto atau nama untuk melihat profil lengkap, atau langsung
              mulai ngobrol.
            </p>
          </div>
          <Badge variant="primary">{activeMatches.length} Match</Badge>
        </div>

        {activeMatches.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title="Belum ada Match"
            description="Terus kenalan. Siapa tahu sebentar lagi ada yang cocok."
            actionLabel="Cari Orang Baru"
            onAction={() => router.push("/discover")}
          />
        ) : (
          <div className="space-y-6">
            {groups.map((groupName) => {
              const items = activeMatches.filter(
                (m) => getMatchGroup(m.matched_at) === groupName
              );
              if (items.length === 0) return null;

              return (
                <section key={groupName} className="space-y-3">
                  <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#6F7078] px-1">
                    {groupName}
                  </h2>

                  <div className="space-y-2.5">
                    {items.map((match) => {
                      const matchMessages = appState.messages.filter(
                        (msg) =>
                          msg.match_id === match.id &&
                          msg.content !== "[DELETED_IMG]" &&
                          msg.content !== "[DELETED_MSG]"
                      );
                      const lastMsg =
                        matchMessages[matchMessages.length - 1] ?? null;
                      const unreadCount = matchMessages.filter(
                        (msg) =>
                          !msg.is_read &&
                          msg.sender_id !== appState.currentUser?.id
                      ).length;

                      const primaryPhoto =
                        match.partner.photos.find((p) => p.is_primary)
                          ?.public_url ??
                        match.partner.photos[0]?.public_url;

                      return (
                        <div
                          key={match.id}
                          className="p-4 rounded-[20px] bg-white border border-[#E9E9EE] hover:border-[#267a50]/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex items-center justify-between gap-3 transition-all"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedMatch({
                                  matchId: match.id,
                                  partner: match.partner,
                                })
                              }
                              aria-label={`Lihat profil ${match.partner.name}`}
                              title={`Klik untuk melihat profil ${match.partner.name}`}
                              className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-[#267a50] transition-transform hover:scale-105 cursor-pointer"
                            >
                              <Avatar
                                name={match.partner.name}
                                src={primaryPhoto}
                                size="md"
                                isOnline
                              />
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedMatch({
                                      matchId: match.id,
                                      partner: match.partner,
                                    })
                                  }
                                  className="text-[16px] font-bold text-[#1d1d1d] hover:text-[#267a50] hover:underline truncate transition-colors text-left cursor-pointer"
                                >
                                  {match.partner.name}, {match.partner.age}
                                </button>
                                {match.partner.is_premium && <PremiumBadge />}
                              </div>
                              <Link
                                href={`/chat/${match.id}`}
                                className="block text-[13px] text-[#6F7078] hover:text-[#1d1d1d] truncate mt-0.5"
                              >
                                {lastMsg
                                  ? lastMsg.content === "[RECALLED_IMG]"
                                    ? "🚫 Gambar telah ditarik"
                                    : lastMsg.content === "[RECALLED_MSG]"
                                    ? "🚫 Pesan telah ditarik"
                                    : lastMsg.content.startsWith("[IMG]")
                                    ? "📷 Mengirim gambar"
                                    : lastMsg.content
                                  : "Kalian saling suka! Mulai sapa sekarang."}
                              </Link>
                            </div>
                          </div>

                          <Link
                            href={`/chat/${match.id}`}
                            aria-label={`Buka chat dengan ${match.partner.name}`}
                            className="flex flex-col items-end gap-1.5 shrink-0"
                          >
                            <span className="text-[11px] text-[#6F7078]">
                              {new Date(
                                lastMsg?.created_at ?? match.matched_at
                              ).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>

                            {unreadCount > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-[#267a50] text-white text-[11px] font-bold">
                                {unreadCount}
                              </span>
                            ) : (
                              <span className="w-8 h-8 rounded-full bg-[#eaf5ef] hover:bg-[#267a50] text-[#267a50] hover:text-white flex items-center justify-center transition-colors">
                                <MessageCircle className="w-4 h-4" />
                              </span>
                            )}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Matched Profile Card Sheet */}
      <ProfileDetailSheet
        profile={selectedMatch?.partner ?? null}
        isOpen={Boolean(selectedMatch)}
        onClose={() => setSelectedMatch(null)}
        isMatched={true}
        onMessage={() => {
          if (selectedMatch) {
            router.push(`/chat/${selectedMatch.matchId}`);
          }
        }}
        onUnmatch={() => {
          if (selectedMatch) {
            const target = selectedMatch;
            setSelectedMatch(null);
            setUnmatchTarget(target);
          }
        }}
        onReport={(p) => {
          setSelectedMatch(null);
          setReportTarget(p);
        }}
        onBlock={() => {
          if (selectedMatch) {
            const target = selectedMatch;
            setSelectedMatch(null);
            setBlockTarget(target);
          }
        }}
      />

      {unmatchTarget && (
        <UnmatchConfirmModal
          isOpen={Boolean(unmatchTarget)}
          onClose={() => setUnmatchTarget(null)}
          onConfirm={handleConfirmUnmatch}
          partnerName={unmatchTarget.partner.name}
        />
      )}

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
          targetUserName={blockTarget.partner.name}
        />
      )}
    </AppShell>
  );
}
