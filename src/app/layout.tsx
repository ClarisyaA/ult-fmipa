import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { RouteLoadingBar } from "@/components/layout/route-loading-bar";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ULT FMIPA - Universitas Padjadjaran",
  description: "ULT FMIPA is a web application for the Faculty of Mathematics and Natural Sciences at Universitas Padjadjaran, providing information and resources for students, faculty, and staff.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <RouteLoadingBar />
        </Suspense>
        {children}
        <Toaster position="top-right" richColors closeButton />
        <ScrollToTop />
      </body>
    </html>
  );
}
