import Image from "next/image";
import { useMemo, useState } from "react";

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
  icon: string;
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

export function SourceColumn({ title, icon, source, transactions }: Props) {
  const c = sourceClasses[source];
  const isImageIcon = icon.startsWith("/");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const parseAmount = (v: number | string | undefined) => {
    if (v == null) return 0;
    if (typeof v === "number") return v;
    const cleaned = String(v).replace(/[^0-9.-]/g, "");
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    transactions.forEach((t) => {
      const key = t.admin_id || t.admin_name || t.invoice_id;
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    });
    return Array.from(map.entries()).map(([key, txs]) => ({
      key,
      admin_id: txs[0].admin_id ?? key,
      admin_name: txs[0].admin_name ?? "Unknown",
      transactions: txs,
      total: txs.reduce((s, t) => s + parseAmount(t.amount), 0),
    }));
  }, [transactions]);

  const formatAmount = (v: number | string | undefined) => {
    const num = parseAmount(v);
    return num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const total = useMemo(
    () => transactions.reduce((s, t) => s + parseAmount(t.amount), 0),
    [transactions],
  );

  return (
    <div className="flex flex-col h-full px-6 lg:px-8">
      <div
        className={`rounded-2xl bg-card/60 backdrop-blur-sm p-5 mb-5 ring-1 ${c.ring} ${c.shadow}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex-shrink-0 rounded-full overflow-hidden p-1 ${c.chip}`}
            >
              {isImageIcon ? (
                <Image
                  src={icon}
                  alt={title}
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                  priority={source === "sms"}
                />
              ) : (
                <div className="h-10 w-10 flex items-center justify-center text-lg">
                  {icon}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
              <div className="text-xs text-muted-foreground mt-1">
                {transactions.length} Sale
                {transactions.length === 1 ? "" : "s"} · Today
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

      <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
        {transactions.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12 border border-dashed border-border rounded-xl">
            No sales yet
          </div>
        )}

        {groups.map((g) => (
          <div key={g.admin_id} className="space-y-2">
            <button
              type="button"
              onClick={() =>
                setOpenGroups((s) => ({ ...s, [g.admin_id]: !s[g.admin_id] }))
              }
              className={`w-full flex items-center justify-between gap-3 rounded-xl bg-card/40 hover:bg-card/70 transition-colors px-4 py-3 border border-border/50`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${c.chip}`}
                >
                  {isImageIcon ? (
                    <Image
                      src={icon}
                      alt={title}
                      width={36}
                      height={36}
                      className="object-contain"
                    />
                  ) : (
                    <span className="text-sm">{icon}</span>
                  )}
                </div>
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
                <div className={`text-sm font-semibold tabular-nums ${c.text}`}>
                  Rs. {formatAmount(g.total)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {openGroups[g.admin_id] ? "▾" : "▸"}
                </div>
              </div>
            </button>

            {openGroups[g.admin_id] && (
              <div className="pl-14 space-y-1">
                {g.transactions.map((t, i) => (
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
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
