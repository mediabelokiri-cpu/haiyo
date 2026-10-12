"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Heart,
  Users,
  MessageCircle,
  User,
  Bell,
  SlidersHorizontal,
  Settings,
  LogOut,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./BrandLogo";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
}

const MAIN_NAV_ITEMS: NavItem[] = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/likes", label: "Likes", icon: Heart },
  { href: "/matches", label: "Matches", icon: Users },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
];

export interface HeaderProps {
  title?: string;
  showBrand?: boolean;
  hasUnreadNotifications?: boolean;
  onOpenFilter?: () => void;
  rightSlot?: React.ReactNode;
}

export function Header({
  title,
  showBrand = true,
  hasUnreadNotifications = false,
  onOpenFilter,
  rightSlot,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#E9E9EE] px-4 md:px-8 flex items-center justify-between pt-safe">
      <div className="flex items-center gap-3 min-w-0">
        {showBrand && !title ? (
          <BrandLogo href="/discover" size="md" />
        ) : (
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo href="/discover" size="sm" className="md:hidden" />
            <span className="h-4 w-px bg-[#E9E9EE] md:hidden shrink-0" />
            <h1 className="text-[17px] sm:text-[18px] font-bold text-[#1d1d1d] truncate">
              {title}
            </h1>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {rightSlot}

        <Link
          href="/notifications"
          aria-label="Notifikasi"
          className="relative w-11 h-11 rounded-full border border-[#E9E9EE] bg-white hover:bg-[#f9f9fa] flex items-center justify-center text-[#1d1d1d] transition-colors"
        >
          <Bell className="w-5 h-5" />
          {hasUnreadNotifications && (
            <span
              aria-label="Ada notifikasi belum dibaca"
              className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#267a50] ring-2 ring-white"
            />
          )}
        </Link>

        {onOpenFilter && (
          <button
            type="button"
            onClick={onOpenFilter}
            aria-label="Filter pencarian"
            className="w-11 h-11 rounded-full border border-[#E9E9EE] bg-white hover:bg-[#f9f9fa] flex items-center justify-center text-[#1d1d1d] transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
}

export function BottomNav({
  unreadChatCount = 0,
  unreadLikesCount = 0,
}: {
  unreadChatCount?: number;
  unreadLikesCount?: number;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi Utama Mobile"
      className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#E9E9EE] pb-safe md:hidden"
    >
      <div className="h-16 px-2 flex items-center justify-around">
        {MAIN_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const badge =
            item.href === "/chat"
              ? unreadChatCount
              : item.href === "/likes"
              ? unreadLikesCount
              : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] px-2 py-1 rounded-[12px] transition-colors",
                isActive
                  ? "text-[#267a50] font-semibold"
                  : "text-[#6F7078] hover:text-[#1d1d1d]"
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#267a50] text-white text-[10px] font-bold flex items-center justify-center">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Sidebar({
  onLogout,
  unreadChatCount = 0,
}: {
  onLogout?: () => void;
  unreadChatCount?: number;
}) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Navigasi Samping Desktop"
      className="hidden md:flex md:flex-col md:w-[250px] md:shrink-0 md:h-dvh md:sticky md:top-0 bg-white border-r border-[#E9E9EE] p-5 justify-between"
    >
      <div className="space-y-6">
        <div className="px-2">
          <BrandLogo href="/discover" size="lg" />
        </div>

        <nav className="flex flex-col gap-1.5">
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-4 h-12 rounded-[14px] text-[15px] transition-all",
                  isActive
                    ? "bg-[#eaf5ef] text-[#267a50] font-semibold"
                    : "text-[#6F7078] hover:text-[#1d1d1d] hover:bg-[#f9f9fa] font-medium"
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </span>
                {item.href === "/chat" && unreadChatCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#267a50] text-white text-[11px] font-bold">
                    {unreadChatCount}
                  </span>
                )}
              </Link>
            );
          })}

          <Link
            href="/premium"
            className={cn(
              "mt-2 flex items-center gap-3 px-4 h-12 rounded-[14px] text-[15px] font-semibold transition-all",
              pathname === "/premium"
                ? "bg-[#1d1d1d] text-white shadow-sm"
                : "bg-[#eaf5ef] text-[#1d1d1d] hover:bg-[#267a50]/15"
            )}
          >
            <Crown className="w-5 h-5 text-[#267a50] shrink-0" />
            <span>HAIYO Premium</span>
          </Link>
        </nav>
      </div>

      <div className="pt-4 border-t border-[#E9E9EE] flex flex-col gap-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-4 h-11 rounded-[12px] text-[14px] font-medium transition-colors",
            pathname === "/settings"
              ? "bg-[#eaf5ef] text-[#267a50] font-semibold"
              : "text-[#6F7078] hover:text-[#1d1d1d] hover:bg-[#f9f9fa]"
          )}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-3 px-4 h-11 rounded-[12px] text-[14px] font-medium text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        )}
      </div>
    </aside>
  );
}

export function AppShell({
  children,
  headerProps,
  unreadChatCount = 0,
  unreadLikesCount = 0,
  onLogout,
}: {
  children: React.ReactNode;
  headerProps?: HeaderProps;
  unreadChatCount?: number;
  unreadLikesCount?: number;
  onLogout?: () => void;
}) {
  return (
    <div className="min-h-dvh flex flex-col md:flex-row bg-[#f9f9fa] text-[#1d1d1d]">
      <Sidebar onLogout={onLogout} unreadChatCount={unreadChatCount} />

      <div className="flex-1 flex flex-col min-w-0 pb-[72px] md:pb-0">
        <Header {...headerProps} />
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 py-3.5 md:py-5">
          {children}
        </main>
        <footer className="w-full max-w-4xl mx-auto px-4 md:px-8 py-4 border-t border-[#E9E9EE]/70 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-[#6F7078]">
          <BrandLogo href="/discover" size="sm" />
          <span>
            © {new Date().getFullYear()} HAIYO. Ketemu orang baru, siapa tahu
            jadi sesuatu.
          </span>
        </footer>
      </div>

      <BottomNav
        unreadChatCount={unreadChatCount}
        unreadLikesCount={unreadLikesCount}
      />
    </div>
  );
}
