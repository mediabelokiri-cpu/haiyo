"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUp,
  CheckCheck,
  Flag,
  HeartOff,
  MoreHorizontal,
  ShieldBan,
  User,
} from "lucide-react";
import { Avatar, Button, useToast } from "@/components/ui";
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
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { MessageRecord } from "@/types/database";

/**
 * Realtime Chat Screen (/chat/[matchId]) per UI/UX Sections 39, 41 & 86:
 * - Header: Back, Clickable Avatar & Name (opens ProfileDetailSheet), Online status, More button (⋯)
 * - Top-right Safety Menu: Lihat Profil, Unmatch, Block, Report
 * - Body: Message bubbles (User message: Primary pink #267a50, Other message: Light gray)
 * - Composer: Input "Tulis pesan...", Send button (Arrow icon)
 * - Rule: Only active matches can chat.
 */
export default function ChatRoomPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;
  const router = useRouter();
  const { toast } = useToast();

  const [appState, setAppState] = useState<LocalAppState | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showSafetyMenu, setShowSafetyMenu] = useState(false);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [isUnmatchOpen, setIsUnmatchOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const bottomEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const state = loadAppState();
    // Mark incoming messages in this match as read
    const updatedMessages = state.messages.map((m) =>
      m.match_id === matchId && m.sender_id !== state.currentUser?.id
        ? { ...m, is_read: true }
        : m
    );
    const updatedState = { ...state, messages: updatedMessages };
    saveAppState(updatedState);
    setAppState(updatedState);
  }, [matchId]);

  // Subscribe to Supabase Realtime messages channel when configured
  useEffect(() => {
    if (!isSupabaseConfigured() || !matchId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const incoming = payload.new as MessageRecord;
          setAppState((prev) => {
            if (!prev) return prev;
            if (prev.messages.some((m) => m.id === incoming.id)) return prev;
            const next = {
              ...prev,
              messages: [...prev.messages, incoming],
            };
            saveAppState(next);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  useEffect(() => {
    bottomEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [appState?.messages.length]);

  if (!appState || !appState.currentUser) return null;

  const match = appState.matches.find((m) => m.id === matchId);
  if (!match) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-[#f9f9fa] text-center space-y-4">
        <h1 className="text-[20px] font-bold">Percakapan tidak ditemukan</h1>
        <p className="text-[14px] text-[#6F7078]">
          Match ini mungkin sudah berakhir atau tidak tersedia.
        </p>
        <Link href="/matches">
          <Button variant="primary">Kembali ke Match</Button>
        </Link>
      </div>
    );
  }

  const isMatchActive =
    match.status === "active" &&
    !appState.blockedUserIds.includes(match.partner.id);
  const partner = match.partner;
  const partnerPhoto =
    partner.photos.find((p) => p.is_primary)?.public_url ??
    partner.photos[0]?.public_url;

  const conversationMessages = appState.messages.filter(
    (m) => m.match_id === matchId
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed || !isMatchActive) return;

    const myId = appState.currentUser!.id;
    const newMsg: MessageRecord = {
      id: `msg-${Date.now()}`,
      match_id: matchId,
      sender_id: myId,
      content: trimmed,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessageText("");

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.from("messages").insert({
        match_id: matchId,
        sender_id: myId,
        content: trimmed,
      });
    }

    const fresh = loadAppState();
    const updated: LocalAppState = {
      ...fresh,
      messages: [...fresh.messages, newMsg],
    };
    saveAppState(updated);
    setAppState(updated);

    // Friendly simulated reply in local demo mode if this is the first message
    if (!isSupabaseConfigured() && conversationMessages.length === 0) {
      setTimeout(() => {
        const latest = loadAppState();
        const currentMatch = latest.matches.find((m) => m.id === matchId);
        if (!currentMatch || currentMatch.status !== "active") return;

        const replyMsg: MessageRecord = {
          id: `msg-reply-${Date.now()}`,
          match_id: matchId,
          sender_id: partner.id,
          content: `Hai ${latest.currentUser?.profile.name}! Senang bisa Match sama kamu di HAIYO. Lagi sibuk apa hari ini?`,
          is_read: true,
          created_at: new Date().toISOString(),
        };
        const withReply: LocalAppState = {
          ...latest,
          messages: [...latest.messages, replyMsg],
        };
        saveAppState(withReply);
        setAppState(withReply);
      }, 1200);
    }
  };

  const handleConfirmUnmatch = async () => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase
        .from("matches")
        .update({ status: "unmatched", unmatched_at: new Date().toISOString() })
        .eq("id", matchId);
    }

    const fresh = loadAppState();
    const updated: LocalAppState = {
      ...fresh,
      matches: fresh.matches.map((m) =>
        m.id === matchId
          ? { ...m, status: "unmatched", unmatched_at: new Date().toISOString() }
          : m
      ),
    };
    saveAppState(updated);
    setAppState(updated);
    setIsUnmatchOpen(false);
    toast({
      title: `Match dengan ${partner.name} telah diakhiri.`,
      variant: "info",
    });
    router.push("/matches");
  };

  const handleConfirmBlock = async () => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("blocks").insert({
          blocker_id: user.id,
          blocked_id: partner.id,
        });
      }
    }

    const fresh = loadAppState();
    const updated: LocalAppState = {
      ...fresh,
      blockedUserIds: [...fresh.blockedUserIds, partner.id],
      matches: fresh.matches.map((m) =>
        m.id === matchId
          ? { ...m, status: "unmatched", unmatched_at: new Date().toISOString() }
          : m
      ),
    };
    saveAppState(updated);
    setAppState(updated);
    setIsBlockOpen(false);
    toast({
      title: "Pengguna berhasil diblokir.",
      variant: "info",
    });
    router.push("/chat");
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#f9f9fa] text-[#1d1d1d]">
      {/* Chat Header (UI/UX Section 39 & 41) */}
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E9E9EE] px-4 flex items-center justify-between pt-safe">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/chat"
            aria-label="Kembali ke daftar chat"
            className="w-10 h-10 rounded-full hover:bg-[#f9f9fa] flex items-center justify-center text-[#1d1d1d] shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <button
            type="button"
            onClick={() => setIsProfileSheetOpen(true)}
            aria-label={`Lihat profil ${partner.name}`}
            title={`Klik untuk melihat profil ${partner.name}`}
            className="flex items-center gap-3 min-w-0 px-2 py-1 rounded-[14px] hover:bg-[#eaf5ef] transition-colors text-left group cursor-pointer"
          >
            <Avatar name={partner.name} src={partnerPhoto} size="sm" isOnline />

            <div className="min-w-0">
              <h1 className="text-[16px] font-bold text-[#1d1d1d] truncate group-hover:text-[#267a50] transition-colors">
                {partner.name}, {partner.age}
              </h1>
              <p className="text-[12px] text-[#22C55E] font-medium">
                Online · {partner.city}
              </p>
            </div>
          </button>
        </div>

        {/* Top-Right ⋯ Safety Menu (UI/UX Section 41) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSafetyMenu((prev) => !prev)}
            aria-label="Menu keamanan percakapan"
            className="w-10 h-10 rounded-full border border-[#E9E9EE] bg-white hover:bg-[#f9f9fa] flex items-center justify-center text-[#1d1d1d] cursor-pointer"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showSafetyMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-[16px] bg-white border border-[#E9E9EE] shadow-[0_8px_24px_rgba(0,0,0,0.12)] py-1.5 text-[14px] z-40">
              <button
                type="button"
                onClick={() => {
                  setShowSafetyMenu(false);
                  setIsProfileSheetOpen(true);
                }}
                className="w-full px-4 py-2.5 text-left flex items-center gap-2.5 hover:bg-[#f9f9fa] cursor-pointer"
              >
                <User className="w-4 h-4 text-[#267a50]" />
                <span>Lihat Profil</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSafetyMenu(false);
                  setIsUnmatchOpen(true);
                }}
                className="w-full px-4 py-2.5 text-left flex items-center gap-2.5 hover:bg-[#f9f9fa] cursor-pointer"
              >
                <HeartOff className="w-4 h-4 text-[#6F7078]" />
                <span>Unmatch</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSafetyMenu(false);
                  setIsReportOpen(true);
                }}
                className="w-full px-4 py-2.5 text-left flex items-center gap-2.5 hover:bg-[#f9f9fa] cursor-pointer"
              >
                <Flag className="w-4 h-4 text-[#F59E0B]" />
                <span>Report</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSafetyMenu(false);
                  setIsBlockOpen(true);
                }}
                className="w-full px-4 py-2.5 text-left flex items-center gap-2.5 text-[#EF4444] hover:bg-[#EF4444]/10 cursor-pointer"
              >
                <ShieldBan className="w-4 h-4" />
                <span>Block</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Messages Body */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 overflow-y-auto space-y-3">
        <div className="text-center py-3">
          <button
            type="button"
            onClick={() => setIsProfileSheetOpen(true)}
            className="inline-block px-3.5 py-1 rounded-full bg-white hover:bg-[#eaf5ef] border border-[#E9E9EE] text-[12px] text-[#6F7078] hover:text-[#267a50] transition-colors cursor-pointer"
          >
            Kalian saling suka! Klik untuk lihat profil {partner.name}
          </button>
        </div>

        {conversationMessages.map((msg) => {
          const isMe = msg.sender_id === appState.currentUser?.id;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                isMe ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[78%] px-4 py-3 rounded-[18px] text-[15px] leading-relaxed ${
                  isMe
                    ? "bg-[#267a50] text-white rounded-br-[4px] shadow-sm"
                    : "bg-[#E9E9EE]/75 text-[#1d1d1d] rounded-bl-[4px]"
                }`}
              >
                <p>{msg.content}</p>
              </div>
              <div className="flex items-center gap-1 mt-1 px-1 text-[11px] text-[#6F7078]">
                <span>
                  {new Date(msg.created_at).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {isMe && (
                  <CheckCheck
                    className={`w-3.5 h-3.5 ${
                      msg.is_read ? "text-[#267a50]" : "text-[#A0A0A8]"
                    }`}
                  />
                )}
              </div>
            </div>
          );
        })}

        <div ref={bottomEndRef} />
      </main>

      {/* Message Composer (Only active matches can chat per PRD Section 20 & 21) */}
      <footer className="sticky bottom-0 bg-white border-t border-[#E9E9EE] p-3 pb-safe">
        {isMatchActive ? (
          <form
            onSubmit={handleSendMessage}
            className="max-w-2xl mx-auto flex items-center gap-2.5"
          >
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Tulis pesan..."
              className="flex-1 h-12 rounded-full bg-[#f9f9fa] border border-[#E9E9EE] px-5 text-[15px] text-[#1d1d1d] placeholder:text-[#A0A0A8] focus:outline-none focus:border-[#267a50]"
            />
            <button
              type="submit"
              disabled={!messageText.trim()}
              aria-label="Kirim pesan"
              className="w-12 h-12 rounded-full bg-[#267a50] hover:bg-[#1e6340] text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-45 cursor-pointer shrink-0"
            >
              <ArrowUp className="w-5 h-5 stroke-[2.5]" />
            </button>
          </form>
        ) : (
          <div className="max-w-2xl mx-auto py-2 text-center text-[13px] text-[#6F7078]">
            Percakapan ini telah berakhir karena status Match sudah tidak aktif.
          </div>
        )}
      </footer>

      {/* Matched Partner Profile Detail Sheet */}
      <ProfileDetailSheet
        profile={partner}
        isOpen={isProfileSheetOpen}
        onClose={() => setIsProfileSheetOpen(false)}
        isMatched={true}
        onUnmatch={() => {
          setIsProfileSheetOpen(false);
          setIsUnmatchOpen(true);
        }}
        onReport={() => {
          setIsProfileSheetOpen(false);
          setIsReportOpen(true);
        }}
        onBlock={() => {
          setIsProfileSheetOpen(false);
          setIsBlockOpen(true);
        }}
      />

      {/* Safety Modals */}
      <UnmatchConfirmModal
        isOpen={isUnmatchOpen}
        onClose={() => setIsUnmatchOpen(false)}
        onConfirm={handleConfirmUnmatch}
        partnerName={partner.name}
      />

      <BlockConfirmModal
        isOpen={isBlockOpen}
        onClose={() => setIsBlockOpen(false)}
        onConfirm={handleConfirmBlock}
        targetUserName={partner.name}
      />

      <ReportBottomSheet
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetUserId={partner.id}
        targetUserName={partner.name}
      />
    </div>
  );
}
