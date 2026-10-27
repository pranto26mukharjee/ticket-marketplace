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
    default: "TicketLagbe — Travel & Event Ticket Marketplace",
    template: "%s | TicketLagbe",
  },
  description:
    "Browse and list train, bus, flight, launch, concert, festival, and cinema tickets in Bangladesh. Review listing details and track orders from your account.",
  keywords: [
    "TicketLagbe",
    "P2P ticket marketplace",
    "Bangladesh ticket resale",
    "Train ticket Bangladesh",
    "Shohoz train ticket",
    "Bus ticket",
    "Event ticket",
    "Concert ticket",
    "Ticket listing review",
    "Ticket resale marketplace",
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
    title: "TicketLagbe — Travel & Event Ticket Marketplace",
    description:
      "Browse and list travel and event tickets in Bangladesh. Review listing details and follow order updates from your account.",
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
    title: "TicketLagbe — Travel & Event Ticket Marketplace",
    description:
      "Travel and event ticket listings with account-based order tracking.",
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