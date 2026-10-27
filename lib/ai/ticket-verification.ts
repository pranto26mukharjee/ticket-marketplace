import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";
import { prisma } from "@/lib/prisma";
import { TICKET_CATEGORY_CONFIG, type TicketCategory } from "@/lib/ticket-categories";

/*
|--------------------------------------------------------------------------
| Ticket verification pipeline
|--------------------------------------------------------------------------
| 1. Claude reads the uploaded PDF and extracts what the ticket actually says.
|    It is NOT shown the seller's claims, so it cannot be steered by them.
| 2. Deterministic code compares the extraction against the listing
|    (route, date, seat, reference, operator, face value, quantity).
| 3. Marketplace checks: duplicate file / booking reference / seat, expiry,
|    seller trust signals.
| 4. Any hard failure rejects; any warning, or AI being unavailable, sends the
|    listing to the admin review queue; only a clean pass goes live.
*/

const VERIFICATION_MODEL = "claude-opus-5-5";
const AI_TIMEOUT_MS = 90_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CheckStatus = "PASS" | "WARN" | "FAIL" | "SKIP";

export interface VerificationCheck {
  key: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface TicketVerificationInput {
  category: TicketCategory;
  title: string;
  from: string;
  to: string;
  travelDate: Date;
  travelTime?: string | null;
  seatNumber?: string | null;
  ticketType?: string | null;
  price: number;
  quantity: number;
  ticketCode?: string | null;
  listingDetails: Record<string, string>;
  sellerId: string;
  document: { id: string; sha256: string; data: Uint8Array };
}

export interface VerificationResult {
  status: "VERIFIED" | "UNDER_REVIEW" | "REJECTED";
  confidenceScore: number;
  decision: string;
  riskFactors: string[];
  checks: VerificationCheck[];
  extractedData: {
    engine: "claude" | "rules-only";
    model?: string;
    aiError?: string;
    extraction: TicketExtraction | null;
    bookingRef?: string | null;
  };
}

const ExtractionSchema = z.object({
  isTicketDocument: z
    .boolean()
    .describe("True only if this is a genuine booking/e-ticket/boarding pass, not a receipt, screenshot of a chat, or unrelated file."),
  documentType: z
    .string()
    .describe("Short description, e.g. 'Bangladesh Railway e-ticket', 'airline e-ticket itinerary', 'cinema booking'."),
  issuer: z.string().nullable().describe("Operator/airline/organizer that issued the ticket."),
  serviceIdentifier: z
    .string()
    .nullable()
    .describe("Train name/number, flight number, bus coach number, vessel name, or show/screen identifier."),
  bookingReference: z.string().nullable().describe("PNR / ticket number / booking ID exactly as printed."),
  passengerNames: z.array(z.string()).describe("Names printed on the ticket, if any."),
  origin: z.string().nullable().describe("Departure station/airport/terminal, or city for events."),
  destination: z.string().nullable().describe("Arrival station/airport/terminal, or venue for events."),
  travelDate: z.string().nullable().describe("Journey/show date as YYYY-MM-DD."),
  departureTime: z.string().nullable().describe("Departure/show time as HH:MM 24-hour."),
  seats: z.array(z.string()).describe("Every seat/berth/cabin/zone printed, e.g. ['KA-12', 'KA-13']."),
  ticketCount: z.number().int().nullable().describe("Number of tickets/passengers covered by this document."),
  seatClass: z.string().nullable().describe("Class or tier, e.g. 'Snigdha', 'Economy', 'VIP'."),
  totalFare: z.number().nullable().describe("Total amount paid for the whole document, as a number."),
  currency: z.string().nullable().describe("ISO currency code, e.g. BDT."),
  issueDate: z.string().nullable().describe("Date the ticket was issued/purchased as YYYY-MM-DD."),
  tamperingSignals: z
    .array(z.string())
    .describe("Concrete visual signs of editing: mismatched fonts, misaligned or overwritten fields, inconsistent totals, placeholder text, re-photographed screen. Empty if none."),
  tamperingRisk: z.enum(["none", "low", "medium", "high"]),
  legibility: z.enum(["clear", "partial", "poor"]),
  notes: z.string().describe("One or two sentences on anything an examiner should know."),
});

export type TicketExtraction = z.infer<typeof ExtractionSchema>;

// ---------------------------------------------------------------------------
// Claude extraction
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a document examiner for TicketLagbe, a ticket resale marketplace in Bangladesh.
You receive the PDF a seller uploaded as proof of their ticket (train, bus, launch, flight, concert, festival, or cinema).

Report what the document itself shows. Copy values exactly as printed; use null or an empty list for anything not present rather than guessing. Bangla text is common: transliterate place names to their usual English spelling (e.g. "ঢাকা" -> "Dhaka", "চট্টগ্রাম" -> "Chattogram").

Judge authenticity from the document alone: layout typical of the issuer, consistent fonts and alignment, totals that add up, plausible codes. Only list tampering signals you can point to on the page.`;

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic({ timeout: AI_TIMEOUT_MS, maxRetries: 1 });
  return client;
}

async function extractTicketWithClaude(
  pdf: Uint8Array,
  categoryLabel: string
): Promise<{ extraction: TicketExtraction | null; error?: string }> {
  const anthropic = getClient();
  if (!anthropic) {
    return { extraction: null, error: "ANTHROPIC_API_KEY is not configured." };
  }

  try {
    const response = await anthropic.beta.messages.parse({
      model: VERIFICATION_MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "medium",
        format: betaZodOutputFormat(ExtractionSchema),
      },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: Buffer.from(pdf).toString("base64"),
              },
            },
            {
              type: "text",
              text: `The seller listed this as a ${categoryLabel} ticket. Extract the ticket details.`,
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return { extraction: null, error: "The AI model declined to analyse this document." };
    }

    if (!response.parsed_output) {
      return { extraction: null, error: `AI returned no structured result (stop_reason: ${response.stop_reason}).` };
    }

    return { extraction: response.parsed_output };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return { extraction: null, error: "AI service is busy (rate limited)." };
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Claude ticket extraction API error:", error.status, error.message);
      return { extraction: null, error: `AI service error (${error.status ?? "network"}).` };
    }
    console.error("Claude ticket extraction failed:", error);
    return { extraction: null, error: "AI analysis failed unexpectedly." };
  }
}

// ---------------------------------------------------------------------------
// Comparison helpers
// ---------------------------------------------------------------------------

// Common alternate spellings of Bangladeshi places and venues.
const PLACE_ALIASES: Record<string, string> = {
  chittagong: "chattogram",
  ctg: "chattogram",
  dacca: "dhaka",
  dac: "dhaka",
  cgp: "chattogram",
  cxb: "coxsbazar",
  zyl: "sylhet",
  jsr: "jessore",
  jashore: "jessore",
  rjh: "rajshahi",
  spd: "saidpur",
  bzl: "barisal",
  barishal: "barisal",
  comilla: "cumilla",
  bogra: "bogura",
  kamalapur: "dhaka",
  airport: "dhakaairport",
};

const STOP_WORDS = new Set([
  "railway", "station", "rail", "bus", "terminal", "counter", "launch", "ghat",
  "airport", "international", "intl", "the", "of", "stand", "junction", "jn",
]);

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/['’`]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !STOP_WORDS.has(t))
    .map((t) => PLACE_ALIASES[t] ?? t);
}

