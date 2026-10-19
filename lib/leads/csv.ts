export interface LeadRow {
  lead_id: string;
  created_at: string;
  last_seen_at: string;
  full_name: string;
  email_normalized: string;
  company_name: string;
  employee_count_band: string;
  phone_optional: string | null;
  role_optional: string | null;
  interest_categories: string[];
  marketing_opt_in: boolean;
  notice_version: string;
  expires_at: string;
}

const COLUMNS: (keyof LeadRow)[] = [
  "lead_id",
  "created_at",
  "last_seen_at",
  "full_name",
  "email_normalized",
  "company_name",
  "employee_count_band",
  "phone_optional",
  "role_optional",
  "interest_categories",
  "marketing_opt_in",
  "notice_version",
  "expires_at",
];

/**
 * Quotes every cell and neutralizes values a spreadsheet would run as a formula
 * (leading =, +, -, @, tab or carriage return), since lead fields are typed by the public.
 */
export function csvCell(value: unknown): string {
  let s = Array.isArray(value) ? value.join("; ") : value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function leadsToCsv(rows: LeadRow[]): string {
  const lines = [COLUMNS.join(","), ...rows.map((r) => COLUMNS.map((c) => csvCell(r[c])).join(","))];
  return lines.join("\r\n") + "\r\n";
}
