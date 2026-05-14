"use client";

import { useMemo } from "react";
import { SourceColumn, type Transaction } from "./SourceColumn";

interface FrameScreenProps {
  transactions: Transaction[];
}

export const FrameScreen = ({ transactions }: FrameScreenProps) => {
  const grouped = useMemo(
    () => ({
      babal: transactions.filter((t) => t.source === "babal"),
      nest: transactions.filter((t) => t.source === "nest"),
      sms: transactions.filter((t) => t.source === "sms"),
    }),
    [transactions],
  );

  return (
    <div className="w-full  max-w-[1440px] px-6">
      <div className="grid lg:grid-cols-3 gap-6 2xl:gap-[70px] w-full items-start">
        <SourceColumn source="babal" transactions={grouped.babal} />
        <SourceColumn source="nest" transactions={grouped.nest} />
        <SourceColumn source="sms" transactions={grouped.sms} />
      </div>
    </div>
  );
};

export default FrameScreen;
