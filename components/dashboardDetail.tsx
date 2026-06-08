"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { getStaffImage } from "@/lib/staffMap";
import { type Transaction } from "./SourceColumn";
import FrameScreen from "./FrameScreen";

function parseAmount(v: number | string | undefined | null): number {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const cleaned = String(v).replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(v: number | string | undefined | null): string {
  return parseAmount(v).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function normalizeTransaction(data: Partial<Transaction>): Transaction {
  return {
    _id: (data as any)._id ?? "",
    invoice_id: String(data.invoice_id ?? ""),
    source: data.source ?? "unknown",
    admin_id: String(data.admin_id ?? ""),
    admin_name: data.admin_name?.trim() || "Unknown",
    amount: data.amount ?? 0,
    date: data.date ?? new Date().toISOString(),
  };
}

export default function DashboardDetail() {
  type MonthlyAggregate = {
    admin_id: string;
    admin_name: string;
    total_amount: number;
    transaction_count: number;
  };

  const [monthlyTransactions, setMonthlyTransactions] = useState<Transaction[]>([]);
  const [monthlyDetailTransactions, setMonthlyDetailTransactions] = useState<Transaction[]>([]);
  const [monthlyAggregates, setMonthlyAggregates] = useState<MonthlyAggregate[]>([]);

  useEffect(() => {
    let mounted = true;
    const ENCRYPTION_KEY =
      process.env.NEXT_PUBLIC_FRONTEND_ENCRYPTION_KEY ||
      "your-frontend-encryption-key";
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";
    const NPT_OFFSET_MINUTES = 5 * 60 + 45;

    const fetchMonthlyRows = async () => {
      try {
        const now = new Date();
        const nptNow = new Date(now.getTime() + NPT_OFFSET_MINUTES * 60 * 1000);
        const nptStart = new Date(nptNow.getFullYear(), nptNow.getMonth(), 1);
        const nptEnd = new Date(nptNow.getFullYear(), nptNow.getMonth() + 1, 1);

        const startDate = new Date(nptStart.getTime() - NPT_OFFSET_MINUTES * 60 * 1000).toISOString();
        const endDate = new Date(nptEnd.getTime() - NPT_OFFSET_MINUTES * 60 * 1000).toISOString();

        const res = await fetch(`${API_URL}/get_data_between_date`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frontendEncryptionKey: ENCRYPTION_KEY,
            startDate,
            endDate,
          }),
        });

        if (!mounted) return;
        if (res.ok) {
          const raw = (await res.json()) as Partial<Transaction>[];
          const normalized = [...raw].reverse().map(normalizeTransaction);
          setMonthlyTransactions(normalized);
          setMonthlyDetailTransactions(normalized);
        } else {
          console.error("Failed to fetch monthly transaction rows:", res.status);
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error fetching monthly transaction rows:", error);
        }
      }
    };

    const fetchMonthlyAggregates = async () => {
      try {
        const now = new Date();
        const nptNow = new Date(now.getTime() + NPT_OFFSET_MINUTES * 60 * 1000);
        const year = nptNow.getFullYear();
        const month = nptNow.getMonth() + 1;

        const res = await fetch(`${API_URL}/get_monthly_invoice_payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frontendEncryptionKey: ENCRYPTION_KEY,
            year,
            month,
          }),
        });

        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.topAdmins)) {
            setMonthlyAggregates(data.topAdmins as MonthlyAggregate[]);
          }
        } else {
          console.error("Failed to fetch monthly aggregates:", res.status);
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error fetching monthly aggregates:", error);
        }
      }
    };

    fetchMonthlyRows();
    fetchMonthlyAggregates();

    return () => {
      mounted = false;
    };
  }, []);

  const seller = useMemo(() => {
    const map = new Map<string, Transaction & { sales_count: number; total_amount: number }>();

    monthlyTransactions.forEach((tx) => {
      const key = String(tx.admin_id || tx.admin_name || tx.invoice_id);
      const amount = parseAmount(tx.amount);
      const existing = map.get(key);

      if (existing) {
        existing.total_amount += amount;
        existing.sales_count += 1;
        existing.amount = existing.total_amount;
        existing.invoice_id = tx.invoice_id;
        existing.date = tx.date;
      } else {
        map.set(key, {
          ...tx,
          amount,
          total_amount: amount,
          sales_count: 1,
        });
      }
    });

    const topFromRows = Array.from(map.values()).sort((a, b) => b.total_amount - a.total_amount)[0] ?? null;
    if (topFromRows) return topFromRows;

    const topAggregate = monthlyAggregates[0];
    if (!topAggregate) return null;

    return {
      _id: "",
      invoice_id: "",
      source: "unknown",
      admin_id: topAggregate.admin_id,
      admin_name: topAggregate.admin_name,
      amount: topAggregate.total_amount,
      date: new Date().toISOString(),
      sales_count: topAggregate.transaction_count,
      total_amount: topAggregate.total_amount,
    };
  }, [monthlyTransactions, monthlyAggregates]);

  const imagePath = seller ? getStaffImage(seller.admin_id) : null;

  const overall = useMemo(() => {
    if (monthlyTransactions.length > 0) {
      return monthlyTransactions.reduce((s, t) => s + parseAmount(t.amount), 0);
    }
    return monthlyAggregates.reduce((s, agg) => s + agg.total_amount, 0);
  }, [monthlyTransactions, monthlyAggregates]);

  const totalSales = monthlyTransactions.length > 0
    ? monthlyTransactions.length
    : monthlyAggregates.reduce((s, agg) => s + agg.transaction_count, 0);

  return (
    <main className="bg-transparent w-full">
      <section className="mx-auto w-full min-h-screen max-w-[1440px] px-4 sm:px-6 py-10 mb-8">
        {/* Header - kept outside top-seller card */}
        <div className="py-5 text-center">
          <h6 className="[font-family:'Figtree-ExtraBoldItalic',Helvetica] font-bold text-[#0333f9] text-2xl sm:text-4xl tracking-[-0.96px] leading-[normal] whitespace-nowrap">
           MONTHLY LEADERBOARD
          </h6>
          <p className="mt-1 [font-family:'Figtree-Medium',Helvetica] font-normal text-[#0e0e0e] text-fluid-base text-center tracking-tight leading-snug">
            <span className="font-medium">Month-to-date</span>
            <span className="[font-family:'Figtree-ExtraBoldItalic',Helvetica] font-extrabold"> Rs {formatAmount(overall)} </span>
            <span className="font-medium">from</span>
            <span className="[font-family:'Figtree-ExtraBoldItalic',Helvetica] font-extrabold"> {totalSales} sales</span>
          </p>
        </div>

        {/* Top seller card placed between header and products — isolated rounded card */}
          <div className="mx-auto w-full max-w-[1140px] px-4 sm:px-6">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/95 p-5 shadow-lg shadow-slate-950/10">
            <div className="mb-6 border-b border-white/10 pb-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Monthly Top Seller</p>
                  <h3 className="mt-2 text-2xl font-semibold uppercase text-white">Top Salesperson Detail</h3>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-sm font-semibold text-amber-200">
                  <Icon icon="mdi:medal" width={18} height={18} />
                  First place
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* Left: avatar with sales count and total amount placed bottom-left */}
              <div className="flex flex-col justify-between gap-4 w-full lg:w-auto">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border border-white/10 bg-slate-800 flex items-center justify-center flex-shrink-0">
                <Icon icon="mdi:medal" width={40} height={40} className="text-amber-400" />
              </div>

                <div className="flex flex-col items-start">
                  <div className="text-xs uppercase tracking-[0.32em] text-slate-400">Monthly sales count</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{seller?.sales_count ?? 0}</div>

                  <div className="mt-4 text-xs uppercase tracking-[0.32em] text-slate-400">Monthly total amount</div>
                  <div className="mt-2 text-3xl font-semibold text-white">Rs. {formatAmount(seller?.total_amount ?? seller?.amount)}</div>
                </div>
              </div>

              {/* Right: seller name + full staff image */}
              <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left lg:items-center">
                <div className="text-center lg:text-left lg:ml-6">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Top seller</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{seller?.admin_name}</p>
                </div>
                {imagePath ? (
                  <div className="relative h-32 w-32 overflow-hidden rounded-3xl md:h-[160px] md:w-[160px] lg:h-[180px] lg:w-[180px]">
                    <Image
                      src={imagePath}
                      alt={`${seller?.admin_name ?? "Top seller"} photo`}
                      fill
                      className="object-contain translate-x-[26%] translate-y-[5px] object-bottom"
                    />
                  </div>
                ) : null}
              </div>

            </div>
          </div>
        </div>

        {/* Products / columns — kept outside top-seller card */}
        <div className="w-full flex flex-col items-center justify-center mt-6">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Monthly Sales</p>
          <h4 className="mt-2 text-lg font-semibold text-white">Monthly product sales</h4>
          <div className="w-full flex justify-center mt-4">
            <FrameScreen
              transactions={monthlyTransactions}
              detailTransactions={monthlyDetailTransactions}
              periodLabel="This month"
              maxDisplayedSellers={4}
              flameForTopN={3}
              showMedalsForTopSellers={true}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
