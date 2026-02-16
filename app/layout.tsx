import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";

import { BottomNav } from "@/components/navigation/BottomNav";

import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading"
});

export const metadata: Metadata = {
  title: "Blog Companion",
  description: "Mini web-app PWA en support de blog",
  applicationName: "Blog Companion"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${bodyFont.variable} ${headingFont.variable} pb-24`}>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
