export const php = (n: number) =>
  "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/** Weekdays between two ISO dates, inclusive. Returns 0 for invalid or reversed ranges. */
export function businessDays(from: string, to: string): number {
  const d = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  if (isNaN(d.getTime()) || isNaN(end.getTime()) || end < d) return 0;
  let n = 0;
  while (d <= end) {
    const w = d.getDay();
    if (w !== 0 && w !== 6) n++;
    d.setDate(d.getDate() + 1);
  }
  return n;
}

/** Formats seconds-since-midnight as "9:41 AM" (short) or "09:41:05" (full, for the audit log). */
export function formatClock(seconds: number, style: "short" | "full" | "bare" = "short"): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (x: number) => String(x).padStart(2, "0");
  if (style === "full") return `${pad(h)}:${pad(m)}:${pad(s)}`;
  const h12 = ((h + 11) % 12) + 1;
  return style === "bare" ? `${h12}:${pad(m)}` : `${h12}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
}

export const firstName = (fullName: string) => fullName.split(" ")[0];
