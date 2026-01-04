/**
 * Root Layout
 *
 * Main application layout that wraps all pages.
 * Provides global providers, fonts, and the toast notification system.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { FrappeProvider } from "@/lib/frappe-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kairos",
  description: "Kairos School Management System - Streamline your educational institution's administration",
  keywords: ["school management", "education", "administration", "students", "teachers"],
  authors: [{ name: "Kairos Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FrappeProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </FrappeProvider>
      </body>
    </html>
  );
}