/** True if the two place/venue strings plausibly name the same place. */
function placesMatch(claimed: string, extracted: string | null): boolean | null {
  if (!extracted) return null;
  const a = tokens(claimed);
  const b = tokens(extracted);
  if (a.length === 0 || b.length === 0) return null;
  const joinedA = a.join("");
  const joinedB = b.join("");
  if (joinedA === joinedB || joinedA.includes(joinedB) || joinedB.includes(joinedA)) return true;
  return a.some((t) => t.length > 2 && b.includes(t));
}

function normalizeCode(value: string | null | undefined): string {
  return (value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function textsOverlap(a: string, b: string | null): boolean | null {
  if (!a.trim() || !b) return null;
  const na = normalizeCode(a);
  const nb = normalizeCode(b);
  if (!na || !nb) return null;
  return na.includes(nb) || nb.includes(na) || tokens(a).some((t) => t.length > 2 && tokens(b).includes(t));
}

/** Calendar date of the listing in Bangladesh time, YYYY-MM-DD. */
function dhakaDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(date);
}

function minutesOf(time: string | null | undefined): number | null {
  const match = (time || "").match(/(\d{1,2})[:.](\d{2})\s*(am|pm)?/i);
  if (!match) return null;
  let hours = Number(match[1]) % 24;
  const ampm = match[3]?.toLowerCase();
  if (ampm === "pm" && hours < 12) hours += 12;
  if (ampm === "am" && hours === 12) hours = 0;
  return hours * 60 + Number(match[2]);
}

// ---------------------------------------------------------------------------
// Duplicate & trust checks (database)
// ---------------------------------------------------------------------------

export async function checkDuplicateTicket(params: {
  from: string;
  to: string;
  travelDate: Date | string;
  seatNumber?: string | null;
  ticketCode?: string | null;
  excludeTicketId?: string;
}): Promise<{ isDuplicate: boolean; matchedTicketId?: string }> {
  // Without a seat or a booking reference, two listings on the same route and
  // day are normal (many passengers travel), so there is nothing to compare.
  if (!params.seatNumber?.trim() && !params.ticketCode?.trim()) {
    return { isDuplicate: false };
  }

  try {
    const travelDate = new Date(params.travelDate);
    const startOfDay = new Date(travelDate.getTime() - 24 * 60 * 60 * 1000);
    const endOfDay = new Date(travelDate.getTime() + 24 * 60 * 60 * 1000);

    const match = await prisma.ticket.findFirst({
      where: {
        id: params.excludeTicketId ? { not: params.excludeTicketId } : undefined,
        ticketStatus: { in: ["AVAILABLE", "SOLD", "PENDING_REVIEW", "PAUSED"] },
        OR: [
          ...(params.ticketCode?.trim()
            ? [{ ticketCode: { equals: params.ticketCode.trim(), mode: "insensitive" as const } }]
            : []),
          ...(params.seatNumber?.trim()
            ? [{
                from: { equals: params.from.trim(), mode: "insensitive" as const },
                to: { equals: params.to.trim(), mode: "insensitive" as const },
                travelDate: { gte: startOfDay, lte: endOfDay },
                seatNumber: { equals: params.seatNumber.trim(), mode: "insensitive" as const },
              }]
            : []),
        ],
      },
      select: { id: true },
    });

    return { isDuplicate: Boolean(match), matchedTicketId: match?.id };
  } catch (error) {
    console.error("Duplicate ticket check error:", error);
    return { isDuplicate: false };
  }
}

async function loadSellerSignals(sellerId: string) {
  const [seller, rejectedListings, openAlerts, completedSales] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sellerId },
      select: { createdAt: true, fullName: true, profile: { select: { identityVerified: true, fullName: true } } },
    }),
    prisma.ticketVerification.count({ where: { requestedById: sellerId, verificationStatus: "REJECTED" } }),
    prisma.fraudAlert.count({ where: { relatedUserId: sellerId, alertStatus: "OPEN" } }),
    prisma.order.count({ where: { ticket: { sellerId }, orderStatus: "COMPLETED" } }),
  ]);
  return { seller, rejectedListings, openAlerts, completedSales };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function verifyTicket(input: TicketVerificationInput): Promise<VerificationResult> {
  const config = TICKET_CATEGORY_CONFIG[input.category];
  const checks: VerificationCheck[] = [];
  const add = (key: string, label: string, status: CheckStatus, detail: string) =>
    checks.push({ key, label, status, detail });

  const [ai, duplicateFile, duplicateListing, signals] = await Promise.all([
    extractTicketWithClaude(input.document.data, config.label),
    prisma.ticketDocument.findFirst({
      where: {
        sha256: input.document.sha256,
        id: { not: input.document.id },
        // A rejected listing may be corrected and resubmitted with the same PDF
        ticket: { ticketStatus: { notIn: ["REJECTED", "CANCELLED"] } },
      },
      select: { ticketId: true },
    }),
    checkDuplicateTicket({
      from: input.from,
      to: input.to,
      travelDate: input.travelDate,
      seatNumber: input.seatNumber,
      ticketCode: input.ticketCode,
    }),
    loadSellerSignals(input.sellerId),
  ]);

  const ex = ai.extraction;

  // --- Listing sanity -------------------------------------------------------
  const now = Date.now();
  // Compare calendar days in Dhaka: a ticket for later today is still valid.
  if (dhakaDate(input.travelDate) < dhakaDate(new Date(now))) {
    add("date_valid", "Travel date", "FAIL", "The travel/show date has already passed.");
  } else if (input.travelDate.getTime() > now + 365 * 24 * 60 * 60 * 1000) {
    add("date_valid", "Travel date", "WARN", "Date is more than 12 months away.");
  } else {
    add("date_valid", "Travel date", "PASS", "Date is in the future.");
  }

  // --- Marketplace duplicates ----------------------------------------------
  if (duplicateFile) {
    add("duplicate_file", "Unique document", "FAIL", "This exact PDF is already attached to another listing.");
  } else {
    add("duplicate_file", "Unique document", "PASS", "This PDF has not been used in another listing.");
  }

  if (duplicateListing.isDuplicate) {
    add("duplicate_listing", "Unique seat / reference", "FAIL", "Another listing already uses this booking reference or the same seat on this route and date.");
  } else {
    add("duplicate_listing", "Unique seat / reference", "PASS", "No other listing uses this seat or booking reference.");
  }

  // --- Document analysis ----------------------------------------------------
  if (!ex) {
    add("ai_analysis", "AI document analysis", "WARN", `Automatic analysis unavailable: ${ai.error} An admin will check the PDF manually.`);
  } else {
    add(
      "ai_analysis",
      "AI document analysis",
      ex.isTicketDocument ? "PASS" : "FAIL",
      ex.isTicketDocument
        ? `Recognised as: ${ex.documentType}.`
        : `The uploaded file does not look like a ticket (${ex.documentType}).`
    );

    if (ex.legibility === "poor") {
      add("legibility", "Document legibility", "WARN", "Large parts of the document are unreadable.");
    }

    if (ex.tamperingRisk === "high") {
      add("tampering", "Tampering check", "FAIL", `Signs of editing: ${ex.tamperingSignals.join("; ") || "high risk reported"}.`);
    } else if (ex.tamperingRisk === "medium" || ex.tamperingSignals.length > 0) {
      add("tampering", "Tampering check", "WARN", `Possible irregularities: ${ex.tamperingSignals.join("; ") || "medium risk reported"}.`);
    } else {
      add("tampering", "Tampering check", "PASS", "No visual signs of editing found.");
    }

    // Route / venue
    const fromOk = placesMatch(input.from, ex.origin);
    const toOk = placesMatch(input.to, ex.destination);
    if (fromOk === false || toOk === false) {
      add("route", `${config.fromLabel} / ${config.toLabel}`, "FAIL",
        `Listing says ${input.from} → ${input.to}, document shows ${ex.origin ?? "?"} → ${ex.destination ?? "?"}.`);
    } else if (fromOk === null || toOk === null) {
      add("route", `${config.fromLabel} / ${config.toLabel}`, "WARN", "Could not read the full route/venue from the document.");
    } else {
      add("route", `${config.fromLabel} / ${config.toLabel}`, "PASS", `Matches document: ${ex.origin} → ${ex.destination}.`);
    }

    // Date
    const listedDate = dhakaDate(input.travelDate);
    if (!ex.travelDate) {
      add("date_match", config.dateLabel, "WARN", "No date found on the document.");
    } else if (ex.travelDate !== listedDate) {
      add("date_match", config.dateLabel, "FAIL", `Listing date ${listedDate} does not match the document (${ex.travelDate}).`);
    } else {
      add("date_match", config.dateLabel, "PASS", `Matches document (${ex.travelDate}).`);
    }

    // Time (soft: listings often round times)
    const listedMinutes = minutesOf(input.travelTime);
    const docMinutes = minutesOf(ex.departureTime);
    if (listedMinutes !== null && docMinutes !== null) {
      const diff = Math.abs(listedMinutes - docMinutes);
      add("time_match", config.timeLabel, diff <= 30 ? "PASS" : "WARN",
        diff <= 30 ? `Matches document (${ex.departureTime}).` : `Listing time ${input.travelTime} differs from document (${ex.departureTime}).`);
    }

    // Seat
    if (input.seatNumber?.trim()) {
      const seatOk = ex.seats.some((seat) => {
        const a = normalizeCode(seat);
        const b = normalizeCode(input.seatNumber);
        return a === b || a.endsWith(b) || b.endsWith(a);
      });
      if (ex.seats.length === 0) {
        add("seat_match", config.seatLabel, "WARN", "No seat information found on the document.");
      } else {
        add("seat_match", config.seatLabel, seatOk ? "PASS" : "FAIL",
          seatOk ? `Seat found on document (${ex.seats.join(", ")}).` : `Seat ${input.seatNumber} is not on the document (shows ${ex.seats.join(", ")}).`);
      }
    }

    // Booking reference
    if (input.ticketCode?.trim() && ex.bookingReference) {
      const refOk = normalizeCode(input.ticketCode) === normalizeCode(ex.bookingReference);
      add("reference_match", config.referenceLabel, refOk ? "PASS" : "FAIL",
        refOk ? "Matches the document." : "The reference you entered does not match the one printed on the ticket.");
    } else if (!ex.bookingReference) {
      add("reference_match", config.referenceLabel, "WARN", "No booking reference found on the document.");
    }

    // Operator / service number from category-specific fields
    const operatorClaim = input.listingDetails.operator || input.listingDetails.airline || input.listingDetails.organizer || input.listingDetails.cinema || "";
    const serviceClaim = input.listingDetails.trainNumber || input.listingDetails.flightNumber || input.listingDetails.vesselName || input.listingDetails.screen || "";
    const operatorOk = textsOverlap(operatorClaim, ex.issuer);
    const serviceOk = textsOverlap(serviceClaim, ex.serviceIdentifier);
    if (operatorOk === false || serviceOk === false) {
      add("operator_match", "Operator / service", "WARN",
        `Listing: ${[operatorClaim, serviceClaim].filter(Boolean).join(" ")}; document: ${[ex.issuer, ex.serviceIdentifier].filter(Boolean).join(" ") || "not found"}.`);
    } else if (operatorOk || serviceOk) {
      add("operator_match", "Operator / service", "PASS", `Matches document (${[ex.issuer, ex.serviceIdentifier].filter(Boolean).join(" ")}).`);
    }

    // Quantity
    const docCount = ex.ticketCount ?? (ex.seats.length || null);
    if (docCount !== null && input.quantity > docCount) {
      add("quantity", "Quantity", "FAIL", `Listing offers ${input.quantity} tickets but the document covers only ${docCount}.`);
    } else if (docCount !== null) {
      add("quantity", "Quantity", "PASS", `Document covers ${docCount} ticket(s).`);
    }

    // Face value vs asking price (BDT only)
    if (ex.totalFare && (!ex.currency || ex.currency.toUpperCase() === "BDT")) {
      const facePerTicket = ex.totalFare / Math.max(1, docCount ?? 1);
      const ratio = input.price / facePerTicket;
      if (ratio > 2) {
        add("price", "Price vs face value", "FAIL", `Asking ৳${input.price} is more than double the face value (৳${Math.round(facePerTicket)}).`);
      } else if (ratio > 1.2) {
        add("price", "Price vs face value", "WARN", `Asking ৳${input.price} is above the face value (৳${Math.round(facePerTicket)}).`);
      } else {
        add("price", "Price vs face value", "PASS", `At or below face value (৳${Math.round(facePerTicket)}).`);
      }
    }

    // Name on ticket (resale often needs a name change, so warn only)
    const sellerNames = [signals.seller?.fullName, signals.seller?.profile?.fullName].filter(Boolean) as string[];
    if (ex.passengerNames.length > 0 && sellerNames.length > 0) {
      const nameOk = ex.passengerNames.some((name) => sellerNames.some((s) => textsOverlap(s, name)));
      if (!nameOk && (input.category === "TRAIN" || input.category === "FLIGHT")) {
        add("passenger_name", "Name on ticket", "WARN",
          `Ticket is issued to ${ex.passengerNames.join(", ")}, not the seller. ${config.label} tickets are usually name-bound; buyer may need a name change.`);
      } else {
        add("passenger_name", "Name on ticket", "PASS", nameOk ? "Matches the seller's name." : "Name differs; transferable ticket type.");
      }
    }
  }

  // --- Seller trust ---------------------------------------------------------
  if (signals.seller) {
    const ageDays = (now - signals.seller.createdAt.getTime()) / (24 * 60 * 60 * 1000);
    const trustIssues: string[] = [];
    if (ageDays < 2 && signals.completedSales === 0) trustIssues.push("brand-new account with no sales");
    if (signals.rejectedListings >= 2) trustIssues.push(`${signals.rejectedListings} previously rejected listings`);
    if (signals.openAlerts > 0) trustIssues.push(`${signals.openAlerts} open fraud alert(s)`);

    add("seller_trust", "Seller history", trustIssues.length ? "WARN" : "PASS",
      trustIssues.length
        ? `Needs a manual look: ${trustIssues.join(", ")}.`
        : `${signals.completedSales} completed sale(s)${signals.seller.profile?.identityVerified ? ", ID verified" : ""}.`);
  }

  // --- Decision -------------------------------------------------------------
  const fails = checks.filter((c) => c.status === "FAIL");
  const warns = checks.filter((c) => c.status === "WARN");
  const passes = checks.filter((c) => c.status === "PASS");
  const scored = fails.length + warns.length + passes.length;

  const confidenceScore = scored === 0
    ? 0
    : Math.max(0.01, Math.min(1, Number(((passes.length + warns.length * 0.5) / scored - fails.length * 0.25).toFixed(2))));

  let status: VerificationResult["status"];
  let decision: string;

  if (fails.length > 0) {
    status = "REJECTED";
    decision = `Verification failed: ${fails.map((c) => c.detail).join(" ")}`;
  } else if (warns.length > 0 || !ex) {
    status = "UNDER_REVIEW";
    decision = `Sent to manual review: ${warns.map((c) => c.detail).join(" ")}`;
  } else {
    status = "VERIFIED";
    decision = "All checks passed: the document matches the listing and no duplicates were found.";
  }

  return {
    status,
    confidenceScore,
    decision,
    riskFactors: [...fails, ...warns].map((c) => c.detail),
    checks,
    extractedData: {
      engine: ex ? "claude" : "rules-only",
      model: ex ? VERIFICATION_MODEL : undefined,
      aiError: ai.error,
      extraction: ex,
      bookingRef: ex?.bookingReference ?? input.ticketCode ?? null,
    },
  };
}
