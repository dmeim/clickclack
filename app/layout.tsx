import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GLOBAL_COLORS } from "@/lib/colors";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TypeSetGo - Typing Test",
  description:
    "A minimalistic typing test inspired by Monkeytype.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={
          {
            "--bg-primary": GLOBAL_COLORS.background,
            "--bg-surface": GLOBAL_COLORS.surface,
            "--text-body": GLOBAL_COLORS.text.body,
            "--text-primary": GLOBAL_COLORS.text.primary,
            "--text-secondary": GLOBAL_COLORS.text.secondary,
            "--text-error": GLOBAL_COLORS.text.error,
            "--text-success": GLOBAL_COLORS.text.success,
            "--brand-primary": GLOBAL_COLORS.brand.primary,
            "--brand-secondary": GLOBAL_COLORS.brand.secondary,
            "--brand-accent": GLOBAL_COLORS.brand.accent,
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
