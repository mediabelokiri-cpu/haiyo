"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  HeartOff,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  ShieldBan,
} from "lucide-react";
import {
  BottomSheet,
  Button,
  InterestChip,
  LikeButton,
  PassButton,
  PremiumBadge,
} from "@/components/ui";
import { DiscoveryProfileCard } from "@/types/database";

export interface ProfileDetailSheetProps {
  profile: DiscoveryProfileCard | null;
  isOpen: boolean;
  onClose: () => void;
  onLike?: (profile: DiscoveryProfileCard) => void;
  onPass?: (profile: DiscoveryProfileCard) => void;
  onReport?: (profile: DiscoveryProfileCard) => void;
  onBlock?: (profile: DiscoveryProfileCard) => void;
  isMatched?: boolean;
  onMessage?: (profile: DiscoveryProfileCard) => void;
  onUnmatch?: (profile: DiscoveryProfileCard) => void;
}

/**
 * Full Profile Detail Sheet per UI/UX Section 32 & 75:
 * - Multi-photo carousel + thumbnail strip
 * - Name, Age, City, Approximate distance (Never exact GPS/email/phone)
 * - Bio & Interests
 * - Supports both Discovery mode (Pass & Like) and Matched mode (Buka Chat / Unmatch)
 * - Top-right ⋯ Safety menu (Unmatch, Report & Block)
 */
