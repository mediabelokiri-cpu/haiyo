"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldBan } from "lucide-react";
import {
  AppShell,
  Avatar,
  Button,
  EmptyState,
  useToast,
} from "@/components/ui";
import {
  loadAppState,
  LocalAppState,
  saveAppState,
  SEED_CANDIDATE_PROFILES,
} from "@/lib/store/app-state";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Blocked Users Page (/settings/blocked) per UI/UX Section 45:
 * - Heading: "Pengguna yang Diblokir"
 * - List: Avatar, Name, Button: "Buka Blokir"
 * - Empty: "Belum ada pengguna yang diblokir."
 */
export default function BlockedUsersPage() {
  const { toast } = useToast();
  const [appState, setAppState] = useState<LocalAppState | null>(null);

  useEffect(() => {
    setAppState(loadAppState());
  }, []);

  if (!appState) return null;

  const blockedProfiles = appState.blockedUserIds.map((id) => {
    const found = SEED_CANDIDATE_PROFILES.find((p) => p.id === id);
    return (
      found ?? {
        id,
        name: "Pengguna HAIYO",
        age: 24,
        gender: "female" as const,
        city: "Indonesia",
        approx_distance_km: null,
        bio: "",
        is_premium: false,
        photos: [],
        interests: [],
      }
    );
  });

  const handleUnblock = async (targetId: string, targetName: string) => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("blocks")
          .delete()
          .eq("blocker_id", user.id)
          .eq("blocked_id", targetId);
      }
    }

    const fresh = loadAppState();
    const updated: LocalAppState = {
      ...fresh,
      blockedUserIds: fresh.blockedUserIds.filter((id) => id !== targetId),
    };
    saveAppState(updated);
    setAppState(updated);
    toast({
      title: `Blokir untuk ${targetName} telah dibuka.`,
      variant: "success",
    });
  };

  return (
    <AppShell
      headerProps={{
        title: "Pengguna yang Diblokir",
        showBrand: false,
      }}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#6F7078] hover:text-[#1d1d1d]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Settings</span>
          </Link>
        </div>

        <h1 className="text-[24px] font-bold text-[#1d1d1d]">
          Pengguna yang Diblokir
        </h1>

        {blockedProfiles.length === 0 ? (
          <EmptyState
            icon={<ShieldBan className="w-8 h-8" />}
            title="Belum ada pengguna yang diblokir."
            description="Pengguna yang kamu blokir tidak akan bisa melihat profilmu atau mengirim pesan."
          />
        ) : (
          <div className="space-y-3">
            {blockedProfiles.map((user) => (
              <div
                key={user.id}
                className="p-4 rounded-[20px] bg-white border border-[#E9E9EE] flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <Avatar
                    name={user.name}
                    src={user.photos[0]?.public_url}
                    size="md"
                  />
                  <div>
                    <p className="text-[16px] font-bold text-[#1d1d1d]">
                      {user.name}
                    </p>
                    <p className="text-[13px] text-[#6F7078]">{user.city}</p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUnblock(user.id, user.name)}
                >
                  Buka Blokir
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
