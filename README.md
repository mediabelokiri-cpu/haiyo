# HAIYO

> **"Ketemu orang baru, siapa tahu jadi sesuatu."**

HAIYO adalah aplikasi social discovery dan dating (18+) berbasis **Web / PWA (Mobile-First)** yang dibangun dengan **Next.js (App Router) + TypeScript + Tailwind CSS + Supabase**.

---

## Tech Stack
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend & Database:** Supabase (PostgreSQL, Auth, Storage, Realtime, RLS)
- **Deployment:** GitHub + Vercel (Continuous Preview per Phase)

---

## 11-Phase Official Execution Roadmap
1. **Phase 1:** Project Foundation, Design Tokens & Core UI (`#FF5C8A` Primary Pink, `#7C5CFC` Secondary Purple, `#FFF8FA` Background, `Inter`, PWA, Core Reusable Components)
2. **Phase 2:** Supabase Foundation (17 Tabel ERD v1.0, Indexes, RLS, Storage `profile-photos`, Seed Data & Database RPC Functions)
3. **Phase 3:** Landing Page, Auth & 5-Step Onboarding (Privacy-Safe / Non-blocking GPS)
4. **Phase 4:** Discovery Engine (PostgreSQL RPC `get_discovery_profiles()`, Ranking V1, Swipe Limit 100/day)
5. **Phase 5:** Match, Realtime Chat & Safety Ecosystem (Atomic Match Transaction, Match Celebration, Realtime Chat, Unmatch, Block, Report)
6. **Phase 6:** Profile Management, Settings, Server Notifications & Complete Delete Account Flow
7. **Phase 7:** Admin Panel & Moderation (Server/RLS Admin Auth, Dashboard, Users, Reports, Subscriptions, Payments)
8. **Phase 8:** Premium & Subscription Engine (3 Plans, Unlimited Swipe, Who Likes You, Undo, Advanced Filter, Cumulative Expiry)
9. **Phase 9:** Payment Gateway, Idempotent Server Webhook & Sandbox Simulator
10. **Phase 10:** QA, RLS Security Audit & Performance Optimization
11. **Phase 11:** Production Deployment & HAIYO Launch 🚀

---

## Menjalankan Secara Lokal

1. Salin file environment:
   ```bash
   cp .env.example .env.local
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Jalankan development server:
   ```bash
   npm run dev
   ```
4. Buka `http://localhost:3000` di browser.
