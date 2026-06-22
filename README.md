# Paree - Premium Luxury Bridal Fashion E-Commerce Platform

Welcome to **Paree**, a premium luxury bridal fashion e-commerce platform. The visual aesthetics and branding are designed to match elite wedding fashion labels like Dior, Sabyasachi, and Manish Malhotra.

---

## 🏛️ Project Architecture & Layout

This project is configured as a dual-workspace structure:

*   **`/frontend`**: Next.js 15 (App Router) client application utilizing Tailwind CSS v4, TypeScript, Lucide React, Framer Motion (for premium animations), Recharts (for administrative timeline widgets), and TanStack Query.
*   **`/backend`**: Node.js + Express.js service powered by TypeScript, JWT Security, Bcrypt hashes, Razorpay payment integrations, and PostgreSQL query configurations.

---

## 🚀 Getting Started

Follow these steps to spin up the local development servers:

### 1. Start the Backend API Server
Navigate to the `backend` workspace, install dependencies, and run the hot-reloading dev listener:
```bash
cd backend
npm install
npm run dev
```
*   **Local URL**: [http://localhost:5000](http://localhost:5000)
*   **Default Admin Account**:
    *   **Email**: `admin@paree.com`
    *   **Password**: `admin123`
*   **Local Database**: Sown automatically. Persists data locally in `db_backup.json` inside the backend directory.

### 2. Start the Frontend Client Application
Navigate to the `frontend` workspace, install packages, and boot the Next.js dev server:
```bash
cd frontend
npm install
npm run dev
```
*   **Local URL**: [http://localhost:3000](http://localhost:3000)

---

## 💎 Features Summary

*   **Fullscreen Hero Slideshow**: Luxury animations displaying royal lehengas, gold statistics counters, and Sabyasachi-styled call-to-actions.
*   **Interactive Sidebar Drawers**: Smooth Framer Motion drawers on the header for the Shopping Cart, Wishlist, Search Panel, and user login forms.
*   **Dynamic Sizing Reference**: Integrated sizing guides for standard S, M, L, XL coutures.
*   **Loupe Image Magnifier**: Hover over single product images to activate granular lens zoom.
*   **Razorpay Payment Gateway Sandbox**: Checkout processes COD orders or triggers simulated Razorpay payment responses for smooth offline evaluations.
*   **Cart Abandonment Logs**: Automatic session monitoring tracking visitor states (added items, checkout entries, recovered orders).
*   **Premium Admin Control Panel**: Hidden routing at `/admin` displaying KPI cards, Recharts sales lines, low-stock warnings, category tree nesting, user logs, and coupon configs.
*   **Printable Invoices**: Generates printable HTML invoices matching Sabyasachi branding, accessible directly from order histories.
