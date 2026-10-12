"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import {
  AppShell,
  Avatar,
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
} from "@/lib/store/app-state";
import { DiscoveryProfileCard } from "@/types/database";

/**
 * Chat List Page (/chat) per UI/UX Sections 38 & 40:
 * - Heading: "Chat"
 * - Each conversation: Clickable Avatar & Name (opens ProfileDetailSheet), Last message, Time, Unread badge, Premium badge
 * - Empty State: "Belum ada percakapan" -> "Match dulu, lalu mulai ngobrol." -> CTA: "Cari Match"
 */
export default function ChatListPage() {
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
  }, []);

  if (!appState) return null;

  const activeMatches = appState.matches.filter(
    (m) =>
      m.status === "active" &&
      !appState.blockedUserIds.includes(m.partner.id)
  );

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
        title: "Chat",
        showBrand: false,
      }}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-[24px] font-bold text-[#1d1d1d]">Chat</h1>
          <p className="text-[14px] text-[#6F7078]">
            Klik foto atau nama untuk melihat profil Match kamu, atau klik pesan
            untuk lanjut ngobrol.
          </p>
        </div>

        {activeMatches.length === 0 ? (
          <EmptyState
            icon={<MessageCircle className="w-8 h-8" />}
            title="Belum ada percakapan"
            description="Match dulu, lalu mulai ngobrol."
            actionLabel="Cari Match"
            onAction={() => router.push("/discover")}
          />
        ) : (
          <div className="space-y-2.5">
            {activeMatches.map((match) => {
              const msgs = appState.messages.filter(
                (m) => m.match_id === match.id
              );
              const lastMsg = msgs[msgs.length - 1] ?? null;
              const unreadCount = msgs.filter(
                (m) => !m.is_read && m.sender_id !== appState.currentUser?.id
              ).length;
              const photo =
                match.partner.photos.find((p) => p.is_primary)?.public_url ??
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
                        src={photo}
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
                        className="block text-[14px] text-[#6F7078] hover:text-[#1d1d1d] truncate mt-0.5"
                      >
                        {lastMsg ? lastMsg.content : "Saatnya mulai kenalan"}
                      </Link>
                    </div>
                  </div>

                  <Link
                    href={`/chat/${match.id}`}
                    aria-label={`Buka chat dengan ${match.partner.name}`}
                    className="flex flex-col items-end gap-1.5 shrink-0"
                  >
                    <span className="text-[12px] text-[#6F7078]">
                      {new Date(
                        lastMsg?.created_at ?? match.matched_at
                      ).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {unreadCount > 0 ? (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#267a50] text-white text-[11px] font-bold flex items-center justify-center">
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
