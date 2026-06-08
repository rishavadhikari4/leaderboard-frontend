"use client";

import { useMemo } from "react";
import { SourceColumn, type Transaction } from "./SourceColumn";

interface FrameScreenProps {
  transactions: Transaction[];
  detailTransactions?: Transaction[];
  periodLabel?: string;
  maxDisplayedSellers?: number;
  flameForTopN?: number;
  showMedalsForTopSellers?: boolean;
}

export const FrameScreen = ({
  transactions,
  detailTransactions = [],
  periodLabel,
  maxDisplayedSellers,
  flameForTopN,
  showMedalsForTopSellers,
}: FrameScreenProps) => {
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
    <div className="w-full max-w-[1440px] px-4 sm:px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 2xl:gap-[70px] w-full items-start">
        <SourceColumn
          source="babal"
          transactions={grouped.babal}
          detailTransactions={groupedDetails.babal}
          periodLabel={periodLabel}
          maxDisplayedSellers={maxDisplayedSellers}
          flameForTopN={flameForTopN}
          showMedalsForTopSellers={showMedalsForTopSellers}
        />
        <SourceColumn
          source="nest"
          transactions={grouped.nest}
          detailTransactions={groupedDetails.nest}
          periodLabel={periodLabel}
          maxDisplayedSellers={maxDisplayedSellers}
          flameForTopN={flameForTopN}
          showMedalsForTopSellers={showMedalsForTopSellers}
        />
        <SourceColumn
          source="sms"
          transactions={grouped.sms}
          detailTransactions={groupedDetails.sms}
          periodLabel={periodLabel}
          maxDisplayedSellers={maxDisplayedSellers}
          flameForTopN={flameForTopN}
          showMedalsForTopSellers={showMedalsForTopSellers}
        />
      </div>
    </div>
  );
};

export default FrameScreen;
