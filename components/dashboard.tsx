"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SourceColumn, type Transaction } from "./SourceColumn";
import { Volume2, Crown, X } from "lucide-react";

type MonthlyTopAdmin = {
  admin_id: string;
  admin_name: string;
  total_amount: number;
  transaction_count: number;
};

export function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incoming, setIncoming] = useState<Transaction | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(
    process.env.NEXT_PUBLIC_ALERT_SOUND || "/sounds/announcement.mp3",
  );
  const [monthlyTopAdmins, setMonthlyTopAdmins] = useState<MonthlyTopAdmin[]>(
    [],
  );
  const [monthlyPanelVisible, setMonthlyPanelVisible] = useState(false);
  const [monthlyPanelReady, setMonthlyPanelReady] = useState(false);
  const [monthlyPanelError, setMonthlyPanelError] = useState<string | null>(
    null,
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const incomingTimer = useRef<number | null>(null);
  const monthlyCycleTimer = useRef<number | null>(null);
  const monthlyHideTimer = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const soundEnabledRef = useRef(soundEnabled);

  const parseAmount = (v: number | string | undefined) => {
    if (v == null) return 0;
    if (typeof v === "number") return v;
    const cleaned = String(v).replace(/[^0-9.-]/g, "");
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatAmount = (v: number | string | undefined) => {
    const num = parseAmount(v);
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Hydrate client-only state and start live sync
  useEffect(() => {
    const ENCRYPTION_KEY =
      process.env.NEXT_PUBLIC_FRONTEND_ENCRYPTION_KEY ||
      "your-frontend-encryption-key";
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

    const fetchTodayData = async () => {
      try {
        const res = await fetch(`${API_URL}/get_today_invoice_payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frontendEncryptionKey: ENCRYPTION_KEY }),
        });
        if (res.ok) {
          const data: Transaction[] = await res.json();
          setTransactions(data.reverse());
        } else {
          console.error("Failed to fetch transactions", res.status);
        }
      } catch (err) {
        console.error("Error fetching transactions", err);
      }
    };

    const setupSocket = () => {
      if (socketRef.current) return;
      const socket = io(`${API_URL}/socket/leaderboard_updates`, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socket.on("connect", () => console.log("Socket connected"));

      socket.on("new_transaction", (data: Transaction) => {
        setTransactions((prev) => [data, ...prev]);
        setIncoming(data);

        if (incomingTimer.current) window.clearTimeout(incomingTimer.current);

        const amountVal = parseAmount((data as any).amount);
        if (soundEnabledRef.current && amountVal >= 10000) {
          audioRef.current?.play().catch(() => {});
        }

        incomingTimer.current = window.setTimeout(
          () => setIncoming(null),
          6000,
        );
      });

      socket.on("disconnect", () => console.log("Socket disconnected"));

      socketRef.current = socket;
    };

    fetchTodayData();
    setupSocket();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (incomingTimer.current) window.clearTimeout(incomingTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep the ref updated when user toggles sound
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    const ENCRYPTION_KEY =
      process.env.NEXT_PUBLIC_FRONTEND_ENCRYPTION_KEY ||
      "your-frontend-encryption-key";
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

    let cancelled = false;

    const fetchMonthlyTopAdmins = async () => {
      try {
        const now = new Date();
        const response = await fetch(
          `${API_URL}/get_monthly_invoice_payments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              frontendEncryptionKey: ENCRYPTION_KEY,
              year: now.getFullYear(),
              month: now.getMonth() + 1,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`Monthly API failed with ${response.status}`);
        }

        const data: {
          month: number;
          year: number;
          topAdmins?: MonthlyTopAdmin[];
        } = await response.json();

        if (!cancelled) {
          setMonthlyTopAdmins(data.topAdmins ?? []);
          setMonthlyPanelError(null);
          setMonthlyPanelReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          setMonthlyTopAdmins([]);
          setMonthlyPanelError(
            error instanceof Error
              ? error.message
              : "Failed to load monthly leaderboard",
          );
          setMonthlyPanelReady(true);
        }
      }
    };

    const runMonthlyCycle = async () => {
      await fetchMonthlyTopAdmins();
      if (cancelled) return;

      setMonthlyPanelVisible(true);

      monthlyHideTimer.current = window.setTimeout(() => {
        if (cancelled) return;
        setMonthlyPanelVisible(false);

        monthlyCycleTimer.current = window.setTimeout(() => {
          void runMonthlyCycle();
        }, 10000);
      }, 10000);
    };

    void runMonthlyCycle();

    return () => {
      cancelled = true;
      if (monthlyHideTimer.current)
        window.clearTimeout(monthlyHideTimer.current);
      if (monthlyCycleTimer.current)
        window.clearTimeout(monthlyCycleTimer.current);
    };
  }, []);

  const enableSound = async () => {
    try {
      setSoundEnabled(true);
      soundEnabledRef.current = true;
    } catch (e) {
      // ignore
    }
  };

  const grouped = useMemo(() => {
    return {
      nest: transactions.filter((t) => t.source === "nest"),
      sms: transactions.filter((t) => t.source === "sms"),
      babal: transactions.filter((t) => t.source === "babal"),
    };
  }, [transactions]);

  const overall = useMemo(
    () => transactions.reduce((s, t) => s + parseAmount((t as any).amount), 0),
    [transactions],
  );

  const sourceLabel =
    incoming?.source === "nest"
      ? "Nest Nepal"
      : incoming?.source === "sms"
        ? "Nest SMS"
        : "Babal Host";

  const maxMonthlyAmount = monthlyTopAdmins.length
    ? monthlyTopAdmins[0].total_amount
    : 1;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hidden audio (src set by user) */}
      <audio ref={audioRef} preload="auto" src={audioSrc ?? undefined} />

      {/* Monthly top-admin drawer */}
      <div
        className={`fixed right-4 top-24 z-40 w-[min(26rem,calc(100vw-2rem))] transition-transform duration-700 ease-out ${
          monthlyPanelVisible
            ? "translate-x-0"
            : "translate-x-[calc(100%+1rem)]"
        }`}
      >
        <div className="rounded-3xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-gradient-to-r from-foreground/5 to-transparent">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                Monthly Top Admins
              </div>
              <div className="mt-1 text-lg font-semibold text-foreground flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-400" />
                {new Date().toLocaleString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                {monthlyPanelReady ? "Live" : "Loading"}
              </div>
              <button
                aria-label="Close monthly drawer"
                onClick={() => setMonthlyPanelVisible(false)}
                className="inline-flex items-center justify-center rounded-full p-1 hover:bg-muted/30"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-4 py-4 space-y-3">
            {monthlyPanelError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {monthlyPanelError}
              </div>
            ) : monthlyTopAdmins.length === 0 ? (
              <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                No monthly data available
              </div>
            ) : (
              monthlyTopAdmins.map((admin, index) => {
                const pct = Math.round(
                  (admin.total_amount / Math.max(1, maxMonthlyAmount)) * 100,
                );
                return (
                  <div
                    key={`${admin.admin_id}-${index}`}
                    className="group relative overflow-hidden rounded-2xl border border-border/60 bg-background/60 px-4 py-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-foreground/10 to-foreground/5 text-foreground font-semibold">
                        <span className="text-sm">{index + 1}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate font-medium text-foreground">
                            {admin.admin_name}
                          </div>
                          <div className="text-sm font-semibold tabular-nums text-foreground">
                            Rs. {formatAmount(admin.total_amount)}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex-1">
                            <div className="h-2 rounded-full bg-border/30">
                              <div
                                className="h-2 rounded-full bg-amber-400"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground w-12 text-right">
                            {pct}%
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-muted-foreground">
                          {admin.transaction_count} sale
                          {admin.transaction_count === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      {/* Top bar */}
      <header className="px-6 lg:px-10 lg:pt-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-center">
          <div className="hidden md:block" />
          {/* Centered title */}
          <div className="text-center md:order-none order-1">
            <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight">
              Today's Leaderboard
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Rs.{" "}
              <span className="text-foreground font-semibold tabular-nums">
                {formatAmount(overall)}
              </span>{" "}
              across {transactions.length} sales
            </p>
          </div>

          {/* Right: one-time enable-sound button (visible until user consents) */}
          <div className="w-full md:w-auto flex justify-center md:justify-end items-center gap-2 order-2 md:order-none">
            {!soundEnabled && (
              <button
                onClick={enableSound}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:bg-card hover:shadow-md focus:outline-none focus:ring-2 focus:ring-foreground/20"
                aria-label="Enable sound"
              >
                Enable sound
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Incoming flash banner */}
      {incoming && (
        <div className="px-6 lg:px-10 mt-6 h-14">
          <div
            key={incoming._id}
            className="slide-fade mx-auto max-w-2xl rounded-full bg-card/80 backdrop-blur border border-white/15 px-5 py-3 flex items-center justify-center gap-3 [box-shadow:0_10px_40px_-10px_rgba(255,255,255,0.18)]"
          >
            <span className="text-sm">
              <span className="font-semibold text-black">
                Rs. {formatAmount((incoming as any).amount)}
              </span>{" "}
              <span className="text-muted-foreground">
                · {sourceLabel} · {incoming.admin_name}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Three columns separated by vertical lines */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 mt-2 mb-10 max-w-[1500px] mx-auto w-full">
        <div className="md:border-r md:border-border/60">
          <SourceColumn
            title="Nest Nepal"
            icon="/nestnepal.png"
            source="nest"
            transactions={grouped.nest}
          />
        </div>
        <div className="md:border-r md:border-border/60 md:border-t-0 border-t border-border/60 md:pt-0 pt-6">
          <SourceColumn
            title="Nest SMS"
            icon="/nestsms.png"
            source="sms"
            transactions={grouped.sms}
          />
        </div>
        <div className="md:border-t-0 border-t border-border/60 md:pt-0 pt-6">
          <SourceColumn
            title="Babal Host"
            icon="/babalhost.png"
            source="babal"
            transactions={grouped.babal}
          />
        </div>
      </main>
    </div>
  );
}
