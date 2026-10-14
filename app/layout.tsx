import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#1A1C43",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://ticketlagbe.com"
  ),
  title: {
    default: "TicketLagbe — AI-Verified P2P Secondary Ticket Marketplace",
    template: "%s | TicketLagbe",
  },
  description:
    "Bangladesh's premier AI-verified peer-to-peer ticket marketplace. Buy and sell train, bus, flight, and event tickets safely with automated fraud screening and 100% escrow protection.",
  keywords: [
    "TicketLagbe",
    "P2P ticket marketplace",
    "Bangladesh ticket resale",
    "Train ticket Bangladesh",
    "Shohoz train ticket",
    "Bus ticket",
    "Event ticket",
    "Concert ticket",
    "AI ticket verification",
    "Escrow ticketing",
    "Safe ticket resale",
  ],
  authors: [{ name: "TicketLagbe Team", url: "https://ticketlagbe.com" }],
  creator: "TicketLagbe Technologies",
  publisher: "TicketLagbe Escrow Ltd",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_BD",
    url: "https://ticketlagbe.com",
    siteName: "TicketLagbe",
    title: "TicketLagbe — AI-Verified P2P Secondary Ticket Marketplace",
    description:
      "Buy and sell authentic travel and event tickets in Bangladesh safely with AI verification, duplicate detection, and neutral escrow funds protection.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "TicketLagbe Verified Ticket Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TicketLagbe — AI-Verified P2P Secondary Ticket Marketplace",
    description:
      "Safe, escrow-protected secondary ticketing for travel and events in Bangladesh.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col font-sans bg-[#F8FAFC] text-slate-800 selection:bg-teal-500 selection:text-white">
           <script dangerouslySetInnerHTML={{__html:
     "if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}"}} />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}