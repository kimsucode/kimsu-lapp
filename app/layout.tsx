import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";

import { BottomNav } from "@/components/navigation/BottomNav";

import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm"
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cormorant"
});

export const metadata: Metadata = {
  title: "Kimsu l'App",
  description: "Une app chill pour les gens chill.",
  applicationName: "KIMSU",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png"
  },
  openGraph: {
    title: "Kimsu l'App",
    description: "Une app chill pour les gens chill.",
    type: "website",
    url: "https://kimsu-lapp.vercel.app",
    siteName: "Kimsu l'App"
  },
  twitter: {
    card: "summary_large_image",
    title: "Kimsu l'App",
    description: "Une app chill pour les gens chill."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${dmSans.variable} ${cormorant.variable} pb-24`}>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
