
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  ShieldCheck,
  Ticket,
} from "lucide-react";

type TicketData = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  from: string;
  to: string;
  travelDate: string;
  travelTime: string | null;
  seatNumber: string | null;
  ticketType: string | null;
  price: number;
  quantity: number;
  status: string;
};

type PaymentMethod = "CARD" | "MOBILE_BANKING";

type OrderResponse = {
  success?: boolean;
  message?: string;
  order?: {
    id?: string;
  };
};

export default function CheckoutPage() {
  const router = useRouter();

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [ticketId, setTicketId] = useState("");

  const [quantity, setQuantity] = useState(1);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("CARD");

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [error, setError] = useState("");
  const [orderError, setOrderError] = useState("");

  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  // --------------------------------
  // Get ticket ID from URL
  // --------------------------------

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("ticketId");

    if (!id) {
      setError("Ticket information is missing.");
      setLoading(false);
      return;
    }

    setTicketId(id);
  }, []);

  // --------------------------------
  // Load ticket
  // --------------------------------

  useEffect(() => {
    if (!ticketId) return;

    const loadTicket = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/tickets/${ticketId}`,
          {
            cache: "no-store",
          }
        );

        const responseText = await response.text();

        let data: {
          success?: boolean;
          message?: string;
          ticket?: TicketData;
        } = {};

        try {
          data = responseText
            ? JSON.parse(responseText)
            : {};
        } catch {
          throw new Error(
            `Server returned an invalid response. Status: ${response.status}`
          );
        }

        if (!response.ok || !data.success || !data.ticket) {
          throw new Error(
            data.message || "Failed to load ticket."
          );
        }

        setTicket(data.ticket);

        if (data.ticket.quantity < 1) {
          setError(
            "This ticket is no longer available."
          );
        }
      } catch (err) {
        console.error("Load ticket error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load ticket."
        );
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [ticketId]);

  // --------------------------------
  // Load logged-in user
  // --------------------------------

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const responseText = await response.text();

        let data: {
          success?: boolean;
          user?: {
            fullName?: string;
            email?: string;
            phone?: string | null;
          };
        } = {};

        try {
          data = responseText
            ? JSON.parse(responseText)
            : {};
        } catch {
          console.error(
            "Invalid response from /api/auth/me:",
            responseText
          );
          return;
        }

        if (response.ok && data.success && data.user) {
          setBuyerName(data.user.fullName || "");
          setBuyerEmail(data.user.email || "");
          setBuyerPhone(data.user.phone || "");
        }
      } catch (err) {
        console.error(
          "Failed to load user:",
          err
        );
      }
    };

    loadUser();
  }, []);

  // --------------------------------
  // Price calculation
  // --------------------------------

  const ticketPrice = ticket
    ? ticket.price * quantity
    : 0;

  const serviceFee = Number(
    (ticketPrice * 0.02).toFixed(2)
  );

  const totalAmount = Number(
    (ticketPrice + serviceFee).toFixed(2)
  );

  // --------------------------------
  // Place order
  // --------------------------------

  const handlePlaceOrder = async () => {
    if (!ticket) return;

    setOrderError("");

    if (!buyerName.trim()) {
      setOrderError(
        "Please enter your full name."
      );
      return;
    }

    if (!buyerEmail.trim()) {
      setOrderError(
        "Please enter your email."
      );
      return;
    }

    if (!buyerPhone.trim()) {
      setOrderError(
        "Please enter your phone number."
      );
      return;
    }

    if (quantity < 1) {
      setOrderError(
        "Please select a valid quantity."
      );
      return;
    }

    if (quantity > ticket.quantity) {
      setOrderError(
        `Only ${ticket.quantity} ticket(s) are available.`
      );
      return;
    }

    try {
      setPlacingOrder(true);

      const response = await fetch(
        "/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ticketId: ticket.id,
            quantity,
            paymentMethod,
          }),
        }
      );

      // --------------------------------
      // Read response safely
      // --------------------------------

      const responseText =
        await response.text();

      let data: OrderResponse = {};

      if (responseText.trim()) {
        try {
          data = JSON.parse(
            responseText
          ) as OrderResponse;
        } catch (parseError) {
          console.error(
            "Invalid JSON response from /api/orders:",
            parseError
          );

          console.error(
            "Server response:",
            responseText
          );

          throw new Error(
            `Server returned an invalid response. Status: ${response.status}`
          );
        }
      }

      // --------------------------------
      // Check API response
      // --------------------------------

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to place order."
        );
      }

      if (!data.success) {
        throw new Error(
          data.message ||
            "Failed to place order."
        );
      }

      // --------------------------------
      // Get order ID
      // --------------------------------

      const orderId =
        data.order?.id;

      if (!orderId) {
        console.error(
          "Order API response:",
          data
        );

        throw new Error(
          "Order was created, but order ID was not returned."
        );
      }

      // --------------------------------
      // Redirect to order success
      // --------------------------------

      router.push(
        `/order-success?orderId=${orderId}`
      );
    } catch (err) {
      console.error(
        "Order error:",
        err
      );

      setOrderError(
        err instanceof Error
          ? err.message
          : "Failed to place order."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  // --------------------------------
  // Loading
  // --------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />

          <p className="text-slate-600">
            Loading checkout...
          </p>
        </div>
      </main>
    );
  }

  // --------------------------------
  // Error
  // --------------------------------

  if (error || !ticket) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <Ticket className="h-7 w-7 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Checkout unavailable
          </h1>

          <p className="mt-3 text-slate-600">
            {error ||
              "Ticket information could not be loaded."}
          </p>

          <Link
            href="/tickets"
            className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Browse Tickets
          </Link>
        </div>
      </main>
    );
  }

  // --------------------------------
  // Main checkout
  // --------------------------------

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}

        <div className="mb-8">
          <Link
            href={`/tickets/${ticket.id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to ticket
          </Link>

          <h1 className="mt-5 text-3xl font-bold text-slate-900">
            Secure Checkout
          </h1>

          <p className="mt-2 text-slate-600">
            Review your ticket and complete your order.
          </p>
        </div>

        {/* Order Error */}

        {orderError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {orderError}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* LEFT */}

          <div className="space-y-6">

            {/* Ticket summary */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-5 flex items-start justify-between gap-4">

                <div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase text-blue-700">
                    {ticket.category}
                  </span>

                  <h2 className="mt-3 text-xl font-bold text-slate-900">
                    {ticket.title}
                  </h2>
                </div>

                <div className="text-right">
                  <p className="text-sm text-slate-500">
                    Price
                  </p>

                  <p className="text-xl font-bold text-slate-900">
                    ৳
                    {ticket.price.toLocaleString()}
                  </p>
                </div>

              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    From
                  </div>

                  <p className="mt-1 font-semibold text-slate-900">
                    {ticket.from}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    To
                  </div>

                  <p className="mt-1 font-semibold text-slate-900">
                    {ticket.to}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CalendarDays className="h-4 w-4" />
                    Travel Date
                  </div>

                  <p className="mt-1 font-semibold text-slate-900">
                    {new Date(
                      ticket.travelDate
                    ).toLocaleDateString(
                      "en-BD",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Seat
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {ticket.seatNumber ||
                      "Not specified"}
                  </p>
                </div>

              </div>
            </section>

            {/* Buyer Information */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                Buyer Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your account information will be used for this order.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) =>
                      setBuyerName(
                        e.target.value
                      )
                    }
                    placeholder="Your full name"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    value={buyerPhone}
                    onChange={(e) =>
                      setBuyerPhone(
                        e.target.value
                      )
                    }
                    placeholder="01XXXXXXXXX"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) =>
                      setBuyerEmail(
                        e.target.value
                      )
                    }
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

              </div>
            </section>

            {/* Quantity */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                Ticket Quantity
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Available tickets:{" "}
                {ticket.quantity}
              </p>

              <div className="mt-5 flex items-center gap-4">

                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() =>
                    setQuantity(
                      (value) =>
                        Math.max(
                          1,
                          value - 1
                        )
                    )
                  }
                  className="h-11 w-11 rounded-lg border border-slate-300 text-xl font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  −
                </button>

                <div className="flex h-11 min-w-16 items-center justify-center rounded-lg border border-slate-300 px-4 font-semibold">
                  {quantity}
                </div>

                <button
                  type="button"
                  disabled={
                    quantity >=
                    ticket.quantity
                  }
                  onClick={() =>
                    setQuantity(
                      (value) =>
                        Math.min(
                          ticket.quantity,
                          value + 1
                        )
                    )
                  }
                  className="h-11 w-11 rounded-lg border border-slate-300 text-xl font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +
                </button>

              </div>
            </section>

            {/* Payment */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                Payment Method
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod("CARD")
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    paymentMethod === "CARD"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">

                    <CreditCard className="h-6 w-6 text-blue-600" />

                    <div>
                      <p className="font-semibold text-slate-900">
                        Card
                      </p>

                      <p className="text-sm text-slate-500">
                        Visa / Mastercard
                      </p>
                    </div>

                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod(
                      "MOBILE_BANKING"
                    )
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    paymentMethod ===
                    "MOBILE_BANKING"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">

                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-pink-100 text-xs font-bold text-pink-600">
                      ৳
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900">
                        Mobile Banking
                      </p>

                      <p className="text-sm text-slate-500">
                        bKash / Nagad
                      </p>
                    </div>

                  </div>
                </button>

              </div>

              <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                Real payment gateway integration will be connected in the payment phase.
                This order currently records the selected payment method.
              </div>

            </section>
          </div>

          {/* RIGHT */}

          <aside className="lg:sticky lg:top-6 lg:self-start">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-500">
                    Ticket price
                  </span>

                  <span className="font-medium text-slate-900">
                    ৳
                    {ticketPrice.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-500">
                    Quantity
                  </span>

                  <span className="font-medium text-slate-900">
                    {quantity}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-500">
                    Service fee
                  </span>

                  <span className="font-medium text-slate-900">
                    ৳
                    {serviceFee.toLocaleString()}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-4">

                  <div className="flex justify-between gap-4">

                    <span className="font-semibold text-slate-900">
                      Total
                    </span>

                    <span className="text-2xl font-bold text-blue-600">
                      ৳
                      {totalAmount.toLocaleString()}
                    </span>

                  </div>

                </div>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={
                  placingOrder ||
                  ticket.quantity < 1
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {placingOrder ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Place Order
                  </>
                )}
              </button>

              <div className="mt-5 flex items-start gap-3 rounded-xl bg-green-50 p-4">

                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

                <div>
                  <p className="font-semibold text-green-800">
                    Secure Checkout
                  </p>

                  <p className="mt-1 text-xs leading-5 text-green-700">
                    Your order is processed securely and your ticket
                    availability is checked before confirmation.
                  </p>
                </div>

              </div>

            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

