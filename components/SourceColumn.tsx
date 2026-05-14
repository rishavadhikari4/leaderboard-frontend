"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { getStaffImage } from "@/lib/staffMap";

export interface Transaction {
  _id: string;
  invoice_id: string;
  source: "nest" | "sms" | "babal";
  admin_id: string;
  admin_name?: string;
  amount: number | string;
  date: string;
  isNew?: boolean;
}

interface Props {
  source: "nest" | "sms" | "babal";
  transactions: Transaction[];
}

const brandConfig = {
  babal: {
    label: "Babal Host",
    logo: "/logo/babalhost.png",
    heroBg: "bg-[#f4cf31]",
    heroText: "text-[#0e0e0e]",
    totalColor: "text-[#dfb400]",
  },
  nest: {
    label: "Nest Nepal",
    logo: "/logo/nestnepal.png",
    heroBg: "bg-[#0333f9]",
    heroText: "text-white",
    totalColor: "text-[#0333f9]",
  },
  sms: {
    label: "Nest SMS",
    logo: "/logo/nestsms.png",
    heroBg: "bg-[#2b7fff]",
    heroText: "text-white",
    totalColor: "text-[#2b7fff]",
  },
} as const;

function parseAmount(v: number | string | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const cleaned = String(v).replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(v: number | string | undefined): string {
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

const HERO_HEIGHT = 150;
const PHOTO_HEIGHT = 240;

export function SourceColumn({ source, transactions }: Props) {
  const brand = brandConfig[source];
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [updateKey, setUpdateKey] = useState(0);

  // Force re-render when transactions change
  useEffect(() => {
    setUpdateKey((prev) => prev + 1);
  }, [transactions.length]);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    transactions.forEach((t) => {
      // Use admin_id as primary key, fallback to admin_name, then invoice_id
      const key = t.admin_id?.trim() || t.admin_name?.trim().toLowerCase() || t.invoice_id;
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    });
    
    // Convert to array and sort by total amount (descending)
    const groupsArray = Array.from(map.entries())
      .map(([key, txs]) => ({
        key,
        admin_id: txs[0].admin_id ?? key,
        admin_name: txs[0].admin_name ?? "Unknown",
        transactions: txs,
        total: txs.reduce((s, t) => s + parseAmount(t.amount), 0),
      }))
      .sort((a, b) => b.total - a.total);
    
    return groupsArray;
  }, [transactions]);

  const columnTotal = useMemo(
    () => transactions.reduce((s, t) => s + parseAmount(t.amount), 0),
    [transactions],
  );

  const topSeller = groups[0] ?? null;
  const imagePath = topSeller ? getStaffImage(topSeller.admin_id) : null;

  return (
    <section
      key={`${source}-${updateKey}-${transactions.length}`}
      aria-label={`${brand.label} sales`}
      className="flex flex-col w-full relative"
    >
      {/* ── Header: logo + name + count ── */}
      <div className="flex items-center justify-between mb-1 sm:mb-1.5 relative z-0 min-h-[45px] sm:min-h-[55px] lg:min-h-[65px] xl:min-h-[75px]">
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 min-w-0">
          <Image
            src={brand.logo}
            alt={brand.label}
            width={110}
            height={32}
            className="object-contain object-left h-4 w-14 sm:h-5 sm:w-16 md:h-6 md:w-20 lg:h-7 lg:w-24 xl:h-8 xl:w-28"
            priority
          />
          <span className="font-bold text-[#1f1f30] text-fluid-sm sm:text-fluid-base md:text-fluid-lg lg:text-fluid-xl truncate">
            {brand.label}
          </span>
        </div>
        <span className="text-[#0e0e0e] text-fluid-xs whitespace-nowrap ml-1 sm:ml-2">
          {transactions.length} Sale{transactions.length !== 1 ? "s" : ""} · Today
        </span>
      </div>

      {/* ── Total ── */}
      <div className="flex items-baseline gap-1.5 sm:gap-2 mb-2 sm:mb-2.5">
        <span className="font-bold italic text-[#1f1f30] text-fluid-lg sm:text-fluid-xl lg:text-fluid-2xl leading-none">
          Total:
        </span>
        <span className={`font-extrabold italic text-fluid-lg sm:text-fluid-xl lg:text-fluid-2xl leading-none ${brand.totalColor}`}>
          Rs. {formatAmount(columnTotal)}
        </span>
      </div>

      {/* ── Card wrapper ── */}
      <div className="w-full rounded-lg sm:rounded-xl border border-[#e8e8e8] shadow-md overflow-visible relative">
        {/* ── Hero banner ── */}
        {topSeller ? (
          <>
            <div
              className={`relative px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 lg:px-5 lg:py-5 overflow-visible rounded-t-lg sm:rounded-t-xl ${brand.heroBg} ${brand.heroText} h-[85px] sm:h-[95px] md:h-[110px] lg:h-[130px] xl:h-[150px] pr-[70px] sm:pr-[80px] md:pr-[90px] lg:pr-[100px] xl:pr-[110px]`}
            >
              <div className="absolute right-0 bottom-0 pointer-events-none z-20 w-[65px] sm:w-[75px] md:w-[85px] lg:w-[95px] xl:w-[105px] h-[130px] sm:h-[145px] md:h-[165px] lg:h-[195px] xl:h-[230px]">
                {imagePath ? (
                  <>
                    <img
                      src={imagePath}
                      alt={topSeller.admin_name ?? "Top seller"}
                      className="absolute bottom-0 right-0 object-contain object-bottom w-full h-full"
                    />
                    <div className="absolute inset-0 pointer-events-none" />
                  </>
                ) : (
                  <div
                    className={`absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-bold border-2 bg-white/25 ${brand.heroText} border-white/40 text-xs sm:text-sm md:text-base`}
                  >
                    {getInitials(topSeller.admin_name ?? "?")}
                  </div>
                )}
              </div>

              {/* Crown + name row */}
              <div className="flex items-start justify-between mb-0.5 sm:mb-1">
                <div className="flex flex-col gap-0.5">
                  <span className="leading-none inline-flex text-[#ffd23f]">
                    <Icon icon="material-symbols:crown" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
                  </span>
                  <span className="text-fluid-sm sm:text-fluid-base md:text-fluid-lg font-semibold leading-tight">
                    {topSeller.admin_name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenGroups((s) => ({ ...s, [topSeller.admin_id]: !s[topSeller.admin_id] }))}
                  aria-expanded={!!openGroups[topSeller.admin_id]}
                  className="text-fluid-xs opacity-70 whitespace-nowrap pt-0.5 bg-transparent border-none cursor-pointer hover:opacity-100 transition-opacity"
                >
                  {topSeller.transactions.length} Sale{topSeller.transactions.length !== 1 ? "s" : ""}{" "}
                  {openGroups[topSeller.admin_id] ? "▾" : "▸"}
                </button>
              </div>

              {/* Total */}
              <div className="mt-1 sm:mt-1.5">
                <div className="text-fluid-xs opacity-70 mb-0.5">Total</div>
                <div className="text-fluid-lg sm:text-fluid-xl lg:text-fluid-2xl font-bold leading-none tracking-tight">
                  Rs. {formatAmount(topSeller.total)}
                </div>
              </div>
            </div>

            {/* Top-seller expanded invoice rows */}
            {openGroups[topSeller.admin_id] && (
              <div className="bg-[#fafafa] border-b border-[#f0f0f0]">
                {topSeller.transactions.map((t, i) => (
                  <div
                    key={`${t._id || t.invoice_id}-${i}`}
                    className="flex items-center justify-between px-3.5 sm:px-5 md:px-7 py-1.5 sm:py-2 border-b border-[#f0f0f0] last:border-b-0"
                  >
                    <span className="text-[#0e0e0e]/50 text-fluid-xs font-mono truncate">
                      {t.invoice_id.slice(0, 10)} · {new Date(t.date).toLocaleTimeString()}
                    </span>
                    <span className="font-semibold text-[#0e0e0e] text-fluid-xs sm:text-fluid-sm ml-2 whitespace-nowrap">
                      Rs. {formatAmount(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="p-6 sm:p-7 md:p-9 text-center text-[#0e0e0e]/40 text-fluid-sm rounded-t-lg sm:rounded-t-xl bg-white">
            No sales yet
          </div>
        )}

        {/* ── Remaining sellers ── */}
        <div className="overflow-hidden rounded-b-lg sm:rounded-b-xl">
          {groups.slice(1).map((g, idx) => {
            const isOpen = openGroups[g.admin_id];
            const showFlame = idx > 4;

            return (
              <div key={g.key ?? g.admin_id} className="bg-white">
                <button
                  type="button"
                  onClick={() => setOpenGroups((s) => ({ ...s, [g.admin_id]: !s[g.admin_id] }))}
                  className="w-full flex items-center justify-between px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 lg:px-5 lg:py-3 border-b border-[#f0f0f0] bg-transparent cursor-pointer text-left hover:bg-[#fafafa] transition-colors"
                >
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-[#0e0e0e] text-fluid-xs sm:text-fluid-sm md:text-fluid-base truncate">
                        {g.admin_name}
                      </span>
                    </div>
                    <span className="text-[#0e0e0e]/50 text-fluid-xs inline-flex items-center gap-1">
                      {g.transactions.length} Sale{g.transactions.length !== 1 ? "s" : ""}
                      {showFlame && (
                        <span className="inline-flex leading-none">
                          <img
                            src="https://i.pinimg.com/originals/b7/03/7a/b7037a608cac4369cc7a2c5a6a891bc2.gif"
                            alt="fire"
                            className="object-contain w-3.5 h-3.5 sm:w-4 sm:h-4 drop-shadow-lg"
                          />
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-1.5 sm:ml-2">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[#0e0e0e]/50 text-fluid-xs">Total</span>
                      <span className="font-bold text-[#0e0e0e] text-fluid-xs sm:text-fluid-sm md:text-fluid-base whitespace-nowrap">
                        Rs. {formatAmount(g.total)}
                      </span>
                    </div>
                    <span className="text-fluid-xs text-[#0e0e0e]/30">
                      {isOpen ? "▾" : "▸"}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="bg-[#fafafa] border-b border-[#f0f0f0]">
                    {g.transactions.map((t, i) => (
                      <div
                        key={`${t._id || t.invoice_id}-${i}`}
                        className="flex items-center justify-between px-3.5 sm:px-5 md:px-7 py-1.5 sm:py-2 border-b border-[#f0f0f0] last:border-b-0"
                      >
                        <span className="text-[#0e0e0e]/50 text-fluid-xs font-mono truncate">
                          {t.invoice_id.slice(0, 10)} · {new Date(t.date).toLocaleTimeString()}
                        </span>
                        <span className="font-semibold text-[#0e0e0e] text-fluid-xs sm:text-fluid-sm ml-2 whitespace-nowrap">
                          Rs. {formatAmount(t.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
