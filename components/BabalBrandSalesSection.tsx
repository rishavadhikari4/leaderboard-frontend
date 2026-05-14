"use client";

import { useState, useEffect } from "react";
import { type Transaction, SourceColumn } from "./SourceColumn";

export function BabalBrandSalesSection() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

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
          setTransactions(data.filter((t) => t.source === "babal").reverse());
        }
      } catch (err) {
        console.error("Error fetching Babal transactions", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayData();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-sm text-[#0e0e0e]/40 py-8">
        Loading Babal Host sales...
      </div>
    );
  }

  return <SourceColumn source="babal" transactions={transactions} />;
}
