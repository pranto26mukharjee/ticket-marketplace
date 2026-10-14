"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Invalid JSON response from server:", text);
        setError("Server error. Please try again later.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.message || "Invalid email or password.");
        return;
      }

      // Redirect to original destination or dashboard
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.push(redirect);
    } catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-[#F4F7FB] flex items-center justify-center p-4 md:p-10 font-sans">
      <div className="w-full max-w-[880px] bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[480px]">

        {/* Left Section */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">

          {/* Logo */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-[#1E293B] flex items-center">
              Ticket<span className="text-[#0D9488]">Lagbe</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-normal">
              Secure access to your tickets
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-600">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Forgot?
                </Link>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-4 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition shadow-sm mt-2 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Logging In...
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          {/* Signup Link */}
          <div className="text-center mt-6">
            <p className="text-xs text-slate-500">
              New to TicketLagbe?{" "}
              <Link href="/signup" className="font-semibold text-blue-600 hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="w-full md:w-1/2 bg-[#1A1C43] p-8 md:p-12 flex flex-col items-center justify-center text-center text-white relative">

          <div className="w-20 h-20 bg-[#6EE7B7]/20 border border-[#6EE7B7]/40 rounded-full flex items-center justify-center mb-6">
            <div className="w-14 h-14 bg-[#5EEAD4] rounded-full flex items-center justify-center text-[#1A1C43]">
              <ShieldCheck size={28} />
            </div>
          </div>

          <h2 className="text-xl font-bold mb-3 tracking-wide">
            AI Signature Check
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed max-w-[280px]">
            Our system instantly checks the ticket cryptographic key to ensure uniqueness before any sale.
          </p>
        </div>

      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F4F7FB]"><Loader2 className="animate-spin text-[#0D9488]" size={32} /></div>}>
      <LoginForm />
    </Suspense>
  );
}