"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SourceColumn, type Transaction } from "./SourceColumn";
import { formatAmount, parseAmount } from "@/lib/currency";
import { Volume2 } from "lucide-react";

export function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incoming, setIncoming] = useState<Transaction | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hidden audio (src set by user) */}
      <audio ref={audioRef} preload="auto" src={audioSrc ?? undefined} />

      {/* Top bar */}
      <header className="px-6 lg:px-10 lg:pt-4">
        <div className="grid grid-cols-3 items-center">
          <div />
          {/* Centered title */}
          <div className="text-center">
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
          <div className="w-32 flex justify-end items-center gap-2">
            {!soundEnabled && (
              <button
                onClick={enableSound}
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:bg-card hover:shadow-md focus:outline-none focus:ring-2 focus:ring-foreground/20"
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
