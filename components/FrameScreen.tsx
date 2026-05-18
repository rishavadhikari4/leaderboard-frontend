"use client";

import { useMemo } from "react";
import { SourceColumn, type Transaction } from "./SourceColumn";

interface FrameScreenProps {
  transactions: Transaction[];
  detailTransactions?: Transaction[];
}

export const FrameScreen = ({ transactions, detailTransactions = [] }: FrameScreenProps) => {
  const grouped = useMemo(
    () => ({
      babal: transactions.filter((t) => t.source === "babal"),
      nest: transactions.filter((t) => t.source === "nest"),
      sms: transactions.filter((t) => t.source === "sms"),
    }),
    [transactions],
  );

  const groupedDetails = useMemo(
    () => ({
      babal: detailTransactions.filter((t) => t.source === "babal"),
      nest: detailTransactions.filter((t) => t.source === "nest"),
      sms: detailTransactions.filter((t) => t.source === "sms"),
    }),
    [detailTransactions],
  );

  return (
    <div className="w-full  max-w-[1440px] px-6">
      <div className="grid md:grid-cols-3 gap-6 2xl:gap-[70px] w-full items-start">
        <SourceColumn source="babal" transactions={grouped.babal} detailTransactions={groupedDetails.babal} />
        <SourceColumn source="nest" transactions={grouped.nest} detailTransactions={groupedDetails.nest} />
        <SourceColumn source="sms" transactions={grouped.sms} detailTransactions={groupedDetails.sms} />
      </div>
    </div>
  );
};

export default FrameScreen;
