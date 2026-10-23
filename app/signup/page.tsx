
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2 } from "lucide-react";

export default function SignupPage() {
const router = useRouter();

const [fullName, setFullName] = useState("");
const [email, setEmail] = useState("");
const [phone, setPhone] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");

const [error, setError] = useState("");
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

  const data = await response.json();

  if (!response.ok) {
    setError(data.message || "Registration failed.");
    return;
  }

  alert("Registration successful! Please login.");

  router.push("/login");
} catch (error) {
  console.error("Registration error:", error);
  setError("Something went wrong. Please try again.");
} finally {
  setLoading(false);
}


}

return ( <main className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-12 bg-slate-50"> <div className="w-full max-w-md"> <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">

      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#1A1C43] flex items-center justify-center">
          <UserPlus className="text-[#5EEAD4]" size={28} />
        </div>

        <h1 className="text-2xl font-bold text-[#1A1C43]">
          Create Account
        </h1>

        <p className="text-sm text-slate-500 mt-2">
          Create your TicketLagbe account
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Full Name
          </label>

          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Enter your full name"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none focus:border-[#5EEAD4] focus:ring-2 focus:ring-[#5EEAD4]/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none focus:border-[#5EEAD4] focus:ring-2 focus:ring-[#5EEAD4]/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Phone Number
          </label>

          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="01XXXXXXXXX"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none focus:border-[#5EEAD4] focus:ring-2 focus:ring-[#5EEAD4]/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 6 characters"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none focus:border-[#5EEAD4] focus:ring-2 focus:ring-[#5EEAD4]/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Confirm Password
          </label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            placeholder="Enter password again"
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none focus:border-[#5EEAD4] focus:ring-2 focus:ring-[#5EEAD4]/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#1A1C43] hover:bg-[#25285b] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </button>

      </form>

      <div className="text-center mt-6 text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#1A1C43] hover:text-[#0f766e]"
        >
          Login
        </Link>
      </div>

    </div>
  </div>
</main>


);
}
