# La Claire Ligna

A lending management system built with [Next.js](https://nextjs.org) and [Supabase](https://supabase.com).

## Features

- **Loan Tracking** – Monitor active loans, payments, and borrower details
- **Fund Management** – Organize and manage multiple lending funds
- **QR Code Integration** – Generate QR codes for loan portfolios
- **OCR Support** – Scan and parse loan cards
- **Authentication** – Secure sign-in powered by Supabase Auth
- **Dark Mode** – Full theme support with light and dark modes
- **Responsive Design** – Works across desktop and mobile devices

## Getting Started

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file with your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=[INSERT SUPABASE PROJECT URL]
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[INSERT SUPABASE PROJECT API PUBLISHABLE OR ANON KEY]
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- [Next.js](https://nextjs.org) – React framework
- [Supabase](https://supabase.com) – Backend & Auth
- [Tailwind CSS](https://tailwindcss.com) – Styling
- [shadcn/ui](https://ui.shadcn.com/) – UI Components
- [Recharts](https://recharts.org/) – Data visualization
- [Three.js](https://threejs.org/) – 3D graphics

## License

Private project – © 2025 La Claire Ligna Finance
