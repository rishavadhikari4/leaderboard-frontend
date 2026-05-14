"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { io, Socket } from "socket.io-client";
import { type Transaction } from "./SourceColumn";
import { FrameScreen } from "./FrameScreen";

import groupBg from "@/public/Group.png";

// The design was built for a 1440px wide viewport.
// On larger screens (TV, 4K) we scale the entire layout up uniformly.
const DESIGN_WIDTH = 1440;

function useScaleFactor() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function update() {
      const vw = window.innerWidth;
      // Only scale up — never shrink below 1 (normal laptop/desktop stays as-is)
      setScale(Math.max(1, vw / DESIGN_WIDTH));
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return scale;
}

function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    function update() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return size;
}

export function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incoming, setIncoming] = useState<Transaction | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showSoundBtn, setShowSoundBtn] = useState(true);
  const [audioSrc] = useState<string | null>(
    process.env.NEXT_PUBLIC_ALERT_SOUND || "/sounds/announcement.mp3",
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const incomingTimer = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const scale = useScaleFactor();
  const { width, height } = useWindowSize();

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
          audioRef.current?.play().catch(() => { });
        }

        incomingTimer.current = window.setTimeout(() => setIncoming(null), 6000);
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

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const overall = useMemo(
    () => transactions.reduce((s, t) => s + parseAmount((t as any).amount), 0),
    [transactions],
  );

  return (
    <main
      className="bg-white w-full min-h-screen relative "
      aria-label="Leaderboard page"
    >
      <div className="absolute text-xs bg-black text-white rounded-full px-2 py-0.5 top-2 z-50 left-2 ">
        device ratio = {width}/{height}
      </div>
      {/* Background Image */}
      <Image
        className="absolute w-full h-full inset-0 pointer-events-none select-none object-cover"
        alt=""
        src={groupBg}
        fill
        priority
        aria-hidden="true"
      />

      {/* Audio */}
      <audio ref={audioRef} preload="auto" src={audioSrc ?? undefined} />

      {/* Main Content — scaled up uniformly on large screens */}
      <div
        className="relative z-10 w-full h-full"

      >
        {/* Enable Sound Button */}
        {showSoundBtn && (
          <button
            onClick={() => {
              setSoundEnabled(true);
              setShowSoundBtn(false);
              audioRef.current?.play().catch(() => { });
            }}
            className="fixed right-8 top-[95%]  sm:top-8 bg-primary text-white sm:text-black sm:bg-white/80 backdrop-blur border border-white/20 rounded-lg px-4 sm:px-6 py-2 text-sm font-semibold hover:bg-white/90 transition-all duration-200 flex items-center gap-2 hover:scale-105 z-40"
            aria-label="Enable sound"
          >
            <Icon icon="fluent:speaker-2-32-regular" width={24} height={24} />
            <span className="text-[#0e0e0e] hidden sm:block">Enable Sound</span>
          </button>
        )}

        {/* Header */}
        <header className=" py-5  text-center">
          <h6 className="[font-family:'Figtree-ExtraBoldItalic',Helvetica] font-bold text-[#0333f9] text-2xl sm:text-4xl  tracking-[-0.96px] leading-[normal] whitespace-nowrap">
            LEADERBOARD
          </h6>
          <p className="mt-2 [font-family:'Figtree-Medium',Helvetica] font-normal text-[#0e0e0e] text-lg text-center tracking-[-0.56px] leading-[normal] whitespace-nowrap">
            <span className="font-medium tracking-[-0.16px]">Rs</span>
            <span className="tracking-[-0.16px] [font-family:'Figtree-ExtraBoldItalic',Helvetica] font-extrabold">
              {" "}
              {formatAmount(overall)}{" "}
            </span>
            <span className="font-medium tracking-[-0.16px]">across</span>
            <span className="tracking-[-0.16px] [font-family:'Figtree-ExtraBoldItalic',Helvetica] font-extrabold">
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
                  Rs. {formatAmount((incoming as any).amount)}
                </span>{" "}
                <span className="text-muted-foreground">
                  · {incoming.source} · {incoming.admin_name}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* 3-column sales sections */}
        <div className="  w-full flex justify-center">
          <FrameScreen transactions={transactions} />
        </div>
      </div>
    </main>
  );
}