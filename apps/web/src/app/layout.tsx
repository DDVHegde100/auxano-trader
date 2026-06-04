export const dynamic = "force-dynamic";

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Auxano — Algorithmic Investment OS",
  description:
    "Create, test, and simulate algorithmic trading strategies with $100,000 virtual capital.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Auxano",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const useDevAuth = process.env.ALLOW_DEV_AUTH === "true";

  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`}>
        <AppProviders devAuth={useDevAuth}>{children}</AppProviders>
      </body>
    </html>
  );
}
