"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUp,
  Ban,
  CheckCheck,
  Flag,
  HeartOff,
  ImagePlus,
  Loader2,
  MoreHorizontal,
  RotateCcw,
  ShieldBan,
  Smile,
  Trash2,
  User,
  X,
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
  syncAppStateFromSupabase,
} from "@/lib/store/app-state";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  deleteStoragePhotoIfPresent,
  uploadCompressedProfilePhoto,
} from "@/lib/supabase/photo-storage";
import { MessageRecord } from "@/types/database";

const CHAT_EMOJIS = [
  "😊",
  "😂",
  "😍",
  "🥰",
  "😘",
  "🤩",
  "😎",
  "🤭",
  "🤗",
  "🥳",
  "🥺",
  "😭",
  "😅",
  "🙏",
  "👋",
  "👍",
  "👏",
  "🙌",
  "❤️",
  "💕",
  "💖",
  "🔥",
  "✨",
  "🌹",
  "☕",
  "🍜",
  "🎬",
  "🎵",
  "✈️",
  "📸",
  "🎉",
  "💯",
];

function parseImageMessage(content: string): {
  isImage: boolean;
  imageUrl: string;
  caption: string;
} {
  if (!content.startsWith("[IMG]")) {
    return { isImage: false, imageUrl: "", caption: content };
  }
  const body = content.slice(5).trim();
  const newlineIdx = body.indexOf("\n");
  if (newlineIdx === -1) {
    return { isImage: true, imageUrl: body, caption: "" };
  }
  return {
    isImage: true,
    imageUrl: body.slice(0, newlineIdx).trim(),
    caption: body.slice(newlineIdx + 1).trim(),
  };
}

