"use client";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __haiyoDeferredPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

let initialized = false;

export function initPwaInstallListener(): void {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;

  // Register Service Worker for Chrome/Android PWA Installability
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => null);
    });
    navigator.serviceWorker.register("/sw.js").catch(() => null);
  }

  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    window.__haiyoDeferredPwaPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event("haiyo-pwa-ready"));
  });

  window.addEventListener("appinstalled", () => {
    window.__haiyoDeferredPwaPrompt = null;
    window.dispatchEvent(new Event("haiyo-pwa-installed"));
  });
}

export function getDeferredPwaPrompt(): BeforeInstallPromptEvent | null {
  if (typeof window === "undefined") return null;
  return window.__haiyoDeferredPwaPrompt ?? null;
}

export async function triggerBrowserPwaInstall(): Promise<
  "accepted" | "dismissed" | "unavailable"
> {
  const promptEvent = getDeferredPwaPrompt();
  if (!promptEvent) {
    return "unavailable";
  }

  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") {
      window.__haiyoDeferredPwaPrompt = null;
      return "accepted";
    }
    return "dismissed";
  } catch {
    return "unavailable";
  }
}

export function isAppInstalledStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const isStandaloneDisplay = window.matchMedia(
    "(display-mode: standalone)"
  ).matches;
  const isIosStandalone = Boolean(
    (window.navigator as Navigator & { standalone?: boolean }).standalone
  );
  return isStandaloneDisplay || isIosStandalone;
}
