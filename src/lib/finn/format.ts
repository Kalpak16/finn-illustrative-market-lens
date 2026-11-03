export const inr = (n: number, digits = 2) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const crore = (n: number | null) => (n == null ? "Not available" : "₹" + Math.round(n).toLocaleString("en-IN") + " cr");

export const pct = (n: number | null, digits = 2) => (n == null ? "—" : `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`);

export const compact = (n: number) => {
  if (n >= 1e7) return (n / 1e7).toFixed(2) + " Cr";
  if (n >= 1e5) return (n / 1e5).toFixed(2) + " L";
  return n.toLocaleString("en-IN");
};

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export const toneOf = (n: number | null) => (n == null ? "text-muted-foreground" : n > 0 ? "text-positive" : n < 0 ? "text-negative" : "text-muted-foreground");
