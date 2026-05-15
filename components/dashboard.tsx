"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { io, Socket } from "socket.io-client";
import { type Transaction } from "./SourceColumn";
import { FrameScreen } from "./FrameScreen";

import groupBg from "@/public/Group.png";

export function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incoming, setIncoming] = useState<Transaction | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showSoundBtn, setShowSoundBtn] = useState(true);
  const [audioSrc] = useState<string | null>(
    process.env.NEXT_PUBLIC_ALERT_SOUND || "/sounds/announcement.mp3",
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const incomingTimer = useRef<ReturnType<typeof setTimeout> | null>(null); // FIX 1: correct timer type
  const socketRef = useRef<Socket | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const isMountedRef = useRef(true); // FIX 2: track mount state to prevent setState on unmounted component

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

  // FIX 3: safe audio play helper — guards readyState and handles promise rejection cleanly
  const safePlayAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    // readyState >= 2 means HAVE_CURRENT_DATA — safe to play
    if (audio.readyState >= 2) {
      audio.play().catch(() => {});
    } else {
      // Wait for it to be ready, then play once
      const onCanPlay = () => {
        audio.play().catch(() => {});
        audio.removeEventListener("canplay", onCanPlay);
      };
      audio.addEventListener("canplay", onCanPlay);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    const ENCRYPTION_KEY =
      process.env.NEXT_PUBLIC_FRONTEND_ENCRYPTION_KEY ||
      "your-frontend-encryption-key";
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

    // FIX 4: use AbortController so fetch doesn't call setState after unmount
    const controller = new AbortController();

    const fetchTodayData = async () => {
      try {
        const res = await fetch(`${API_URL}/get_today_invoice_payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frontendEncryptionKey: ENCRYPTION_KEY }),
          signal: controller.signal, // abort on unmount
        });

        if (!isMountedRef.current) return; // guard after async gap

        if (res.ok) {
          const data: Transaction[] = await res.json();
          if (!isMountedRef.current) return; // guard after second async gap
          console.log("Initial data fetched:", data.length, "transactions");
          setTransactions([...data].reverse());
        } else {
          console.error("Failed to fetch transactions", res.status);
        }
      } catch (err) {
        // AbortError is expected on unmount — don't log it as a real error
        if (err instanceof Error && err.name === "AbortError") return;
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
        if (!isMountedRef.current) return; // FIX 5: guard against post-unmount state updates

        console.log("New transaction received:", data);
        console.log("Transaction _id:", data._id, "invoice_id:", data.invoice_id);

        // Update incoming banner
        setIncoming(data);

        // Update transactions list
        setTransactions((prev) => {
          const isDuplicate = prev.some((t) => {
            if (t._id && data._id) return t._id === data._id;
            return t.invoice_id === data.invoice_id && t.date === data.date;
          });

          if (isDuplicate) {
            console.log("Duplicate transaction detected, skipping");
            return prev;
          }

          const next = [data, ...prev];
          console.log("Transaction added. Total:", next.length);
          return next.length > 500 ? next.slice(0, 500) : next;
        });

        // Clear any existing hide-banner timer
        if (incomingTimer.current) clearTimeout(incomingTimer.current);

        // Play sound if amount >= 10000
        const amountVal = parseAmount(data.amount);
        console.log("Amount:", amountVal, "Sound enabled:", soundEnabledRef.current);

        if (soundEnabledRef.current && amountVal >= 10000) {
          safePlayAudio(); // FIX 6: use safe audio play helper
        }

        // Hide incoming banner after 6 seconds
        incomingTimer.current = setTimeout(() => {
          if (isMountedRef.current) setIncoming(null); // FIX 7: guard timer callback too
        }, 6000);
      });

      socket.on("disconnect", () => console.log("Socket disconnected"));

      socketRef.current = socket;
    };

    fetchTodayData();
    setupSocket();

    return () => {
      // FIX 8: full cleanup — fetch abort, timer, socket, mount flag
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

  // Keep ref in sync with state so socket handler always reads latest value
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const overall = useMemo(
    () => transactions.reduce((s, t) => s + parseAmount((t as any).amount), 0),
    [transactions],
  );

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

      {/* Audio — preload so readyState is ready before first play */}
      <audio ref={audioRef} preload="auto" src={audioSrc ?? undefined} />

      <div className="relative z-10 w-full h-full">
        {/* Enable Sound Button */}
        {showSoundBtn && (
          <button
            onClick={() => {
              setSoundEnabled(true);
              setShowSoundBtn(false);
              safePlayAudio(); // FIX 9: use safe play here too
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
              {transactions.length} sales
            </span>
          </p>
        </header>

        {/* Incoming Flash Banner */}
        {incoming && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30">
            <div className="mx-auto rounded-full bg-card/80 backdrop-blur border border-white/15 px-5 py-3 flex items-center justify-center gap-3 [box-shadow:0_10px_40px_-10px_rgba(255,255,255,0.18)]">
              <span className="text-sm">
                <span className="font-semibold text-black">
                  Rs. {formatAmount(incoming.amount)}
                </span>{" "}
                <span className="text-muted-foreground">
                  · {incoming.source} · {incoming.admin_name || "Unknown"}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* 3-column sales sections */}
        <div className="w-full flex justify-center">
          <FrameScreen transactions={transactions} />
        </div>
      </div>
    </main>
  );
}