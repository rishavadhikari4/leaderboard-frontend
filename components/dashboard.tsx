"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { io, Socket } from "socket.io-client";
import { type Transaction } from "./SourceColumn";
import { FrameScreen } from "./FrameScreen";

import groupBg from "@/public/Group.png";

/**
 * A Transaction as it arrives from the API / socket.
 * Extended with `sales_count` and `total_amount` so FrameScreen
 * can display per-person aggregates.
 */
export type AggregatedTransaction = Transaction & {
  sales_count: number;   // how many individual invoices this person has made today
  total_amount: number;  // running numeric total (avoids re-parsing on every render)
};

export function Dashboard() {
  // One entry per salesperson, keyed by admin_id
  const [roster, setRoster] = useState<Map<string, AggregatedTransaction>>(new Map());

  const [incoming, setIncoming] = useState<Transaction | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showSoundBtn, setShowSoundBtn] = useState(true);
  const [audioSrc] = useState<string | null>(
    process.env.NEXT_PUBLIC_ALERT_SOUND || "/sounds/announcement.mp3",
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const incomingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const isMountedRef = useRef(true);

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const parseAmount = (v: number | string | undefined | null): number => {
    if (v == null) return 0;
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    const cleaned = String(v).replace(/[^0-9.-]/g, "");
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatAmount = (v: number | string | undefined | null): string => {
    const num = parseAmount(v);
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  /** Normalize raw socket/API payload into a fully-shaped Transaction */
  const normalizeTransaction = (data: Partial<Transaction>): Transaction => ({
    _id: (data as any)._id ?? undefined,
    invoice_id: data.invoice_id as string ?? 0,
    source: data.source ?? "unknown",
    admin_id: data.admin_id as string ?? 0,
    admin_name: data.admin_name?.trim() || "Unknown",
    amount: data.amount ?? 0,
    date: data.date ?? new Date().toISOString(),
  });

  /**
   * Merge one transaction into the roster map.
   *
   * Same person  → add amount to their running total, increment sales_count
   * New person   → insert fresh entry with sales_count = 1
   *
   * Always returns a NEW Map so React detects the state change.
   */
  const mergeIntoRoster = (
    prev: Map<string, AggregatedTransaction>,
    tx: Transaction,
  ): Map<string, AggregatedTransaction> => {
    // Stringify so numeric and string admin_ids both resolve to the same key
    const key = String(tx.admin_id || tx.admin_name || "unknown");
    const txAmount = parseAmount(tx.amount);
    const next = new Map(prev);

    if (next.has(key)) {
      const existing = next.get(key)!;
      const newTotal = existing.total_amount + txAmount;
      next.set(key, {
        ...existing,
        amount: newTotal,          // keep amount in sync with total_amount
        total_amount: newTotal,
        sales_count: existing.sales_count + 1,
        // Update to the latest transaction's metadata
        invoice_id: tx.invoice_id,
        date: tx.date,
        source: tx.source,
      });
      console.log(
        `Updated ${existing.admin_name}: total=${newTotal}, sales=${existing.sales_count + 1}`,
      );
    } else {
      next.set(key, {
        ...tx,
        total_amount: txAmount,
        sales_count: 1,
      });
      console.log(`New member added: ${tx.admin_name}, amount=${txAmount}`);
    }

    return next;
  };

  /**
   * Build initial roster from the today's-invoices list.
   * The REST API returns one row per invoice; we fold them into one row per person.
   */
  const buildRosterFromList = (
    list: Partial<Transaction>[],
  ): Map<string, AggregatedTransaction> => {
    let map = new Map<string, AggregatedTransaction>();
    for (const raw of list) {
      map = mergeIntoRoster(map, normalizeTransaction(raw));
    }
    return map;
  };

  // Sorted array derived from the roster — sorted by total_amount descending
  const transactions = useMemo<AggregatedTransaction[]>(
    () =>
      Array.from(roster.values()).sort((a, b) => b.total_amount - a.total_amount),
    [roster],
  );

  // Grand total amount across all salespeople
  const overall = useMemo(
    () => transactions.reduce((s, t) => s + t.total_amount, 0),
    [transactions],
  );

  // Total invoice count across all salespeople
  const totalSales = useMemo(
    () => transactions.reduce((s, t) => s + t.sales_count, 0),
    [transactions],
  );

  // ─── Audio ──────────────────────────────────────────────────────────────────

  const safePlayAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.readyState >= 2) {
      audio.play().catch(() => {});
    } else {
      const onCanPlay = () => {
        audio.play().catch(() => {});
        audio.removeEventListener("canplay", onCanPlay);
      };
      audio.addEventListener("canplay", onCanPlay);
    }
  };

  // ─── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    isMountedRef.current = true;

    const ENCRYPTION_KEY =
      process.env.NEXT_PUBLIC_FRONTEND_ENCRYPTION_KEY ||
      "your-frontend-encryption-key";
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

    const controller = new AbortController();

    const fetchTodayData = async () => {
      try {
        const res = await fetch(`${API_URL}/get_today_invoice_payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frontendEncryptionKey: ENCRYPTION_KEY }),
          signal: controller.signal,
        });

        if (!isMountedRef.current) return;

        if (res.ok) {
          const raw: Partial<Transaction>[] = await res.json();
          if (!isMountedRef.current) return;
          console.log("Initial data fetched:", raw.length, "invoices");
          setRoster(buildRosterFromList([...raw].reverse()));
        } else {
          console.error("Failed to fetch transactions:", res.status);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Error fetching transactions:", err);
      }
    };

    const setupSocket = () => {
      if (socketRef.current) return;

      console.log("Connecting socket to:", `${API_URL}/socket/leaderboard_updates`);

      const socket = io(`${API_URL}/socket/leaderboard_updates`, {
        transports: ["websocket", "polling"],
        secure: API_URL.startsWith("https"),
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        timeout: 5000,
      });

      socket.on("connect", () => console.log("Socket connected:", socket.id));

      socket.on("new_transaction", (raw: Partial<Transaction>) => {
        if (!isMountedRef.current) return;

        console.log("RAW new_transaction payload:", JSON.stringify(raw));

        const tx = normalizeTransaction(raw);

        // Flash banner shows the individual transaction that just arrived
        setIncoming(tx);

        // Update the roster — existing person gets accumulated, new person gets added
        setRoster((prev) => mergeIntoRoster(prev, tx));

        // Reset banner hide timer
        if (incomingTimer.current) clearTimeout(incomingTimer.current);

        // Play sound for large transactions
        const amountVal = parseAmount(tx.amount);
        if (soundEnabledRef.current && amountVal >= 10000) {
          safePlayAudio();
        }

        // Hide banner after 6 s
        incomingTimer.current = setTimeout(() => {
          if (isMountedRef.current) setIncoming(null);
        }, 6000);
      });

      socket.on("disconnect", () => console.log("Socket disconnected"));
      socket.on("connect_error", (err) =>
        console.error("Socket connection error:", err),
      );

      socketRef.current = socket;
    };

    fetchTodayData();
    setupSocket();

    return () => {
      isMountedRef.current = false;
      controller.abort();
      if (incomingTimer.current) clearTimeout(incomingTimer.current);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <main
      className="bg-white w-full min-h-screen relative"
      aria-label="Leaderboard page"
    >
      <Image
        className="absolute w-full h-full inset-0 pointer-events-none select-none object-cover"
        alt=""
        src={groupBg}
        fill
        priority
        aria-hidden="true"
      />

      {/* Audio — preloaded so readyState is ready before first play */}
      <audio ref={audioRef} preload="auto" src={audioSrc ?? undefined} />

      <div className="relative z-10 w-full h-full">
        {/* Enable Sound Button */}
        {showSoundBtn && (
          <button
            onClick={() => {
              setSoundEnabled(true);
              setShowSoundBtn(false);
              safePlayAudio();
            }}
            className="fixed right-8 top-[95%] sm:top-8 bg-primary text-white sm:text-black sm:bg-white/80 backdrop-blur border border-white/20 rounded-full px-4 sm:px-6 py-2 text-sm font-semibold hover:bg-white/90 transition-all duration-200 flex items-center gap-2 hover:scale-105 z-40"
            aria-label="Enable sound"
          >
            <Icon icon="fluent:speaker-2-32-regular" width={24} height={24} />
            <span className="text-[#0e0e0e] hidden sm:block">Enable Sound</span>
          </button>
        )}

        {/* Header */}
        <header className="py-5 text-center">
          <h6 className="[font-family:'Figtree-ExtraBoldItalic',Helvetica] font-bold text-[#0333f9] text-2xl sm:text-4xl tracking-[-0.96px] leading-[normal] whitespace-nowrap">
            LEADERBOARD
          </h6>
          <p className="mt-1 [font-family:'Figtree-Medium',Helvetica] font-normal text-[#0e0e0e] text-fluid-base text-center tracking-tight leading-snug">
            <span className="font-medium">Rs</span>
            <span className="[font-family:'Figtree-ExtraBoldItalic',Helvetica] font-extrabold">
              {" "}
              {formatAmount(overall)}{" "}
            </span>
            <span className="font-medium">across</span>
            <span className="[font-family:'Figtree-ExtraBoldItalic',Helvetica] font-extrabold">
              {" "}
              {totalSales} sales
            </span>
          </p>
        </header>

        {/* Incoming Flash Banner — shows the individual transaction that just arrived */}
        {incoming && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
            <div className="mx-auto rounded-full bg-card/80 backdrop-blur border border-white/15 px-5 py-3 flex items-center justify-center gap-3 [box-shadow:0_10px_40px_-10px_rgba(255,255,255,0.18)]">
              <span className="text-sm">
                <span className="font-semibold text-black">
                  Rs. {formatAmount(incoming.amount ?? 0)}
                </span>{" "}
                <span className="text-muted-foreground">
                  · {incoming.source ?? "unknown"} ·{" "}
                  {incoming.admin_name ?? "Unknown"}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* 3-column sections — one aggregated row per salesperson */}
        <div className="w-full flex justify-center">
          <FrameScreen transactions={transactions} />
        </div>
      </div>
    </main>
  );
}