
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  ShoppingBag,
  Ticket,
  User,
} from "lucide-react";

type Order = {
  id: string;
  quantity: number;
  totalAmount: number;
  status: string;
  paymentMethod: string | null;
  createdAt: string;

  ticket: {
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
  };

  buyer: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
};

export default function OrderSuccessPage() {
  const [order, setOrder] = useState<Order | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const params = new URLSearchParams(
          window.location.search
        );

        const orderId = params.get("orderId");

        if (!orderId) {
          setError("Order ID is missing.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/orders/${orderId}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load order."
          );
        }

        setOrder(data.order);
      } catch (err) {
        console.error("Order loading error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load order."
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />

          <p className="text-slate-600">
            Loading your order...
          </p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <Ticket className="h-7 w-7 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Order could not be loaded
          </h1>

          <p className="mt-3 text-slate-600">
            {error || "Something went wrong."}
          </p>

          <Link
            href="/dashboard"
            className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const ticketTotal =
    order.ticket.price * order.quantity;

  const serviceFee = Number(
    (ticketTotal * 0.02).toFixed(2)
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">

        {/* Success header */}

        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-11 w-11 text-green-600" />
          </div>

          <h1 className="mt-5 text-3xl font-bold text-slate-900">
            Order Placed Successfully!
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            Your order has been created successfully. Keep your
            order ID for future reference.
          </p>
        </div>

        {/* Order ID */}

        <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
          <p className="text-sm font-medium text-green-700">
            Order ID
          </p>

          <p className="mt-1 break-all text-lg font-bold text-green-900">
            {order.id}
          </p>

          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-green-700">
            <Clock3 className="h-4 w-4" />

            {new Date(order.createdAt).toLocaleString(
              "en-BD",
              {
                dateStyle: "medium",
                timeStyle: "short",
              }
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* Main */}

          <div className="space-y-6">

            {/* Ticket */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-start justify-between gap-4">

                <div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase text-blue-700">
                    {order.ticket.category}
                  </span>

                  <h2 className="mt-3 text-xl font-bold text-slate-900">
                    {order.ticket.title}
                  </h2>
                </div>

                <div className="text-right">
                  <p className="text-sm text-slate-500">
                    Status
                  </p>

                  <span
                    className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      order.status === "CONFIRMED"
                        ? "bg-green-100 text-green-700"
                        : order.status === "CANCELLED"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

              </div>

              {/* Route */}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    From
                  </div>

                  <p className="mt-1 font-semibold text-slate-900">
                    {order.ticket.from}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    To
                  </div>

                  <p className="mt-1 font-semibold text-slate-900">
                    {order.ticket.to}
                  </p>
                </div>

              </div>

              {/* Travel details */}

              <div className="mt-4 grid gap-4 sm:grid-cols-3">

                <div>
                  <p className="text-sm text-slate-500">
                    Travel Date
                  </p>

                  <p className="mt-1 flex items-center gap-2 font-semibold text-slate-900">
                    <CalendarDays className="h-4 w-4 text-blue-600" />

                    {new Date(
                      order.ticket.travelDate
                    ).toLocaleDateString("en-BD", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Travel Time
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {order.ticket.travelTime ||
                      "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Seat
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {order.ticket.seatNumber ||
                      "Not specified"}
                  </p>
                </div>

              </div>

            </section>

            {/* Buyer */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                  <User className="h-5 w-5 text-blue-600" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Buyer Information
                  </h2>

                  <p className="text-sm text-slate-500">
                    Information associated with this order
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">

                <div>
                  <p className="text-sm text-slate-500">
                    Name
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {order.buyer.fullName}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Email
                  </p>

                  <p className="mt-1 break-all font-semibold text-slate-900">
                    {order.buyer.email}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Phone
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {order.buyer.phone ||
                      "Not provided"}
                  </p>
                </div>

              </div>
            </section>

          </div>

          {/* Summary */}

          <aside className="lg:sticky lg:top-6 lg:self-start">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-center gap-3">
                <ShoppingBag className="h-6 w-6 text-blue-600" />

                <h2 className="text-xl font-bold text-slate-900">
                  Payment Summary
                </h2>
              </div>

              <div className="mt-6 space-y-4">

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Ticket price
                  </span>

                  <span className="font-medium">
                    ৳{ticketTotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Quantity
                  </span>

                  <span className="font-medium">
                    {order.quantity}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Service fee
                  </span>

                  <span className="font-medium">
                    ৳{serviceFee.toLocaleString()}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">
                      Total Paid
                    </span>

                    <span className="text-xl font-bold text-blue-600">
                      ৳{order.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Payment method
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {order.paymentMethod === "CARD"
                    ? "Card"
                    : order.paymentMethod ===
                      "MOBILE_BANKING"
                    ? "Mobile Banking"
                    : "Not specified"}
                </p>
              </div>

            </div>

            {/* Actions */}

            <div className="mt-4 grid gap-3">

              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/tickets"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Browse More Tickets
              </Link>

            </div>

          </aside>

        </div>
      </div>
    </main>
  );
}

