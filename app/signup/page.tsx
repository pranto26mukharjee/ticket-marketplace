"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
        }),
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
        setError(data.message || "Registration failed.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-[#F4F7FB] flex items-center justify-center p-4 md:p-10 font-sans">
      <div className="w-full max-w-[880px] bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[520px]">

        {/* Left Section – Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">

          {/* Logo */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">
              Ticket<span className="text-[#0D9488]">Lagbe</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-normal">
              Create your free account
            </p>
          </div>

          {/* Success Banner */}
          {success && (
            <div className="mb-5 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle2 size={18} />
              Account created! Redirecting to login...
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Phone Number <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  className="w-full pl-4 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3.5 px-4 bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition shadow-sm mt-2 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-xs text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                Log In
              </Link>
            </p>
          </div>
        </div>

        {/* Right Section – Branding */}
        <div className="w-full md:w-1/2 bg-[#1A1C43] p-8 md:p-12 flex flex-col items-center justify-center text-center text-white relative">
          <div className="w-20 h-20 bg-[#6EE7B7]/20 border border-[#6EE7B7]/40 rounded-full flex items-center justify-center mb-6">
            <div className="w-14 h-14 bg-[#5EEAD4] rounded-full flex items-center justify-center text-[#1A1C43]">
              <UserPlus size={28} />
            </div>
          </div>

          <h2 className="text-xl font-bold mb-3 tracking-wide">
            Trusted Marketplace
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed max-w-[280px]">
            Join thousands of buyers and sellers on Bangladesh&apos;s first AI-verified ticket marketplace.
          </p>

          <ul className="mt-6 space-y-2 text-left text-xs text-slate-400">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#5EEAD4]" />
              AI-powered ticket verification
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#5EEAD4]" />
              Secure escrow payments
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#5EEAD4]" />
              Fraud detection system
            </li>
          </ul>
        </div>

      </div>
    </main>
  );
}
