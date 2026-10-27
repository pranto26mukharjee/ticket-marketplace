"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ShieldCheck } from "lucide-react";

interface ProfileData {
  fullName: string | null;
  email: string;
  phone: string | null;
  role: string;
  profile?: {
    address: string | null;
    dob: string | null;
    nidPassportNo: string | null;
    identityVerified: boolean;
  } | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [dob, setDob] = useState("");
  const [nidPassportNo, setNidPassportNo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        if (response.status === 401) {
          router.replace("/login?redirect=/profile");
          return;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load your profile.");
        if (!isCurrent) return;
        const value = data.profile as ProfileData;
        setProfile(value);
        setFullName(value.fullName || "");
        setPhone(value.phone || "");
        setAddress(value.profile?.address || "");
        setDob(value.profile?.dob?.slice(0, 10) || "");
        setNidPassportNo(value.profile?.nidPassportNo || "");
      } catch (loadError) {
        if (isCurrent) setError(loadError instanceof Error ? loadError.message : "Could not load your profile.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    }
    void loadProfile();
    return () => { isCurrent = false; };
  }, [router]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, address, dob, nidPassportNo }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save your profile.");
      if (data.user) setProfile((current) => current ? { ...current, ...data.user, profile: { ...current.profile, ...data.user.profile } } : current);
      setMessage(data.message || "Profile saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="min-h-[60vh] grid place-items-center text-sm text-slate-500"><span className="inline-flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> Loading profile</span></main>;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:py-14 text-slate-900">
      <div className="max-w-3xl mx-auto">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-800">Your account</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold">Profile & verification</h1>
          <p className="mt-2 text-sm text-slate-600">Update your contact details and identity information.</p>
        </header>

        {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="mt-5 text-sm text-emerald-800">{message}</p>}

        {profile && (
          <form onSubmit={saveProfile} className="mt-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-sm font-semibold">Identity review</p>
                <p className="mt-1 text-xs text-slate-500">Your profile is reviewed by the platform team.</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${profile.profile?.identityVerified ? "text-emerald-700" : "text-amber-700"}`}>
                <ShieldCheck size={15} />{profile.profile?.identityVerified ? "Verified" : "Not verified"}
              </span>
            </div>

            <label className="block text-sm font-medium">Email address
              <input value={profile.email} readOnly className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-600" />
            </label>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block text-sm font-medium">Full name
                <input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-700" />
              </label>
              <label className="block text-sm font-medium">Phone
                <input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-700" />
              </label>
              <label className="block text-sm font-medium">Date of birth
                <input type="date" value={dob} onChange={(event) => setDob(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-700" />
              </label>
              <label className="block text-sm font-medium">NID / passport number
                <input value={nidPassportNo} onChange={(event) => setNidPassportNo(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-700" />
              </label>
            </div>
            <label className="block text-sm font-medium">Address
              <textarea rows={3} value={address} onChange={(event) => setAddress(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-700" />
            </label>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save profile
            </button>
          </form>
        )}
      </div>
    </main>
  );
}