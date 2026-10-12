import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HAIYO — Ketemu orang baru, siapa tahu jadi sesuatu.",
    template: "%s | HAIYO",
  },
  description:
    "Kenalan, ngobrol, dan lihat ke mana ceritanya berjalan. Aplikasi social discovery dan dating untuk pengguna 18+.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logourlbar.png", type: "image/png" },
    ],
    shortcut: "/logourlbar.png",
    apple: "/logourlbar.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HAIYO",
  },
};

export const viewport: Viewport = {
  themeColor: "#267a50",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="bg-[#f9f9fa] text-[#1d1d1d] antialiased selection:bg-[#267a50]/20 selection:text-[#1e6340]">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
