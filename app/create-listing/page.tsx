"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  ShieldCheck,
  Ticket,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  FileText,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Armchair,
  ArrowRight,
  Info,
  Building,
  Plane,
  Bus,
  Train,
  Check,
} from "lucide-react";

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

  // Category State
  const [category, setCategory] = useState<"TRAIN" | "BUS" | "FLIGHT" | "EVENT">("TRAIN");

  // Common Fields
  const [title, setTitle] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [travelTime, setTravelTime] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [ticketCode, setTicketCode] = useState("");
  const [description, setDescription] = useState("");

  // Specialized Fields for Train
  const [trainName, setTrainName] = useState("Sonar Bangla Express");
  const [trainClass, setTrainClass] = useState("Snigdha (AC Chair)");
  const [bogeyNumber, setBogeyNumber] = useState("");
  const [trainSeat, setTrainSeat] = useState("");

  // Specialized Fields for Bus
  const [busOperator, setBusOperator] = useState("Green Line Paribahan");
  const [busCoachType, setBusCoachType] = useState("AC Business Class");
  const [boardingPoint, setBoardingPoint] = useState("");
  const [droppingPoint, setDroppingPoint] = useState("");
  const [busSeat, setBusSeat] = useState("");

  // Specialized Fields for Flight
  const [airline, setAirline] = useState("Biman Bangladesh Airlines");
  const [flightNumber, setFlightNumber] = useState("");
  const [flightClass, setFlightClass] = useState("Economy");

  // Specialized Fields for Event
  const [eventName, setEventName] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventZone, setEventZone] = useState("VIP Pass");

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Auto-generate Title when Category or Specifics change
  useEffect(() => {
    if (category === "TRAIN") {
      setTitle(`${trainName} - ${trainClass}`);
    } else if (category === "BUS") {
      setTitle(`${busOperator} (${busCoachType})`);
    } else if (category === "FLIGHT") {
      setTitle(`${airline} ${flightNumber ? `(${flightNumber})` : ""}`);
    } else if (category === "EVENT") {
      setTitle(eventName ? `${eventName} (${eventZone})` : "Event Ticket");
    }
  }, [category, trainName, trainClass, busOperator, busCoachType, airline, flightNumber, eventName, eventZone]);

  // Handle Document Selection and Immediate Upload
  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setFileError("Document exceeds maximum size of 10MB.");
      return;
    }

    const validExts = ["pdf", "jpg", "jpeg", "png", "webp"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !validExts.includes(ext)) {
      setFileError(`Invalid format (.${ext}). Only PDF and standard images are allowed.`);
      return;
    }

    setFileError("");
    setSelectedFile(file);

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

      setDocumentUrl(data.documentUrl);
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

    if (Number(price) <= 0) {
      setError("Price must be greater than 0 BDT.");
      return;
    }

    // Resolve category-specific metadata
    let resolvedOperator = "";
    let resolvedCoachType = "";
    let resolvedSeat = "";
    let resolvedBoarding = "";
    let resolvedDropping = "";
    let resolvedBogey = "";

    if (category === "TRAIN") {
      resolvedOperator = trainName;
      resolvedCoachType = trainClass;
      resolvedSeat = trainSeat;
      resolvedBogey = bogeyNumber;
    } else if (category === "BUS") {
      resolvedOperator = busOperator;
      resolvedCoachType = busCoachType;
      resolvedSeat = busSeat;
      resolvedBoarding = boardingPoint;
      resolvedDropping = droppingPoint;
    } else if (category === "FLIGHT") {
      resolvedOperator = airline;
      resolvedCoachType = `${flightClass} ${flightNumber ? `(${flightNumber})` : ""}`;
      resolvedSeat = trainSeat || "Assigned at check-in";
    } else if (category === "EVENT") {
      resolvedOperator = eventVenue;
      resolvedCoachType = eventZone;
      resolvedSeat = eventZone;
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
          seatNumber: resolvedSeat.trim() || null,
          ticketType: resolvedCoachType.trim() || null,
          price: Number(price),
          quantity: Number(quantity) || 1,
          ticketCode: ticketCode.trim() || null,
          description: description.trim() || null,
          documentUrl,
          operatorName: resolvedOperator.trim() || null,
          coachType: resolvedCoachType.trim() || null,
          boardingPoint: resolvedBoarding.trim() || null,
          droppingPoint: resolvedDropping.trim() || null,
          bogeyNumber: resolvedBogey.trim() || null,
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

      setSuccess("Ticket analyzed by AI and listed successfully!");
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
              <Link
                href="/login?redirect=/create-listing"
                className="inline-block bg-[#0D9488] text-white px-5 py-2.5 rounded-xl font-bold text-xs"
              >
                Go to Sign In
              </Link>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] py-10 px-4 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-1 rounded-full text-xs font-bold text-[#065F46]">
            <ShieldCheck size={15} />
            <span>AI Verified & Escrow Protected Listing</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[#1E293B] tracking-tight">
            List Your Ticket for Resale
          </h1>
          <p className="text-slate-500 text-xs md:text-sm max-w-xl mx-auto">
            Select your travel mode below. Customized verification forms are provided for Bus, Train, Flight, and Event tickets.
          </p>
        </div>

        {/* ========================================================
            CATEGORY SELECTOR TABS (Bus, Train, Flight, Event)
        ======================================================== */}
        <div className="bg-white p-3 rounded-3xl border border-slate-200 shadow-md">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">
            Step 1: Choose Ticket Category
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              {
                id: "TRAIN",
                label: "Train Ticket",
                sub: "Railway, Bogey & Seat",
                icon: Train,
                color: "from-indigo-600 to-purple-600",
                activeBg: "bg-indigo-50 border-indigo-500 text-indigo-900",
              },
              {
                id: "BUS",
                label: "Bus Ticket",
                sub: "Operator, AC / Sleeper",
                icon: Bus,
                color: "from-teal-600 to-emerald-600",
                activeBg: "bg-teal-50 border-teal-500 text-teal-900",
              },
              {
                id: "FLIGHT",
                label: "Flight / Air",
                sub: "Airline & Flight No.",
                icon: Plane,
                color: "from-sky-600 to-blue-600",
                activeBg: "bg-sky-50 border-sky-500 text-sky-900",
              },
              {
                id: "EVENT",
                label: "Event & Concert",
                sub: "Venue, Gate & Zone",
                icon: Ticket,
                color: "from-amber-600 to-orange-600",
                activeBg: "bg-amber-50 border-amber-500 text-amber-900",
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = category === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategory(tab.id as typeof category)}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? `${tab.activeBg} shadow-sm border-2`
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${tab.color} text-white flex items-center justify-center shrink-0 shadow-sm`}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs">{tab.label}</h3>
                    <p className="text-[10px] text-slate-500">{tab.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================
            FORM CONTAINER
        ======================================================== */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Details Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
            <h2 className="text-base font-black text-[#1E293B] flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles size={18} className="text-teal-600" />
              <span>
                Step 2: Enter {category === "TRAIN" ? "Train" : category === "BUS" ? "Bus" : category === "FLIGHT" ? "Flight" : "Event"} Details
              </span>
            </h2>

            {/* CATEGORY-SPECIFIC INPUTS */}
            {category === "TRAIN" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Bangladesh Railway Train Name *
                  </label>
                  <select
                    value={trainName}
                    onChange={(e) => setTrainName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
                  >
                    <option value="Sonar Bangla Express">Sonar Bangla Express (788/787)</option>
                    <option value="Suborno Express">Suborno Express (701/702)</option>
                    <option value="Parabat Express">Parabat Express (709/710)</option>
                    <option value="Silkcity Express">Silkcity Express (753/754)</option>
                    <option value="Kalni Express">Kalni Express (773/774)</option>
                    <option value="Mahanagar Provati">Mahanagar Provati (703/704)</option>
                    <option value="Chitra Express">Chitra Express (763/764)</option>
                    <option value="Upaban Express">Upaban Express (739/740)</option>
                    <option value="Other Train">Other / Intercity Train</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Train Coach Class *
                  </label>
                  <select
                    value={trainClass}
                    onChange={(e) => setTrainClass(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
                  >
                    <option value="Snigdha (AC Chair)">Snigdha (AC Chair)</option>
                    <option value="AC Berth (Cabin Sleeper)">AC Berth (Cabin Sleeper)</option>
                    <option value="Shovon Chair">Shovon Chair</option>
                    <option value="Shovon">Shovon</option>
                    <option value="First Class Chair">First Class Chair</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Bogey / Compartment (e.g. Ka, Kha, Ga, Cha)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cha, Jha, Bogey 4"
                    value={bogeyNumber}
                    onChange={(e) => setBogeyNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Seat Number(s) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 14, 15 or A1"
                    value={trainSeat}
                    onChange={(e) => setTrainSeat(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            )}

            {category === "BUS" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-teal-50/50 p-4 rounded-2xl border border-teal-100">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Bus Operator Name *
                  </label>
                  <select
                    value={busOperator}
                    onChange={(e) => setBusOperator(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-teal-600"
                  >
                    <option value="Green Line Paribahan">Green Line Paribahan</option>
                    <option value="Shohagh Paribahan">Shohagh Paribahan</option>
                    <option value="Hanif Enterprise">Hanif Enterprise</option>
                    <option value="Ena Transport">Ena Transport</option>
                    <option value="Shyamoli NR Travels">Shyamoli NR Travels</option>
                    <option value="Desh Travels">Desh Travels</option>
                    <option value="Saintmartin Travels">Saintmartin Travels</option>
                    <option value="London Express">London Express</option>
                    <option value="Other Operator">Other Bus Operator</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Bus Coach Type *
                  </label>
                  <select
                    value={busCoachType}
                    onChange={(e) => setBusCoachType(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-teal-600"
                  >
                    <option value="AC Business Class (Hyundai / Scania)">AC Business Class (Hyundai / Scania)</option>
                    <option value="AC Deluxe (Hino 1J)">AC Deluxe (Hino 1J)</option>
                    <option value="Sleeper Coach (Single / Double)">Sleeper Coach (Single / Double)</option>
                    <option value="Non-AC Chair Coach">Non-AC Chair Coach</option>
                    <option value="Double Decker Bus">Double Decker Bus</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Boarding Point / Counter *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sayedabad Counter, Gabtoli, Arambagh"
                    value={boardingPoint}
                    onChange={(e) => setBoardingPoint(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Seat Number(s) (e.g. A1, B2) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A1, B2, C3"
                    value={busSeat}
                    onChange={(e) => setBusSeat(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-teal-600"
                  />
                </div>
              </div>
            )}

            {category === "FLIGHT" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-sky-50/50 p-4 rounded-2xl border border-sky-100">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Airline *
                  </label>
                  <select
                    value={airline}
                    onChange={(e) => setAirline(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-sky-600"
                  >
                    <option value="Biman Bangladesh Airlines">Biman Bangladesh Airlines</option>
                    <option value="US-Bangla Airlines">US-Bangla Airlines</option>
                    <option value="Novoair">Novoair</option>
                    <option value="Air Astra">Air Astra</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Flight Number (e.g. BG-433, BS-101)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BG-433"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-sky-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Cabin Class *
                  </label>
                  <select
                    value={flightClass}
                    onChange={(e) => setFlightClass(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-sky-600"
                  >
                    <option value="Economy Class">Economy Class</option>
                    <option value="Premium Economy">Premium Economy</option>
                    <option value="Business Class">Business Class</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    PNR / Airline Booking Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 6-Character PNR (X94B2Q)"
                    value={ticketCode}
                    onChange={(e) => setTicketCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-sky-600"
                  />
                </div>
              </div>
            )}

            {category === "EVENT" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Event / Concert Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Coke Studio Concert, BPL Cricket Final"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Auditorium / Stadium Venue *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Army Stadium, ICCB Hall 4, Mirpur Stadium"
                    value={eventVenue}
                    onChange={(e) => setEventVenue(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Zone / Tier Type *
                  </label>
                  <select
                    value={eventZone}
                    onChange={(e) => setEventZone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-amber-600"
                  >
                    <option value="VIP Pass">VIP Pass</option>
                    <option value="Fan Zone / Pit">Fan Zone / Pit</option>
                    <option value="General Admission">General Admission</option>
                    <option value="Grand Stand / Gallery">Grand Stand / Gallery</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Ticket / Barcode Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. E-Ticket serial or pass code"
                    value={ticketCode}
                    onChange={(e) => setTicketCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-amber-600"
                  />
                </div>
              </div>
            )}

            {/* ROUTE AND TIMING */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Origin / Departure City *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dhaka"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-teal-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Destination / Arrival City *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chittagong, Cox's Bazar, Sylhet"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-teal-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Travel Date *
                </label>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-teal-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Departure Time *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 08:30 PM"
                  value={travelTime}
                  onChange={(e) => setTravelTime(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-teal-600 focus:bg-white"
                />
              </div>
            </div>

            {/* PRICING & QUANTITY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Resale Asking Price (BDT ৳) *
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 600"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-teal-600 focus:bg-white font-bold text-teal-700"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Fair pricing prevents fraud and ensures faster buyer match.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Available Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-teal-600 focus:bg-white"
                />
              </div>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Listing Notes / Additional Info (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Original ticket printed, buyer can collect at counter or transfer online."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>

            {/* DOCUMENT / TICKET PROOF UPLOAD */}
            <div className="pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Upload Ticket Document (PDF or Image) for AI Verification
              </label>
              <div className="p-4 border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl bg-slate-50 text-center transition">
                <input
                  type="file"
                  id="ticket-doc"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="ticket-doc" className="cursor-pointer space-y-2 block">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                    {uploadingFile ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Upload size={20} />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-teal-700 hover:underline">
                      Click to upload ticket file
                    </span>
                    <p className="text-[10px] text-slate-400">PDF, JPG, PNG up to 10MB</p>
                  </div>
                </label>

                {documentUrl && (
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full">
                    <CheckCircle2 size={13} />
                    <span>Document uploaded & ready for AI verification</span>
                  </div>
                )}
                {fileError && <p className="text-xs text-rose-600 mt-2">{fileError}</p>}
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-bold flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || uploadingFile}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-500 hover:to-emerald-500 text-white font-black text-sm tracking-wide shadow-xl hover:shadow-2xl transition transform active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>
                  {aiAnalyzing ? "Running AI Authenticity Verification..." : "Publishing Listing..."}
                </span>
              </>
            ) : (
              <>
                <span>Publish Ticket Listing</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
