
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  ShieldCheck,
  Ticket,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function CreateListingPage() {
  const router = useRouter();

  const [fileName, setFileName] = useState<string>("");
  const [category, setCategory] = useState<string>("TRAIN");
  const [title, setTitle] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [seatNumber, setSeatNumber] = useState<string>("");
  const [travelDate, setTravelDate] = useState<string>("");
  const [price, setPrice] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB.");
      setFileName("");
      return;
    }

    setError("");
    setFileName(file.name);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !title ||
      !category ||
      !from ||
      !to ||
      !travelDate ||
      !price
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (Number(price) <= 0) {
      setError("Price must be greater than 0.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
          category: category,
          from: from,
          to: to,
          travelDate: travelDate,
          travelTime: null,
          seatNumber: seatNumber || null,
          ticketType: null,
          price: Number(price),
          quantity: 1,
          description: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Failed to create ticket listing."
        );
        return;
      }

      setSuccess("Ticket listing created successfully!");

setTimeout(() => {
  router.push(
    `/verification-result?id=${data.ticket.id}`
  );
}, 800);
    } catch (error) {
      console.error("Create listing error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
      <main className="max-w-3xl mx-auto px-4 py-10">

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900">
            List Your Ticket for Sale
          </h1>

          <p className="text-slate-500 text-sm mt-1">
            Fill in the details below. Our AI system will verify
            the ticket authenticity automatically.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm">
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Upload */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Upload size={20} className="text-[#0D9488]" />
              <span>Upload Ticket Document</span>
            </h2>

            <div className="border-2 border-dashed border-slate-200 hover:border-[#0D9488] rounded-2xl p-8 text-center transition bg-slate-50/50 relative cursor-pointer">
              <input
                type="file"
                accept=".pdf,application/pdf,image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 bg-[#0D9488]/10 text-[#0D9488] rounded-full flex items-center justify-center">
                  <Ticket size={24} />
                </div>

                <p className="text-sm font-semibold text-slate-700">
                  {fileName || "Click or drag & drop ticket file"}
                </p>

                <p className="text-xs text-slate-400">
                  Max file size: 10MB (PDF, PNG, JPG)
                </p>
              </div>
            </div>

            <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3 flex items-center gap-2 text-xs text-[#065F46]">
              <ShieldCheck size={16} />

              <span>
                Personal sensitive information will be automatically
                masked before buyers see it.
              </span>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900">
              Journey & Event Details
            </h2>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category
              </label>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              >
                <option value="TRAIN">Train Ticket</option>
                <option value="BUS">Bus Ticket</option>
                <option value="EVENT">
                  Concert / Event
                </option>
                <option value="MOVIE">Movie Ticket</option>
                <option value="FLIGHT">Flight Ticket</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ticket / Event Name
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="e.g. Cox's Bazar Express"
                required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>

            {/* From / To */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  From (Origin)
                </label>

                <input
                  type="text"
                  value={from}
                  onChange={(event) =>
                    setFrom(event.target.value)
                  }
                  placeholder="e.g. Dhaka"
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  To (Destination)
                </label>

                <input
                  type="text"
                  value={to}
                  onChange={(event) =>
                    setTo(event.target.value)
                  }
                  placeholder="e.g. Cox's Bazar"
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
            </div>

            {/* Seat */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Class / Seat Info
              </label>

              <input
                type="text"
                value={seatNumber}
                onChange={(event) =>
                  setSeatNumber(event.target.value)
                }
                placeholder="e.g. Snigdha / Seat G-12"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Departure Date & Time
              </label>

              <input
                type="datetime-local"
                value={travelDate}
                onChange={(event) =>
                  setTravelDate(event.target.value)
                }
                required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Pricing
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Asking Price (BDT)
              </label>

              <div className="relative">
                <input
                  type="number"
                  value={price}
                  onChange={(event) =>
                    setPrice(event.target.value)
                  }
                  placeholder="1200"
                  min="1"
                  required
                  className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  BDT
                </span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-base transition shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Publishing...
              </>
            ) : (
              "Publish Ticket Listing"
            )}
          </button>

        </form>
      </main>
    </div>
  );
}

