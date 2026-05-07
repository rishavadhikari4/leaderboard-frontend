"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SourceColumn, type Transaction } from "./SourceColumn";
import { formatAmount, parseAmount } from "@/lib/currency";

export function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incoming, setIncoming] = useState<Transaction | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audioSrc] = useState<string | null>(
    process.env.NEXT_PUBLIC_ALERT_SOUND || "/sounds/announcement.mp3",
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const incomingTimer = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const soundEnabledRef = useRef(soundEnabled);

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
          setTransactions([...data].reverse());
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
        setTransactions((prev) => {
          // Keep list bounded and avoid duplicate inserts from retries/reconnects.
          if (prev.some((t) => t._id === data._id)) return prev;
          const next = [data, ...prev];
          return next.length > 500 ? next.slice(0, 500) : next;
        });
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

  const enableSound = async () => {
    setSoundEnabled(true);
    soundEnabledRef.current = true;
    try {
      if (audioRef.current) {
        await audioRef.current.play();
      }
    } catch (e) {
      // ignore autoplay-policy errors
    }
  };

  const { grouped, overall } = useMemo(() => {
    const nest: Transaction[] = [];
    const sms: Transaction[] = [];
    const babal: Transaction[] = [];
    let overall = 0;

    for (const t of transactions) {
      overall += parseAmount(t.amount);
      if (t.source === "nest") nest.push(t);
      else if (t.source === "sms") sms.push(t);
      else babal.push(t);
    }

    return {
      grouped: { nest, sms, babal },
      overall,
    };
  }, [transactions]);

  const sourceLabel =
    incoming?.source === "nest"
      ? "Nest Nepal"
      : incoming?.source === "sms"
        ? "Nest SMS"
        : "Babal Host";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hidden audio (src set by user) */}
      <audio ref={audioRef} preload="auto" src={audioSrc ?? undefined} />

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
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:bg-card hover:shadow-md focus:outline-none focus:ring-2 focus:ring-foreground/20 w-full md:w-auto max-w-xs"
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
        <div className="px-6 lg:px-10 mt-6 min-h-14">
          <div
            key={incoming._id}
            className="slide-fade mx-auto max-w-2xl rounded-2xl md:rounded-full bg-card/80 backdrop-blur border border-white/15 px-4 md:px-5 py-3 flex items-center justify-center gap-3 [box-shadow:0_10px_40px_-10px_rgba(255,255,255,0.18)]"
          >
            <span className="text-sm text-center md:text-left">
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
            source="nest"
            transactions={grouped.nest}
          />
        </div>
        <div className="md:border-r md:border-border/60 md:border-t-0 border-t border-border/60 md:pt-0 pt-6">
          <SourceColumn
            title="Nest SMS"
            source="sms"
            transactions={grouped.sms}
          />
        </div>
        <div className="md:border-t-0 border-t border-border/60 md:pt-0 pt-6">
          <SourceColumn
            title="Babal Host"
            source="babal"
            transactions={grouped.babal}
          />
        </div>
      </main>
    </div>
  );
}
