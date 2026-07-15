import type { Metadata } from "next";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { RouteLoadingBar } from "@/components/layout/route-loading-bar";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import "./globals.css";

export const metadata: Metadata = {
  title: "ULT FMIPA - Universitas Padjadjaran",
  description: "ULT FMIPA is a web application for the Faculty of Mathematics and Natural Sciences at Universitas Padjadjaran, providing information and resources for students, faculty, and staff.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Suppresses hydration noise from browser extensions that inject attributes into html/body.
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
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