export default function ChatRoomPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;
  const router = useRouter();
  const { toast } = useToast();

  const [appState, setAppState] = useState<LocalAppState | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(
    null
  );
  const [isSending, setIsSending] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  const [showSafetyMenu, setShowSafetyMenu] = useState(false);
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [isUnmatchOpen, setIsUnmatchOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const bottomEndRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const fetchAndMarkRoomMessages = useCallback(async () => {
    if (!isSupabaseConfigured() || !matchId) return;
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: msgRows } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      if (!Array.isArray(msgRows)) return;

      // Mark unread messages from partner as read in Supabase
      const unreadIds = msgRows
        .filter((m) => m.sender_id !== user.id && !m.is_read)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .in("id", unreadIds);

        await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("user_id", user.id)
          .eq("reference_id", matchId)
          .eq("is_read", false);
      }

      const normalizedRoomMsgs = (msgRows as MessageRecord[])
        .filter(
          (m) => m.content !== "[DELETED_IMG]" && m.content !== "[DELETED_MSG]"
        )
        .map((m) =>
          unreadIds.includes(m.id) ? { ...m, is_read: true } : m
        );

      const fresh = loadAppState();
      const otherMatchMsgs = fresh.messages.filter(
        (m) => m.match_id !== matchId
      );
      const updatedState: LocalAppState = {
        ...fresh,
        messages: [...otherMatchMsgs, ...normalizedRoomMsgs],
        notifications: fresh.notifications.map((n) =>
          n.reference_id === matchId ? { ...n, is_read: true } : n
        ),
      };
      saveAppState(updatedState);
      setAppState(updatedState);
    } catch {
      // non-blocking
    }
  }, [matchId]);

  useEffect(() => {
    const state = loadAppState();
    const updatedMessages = state.messages.map((m) =>
      m.match_id === matchId && m.sender_id !== state.currentUser?.id
        ? { ...m, is_read: true }
        : m
    );
    const updatedState = { ...state, messages: updatedMessages };
    saveAppState(updatedState);
    setAppState(updatedState);

    if (isSupabaseConfigured()) {
      void syncAppStateFromSupabase().then((synced) => {
        setAppState(synced);
        void fetchAndMarkRoomMessages();
      });
    }
  }, [matchId, fetchAndMarkRoomMessages]);

  // Subscribe to Supabase Realtime messages channel (INSERT + UPDATE) & fast poll fallback
  useEffect(() => {
    if (!isSupabaseConfigured() || !matchId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        () => {
          void fetchAndMarkRoomMessages();
        }
      )
      .subscribe();

    const pollInterval = window.setInterval(() => {
      void fetchAndMarkRoomMessages();
    }, 3500);

    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(pollInterval);
    };
  }, [matchId, fetchAndMarkRoomMessages]);

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
    (m) =>
      m.match_id === matchId &&
      m.content !== "[DELETED_IMG]" &&
      m.content !== "[DELETED_MSG]"
  );

  const handleSelectImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Format file tidak didukung",
        description: "Pilih file gambar (JPG, PNG, atau WebP).",
        variant: "error",
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingImageFile(file);
    setPendingImagePreview(previewUrl);
    setShowEmojiPicker(false);
  };

  const handleClearPendingImage = () => {
    if (pendingImagePreview) {
      URL.revokeObjectURL(pendingImagePreview);
    }
    setPendingImageFile(null);
    setPendingImagePreview(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = messageText.trim();
    if ((!trimmed && !pendingImageFile) || !isMatchActive || isSending) return;

    const myId = appState.currentUser!.id;
    setIsSending(true);
    setShowEmojiPicker(false);

    try {
      let finalContent = trimmed;

      if (pendingImageFile) {
        const uploaded = await uploadCompressedProfilePhoto(
          pendingImageFile,
          myId
        );
        if (uploaded.publicUrl.startsWith("data:")) {
          toast({
            title: "Gagal mengunggah gambar",
            description: "Pastikan koneksi internet kamu stabil lalu coba lagi.",
            variant: "error",
          });
          setIsSending(false);
          return;
        }
        finalContent = trimmed
          ? `[IMG]${uploaded.publicUrl}\n${trimmed}`
          : `[IMG]${uploaded.publicUrl}`;
        handleClearPendingImage();
      }

      setMessageText("");

      let insertedMsg: MessageRecord = {
        id: `msg-${Date.now()}`,
        match_id: matchId,
        sender_id: myId,
        content: finalContent,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { data: dbRow, error } = await supabase
          .from("messages")
          .insert({
            match_id: matchId,
            sender_id: myId,
            content: finalContent,
          })
          .select("*")
          .single();

        if (error) {
          toast({
            title: "Pesan gagal terkirim",
            description: error.message,
            variant: "error",
          });
          setIsSending(false);
          return;
        }
        if (dbRow) {
          insertedMsg = dbRow as MessageRecord;
        }
      }

      const fresh = loadAppState();
      const exists = fresh.messages.some((m) => m.id === insertedMsg.id);
      const updated: LocalAppState = {
        ...fresh,
        messages: exists ? fresh.messages : [...fresh.messages, insertedMsg],
      };
      saveAppState(updated);
      setAppState(updated);
    } finally {
      setIsSending(false);
    }
  };

  const handleRecallImage = async (msg: MessageRecord, imageUrl: string) => {
    try {
      await deleteStoragePhotoIfPresent(imageUrl);

      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase
          .from("messages")
          .update({ content: "[RECALLED_IMG]" })
          .eq("id", msg.id);
      }

      const fresh = loadAppState();
      const updated: LocalAppState = {
        ...fresh,
        messages: fresh.messages.map((m) =>
          m.id === msg.id ? { ...m, content: "[RECALLED_IMG]" } : m
        ),
      };
      saveAppState(updated);
      setAppState(updated);
      toast({
        title: "Gambar berhasil ditarik",
        description: "Gambar telah ditarik dari percakapan untuk kedua pihak.",
        variant: "info",
      });
    } catch {
      toast({
        title: "Gagal menarik gambar",
        variant: "error",
      });
    }
  };

  const handleDeleteImage = async (msg: MessageRecord, imageUrl: string) => {
    try {
      await deleteStoragePhotoIfPresent(imageUrl);

      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase
          .from("messages")
          .update({ content: "[DELETED_IMG]" })
          .eq("id", msg.id);
        await supabase.from("messages").delete().eq("id", msg.id);
      }

      const fresh = loadAppState();
      const updated: LocalAppState = {
        ...fresh,
        messages: fresh.messages.filter((m) => m.id !== msg.id),
      };
      saveAppState(updated);
      setAppState(updated);
      toast({
        title: "Gambar berhasil dihapus",
        description: "Gambar telah dihapus permanen dari ruang chat.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Gagal menghapus gambar",
        variant: "error",
      });
    }
  };

  const handleRecallTextMessage = async (msg: MessageRecord) => {
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase
          .from("messages")
          .update({ content: "[RECALLED_MSG]" })
          .eq("id", msg.id);
      }

      const fresh = loadAppState();
      const updated: LocalAppState = {
        ...fresh,
        messages: fresh.messages.map((m) =>
          m.id === msg.id ? { ...m, content: "[RECALLED_MSG]" } : m
        ),
      };
      saveAppState(updated);
      setAppState(updated);
      toast({
        title: "Pesan berhasil ditarik",
        description: "Pesan telah ditarik dari percakapan untuk kedua pihak.",
        variant: "info",
      });
    } catch {
      toast({
        title: "Gagal menarik pesan",
        variant: "error",
      });
    }
  };

  const handleDeleteTextMessage = async (msg: MessageRecord) => {
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase
          .from("messages")
          .update({ content: "[DELETED_MSG]" })
          .eq("id", msg.id);
        await supabase.from("messages").delete().eq("id", msg.id);
      }

      const fresh = loadAppState();
      const updated: LocalAppState = {
        ...fresh,
        messages: fresh.messages.filter((m) => m.id !== msg.id),
      };
      saveAppState(updated);
      setAppState(updated);
      toast({
        title: "Pesan berhasil dihapus",
        description: "Pesan telah dihapus dari ruang chat.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Gagal menghapus pesan",
        variant: "error",
      });
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
          const isRecalledImg = msg.content === "[RECALLED_IMG]";
          const isRecalledMsg = msg.content === "[RECALLED_MSG]";
          const parsedImg = parseImageMessage(msg.content);

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                isMe ? "items-end" : "items-start"
              }`}
            >
              {isRecalledImg || isRecalledMsg ? (
                <div
                  className={`max-w-[78%] px-4 py-2.5 rounded-[18px] text-[13.5px] italic flex items-center gap-2 border ${
                    isMe
                      ? "bg-[#f2f7f4] text-[#6F7078] border-[#267a50]/20 rounded-br-[4px]"
                      : "bg-white text-[#6F7078] border-[#E9E9EE] rounded-bl-[4px]"
                  }`}
                >
                  <Ban className="w-4 h-4 shrink-0 text-[#8C8D96]" />
                  <span>
                    {isRecalledImg
                      ? "Gambar telah ditarik"
                      : "Pesan telah ditarik"}
                  </span>
                </div>
              ) : parsedImg.isImage ? (
                <div
                  className={`max-w-[78%] sm:max-w-[300px] p-2 rounded-[20px] space-y-2 ${
                    isMe
                      ? "bg-[#267a50] text-white rounded-br-[4px] shadow-sm"
                      : "bg-white border border-[#E9E9EE] text-[#1d1d1d] rounded-bl-[4px] shadow-sm"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setZoomedImageUrl(parsedImg.imageUrl)}
                    className="block w-full overflow-hidden rounded-[14px] bg-black/5 cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={parsedImg.imageUrl}
                      alt="Foto percakapan"
                      className="w-full max-h-[280px] object-cover hover:opacity-95 transition-opacity"
                    />
                  </button>

                  {parsedImg.caption && (
                    <p className="px-2 pb-1 text-[14.5px] leading-relaxed break-words">
                      {parsedImg.caption}
                    </p>
                  )}

                  {isMe && (
                    <div className="flex items-center justify-end gap-1.5 pt-1 px-1 border-t border-white/15">
                      <button
                        type="button"
                        onClick={() =>
                          handleRecallImage(msg, parsedImg.imageUrl)
                        }
                        title="Tarik kembali gambar untuk semua orang"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Tarik</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteImage(msg, parsedImg.imageUrl)
                        }
                        title="Hapus gambar dari room chat"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/25 hover:bg-[#EF4444] text-white text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`max-w-[78%] px-4 py-3 rounded-[18px] text-[15px] leading-relaxed break-words space-y-2 ${
                    isMe
                      ? "bg-[#267a50] text-white rounded-br-[4px] shadow-sm"
                      : "bg-[#E9E9EE]/75 text-[#1d1d1d] rounded-bl-[4px]"
                  }`}
                >
                  <p>{msg.content}</p>

                  {isMe && (
                    <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-white/15">
                      <button
                        type="button"
                        onClick={() => handleRecallTextMessage(msg)}
                        title="Tarik kembali pesan untuk semua orang"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-[10.5px] font-semibold transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Tarik</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTextMessage(msg)}
                        title="Hapus pesan dari room chat"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/25 hover:bg-[#EF4444] text-white text-[10.5px] font-semibold transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

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
      <footer className="sticky bottom-0 bg-white border-t border-[#E9E9EE] p-3 pb-safe z-20">
        {isMatchActive ? (
          <div className="max-w-2xl mx-auto space-y-2.5">
            {/* Pending Image Preview Bar */}
            {pendingImagePreview && (
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-[16px] bg-[#eaf5ef] border border-[#267a50]/25">
                <div className="flex items-center gap-3 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pendingImagePreview}
                    alt="Preview gambar"
                    className="w-12 h-12 rounded-[10px] object-cover border border-white shadow-sm shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#1d1d1d] truncate">
                      Gambar siap dikirim
                    </p>
                    <p className="text-[11.5px] text-[#6F7078] truncate">
                      Klik tombol panah hijau untuk mengirim foto
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearPendingImage}
                  aria-label="Batalkan gambar"
                  className="w-8 h-8 rounded-full bg-white hover:bg-[#EF4444]/10 text-[#6F7078] hover:text-[#EF4444] flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Emoji Picker Tray */}
            {showEmojiPicker && (
              <div className="p-3 rounded-[20px] bg-white border border-[#E9E9EE] shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E9E9EE]">
                  <span className="text-[12px] font-bold text-[#6F7078]">
                    Pilih Emoticon
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-[12px] font-semibold text-[#267a50] hover:underline cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
                <div className="grid grid-cols-8 gap-1.5 max-h-40 overflow-y-auto">
                  {CHAT_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setMessageText((prev) => prev + emoji)}
                      className="h-9 rounded-[10px] hover:bg-[#eaf5ef] active:scale-95 flex items-center justify-center text-[20px] transition-all cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2"
            >
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleSelectImageFile}
                className="hidden"
              />

              {/* Emoji Button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                aria-label="Pilih emoticon"
                title="Emoticon"
                className={`w-11 h-11 rounded-full border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                  showEmojiPicker
                    ? "bg-[#eaf5ef] border-[#267a50] text-[#267a50]"
                    : "bg-[#f9f9fa] border-[#E9E9EE] text-[#6F7078] hover:text-[#267a50]"
                }`}
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Image Upload Button */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                aria-label="Kirim gambar"
                title="Kirim gambar"
                className={`w-11 h-11 rounded-full border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                  pendingImageFile
                    ? "bg-[#eaf5ef] border-[#267a50] text-[#267a50]"
                    : "bg-[#f9f9fa] border-[#E9E9EE] text-[#6F7078] hover:text-[#267a50]"
                }`}
              >
                <ImagePlus className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={
                  pendingImageFile
                    ? "Tambah keterangan foto (opsional)..."
                    : "Tulis pesan..."
                }
                className="flex-1 min-w-0 h-12 rounded-full bg-[#f9f9fa] border border-[#E9E9EE] px-4 text-[15px] text-[#1d1d1d] placeholder:text-[#A0A0A8] focus:outline-none focus:border-[#267a50]"
              />

              <button
                type="submit"
                disabled={(!messageText.trim() && !pendingImageFile) || isSending}
                aria-label="Kirim pesan"
                className="w-12 h-12 rounded-full bg-[#267a50] hover:bg-[#1e6340] text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-45 cursor-pointer shrink-0"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto py-2 text-center text-[13px] text-[#6F7078]">
            Percakapan ini telah berakhir karena status Match sudah tidak aktif.
          </div>
        )}
      </footer>

      {/* Fullscreen Lightbox for Chat Image */}
      {zoomedImageUrl && (
        <div
          onClick={() => setZoomedImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={() => setZoomedImageUrl(null)}
            aria-label="Tutup pratinjau foto"
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomedImageUrl}
            alt="Foto ukuran penuh"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[88dvh] rounded-[16px] object-contain shadow-2xl"
          />
        </div>
      )}

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

