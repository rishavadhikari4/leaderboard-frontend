import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Transaction Leaderboard",
  description:
    "Real-time sales tracking across Nest Nepal, Nest SMS, and Babal Host platforms",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/nestnepal.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/nestnepal.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/nestnepal.png",
        type: "image/svg+xml",
      },
    ],
    apple: "/nestnepal.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
        {process.env.NODE_ENV === "production" && <SpeedInsights />}
      </body>
    </html>
  );
}
