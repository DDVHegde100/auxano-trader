export const dynamic = "force-dynamic";

import type { Metadata, Viewport } from "next";
import { Anaheim } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

const anaheim = Anaheim({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anaheim",
  display: "swap",
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
  themeColor: "#1a1209",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const useDevAuth = process.env.ALLOW_DEV_AUTH === "true";

  return (
    <html lang="en" className={anaheim.variable}>
      <body className={`${anaheim.className} antialiased`}>
        <AppProviders devAuth={useDevAuth}>{children}</AppProviders>
      </body>
    </html>
  );
}
