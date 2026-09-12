import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "TicketLagbe - Secured P2P Ticket Marketplace",
  description: "Buy and sell verified tickets safely with Escrow protection",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#F8FAFC] text-slate-800">
        {/* Global Navigation Bar */}
        <Navbar />

        {/* Dynamic Page Content */}
        <div className="flex-grow">
          {children}
        </div>

        {/* Global Footer */}
        <Footer />
      </body>
    </html>
  );
}