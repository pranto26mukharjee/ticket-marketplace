"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Mail,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-12">

      <div className="w-full max-w-md">

        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6"
        >
          <ArrowLeft size={16} />
          Back to Login
        </Link>

        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-8">

          <div className="w-14 h-14 rounded-2xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center mb-5">
            <Mail size={26} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Forgot Password?
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Enter your email address to request password
            reset instructions.
          </p>

          {!submitted ? (
            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >

              <input
                type="email"
                required
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#0D9488]"
              />

              <button
                type="submit"
                className="w-full py-3 bg-[#0D9488] hover:bg-[#0F766E] text-white font-semibold rounded-xl"
              >
                Send Reset Instructions
              </button>

            </form>
          ) : (
            <div className="mt-6 p-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm">
              Reset request submitted successfully.
              Real email functionality will be connected
              during backend development.
            </div>
          )}

        </div>

      </div>

    </main>
  );
}