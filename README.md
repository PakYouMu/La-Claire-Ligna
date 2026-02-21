<div align="center">
  <h1>La Claire Ligña</h1>
  <p><strong>A beautifully engineered, mathematical loan and fund tracker for private lenders.</strong></p>
  
  [![License](https://img.shields.io/badge/License-FOSS_with_Attribution-blue.svg)](LICENSE)
  [![Next.js](https://img.shields.io/badge/Next.js-16.1.4-black?logo=next.js)](https://nextjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?logo=supabase)](https://supabase.com)
</div>

<br />

Welcome to **La Claire Ligña**, a premium alternative to messy spreadsheet accounting. Built specifically for private lenders and small lending businesses, this application acts as your central financial hub. Manage high-level capital funds and track granular loan disbursements, all backed by a reversible double-entry ledger that guarantees mathematical perfection down to the final cent.

## Why La Claire Ligña?
---
- **Immutable Financial Integrity**: Forget broken spreadsheet formulas. Every loan, payment, and deletion is written securely into an append-tracking ledger (deposits, disbursements, repayments), guaranteeing your "Cash on Hand" perfectly matches reality.
- **Automated Amortization**: Provide a principal, flat interest rate, and duration, and the system instantly maps out bi-monthly schedule payments bridging the entire loan lifecycle.
- **Fluid & Modern UX**: Built with Shadcn UI, pure CSS animations, and Three.js 60FPS fluid backgrounds, the entire application feels like a native mobile app, functioning beautifully in both Light and Dark modes.
- **Auditable Rollbacks**: Need to void a bad loan? The system safely restores your initial cash disbursement while retaining the voided record for transparent historical auditing.

<br />

## Key Features
---
*   **Multi-Fund Management:** Segment your capital. Move money in and out of discrete funds.
*   **Dual-Sided Balances:** Watch your active cash-on-hand deplete as you distribute loans, and refill as borrowers submit payments.
*   **Intelligent Schedule Grids:** Visual dashboards reveal exactly how much is expected on upcoming 15th and end-of-month cycles.
*   **QR & OCR Ready:** Generate scannable QR portfolios and track ID-driven borrower interactions.
*   **Next-Gen Tech Stack:** Powered end-to-end by Next.js Server Actions, PostgreSQL (Supabase), and Tailwind CSS.

<br />

## Self-Hosting Guide
---
Deploying your own instance of La Claire Ligña is intentionally straightforward. 

**Note: By downloading and hosting this software, you agree to the terms laid out in the LICENSE file.**

### 1. Database Setup (Supabase)
1. Create a free project on [Supabase.com](https://supabase.com).
2. Go to the SQL Editor in your Supabase dashboard.
3. Copy the entire contents of `supabase/schema.sql` from this repository and run it. This instantly builds your required tables, triggers, and accounting views.

### 2. Connect Your App
Clone this repository and create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Install & Run
```bash
npm install
npm run dev
```
Navigate to `http://localhost:3000`. You can now create your first account via the secure sign-up screen.

---

### License & Usage
This project is Free and Open Source Software (FOSS). You are absolutely free to download, self-host, and modify the codebase to fit your exact business needs! 

However, to protect the original architecture from bad actors, it is distributed under a Custom Anti-Plagiarism License:
- You are **expressly prohibited** from taking this codebase, making minimal changes, and claiming or redistributing it as your own original product.
- You must **retain the original copyright notices** in the code.

Violations of these terms, specifically the unauthorized plagiarism and white-labeling of this repository, will be subject to strict legal action by La Claire Ligña. See the `LICENSE` file for full details.
