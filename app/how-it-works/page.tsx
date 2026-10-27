import Link from "next/link";
import { FileCheck2, Search, ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Find a listing or add your ticket",
    description:
      "Browse by transport or event category. Sellers provide route or venue details, ticket class, price, and the original ticket PDF.",
    icon: Search,
  },
  {
    number: "02",
    title: "Review the ticket details",
    description:
      "The platform checks required details, PDF format, and possible duplicate listings. Some submissions can be held for administrator review before they become available.",
    icon: FileCheck2,
  },
  {
    number: "03",
    title: "Track the order in your account",
    description:
      "Place an order through checkout and follow its status from your dashboard. Keep ticket transfer and order updates inside the platform workflow.",
    icon: ShoppingBag,
  },
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="bg-[#172238] text-white px-4 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm font-semibold text-teal-300">TicketLagbe marketplace</p>
          <h1 className="mt-3 max-w-3xl text-3xl sm:text-4xl font-bold leading-tight">
            Clear steps for buying and listing tickets
          </h1>
          <p className="mt-4 max-w-2xl text-sm sm:text-base leading-7 text-slate-300">
            Ticket listings, document checks, and order status are managed in one place. Here is what happens at each step.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <ol className="divide-y divide-slate-200">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.number} className="grid grid-cols-[3.5rem_1fr] sm:grid-cols-[5rem_1fr] gap-4 sm:gap-6 py-7 first:pt-0 last:pb-0">
                <div className="flex flex-col items-center gap-3">
                  <span className="text-sm font-bold text-teal-700">{step.number}</span>
                  <Icon size={24} className="text-slate-500" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold">{step.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="border-y border-amber-200 bg-amber-50 px-4 py-6">
        <div className="max-w-5xl mx-auto flex items-start gap-3">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-amber-800" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-bold text-amber-950">Payment mode</h2>
            <p className="mt-1 max-w-4xl text-sm leading-6 text-amber-900">
              Payment rails in this project are currently sandbox/manual flows. Do not send real money or treat an order as a live escrow transfer until production payment providers and settlement operations are configured.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-10 flex flex-col sm:flex-row gap-3">
        <Link href="/tickets" className="inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-5 py-3 rounded-lg text-sm font-semibold">
          Browse tickets <ArrowRight size={16} />
        </Link>
        <Link href="/create-listing" className="inline-flex items-center justify-center border border-slate-300 hover:bg-slate-50 px-5 py-3 rounded-lg text-sm font-semibold">
          List a ticket
        </Link>
      </section>
    </main>
  );
}