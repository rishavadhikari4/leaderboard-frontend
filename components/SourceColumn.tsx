"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
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

export function SourceColumn({ source, transactions }: Props) {
  const brand = brandConfig[source];
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    transactions.forEach((t) => {
      const key = t.admin_id?.trim() || t.admin_name?.trim().toLowerCase() || t.invoice_id;
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    });
    return Array.from(map.entries())
      .map(([key, txs]) => ({
        key,
        admin_id: txs[0].admin_id ?? key,
        admin_name: txs[0].admin_name ?? "Unknown",
        transactions: txs,
        total: txs.reduce((s, t) => s + parseAmount(t.amount), 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  const columnTotal = useMemo(
    () => transactions.reduce((s, t) => s + parseAmount(t.amount), 0),
    [transactions],
  );

  const topSeller = groups[0] ?? null;
  const imagePath = topSeller ? getStaffImage(topSeller.admin_id) : null;

  return (
    <section aria-label={`${brand.label} sales`} className="flex flex-col w-full relative">

      {/* ── Header: logo + name + count ── */}
      <div className="flex items-center justify-between mb-1.5 min-h-[50px] lg:min-h-[70px] relative z-0">
        <div className="flex items-center gap-2.5 ">
          <Image
            src={brand.logo}
            alt={brand.label}
            width={56}
            height={32}
            className="object-contain object-left h-7 "
            priority
          />
          <span className="font-bold text-[#1f1f30] text-lg whitespace-nowrap">
            {brand.label}
          </span>
        </div>
        <span className="text-[#0e0e0e]  whitespace-nowrap">
          {transactions.length} Sale{transactions.length !== 1 ? "s" : ""} · Today
        </span>
      </div>

      {/* ── Total ── */}
      <div className="flex items-baseline gap-2 mb-8 lg:mb-4">
        <span className="font-bold italic text-[#1f1f30] text-[20px] 2xl:text-[25px] leading-none">
          Total:
        </span>
        <span className={`font-extrabold italic text-[24px] 2xl:text-[25px] leading-none ${brand.totalColor}`}>
          Rs. {formatAmount(columnTotal)}
        </span>
      </div>

      {/* ── Card wrapper ── */}
      <div className="w-full rounded-xl border border-[#e8e8e8] shadow-[0_2px_12px_rgba(0,0,0,0.08)] overflow-visible relative mt-4">

        {/* ── Hero banner ── */}
        {topSeller ? (
          <>
            <div
              className={`relative ${brand.heroBg} ${brand.heroText} h-[160px] lg:h-[150px] p-5 pr-[155px] overflow-visible rounded-t-xl`}
            >

              <Image
                src="/logo/catch.png"
                alt={topSeller.admin_name ?? "Top seller"}
                width={200}        // set to the actual PNG's natural width
                height={100}       // set to the actual PNG's natural height
                className="absolute right-35 -top-10 translate-x-6 z-50 object-contain object-top h-[60px] w-auto"
                quality={100}      // prevent Next.js compression
              />

              <Image
                src="/logo/cover2.png"
                alt={topSeller.admin_name ?? "Top seller"}
                width={700}
                height={70}
                quality={200}
                className="object-contain h-[90px] w-auto absolute right-40 top-25.5 translate-x-6 z-50 object-top"
              />
              {/* Staff photo */}
              <div className="absolute right-0 flex justify-end z-20 items-end bottom-0  w-[150px] h-[180px] 2xl:h-[240px]  overflow-hidden! pointer-events-none ">
                {imagePath ? (
                  <>

                    <img
                      src={imagePath}
                      alt={topSeller.admin_name ?? "Top seller"}
                      className=" object-contain h-full  object-top!"
                    />
                    <div className="absolute inset-0 pointer-events-none" />
                  </>
                ) : (
                  <div
                    className={`absolute bottom-4 right-4  w-20 h-20 rounded-full bg-white/25 flex items-center justify-center text-[26px] font-bold border-[3px] border-white/40 ${brand.heroText}`}
                  >
                    {getInitials(topSeller.admin_name ?? "?")}
                  </div>
                )}
              </div>

              {/* Crown + name row */}
              <div className="flex items-start justify-between mb-1">
                <div className="flex flex-col gap-0.5">
                  <span className="leading-none inline-flex text-[#ffd23f]">
                    <Icon icon="material-symbols:crown" width={28} height={28} className={`${brand.label.toLocaleLowerCase() == "babal host" ? "text-[#ffffff]" : ""}`} />
                  </span>
                  <span className="text-lg 2xl:text-xl font-semibold tracking-wide text-nowrap! truncate leading-snug">
                    {topSeller.admin_name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroups((s) => ({
                      ...s,
                      [topSeller.admin_id]: !s[topSeller.admin_id],
                    }))
                  }
                  aria-expanded={!!openGroups[topSeller.admin_id]}
                  className="text-[11px] opacity-70 whitespace-nowrap pt-0.5 bg-transparent border-none cursor-pointer"
                  style={{ color: "inherit" }}
                >
                  {topSeller.transactions.length} Sale{topSeller.transactions.length !== 1 ? "s" : ""}{" "}
                  {openGroups[topSeller.admin_id] ? "▾" : "▸"}
                </button>
              </div>

              {/* Total */}
              <div className="mt-1.5 2xl:mt-2.5 relative z-50">
                <div className="text-[11px] opacity-70 mb-0.5">Total</div>
                <div className="text-sm 2xl:text-[25px] font-bold lg:text-nowrap leading-none tracking-tight">
                  Rs. {formatAmount(topSeller.total)}
                </div>
              </div>
            </div>

            {/* Top-seller expanded invoice rows */}
            {openGroups[topSeller.admin_id] && (
              <div className="bg-[#fafafa] border-b border-[#f0f0f0]">
                {topSeller.transactions.map((t, i) => (
                  <div
                    key={t._id ?? `${t.invoice_id}-${i}`}
                    className="flex items-center justify-between px-8 py-2 border-b border-[#f0f0f0]"
                  >
                    <span className="text-[#0e0e0e]/50 text-[11px] font-mono">
                      {t.invoice_id.slice(0, 10)} · {new Date(t.date).toLocaleTimeString()}
                    </span>
                    <span className="font-semibold text-[#0e0e0e] text-[13px]">
                      Rs. {formatAmount(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="px-6 py-10 text-center text-[#0e0e0e]/40 text-sm rounded-t-xl bg-white">
            No sales yet
          </div>
        )}

        {/* ── Remaining sellers ── */}
        <div className="overflow-hidden rounded-b-xl">
          {groups.slice(1).map((g, idx) => {
            const isOpen = openGroups[g.admin_id];
            const showFlame = idx > 4;

            return (
              <div key={g.key ?? g.admin_id} className="bg-white">
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroups((s) => ({ ...s, [g.admin_id]: !s[g.admin_id] }))
                  }
                  className="w-full flex items-center justify-between px-6 py-2 border-b border-[#f0f0f0] bg-transparent cursor-pointer text-left"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[#0e0e0e] text-[14px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {g.admin_name}
                      </span>
                    </div>
                    <span className="text-[#0e0e0e]/50 text-lg inline-flex items-center gap-1">
                      {g.transactions.length} Sale{g.transactions.length !== 1 ? "s" : ""}
                      {showFlame && (
                        <span className="inline-flex leading-none">
                          <img
                            src="https://i.pinimg.com/originals/b7/03/7a/b7037a608cac4369cc7a2c5a6a891bc2.gif"
                            alt="fire"
                            className="w-6 h-6 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
                          />
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[#0e0e0e]/50 text-lg">Total</span>
                      <span className="font-bold text-[#0e0e0e] text-[14px] whitespace-nowrap">
                        Rs. {formatAmount(g.total)}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#0e0e0e]/30">
                      {isOpen ? "▾" : "▸"}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="bg-[#fafafa] border-b border-[#f0f0f0]">
                    {g.transactions.map((t, i) => (
                      <div
                        key={t._id ?? `${t.invoice_id}-${i}`}
                        className="flex items-center justify-between px-8 py-2 border-b border-[#f0f0f0]"
                      >
                        <span className="text-[#0e0e0e]/50 text-[11px] font-mono">
                          {t.invoice_id.slice(0, 10)} · {new Date(t.date).toLocaleTimeString()}
                        </span>
                        <span className="font-semibold text-[#0e0e0e] text-[13px]">
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