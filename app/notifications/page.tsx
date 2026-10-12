"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  Clock,
  CreditCard,
  Crown,
  Heart,
  MessageCircle,
  Users,
} from "lucide-react";
import { AppShell, Button, EmptyState } from "@/components/ui";
import {
  loadAppState,
  LocalAppState,
  saveAppState,
} from "@/lib/store/app-state";
import { NotificationType } from "@/types/database";

const NOTIF_ICON_CONFIG: Record<
  NotificationType,
  {
    icon: React.ComponentType<{ className?: string }>;
    tone: string;
  }
> = {
  new_like: {
    icon: Heart,
    tone: "bg-[#eaf5ef] text-[#267a50] border-[#267a50]/20",
  },
  new_match: {
    icon: Users,
    tone: "bg-[#eaf5ef] text-[#267a50] border-[#267a50]/20",
  },
  new_message: {
    icon: MessageCircle,
    tone: "bg-[#eaf5ef] text-[#67bf9a] border-[#67bf9a]/20",
  },
  subscription_active: {
    icon: Crown,
    tone: "bg-[#1d1d1d] text-white border-[#1d1d1d]",
  },
  payment_success: {
    icon: CreditCard,
    tone: "bg-[#22C55E]/10 text-[#16A34A] border-[#22C55E]/20",
  },
  payment_failed: {
    icon: AlertTriangle,
    tone: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20",
  },
  subscription_expiring: {
    icon: Clock,
    tone: "bg-[#F59E0B]/10 text-[#D97706] border-[#F59E0B]/20",
  },
  subscription_expired: {
    icon: Clock,
    tone: "bg-[#F4F4F8] text-[#6F7078] border-[#E9E9EE]",
  },
};

/**
 * Notification Page (/notifications) per UI/UX Sections 65 & 66:
 * - Heading: "Notifikasi"
 * - Grouped: Today, Earlier
 * - Each item: Clean Vector Icon, Title, Description, Time, Unread background highlight
 */
export default function NotificationsPage() {
  const [appState, setAppState] = useState<LocalAppState | null>(null);

  useEffect(() => {
    setAppState(loadAppState());
  }, []);

  if (!appState) return null;

  const notifications = appState.notifications;
  const todayStr = new Date().toISOString().slice(0, 10);

  const todayList = notifications.filter(
    (n) => n.created_at.slice(0, 10) === todayStr
  );
  const earlierList = notifications.filter(
    (n) => n.created_at.slice(0, 10) !== todayStr
  );

  const handleMarkAllRead = () => {
    const fresh = loadAppState();
    const updated: LocalAppState = {
      ...fresh,
      notifications: fresh.notifications.map((n) => ({ ...n, is_read: true })),
    };
    saveAppState(updated);
    setAppState(updated);
  };

  return (
    <AppShell
      headerProps={{
        title: "Notifikasi",
        showBrand: false,
      }}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold text-[#1d1d1d]">Notifikasi</h1>
            <p className="text-[14px] text-[#6F7078]">
              Aktivitas terbaru dari profil, Match, dan langganan kamu.
            </p>
          </div>

          {notifications.some((n) => !n.is_read) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllRead}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Tandai Dibaca
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-8 h-8" />}
            title="Belum ada notifikasi"
            description="Notifikasi tentang Like, Match, dan pesan baru akan muncul di sini."
          />
        ) : (
          <div className="space-y-6">
            {[
              { label: "Today", items: todayList },
              { label: "Earlier", items: earlierList },
            ].map((group) => {
              if (group.items.length === 0) return null;
              return (
                <section key={group.label} className="space-y-2.5">
                  <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#6F7078] px-1">
                    {group.label}
                  </h2>

                  <div className="space-y-2.5">
                    {group.items.map((item) => {
                      const cfg =
                        NOTIF_ICON_CONFIG[item.type] ??
                        NOTIF_ICON_CONFIG.new_like;
                      const IconComponent = cfg.icon;
                      return (
                        <div
                          key={item.id}
                          className={`p-4 rounded-[20px] border transition-colors flex items-start gap-3.5 ${
                            item.is_read
                              ? "bg-white border-[#E9E9EE]"
                              : "bg-[#eaf5ef]/65 border-[#267a50]/30"
                          }`}
                        >
                          <span
                            className={`w-11 h-11 rounded-[14px] border flex items-center justify-center shrink-0 ${cfg.tone}`}
                          >
                            <IconComponent className="w-5 h-5 stroke-[2.2]" />
                          </span>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[15px] font-bold text-[#1d1d1d]">
                                {item.title}
                              </p>
                              {!item.is_read && (
                                <span className="w-2.5 h-2.5 rounded-full bg-[#267a50] shrink-0" />
                              )}
                            </div>
                            <p className="text-[14px] text-[#6F7078] mt-0.5 leading-relaxed">
                              {item.message}
                            </p>
                            <span className="inline-block text-[11px] text-[#A0A0A8] mt-1.5">
                              {new Date(item.created_at).toLocaleString(
                                "id-ID",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
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
    </AppShell>
  );
}
