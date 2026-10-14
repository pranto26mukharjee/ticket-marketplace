"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminUsersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin?tab=users");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0F1123] flex items-center justify-center text-white">
      <div className="text-center space-y-2">
        <Loader2 size={32} className="animate-spin text-teal-400 mx-auto" />
        <p className="text-xs text-slate-400">Redirecting to Admin User Management...</p>
      </div>
    </div>
  );
}