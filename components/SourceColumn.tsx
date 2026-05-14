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
    heroBg: "#f4cf31",
    heroText: "#0e0e0e",
    totalColor: "#dfb400",
  },
  nest: {
    label: "Nest Nepal",
    logo: "/logo/nestnepal.png",
    heroBg: "#0333f9",
    heroText: "#ffffff",
    totalColor: "#0333f9",
  },
  sms: {
    label: "Nest SMS",
    logo: "/logo/nestsms.png",
    heroBg: "#2b7fff",
    heroText: "#ffffff",
    totalColor: "#2b7fff",
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

// How many px the photo overflows above the hero card
const PHOTO_OVERFLOW = 90;
// Total photo height
const PHOTO_HEIGHT = 220;
// Hero card height
const HERO_HEIGHT = 140;

export function SourceColumn({ source, transactions }: Props) {
  const brand = brandConfig[source];
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    transactions.forEach((t) => {
      const key = t.admin_id || t.admin_name || t.invoice_id;
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
    <section
      aria-label={`${brand.label} sales`}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        position: "relative",
      }}
    >
      {/* ── Header: logo + name + count ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Image
            src={brand.logo}
            alt={brand.label}
            width={110}
            height={32}
            style={{
              objectFit: "contain",
              objectPosition: "left",
              height: "32px",
              width: "110px",
            }}
            priority
          />
          <span
            style={{
              fontWeight: 700,
              fontStyle: "italic",
              color: "#1f1f30",
              fontSize: "18px",
              whiteSpace: "nowrap",
            }}
          >
            {brand.label}
          </span>
        </div>
        <span
          style={{ color: "#0e0e0e", fontSize: "12px", whiteSpace: "nowrap" }}
        >
          {transactions.length} Sale{transactions.length !== 1 ? "s" : ""} ·
          Today
        </span>
      </div>

      {/* ── Total ── */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontStyle: "italic",
            color: "#1f1f30",
            fontSize: "30px",
            lineHeight: 1,
          }}
        >
          Total:
        </span>
        <span
          style={{
            fontWeight: 800,
            fontStyle: "italic",
            color: brand.totalColor,
            fontSize: "30px",
            lineHeight: 1,
          }}
        >
          Rs. {formatAmount(columnTotal)}
        </span>
      </div>

      {/* ── Card wrapper — overflow visible so photo escapes upward ── */}
      <div style={{ position: "relative", width: "100%" }}>
        {/* Photo — absolutely positioned, bottom anchored to hero card bottom, overflows top */}
        {topSeller && (
          <div
            style={{
              position: "absolute",
              right: "12px",
              bottom:
                groups.length > 1 ? `calc(100% - ${HERO_HEIGHT}px)` : "0px",
              width: "130px",
              height: `${PHOTO_HEIGHT}px`,
              zIndex: 20,
              pointerEvents: "none",
            }}
          >
            {imagePath ? (
              <img
                src={imagePath}
                alt={topSeller.admin_name ?? "Top seller"}
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: "130px",
                  height: `${PHOTO_HEIGHT}px`,
                  objectFit: "contain",
                  objectPosition: "bottom center",
                  filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.3))",
                }}
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  bottom: "16px",
                  right: "16px",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px",
                  fontWeight: 700,
                  color: brand.heroText,
                  border: "3px solid rgba(255,255,255,0.4)",
                }}
              >
                {getInitials(topSeller.admin_name ?? "?")}
              </div>
            )}
          </div>
        )}

        {/* Card: hero + list rows */}
        <div
          style={{
            width: "100%",
            borderRadius: "12px",
            border: "1px solid #e8e8e8",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          {/* Hero banner */}
          {topSeller ? (
            <>
              <div
                style={{
                  position: "relative",
                  backgroundColor: brand.heroBg,
                  color: brand.heroText,
                  height: `${HERO_HEIGHT}px`,
                  padding: "20px 24px",
                  paddingRight: "160px", // keep text clear of photo
                  overflow: "hidden",
                }}
              >
                {/* Animated fire icon above name */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <span style={{ lineHeight: 1, display: "inline-flex" }}>
                      <span
                        style={{
                          lineHeight: 1,
                          display: "inline-flex",
                          color: "#ffd23f",
                        }}
                      >
                        <Icon
                          icon="material-symbols:crown"
                          width={36}
                          height={36}
                        />
                      </span>
                    </span>
                    <span
                      style={{
                        fontSize: "20px",
                        fontWeight: 600,
                        lineHeight: 1.2,
                      }}
                    >
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
                    style={{
                      fontSize: "11px",
                      opacity: 0.7,
                      whiteSpace: "nowrap",
                      paddingTop: "2px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {topSeller.transactions.length} Sale
                    {topSeller.transactions.length !== 1 ? "s" : ""} {openGroups[topSeller.admin_id] ? "▾" : "▸"}
                  </button>
                </div>

                {/* Total */}
                <div style={{ marginTop: "8px" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      opacity: 0.7,
                      marginBottom: "2px",
                    }}
                  >
                    Total
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 700,
                      lineHeight: 1,
                      letterSpacing: "-0.5px",
                    }}
                  >
                    Rs. {formatAmount(topSeller.total)}
                  </div>
                </div>
              </div>

              {/* Top-seller expanded invoice rows (toggleable) */}
              {openGroups[topSeller.admin_id] && (
                <div
                  style={{
                    backgroundColor: "#fafafa",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  {topSeller.transactions.map((t, i) => (
                    <div
                      key={t._id ?? `${t.invoice_id}-${i}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 32px",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <span
                        style={{
                          color: "rgba(14,14,14,0.5)",
                          fontSize: "11px",
                          fontFamily: "monospace",
                        }}
                      >
                        {t.invoice_id.slice(0, 10)} ·{" "}
                        {new Date(t.date).toLocaleTimeString()}
                      </span>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "#0e0e0e",
                          fontSize: "13px",
                        }}
                      >
                        Rs. {formatAmount(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                padding: "40px 24px",
                textAlign: "center",
                color: "rgba(14,14,14,0.4)",
                fontSize: "14px",
              }}
            >
              No sales yet
            </div>
          )}

          {/* Remaining sellers */}
          {groups.slice(1).map((g, idx) => {
            const isOpen = openGroups[g.admin_id];
            const showFlame = idx < 4; // show fire GIF for the next four sellers

            return (
              <div
                key={g.key ?? g.admin_id}
                style={{ backgroundColor: "#fff" }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroups((s) => ({
                      ...s,
                      [g.admin_id]: !s[g.admin_id],
                    }))
                  }
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 24px",
                    borderBottom: "1px solid #f0f0f0",
                    background: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {/* Left */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          color: "#0e0e0e",
                          fontSize: "15px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {g.admin_name}
                      </span>
                    </div>
                    <span
                      style={{
                        color: "rgba(14,14,14,0.5)",
                        fontSize: "12px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {g.transactions.length} Sale
                      {g.transactions.length !== 1 ? "s" : ""}
                      {showFlame && (
                        <span style={{ display: "inline-flex", lineHeight: 1 }}>
                          <img
                            src="https://i.pinimg.com/originals/b7/03/7a/b7037a608cac4369cc7a2c5a6a891bc2.gif"
                            alt="fire"
                            style={{
                              width: 24,
                              height: 24,
                              objectFit: "contain",
                              filter:
                                "drop-shadow(0 4px 12px rgba(0,0,0,0.25))",
                            }}
                          />
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Right */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: "2px",
                      }}
                    >
                      <span
                        style={{
                          color: "rgba(14,14,14,0.5)",
                          fontSize: "12px",
                        }}
                      >
                        Total
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#0e0e0e",
                          fontSize: "15px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Rs. {formatAmount(g.total)}
                      </span>
                    </div>
                    <span
                      style={{ fontSize: "11px", color: "rgba(14,14,14,0.3)" }}
                    >
                      {isOpen ? "▾" : "▸"}
                    </span>
                  </div>
                </button>

                {/* Expanded invoice rows */}
                {isOpen && (
                  <div
                    style={{
                      backgroundColor: "#fafafa",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    {g.transactions.map((t, i) => (
                      <div
                        key={t._id ?? `${t.invoice_id}-${i}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 32px",
                          borderBottom: "1px solid #f0f0f0",
                        }}
                      >
                        <span
                          style={{
                            color: "rgba(14,14,14,0.5)",
                            fontSize: "11px",
                            fontFamily: "monospace",
                          }}
                        >
                          {t.invoice_id.slice(0, 10)} ·{" "}
                          {new Date(t.date).toLocaleTimeString()}
                        </span>
                        <span
                          style={{
                            fontWeight: 600,
                            color: "#0e0e0e",
                            fontSize: "13px",
                          }}
                        >
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
