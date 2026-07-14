import type { Metadata } from "next";
import { Public_Sans, Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";

const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-sans" });
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["600", "700"],
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Performa — financial statements from your bank statement",
  description:
    "Guided preparation of compliant Tier 3 and Tier 4 performance reports for NZ community organisations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${publicSans.variable} ${sourceSerif.variable} ${plexMono.variable} font-sans antialiased`}>
          {children}
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
