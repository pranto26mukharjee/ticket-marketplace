"use client";

import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import {
  Ticket,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
  MapPin,
  CalendarDays,
  Armchair,
  User,
  Copy,
  Check,
  QrCode,
} from "lucide-react";

interface OrderQrProps {
  orderId: string;
  ticketTitle: string;
  ticketCode?: string | null;
  buyerName: string;
  from?: string | null;
  to?: string | null;
  travelDate?: string | null;
  seatNumber?: string | null;
  totalAmount: number;
  orderStatus: string;
}

export function OrderQrTicket({
  orderId,
  ticketTitle,
  ticketCode,
  buyerName,
  from,
  to,
  travelDate,
  seatNumber,
  totalAmount,
  orderStatus,
}: OrderQrProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const qrPayload = JSON.stringify({
      platform: "TicketLagbe",
      orderId,
      ticketCode: ticketCode || "N/A",
      buyer: buyerName,
      route: from && to ? `${from} → ${to}` : ticketTitle,
      travelDate: travelDate || "—",
      seat: seatNumber || "—",
      amount: `৳${totalAmount.toLocaleString()}`,
      verified: "AI-Escrow-Verified",
    });

    QRCode.toCanvas(canvasRef.current, qrPayload, {
      width: 200,
      margin: 2,
      color: {
        dark: "#1A1C43",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    }).then(() => setQrGenerated(true)).catch(console.error);
  }, [orderId, ticketCode, buyerName, from, to, travelDate, seatNumber, totalAmount, ticketTitle]);

  function handleDownload() {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `TicketLagbe-${orderId.slice(-8)}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  function handleCopy() {
    if (ticketCode) {
      navigator.clipboard.writeText(ticketCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  const isVerified = orderStatus === "CONFIRMED" || orderStatus === "COMPLETED";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-[#1A1C43] text-white px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center">
          <QrCode className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold">Digital Travel Pass</p>
          <p className="text-[10px] text-slate-300">TicketLagbe Escrow Verified</p>
        </div>
        {isVerified && (
          <div className="ml-auto flex items-center gap-1.5 bg-teal-500/20 border border-teal-400/30 text-teal-300 text-[10px] font-bold px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3 h-3" />
            VERIFIED
          </div>
        )}
      </div>

      {/* Ticket Body */}
      <div className="p-5 flex flex-col sm:flex-row gap-6">
        {/* QR Code */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <div className={`relative p-2 border-2 rounded-xl ${isVerified ? "border-teal-500" : "border-slate-200"}`}>
            <canvas ref={canvasRef} className="block rounded-lg" />
            {!qrGenerated && (
              <div className="absolute inset-2 bg-slate-100 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
            )}
          </div>
          <button
            onClick={handleDownload}
            disabled={!qrGenerated}
            className="flex items-center gap-1.5 text-xs text-teal-700 font-semibold hover:text-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Download className="w-3.5 h-3.5" />
            Download QR
          </button>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base leading-tight">{ticketTitle}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Order #{orderId.slice(-10).toUpperCase()}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {from && to && (
              <div className="col-span-2 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="font-medium text-slate-700">{from}</span>
                <span className="text-slate-400 mx-1">→</span>
                <span className="font-medium text-slate-700">{to}</span>
              </div>
            )}

            {travelDate && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(travelDate).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            )}

            {seatNumber && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <Armchair className="w-3.5 h-3.5 text-slate-400" />
                <span>Seat: <strong>{seatNumber}</strong></span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-slate-600">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">{buyerName}</span>
            </div>

            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <span className="text-[10px] text-slate-400 font-normal">Total</span>
              <span>৳{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {ticketCode && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ticket Reference Code</div>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs font-mono font-bold text-slate-800 break-all">{ticketCode}</code>
                <button
                  onClick={handleCopy}
                  className="shrink-0 flex items-center gap-1 text-[10px] text-teal-600 hover:text-teal-700 font-semibold transition"
                >
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}

          {/* Verification note */}
          <div className={`flex items-start gap-2 text-[10px] rounded-lg px-3 py-2 ${
            isVerified
              ? "bg-teal-50 text-teal-700 border border-teal-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}>
            {isVerified ? <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-px" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />}
            <span>
              {isVerified
                ? "This ticket is AI-verified and escrow-confirmed. Show QR at entry."
                : "QR will be fully activated once the seller confirms delivery and escrow is released."}
            </span>
          </div>
        </div>
      </div>

      {/* Perforated divider */}
      <div className="px-5">
        <div className="border-t-2 border-dashed border-slate-200 my-2 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 w-5 h-5 bg-slate-100 rounded-full border border-slate-200" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 w-5 h-5 bg-slate-100 rounded-full border border-slate-200" />
        </div>
      </div>

      {/* Footer strip */}
      <div className="px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3 h-3 text-teal-500" />
          TicketLagbe Escrow Protected
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          TLB-{orderId.slice(-8).toUpperCase()}
        </div>
      </div>
    </div>
  );
}
