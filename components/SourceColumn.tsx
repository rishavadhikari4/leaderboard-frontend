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

  console.log("Rendering SourceColumn", { source, transactions });

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    transactions.forEach((t) => {
      const key = t.admin_id || t.admin_name?.trim().toLowerCase() || t.invoice_id;
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
    <section aria-label={`${brand.label} sales`} className="flex md:scale-95 flex-col w-full relative">

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
            <div className={`h-[120px] relative ${brand.heroBg} p-6 rounded-t-xl`}>
              {/* Cover image */}
              <div className="absolute right-24   z-20 bottom-0">
                <img
                  src="/logo/cover2.png"
                  alt="Leaderboard"
                  className="object-contain translate-x-[25%] -translate-y-[1px] object-bottom w-[95px]"
                />
              </div>

              {/* Staff photo */}
              <div className="absolute -bottom-0 -right-0 w-[150px] h-[150px]">
                <div className="h-full w-full relative overflow-hidden">
                  {imagePath ? (
                    <img
                      src={imagePath}
                      alt={topSeller.admin_name ?? "Top seller"}
                      className="object-contain translate-x-[26%] translate-y-[5px] object-bottom h-full w-full"
                    />
                  ) : (
                    <div
                      className={`absolute bottom-4 right-4 w-20 h-20 rounded-full bg-white/25 flex items-center justify-center text-[26px] font-bold border-[3px] border-white/40 ${brand.heroText}`}
                    >
                      {getInitials(topSeller.admin_name ?? "?")}
                    </div>
                  )}
                </div>
              </div>

              {/* Crown + name + sales count */}
              <div className="flex pt-3 items-center gap-4">
                <h2 className={`text-xl relative font-semibold ${brand.heroText}`}>
                  <div className="absolute top-0 -translate-y-[100%] left-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="11" viewBox="0 0 18 11" fill="none">
                      <g clipPath="url(#clip0_1168_4354)">
                        <path d="M4.92761 2.58789L9.00048 6.90179V9.92111L3.19922 8.15822L4.92761 2.58789Z" fill="url(#paint0_linear_1168_4354)" />
                        <path d="M13.0725 2.58789L9 6.90179V9.92111L14.8013 8.15822L13.0725 2.58789Z" fill="url(#paint1_linear_1168_4354)" />
                        <path d="M14.0963 9.92188H3.90332V11.0002H14.0963V9.92188Z" fill="url(#paint2_linear_1168_4354)" />
                        <path d="M12.0901 6.5236L8.99977 1.18555L5.90942 6.5236L1.19238 3.28834L3.90329 9.92063H8.99977H14.0962L16.8068 3.28834L12.0901 6.5236Z" fill="url(#paint3_linear_1168_4354)" />
                        <path d="M10.1922 1.18627C10.1922 0.951649 10.1223 0.722296 9.99119 0.527215C9.86013 0.332134 9.67384 0.180086 9.45589 0.0903C9.23793 0.00051394 8.9981 -0.0229781 8.76673 0.0227944C8.53535 0.0685669 8.32281 0.181548 8.156 0.347451C7.98919 0.513354 7.87558 0.724728 7.82956 0.954842C7.78354 1.18496 7.80716 1.42348 7.89744 1.64024C7.98772 1.857 8.1406 2.04227 8.33675 2.17262C8.5329 2.30297 8.76352 2.37254 8.99943 2.37254C9.15608 2.37259 9.3112 2.34193 9.45594 2.28233C9.60067 2.22273 9.73218 2.13536 9.84295 2.02519C9.95372 1.91503 10.0416 1.78424 10.1015 1.64029C10.1614 1.49635 10.1923 1.34207 10.1922 1.18627Z" fill="url(#paint4_linear_1168_4354)" />
                        <path d="M17.9998 3.28979C17.9998 3.05516 17.9299 2.82581 17.7988 2.63073C17.6677 2.43565 17.4815 2.2836 17.2635 2.19382C17.0456 2.10403 16.8057 2.08054 16.5743 2.12631C16.343 2.17208 16.1304 2.28506 15.9636 2.45097C15.7968 2.61687 15.6832 2.82824 15.6372 3.05836C15.5912 3.28847 15.6148 3.52699 15.7051 3.74375C15.7953 3.96052 15.9482 4.14579 16.1444 4.27614C16.3405 4.40648 16.5711 4.47606 16.807 4.47606C17.1234 4.47606 17.4268 4.35108 17.6505 4.12861C17.8742 3.90614 17.9998 3.60441 17.9998 3.28979Z" fill="url(#paint5_linear_1168_4354)" />
                        <path d="M2.38557 3.28979C2.38557 3.05516 2.31562 2.82581 2.18455 2.63073C2.05349 2.43565 1.8672 2.2836 1.64925 2.19382C1.43129 2.10403 1.19146 2.08054 0.960085 2.12631C0.728707 2.17208 0.516173 2.28506 0.349359 2.45097C0.182545 2.61687 0.0689435 2.82824 0.0229196 3.05836C-0.0231043 3.28847 0.000516762 3.52699 0.0907959 3.74375C0.181075 3.96052 0.333957 4.14579 0.53011 4.27614C0.726263 4.40648 0.956875 4.47606 1.19279 4.47606C1.5091 4.47597 1.81244 4.35096 2.03611 4.12851C2.25978 3.90606 2.38548 3.60438 2.38557 3.28979Z" fill="url(#paint6_linear_1168_4354)" />
                        <path d="M9.00059 5.55469L7.98828 7.16022L9.00059 8.76576L10.0126 7.16022L9.00059 5.55469Z" fill="#FF29E6" />
                        <path d="M8.99968 5.55469L8.83496 7.16022L8.99968 8.76576L10.0117 7.16022L8.99968 5.55469Z" fill="#B607A1" />
                      </g>
                      <defs>
                        <linearGradient id="paint0_linear_1168_4354" x1="6.09985" y1="-0.903826" x2="6.09985" y2="7.77063" gradientUnits="userSpaceOnUse">
                          <stop offset="0.01" stopColor="#FED33C" />
                          <stop offset="0.16" stopColor="#FEC831" />
                          <stop offset="0.71" stopColor="#FFA50E" />
                          <stop offset="1" stopColor="#FF9800" />
                        </linearGradient>
                        <linearGradient id="paint1_linear_1168_4354" x1="11.9006" y1="-0.903826" x2="11.9006" y2="7.77063" gradientUnits="userSpaceOnUse">
                          <stop offset="0.01" stopColor="#FED33C" />
                          <stop offset="0.16" stopColor="#FEC831" />
                          <stop offset="0.71" stopColor="#FFA50E" />
                          <stop offset="1" stopColor="#FF9800" />
                        </linearGradient>
                        <linearGradient id="paint2_linear_1168_4354" x1="8.9998" y1="9.6368" x2="8.9998" y2="11.1473" gradientUnits="userSpaceOnUse">
                          <stop offset="0.01" stopColor="#FED33C" />
                          <stop offset="0.16" stopColor="#FEC831" />
                          <stop offset="0.71" stopColor="#FFA50E" />
                          <stop offset="1" stopColor="#FF9800" />
                        </linearGradient>
                        <linearGradient id="paint3_linear_1168_4354" x1="8.99977" y1="1.74582" x2="8.99977" y2="11.1566" gradientUnits="userSpaceOnUse">
                          <stop offset="0.01" stopColor="#FED33C" />
                          <stop offset="0.16" stopColor="#FEC831" />
                          <stop offset="0.71" stopColor="#FFA50E" />
                          <stop offset="1" stopColor="#FF9800" />
                        </linearGradient>
                        <linearGradient id="paint4_linear_1168_4354" x1="8.99943" y1="-0.120568" x2="8.99943" y2="2.16819" gradientUnits="userSpaceOnUse">
                          <stop offset="0.01" stopColor="#FED33C" />
                          <stop offset="0.16" stopColor="#FEC831" />
                          <stop offset="0.71" stopColor="#FFA50E" />
                          <stop offset="1" stopColor="#FF9800" />
                        </linearGradient>
                        <linearGradient id="paint5_linear_1168_4354" x1="16.807" y1="2.10862" x2="16.807" y2="4.66509" gradientUnits="userSpaceOnUse">
                          <stop offset="0.01" stopColor="#FED33C" />
                          <stop offset="0.16" stopColor="#FEC831" />
                          <stop offset="0.71" stopColor="#FFA50E" />
                          <stop offset="1" stopColor="#FF9800" />
                        </linearGradient>
                        <linearGradient id="paint6_linear_1168_4354" x1="1.19279" y1="1.98806" x2="1.19279" y2="4.33778" gradientUnits="userSpaceOnUse">
                          <stop offset="0.01" stopColor="#FED33C" />
                          <stop offset="0.16" stopColor="#FEC831" />
                          <stop offset="0.71" stopColor="#FFA50E" />
                          <stop offset="1" stopColor="#FF9800" />
                        </linearGradient>
                        <clipPath id="clip0_1168_4354">
                          <rect width="18" height="11" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                  {topSeller.admin_name}
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroups((s) => ({
                      ...s,
                      [topSeller.admin_id]: !s[topSeller.admin_id],
                    }))
                  }
                  aria-expanded={!!openGroups[topSeller.admin_id]}
                  className={`text-[11px] opacity-70 whitespace-nowrap pt-0.5 bg-transparent border-none cursor-pointer ${brand.heroText}`}
                >
                  {topSeller.transactions.length} Sale{topSeller.transactions.length !== 1 ? "s" : ""}{" "}
                  {openGroups[topSeller.admin_id] ? "▾" : "▸"}
                </button>
              </div>

              {/* Total */}
              <div className="mt-4">
                <p className={` opacity-70 ${brand.heroText}`}>Total Rs.</p>
                <p className={`text-[18px] font-bold ${brand.heroText}`}>
                  {formatAmount(topSeller.total)}
                </p>
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