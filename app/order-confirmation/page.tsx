"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

function ConfirmationRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (orderId) {
      router.replace(`/order-success?orderId=${orderId}`);
    } else {
      router.replace("/dashboard");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={36} className="animate-spin text-[#0D9488]" />
        <p className="text-xs font-semibold text-slate-500">Redirecting to confirmed ticket pass...</p>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <Loader2 size={36} className="animate-spin text-[#0D9488]" />
        </div>
      }
    >
      <ConfirmationRedirect />
    </Suspense>
  );
}