export function ProfileDetailSheet({
  profile,
  isOpen,
  onClose,
  onLike,
  onPass,
  onReport,
  onBlock,
  isMatched = false,
  onMessage,
  onUnmatch,
}: ProfileDetailSheetProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showSafetyMenu, setShowSafetyMenu] = useState(false);

  useEffect(() => {
    setPhotoIndex(0);
    setShowSafetyMenu(false);
  }, [profile?.id, isOpen]);

  if (!profile) return null;

  const photos =
    profile.photos.length > 0
      ? profile.photos
      : [
          {
            id: "default",
            storage_path: "",
            public_url:
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80",
            is_primary: true,
            display_order: 1,
          },
        ];

  const safeIndex = photoIndex % photos.length;
  const activePhoto = photos[safeIndex];
  const hasSafetyActions = Boolean(onReport || onBlock || onUnmatch);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => {
        setShowSafetyMenu(false);
        setPhotoIndex(0);
        onClose();
      }}
      title={`${profile.name}, ${profile.age}${profile.is_online ? " 🟢" : ""}`}
      description={`${
        profile.is_online ? "Online di " : "Lokasi aktif: "
      }${profile.city}${
        profile.approx_distance_km
          ? ` · ±${profile.approx_distance_km} km away`
          : ""
      }`}
    >
      <div className="space-y-4">
        {/* Photo Carousel with Top-Right Safety Menu */}
        <div className="relative rounded-[20px] overflow-hidden aspect-[3/4] bg-[#1d1d1d] select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activePhoto.public_url}
            alt={`${profile.name} foto ${safeIndex + 1}`}
            className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-200"
          />

          {/* Photo Progress Bars (Clickable) */}
          {photos.length > 1 && (
            <div className="absolute top-3 inset-x-3 z-10 flex gap-1.5">
              {photos.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPhotoIndex(idx)}
                  aria-label={`Lihat foto ${idx + 1}`}
                  className={`h-1.5 flex-1 rounded-full transition-all cursor-pointer ${
                    idx === safeIndex
                      ? "bg-white shadow-sm"
                      : "bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Photo Counter Pill */}
          {photos.length > 1 && (
            <div className="absolute top-6 left-3 z-10 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-sm text-white text-[11px] font-bold">
              {safeIndex + 1} / {photos.length} Foto
            </div>
          )}

          {/* Top-Right ⋯ Safety Menu (UI/UX Section 32 & 75) */}
          {hasSafetyActions && (
            <div className="absolute top-6 right-3 z-20">
              <button
                type="button"
                onClick={() => setShowSafetyMenu((prev) => !prev)}
                aria-label="Menu keamanan profil"
                className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/65 transition-colors cursor-pointer"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {showSafetyMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-[16px] bg-white border border-[#E9E9EE] shadow-[0_8px_24px_rgba(0,0,0,0.14)] py-1.5 text-[14px] text-[#1d1d1d]">
                  {isMatched && onUnmatch && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowSafetyMenu(false);
                        onUnmatch(profile);
                      }}
                      className="w-full px-4 py-2.5 text-left flex items-center gap-2.5 hover:bg-[#f9f9fa] cursor-pointer"
                    >
                      <HeartOff className="w-4 h-4 text-[#6F7078]" />
                      <span>Unmatch</span>
                    </button>
                  )}
                  {onReport && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowSafetyMenu(false);
                        onReport(profile);
                      }}
                      className="w-full px-4 py-2.5 text-left flex items-center gap-2.5 hover:bg-[#f9f9fa] cursor-pointer"
                    >
                      <Flag className="w-4 h-4 text-[#F59E0B]" />
                      <span>Laporkan (Report)</span>
                    </button>
                  )}
                  {onBlock && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowSafetyMenu(false);
                        onBlock(profile);
                      }}
                      className="w-full px-4 py-2.5 text-left flex items-center gap-2.5 text-[#EF4444] hover:bg-[#EF4444]/10 cursor-pointer"
                    >
                      <ShieldBan className="w-4 h-4" />
                      <span>Blokir (Block)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Left/Right Carousel Controls */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setPhotoIndex(
                    (prev) => (prev - 1 + photos.length) % photos.length
                  )
                }
                aria-label="Foto sebelumnya"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/65 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setPhotoIndex((prev) => (prev + 1) % photos.length)
                }
                aria-label="Foto berikutnya"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/65 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Multi-Photo Thumbnail Strip */}
        {photos.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {photos.map((photo, idx) => {
              const isSelected = idx === safeIndex;
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setPhotoIndex(idx)}
                  className={`relative w-14 h-16 rounded-[12px] overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? "border-[#267a50] scale-105 shadow-sm"
                      : "border-transparent opacity-65 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.public_url}
                    alt={`${profile.name} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Profile Info */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[22px] font-bold text-[#1d1d1d]">
                  {profile.name}, {profile.age}
                </h3>
                {isMatched && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#22C55E]/12 text-[#16A34A] text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Match Aktif</span>
                  </span>
                )}
              </div>
              <p className="text-[14px] text-[#6F7078] flex items-center gap-1 mt-0.5">
                <MapPin className="w-4 h-4 text-[#267a50]" />
                <span>
                  {profile.city}
                  {profile.approx_distance_km
                    ? ` · ±${profile.approx_distance_km} km away`
                    : ""}
                </span>
              </p>
            </div>
            {profile.is_premium && <PremiumBadge />}
          </div>

          <div className="p-4 rounded-[16px] bg-[#f9f9fa] border border-[#E9E9EE] space-y-1">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6F7078]">
              Tentang {profile.name}
            </p>
            <p className="text-[15px] text-[#1d1d1d] leading-relaxed">
              {profile.bio}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6F7078]">
              Minat (Interests)
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <InterestChip
                  key={interest.id}
                  label={interest.name}
                  emoji={interest.emoji}
                  interactive={false}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isMatched ? (
          <div className="flex items-center gap-3 pt-3 border-t border-[#E9E9EE]">
            {onMessage ? (
              <Button
                variant="primary"
                fullWidth
                leftIcon={<MessageCircle className="w-4 h-4" />}
                onClick={() => {
                  onClose();
                  onMessage(profile);
                }}
              >
                Buka Chat
              </Button>
            ) : (
              <Button variant="secondary" fullWidth onClick={onClose}>
                Kembali ke Chat
              </Button>
            )}
          </div>
        ) : (
          (onPass || onLike) && (
            <div className="flex items-center justify-center gap-3 pt-3 border-t border-[#E9E9EE]">
              {onPass && (
                <PassButton
                  onClick={() => {
                    onClose();
                    onPass(profile);
                  }}
                />
              )}
              {onLike && (
                <LikeButton
                  onClick={() => {
                    onClose();
                    onLike(profile);
                  }}
                />
              )}
            </div>
          )
        )}
      </div>
    </BottomSheet>
  );
}
