"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Check,
} from "lucide-react";
import { TICKET_CATEGORY_CONFIG, type TicketCategory } from "@/lib/ticket-categories";

export default function CreateListingPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState("");

  // Enforce authentication on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.status === 401) {
          window.location.replace("/login?redirect=/create-listing");
          return;
        }
        if (!res.ok) {
          throw new Error("Could not verify your session. Please try again.");
        }
        const data = await res.json();
        if (!data.success || !data.user) {
          window.location.replace("/login?redirect=/create-listing");
          return;
        }
        setAuthChecking(false);
      } catch (error) {
        console.error("Listing authentication check failed:", error);
        setAuthError("Could not verify your session. Check your internet connection and try again.");
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, []);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TicketCategory>("TRAIN");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [travelTime, setTravelTime] = useState("");
  const [seatNumber, setSeatNumber] = useState("");
  const [ticketType, setTicketType] = useState<string>(TICKET_CATEGORY_CONFIG.TRAIN.ticketTypes[1]);
  const [listingDetails, setListingDetails] = useState<Record<string, string>>({});
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [ticketCode, setTicketCode] = useState("");
  const [description, setDescription] = useState("");

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const categoryConfig = TICKET_CATEGORY_CONFIG[category];

  // Handle Document Selection and Immediate Upload
  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(null);
    setDocumentId(null);
    setFileError("");

    // Validate size (4MB)
    if (file.size > 4 * 1024 * 1024) {
      setFileError("Document exceeds maximum size of 4MB.");
      return;
    }

    // Verification accepts the original ticket PDF only.
    const validExts = ["pdf"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !validExts.includes(ext)) {
      setSelectedFile(null);
      setDocumentId(null);
      setFileError("Only the original ticket PDF can be submitted for verification.");
      return;
    }

    setFileError("");
    setSelectedFile(file);
    setDocumentId(null);

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to upload document.");
      }

      setDocumentId(data.documentId);
    } catch (err: unknown) {
      setFileError(err instanceof Error ? err.message : "Document upload failed.");
      setSelectedFile(null);
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim() || !category || !from.trim() || !to.trim() || !travelDate || !price) {
      setError("Please fill in all required travel information.");
      return;
    }

    if (!documentId || !selectedFile || !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Upload the original ticket PDF before submitting it for authentication.");
      return;
    }

    const missingCategoryField = categoryConfig.detailFields.find(
      (field) => field.required && !listingDetails[field.key]?.trim()
    );
    if (missingCategoryField) {
      setError(`${missingCategoryField.label} is required for ${categoryConfig.label} tickets.`);
      return;
    }

    if (Number(price) <= 0) {
      setError("Price must be greater than 0 BDT.");
      return;
    }

    try {
      setSubmitting(true);
      setAiAnalyzing(true);

      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          from: from.trim(),
          to: to.trim(),
          travelDate,
          travelTime: travelTime.trim() || null,
          seatNumber: seatNumber.trim() || null,
          ticketType: ticketType.trim() || null,
          price: Number(price),
          quantity: Number(quantity) || 1,
          ticketCode: ticketCode.trim() || null,
          description: description.trim() || null,
          documentId,
          listingDetails,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          window.location.replace("/login?redirect=/create-listing");
          return;
        }
        throw new Error(data.message || "Failed to create ticket listing.");
      }

      setSuccess("Ticket checks completed and listing submitted.");
      setTimeout(() => {
        router.push(`/verification-result?id=${data.ticket.id}`);
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setAiAnalyzing(false);
      setSubmitting(false);
    }
  }

  if (authChecking || authError) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          {authChecking ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-[#0D9488] mx-auto" />
              <p className="text-sm text-slate-600">Checking your account...</p>
            </>
          ) : (
            <>
              <p className="text-sm text-red-700">{authError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl bg-[#0D9488] text-white font-semibold text-sm"
              >
                Retry
              </button>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-800 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5EEAD4]/10 text-[#0D9488] border border-[#5EEAD4]/30 text-xs font-bold mb-1">
            <Sparkles size={14} />
            <span>Ticket document checks</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            List a Spare Ticket for Sale
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Upload the original ticket PDF. Required details and possible duplicates are checked; some submissions need administrator review.
          </p>
        </div>

        {/* Error and Success Alerts */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-bold flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Listing Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Category & Title */}
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-5 h-5 rounded-full bg-[#1A1C43] text-white flex items-center justify-center text-[10px]">1</span>
                <span>Category & Listing Title</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Transport / Event Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const nextCategory = e.target.value as TicketCategory;
                      setCategory(nextCategory);
                      setTicketType(TICKET_CATEGORY_CONFIG[nextCategory].ticketTypes[0]);
                      setListingDetails({});
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488] cursor-pointer"
                  >
                    {Object.entries(TICKET_CATEGORY_CONFIG).map(([value, config]) => (
                      <option key={value} value={value}>{config.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Listing Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={categoryConfig.titlePlaceholder}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categoryConfig.detailFields.map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {field.label}{field.required ? " *" : ""}
                    </label>
                    <input
                      type="text"
                      required={field.required}
                      placeholder={field.placeholder}
                      value={listingDetails[field.key] || ""}
                      onChange={(event) => setListingDetails((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Route & Schedule */}
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-5 h-5 rounded-full bg-[#1A1C43] text-white flex items-center justify-center text-[10px]">2</span>
                <span>{category === "CONCERT" || category === "MUSIC" || category === "MOVIE" ? "Venue & Event Schedule" : "Route & Travel Schedule"}</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {categoryConfig.fromLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={category === "FLIGHT" ? "Hazrat Shahjalal International Airport (DAC)" : category === "CONCERT" || category === "MUSIC" || category === "MOVIE" ? "Dhaka" : "Dhaka (Kamalapur)"}
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {categoryConfig.toLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={category === "FLIGHT" ? "Shah Amanat International Airport (CGP)" : category === "CONCERT" || category === "MUSIC" || category === "MOVIE" ? "International Convention City Bashundhara" : "Chattogram"}
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {categoryConfig.dateLabel} *
                  </label>
                  <input
                    type="date"
                    required
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {categoryConfig.timeLabel} (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 07:00 AM"
                    value={travelTime}
                    onChange={(e) => setTravelTime(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Seating & Pricing */}
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-5 h-5 rounded-full bg-[#1A1C43] text-white flex items-center justify-center text-[10px]">3</span>
                <span>Seat, Inventory & Price</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {categoryConfig.seatLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={category === "TRAIN" ? "Coach Kha, seat 14" : category === "BUS" ? "Coach 3, seat A2" : category === "LAUNCH" ? "Cabin 302 / seat 4" : category === "FLIGHT" ? "12A" : category === "MOVIE" ? "Screen 4, row C, seat 8" : "Zone A / seat 14"}
                    value={seatNumber}
                    onChange={(e) => setSeatNumber(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {categoryConfig.ticketTypeLabel} *
                  </label>
                  <select
                    required
                    value={ticketType}
                    onChange={(event) => setTicketType(event.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488]"
                  >
                    {categoryConfig.ticketTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Available Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Asking Price (৳ BDT) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="৳ 850"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-[#0D9488] outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>
              </div>

              {/* Booking Reference / PNR for duplicate screening */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {categoryConfig.referenceLabel} (For Verification)
                </label>
                <input
                  type="text"
                  placeholder={categoryConfig.referencePlaceholder}
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Used by our AI to prevent duplicate ticket listings and guarantee uniqueness.
                </span>
              </div>
            </div>

            {/* Step 4: Document Upload */}
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-5 h-5 rounded-full bg-[#1A1C43] text-white flex items-center justify-center text-[10px]">4</span>
                <span>Ticket Authentication Document (PDF Required)</span>
              </h2>

              <div className="border-2 border-dashed border-slate-200 hover:border-[#0D9488] rounded-3xl p-6 text-center transition bg-slate-50/50">
                <input
                  type="file"
                  id="ticket-doc"
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="ticket-doc" className="cursor-pointer space-y-2 block">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0D9488] flex items-center justify-center mx-auto">
                    {uploadingFile ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : documentId ? (
                      <CheckCircle2 size={24} className="text-emerald-500" />
                    ) : (
                      <Upload size={24} />
                    )}
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {uploadingFile
                        ? "Uploading & screening document..."
                        : selectedFile
                        ? selectedFile.name
                        : "Click to upload the original ticket PDF *"}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      PDF only, max 4 MB. Our AI reads it to confirm the route, date, seat and booking reference match your listing. It stays private and is shared with the buyer only after payment.
                    </span>
                  </div>

                  {documentId && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <Check size={12} />
                      <span>Document Uploaded Securely</span>
                    </span>
                  )}
                </label>

                {fileError && (
                  <p className="text-xs text-red-600 font-semibold mt-2">{fileError}</p>
                )}
              </div>
            </div>

            {/* Description / Handover Instructions */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Handover Notes / Additional Instructions
              </label>
              <textarea
                rows={2}
                placeholder="Specify any boarding notes, station counter pickup, or transfer instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || uploadingFile}
                className="w-full py-4 bg-[#0D9488] hover:bg-[#0F766E] text-white font-extrabold rounded-2xl text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {aiAnalyzing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Checking ticket details...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Verify & Publish Ticket Listing</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
