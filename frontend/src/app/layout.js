"use client";

import { usePathname } from "next/navigation";
import PublicNavbar from "@/components/PublicNavbar";
import "@/styles/globals.css";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const hidePublicNavbar =
    pathname.startsWith("/user") ||
    pathname.startsWith("/professional") ||
    pathname.startsWith("/admin");

  return (
    <html lang="en">
      <head>
        <title>EcoPulse</title>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen">
        {!hidePublicNavbar && <PublicNavbar />}
        {children}
      </body>
    </html>
  );
}
