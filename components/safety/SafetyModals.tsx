"use client";

import React, { useState } from "react";
import { Check, ShieldAlert } from "lucide-react";
import {
  BottomSheet,
  Button,
  Modal,
  Radio,
  Textarea,
  useToast,
} from "@/components/ui";
import { ReportReason } from "@/types/database";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { loadAppState, saveAppState } from "@/lib/store/app-state";

const REPORT_REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: "fake_account", label: "Fake Account (Akun Palsu)" },
  { value: "harassment", label: "Harassment (Pelecehan)" },
  { value: "spam", label: "Spam" },
  { value: "scam", label: "Scam (Penipuan)" },
  { value: "inappropriate_content", label: "Inappropriate Content (Konten Tidak Pantas)" },
  { value: "sexual_content", label: "Sexual Content (Konten Seksual)" },
  { value: "other", label: "Other (Lainnya)" },
];

export interface ReportBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
}

/**
 * Report Flow & Report Success per UI/UX Sections 46 & 47.
 */
export function ReportBottomSheet({
  isOpen,
  onClose,
  targetUserId,
  targetUserName,
}: ReportBottomSheetProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState<ReportReason>("fake_account");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setReason("fake_account");
    setDescription("");
    onClose();
  };

  const handleSubmitReport = async () => {
    setIsSubmitting(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("reports").insert({
            reporter_id: user.id,
            reported_user_id: targetUserId,
            reason,
            description: description.trim() || null,
            status: "pending",
          });
          await supabase.from("analytics_events").insert({
            user_id: user.id,
            event_name: "report_created",
            metadata: { reported_user_id: targetUserId, reason },
          });
        }
      }

      const state = loadAppState();
      const newReport = {
        id: `rep-${Date.now()}`,
        reporter_id: state.currentUser?.id ?? "user-me",
        reported_user_id: targetUserId,
        reason,
        description: description.trim() || null,
        status: "pending" as const,
        reviewed_by: null,
        reviewed_at: null,
        created_at: new Date().toISOString(),
      };
      saveAppState({
        ...state,
        reports: [newReport, ...state.reports],
      });

      setIsSubmitted(true);
      toast({
        title: "Laporan berhasil dikirim.",
        variant: "success",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title={isSubmitted ? "Laporan terkirim" : `Laporkan ${targetUserName}`}
      description={
        isSubmitted
          ? undefined
          : "Bantu kami menjaga HAIYO tetap aman."
      }
    >
      {isSubmitted ? (
        /* Report Success Screen (UI/UX Section 47) */
        <div className="py-6 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-[#22C55E]/15 text-[#22C55E] flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-[20px] font-bold text-[#1d1d1d]">
              Laporan terkirim
            </h3>
            <p className="text-[14px] text-[#6F7078] max-w-xs mx-auto">
              Terima kasih. Tim HAIYO akan meninjau laporan ini.
            </p>
          </div>
          <Button variant="primary" fullWidth onClick={handleResetAndClose}>
            Selesai
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {REPORT_REASONS.map((item) => (
              <Radio
                key={item.value}
                name="report_reason"
                checked={reason === item.value}
                onChange={() => setReason(item.value)}
                label={item.label}
              />
            ))}
          </div>

          {reason === "other" && (
            <Textarea
              label="Ceritakan detail laporanmu"
              placeholder="Tuliskan alasan mengapa kamu melaporkan profil ini..."
              maxLength={500}
              showCount
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          )}

          <div className="pt-2">
            <Button
              variant="primary"
              fullWidth
              isLoading={isSubmitting}
              onClick={handleSubmitReport}
            >
              Kirim Laporan
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

/**
 * Unmatch Confirmation Modal per UI/UX Section 41:
 * Heading: "Hapus Match?"
 * Text: "Percakapan ini akan berakhir dan kalian tidak bisa melanjutkan chat."
 */
export function UnmatchConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  partnerName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  partnerName: string;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hapus Match?"
      description={`Percakapan dengan ${partnerName} akan berakhir dan kalian tidak bisa melanjutkan chat.`}
    >
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Unmatch
        </Button>
      </div>
    </Modal>
  );
}

/**
 * Block User Confirmation Modal per UI/UX Section 22 & 75.
 */
export function BlockConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  targetUserName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetUserName: string;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Blokir ${targetUserName}?`}
      description={`${targetUserName} tidak akan muncul lagi di Discover kamu, dan percakapan aktif akan dihentikan.`}
    >
      <div className="flex items-center gap-3 p-3.5 rounded-[14px] bg-[#f9f9fa] border border-[#E9E9EE] text-[13px] text-[#6F7078] mb-4">
        <ShieldAlert className="w-5 h-5 text-[#EF4444] shrink-0" />
        <span>
          Kamu dapat membuka blokir kapan saja melalui menu Pengaturan →
          Pengguna yang Diblokir.
        </span>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Blokir Pengguna
        </Button>
      </div>
    </Modal>
  );
}
