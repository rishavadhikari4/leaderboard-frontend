import { memo, useMemo, useState } from "react";
import { formatAmount, parseAmount } from "@/lib/currency";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Transaction {
  _id: string;
  invoice_id: string;
  source: "nest" | "sms" | "babal";
  admin_id: string;
  admin_name?: string;
  amount: number | string;
  date: string;
  isNew?: boolean;
}

interface Props {
  title: string;
  source: "nest" | "sms" | "babal";
  transactions: Transaction[];
}

const sourceClasses: Record<
  Props["source"],
  { ring: string; text: string; chip: string; shadow: string }
> = {
  nest: {
    ring: "ring-white/15",
    text: "text-black",
    chip: "bg-white/10 text-white",
    shadow: "shadow-[0_12px_40px_-20px_rgba(255,255,255,0.25)]",
  },
  sms: {
    ring: "ring-white/10",
    text: "text-black-200",
    chip: "bg-white/10 text-black-100",
    shadow: "shadow-[0_12px_40px_-20px_rgba(255,255,255,0.18)]",
  },
  babal: {
    ring: "ring-white/20",
    text: "text-black-300",
    chip: "bg-white/10 text-black-100",
    shadow: "shadow-[0_12px_40px_-20px_rgba(255,255,255,0.2)]",
  },
};

function SourceColumnImpl({ title, source, transactions }: Props) {
  const c = sourceClasses[source];
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>(
    {},
  );
  const INITIAL_VISIBLE = 5;
  const INCREMENT = 10;

  // Group by admin and sort by total descending
  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    transactions.forEach((t) => {
      const key = t.admin_id || t.admin_name || t.invoice_id;
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    });
    return Array.from(map.entries())
      .map(([key, txs]) => ({
        key,
        admin_id: txs[0].admin_id ?? key,
        admin_name: txs[0].admin_name ?? "Unknown",
        transactions: txs,
        total: txs.reduce((s, t) => s + parseAmount(t.amount), 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  const total = useMemo(
    () => transactions.reduce((s, t) => s + parseAmount(t.amount), 0),
    [transactions],
  );

  return (
    <div className="flex flex-col h-full min-h-0 px-6 lg:px-8">
      {/* Column header card */}
      <div
        className={`rounded-2xl bg-card/60 backdrop-blur-sm p-5 mb-5 ring-1 ${c.ring} ${c.shadow}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              <div className="text-xs text-muted-foreground mt-1">
                {transactions.length} Sale{transactions.length === 1 ? "" : "s"}{" "}
                · Today
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
              Rs. {formatAmount(total)}
            </div>
          </div>
        </div>
      </div>

      {/* Sorted admin groups */}
      <div className="flex-1 min-h-0 pr-1 space-y-2 pb-2">
        {transactions.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12 rounded-xl">
            No sales yet
          </div>
        )}

        {groups.map((g, index) => {
          const isBoss = index === 0 && groups.length > 1 && g.total > 0;

          return (
            <div
              key={g.admin_id}
              className={`space-y-2 rounded-2xl ${isBoss ? "pt-7" : ""}`}
            >
              <button
                type="button"
                onClick={() =>
                  setOpenGroups((s) => ({
                    ...s,
                    [g.admin_id]: !s[g.admin_id],
                  }))
                }
                className={`relative w-full flex items-center justify-between gap-3 rounded-xl transition-colors px-4 py-3 border ${
                  isBoss
                    ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-400/40"
                    : "bg-card/40 hover:bg-card/70 border-border/50"
                }`}
              >
                {isBoss && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10">
                    <span className="text-2xl leading-none drop-shadow-lg">
                      👑
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400 mt-0.5 whitespace-nowrap">
                      Aaja Ko Dada
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0 text-left">
                    <div className="text-sm font-medium text-foreground truncate">
                      {g.admin_name}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {g.transactions.length} sale
                      {g.transactions.length === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    className={`text-sm font-semibold tabular-nums ${
                      isBoss ? "text-amber-400" : c.text
                    }`}
                  >
                    Rs. {formatAmount(g.total)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {openGroups[g.admin_id] ? "▾" : "▸"}
                  </div>
                </div>
              </button>

              {openGroups[g.admin_id] && (
                <ScrollArea className="max-h-72 pr-1">
                  <div className="pl-14 space-y-1 pb-2">
                    {(() => {
                      const total = g.transactions.length;
                      const visible =
                        visibleCounts[g.admin_id] ?? INITIAL_VISIBLE;
                      const slice = g.transactions.slice(0, visible);

                      return (
                        <>
                          {slice.map((t, i) => (
                            <div
                              key={t._id ?? `${t.invoice_id}-${i}`}
                              className="flex items-center justify-between gap-3 rounded-md px-3 py-2 bg-card/30 border border-border/40"
                            >
                              <div className="text-[13px] text-muted-foreground font-mono truncate">
                                {t.invoice_id.slice(0, 8)} ·{" "}
                                {new Date(t.date).toLocaleTimeString()}
                              </div>
                              <div
                                className={`text-sm font-semibold tabular-nums ${c.text}`}
                              >
                                Rs. {formatAmount(t.amount)}
                              </div>
                            </div>
                          ))}

                          {visible < total && (
                            <div className="px-3 py-2">
                              <button
                                onClick={() =>
                                  setVisibleCounts((s) => ({
                                    ...s,
                                    [g.admin_id]: Math.min(
                                      total,
                                      visible + INCREMENT,
                                    ),
                                  }))
                                }
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                Show more (
                                {Math.min(total - visible, INCREMENT)})
                              </button>
                            </div>
                          )}

                          {visible >= total && total > INITIAL_VISIBLE && (
                            <div className="px-3 py-2">
                              <button
                                onClick={() =>
                                  setVisibleCounts((s) => ({
                                    ...s,
                                    [g.admin_id]: INITIAL_VISIBLE,
                                  }))
                                }
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                Show less
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </ScrollArea>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const SourceColumn = memo(SourceColumnImpl);
