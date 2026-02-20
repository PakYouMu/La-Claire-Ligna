import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { GlobalNav } from "@/components/wrappers/nav-wrapper";
import { AuthProvider } from "@/components/wrappers/auth-wrapper";
import { ScreenGuard } from "@/components/wrappers/screen-wrapper";
import { MotionProvider } from "@/components/context/motion-context";
import MousePositionProvider from "@/components/wrappers/mouse-position-wrapper";


const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "La Clair Ligña",
  description: "Lending Management System",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

const Flaemische_Kanzleischrift = localFont({
  src: '../lib/fonts/Flaemische Kanzleischrift.ttf',
  display: 'swap',
  variable: '--font-display'
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} antialiased ${Flaemische_Kanzleischrift.variable}`} suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <MotionProvider>
          <MousePositionProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <AuthProvider>
                <div className="relative min-h-screen flex flex-col">
                  <GlobalNav />

                  {/* Main Content */}
                  <main className="flex-1 w-full h-full">
                    {children}
                  </main>
                </div>
              </AuthProvider>
            </ThemeProvider>
          </MousePositionProvider>
          <ScreenGuard />
        </MotionProvider>
      </body>
    </html>
  );
}