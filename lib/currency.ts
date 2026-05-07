/**
 * Parse amount from various input types (number, string, undefined)
 */
export const parseAmount = (v: number | string | undefined): number => {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const cleaned = String(v).replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Format amount as INR currency string
 */
export const formatAmount = (v: number | string | undefined): string => {
  const num = parseAmount(v);
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
