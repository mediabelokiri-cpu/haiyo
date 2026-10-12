"use client";

import React from "react";
import { Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { DiscoveryProfileCard } from "@/types/database";

export interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: () => void;
  myName: string;
  myPhotoUrl: string;
  partner: DiscoveryProfileCard | null;
}

export function MatchModal({
  isOpen,
  onClose,
  onSendMessage,
  myName,
  myPhotoUrl,
  partner,
}: MatchModalProps) {
  if (!isOpen || !partner) return null;

  const partnerPhoto =
    partner.photos.find((p) => p.is_primary)?.public_url ??
    partner.photos[0]?.public_url ??
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="It's a Match!"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1d1d1d]/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-[400px] rounded-[28px] bg-white p-7 text-center text-[#1d1d1d] shadow-[0_20px_50px_rgba(0,0,0,0.25)] space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#eaf5ef] text-[#267a50] text-[12px] font-bold tracking-wide">
          <Heart className="w-3.5 h-3.5 fill-[#267a50]" />
          <span>Wah, kalian saling suka!</span>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-[30px] font-extrabold tracking-tight leading-tight text-[#1d1d1d]">
            IT&apos;S A MATCH!
          </h2>
          <p className="text-[15px] text-[#6F7078]">
            Kamu dan <span className="font-bold text-[#1d1d1d]">{partner.name}</span>{" "}
            saling menyukai.
          </p>
        </div>

        <div className="relative flex items-center justify-center py-3">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg -mr-4 -rotate-6 bg-[#eaf5ef]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={myPhotoUrl}
              alt={myName}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="z-10 w-12 h-12 rounded-full bg-[#267a50] text-white shadow-lg flex items-center justify-center">
            <Heart className="w-6 h-6 fill-white" />
          </div>

          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg -ml-4 rotate-6 bg-[#eaf5ef]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={partnerPhoto}
              alt={partner.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onSendMessage}
            leftIcon={<MessageCircle className="w-5 h-5" />}
          >
            Kirim Pesan
          </Button>

          <Button variant="secondary" size="lg" fullWidth onClick={onClose}>
            Lanjut Cari
          </Button>
        </div>
      </div>
    </div>
  );
}
