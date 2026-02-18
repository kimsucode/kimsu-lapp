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
  metadataBase: new URL("https://kimsu-lapp.vercel.app"),
  title: "Kimsu l'App",
  description: "Une app chill pour les gens chill.",
  applicationName: "KIMSU",
  appleWebApp: {
    title: "Kimsu"
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png"
  },
  openGraph: {
    title: "Kimsu l'App",
    description: "Une app chill pour les gens chill.",
    type: "website",
    url: "/",
    siteName: "Kimsu l'App",
    images: [
      {
        url: "/og-image-v2.png",
        width: 1200,
        height: 630,
        alt: "Kimsu logo"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Kimsu l'App",
    description: "Une app chill pour les gens chill.",
    images: ["/og-image-v2.png"]
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
