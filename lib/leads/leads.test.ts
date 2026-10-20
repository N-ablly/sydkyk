import { describe, expect, it } from "vitest";
import { csvCell, leadsToCsv, type LeadRow } from "./csv";
import { isPersonalEmail, parseLeadForm } from "./schema";

const form = (fields: Record<string, string | string[]>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) for (const x of [v].flat()) f.append(k, x);
  return f;
};

const valid = {
  full_name: "  Maria Santos ",
  email: "Maria@Example.com",
  company_name: "Acme PH",
  employee_count_band: "200-999",
  phone_optional: "",
  role_optional: "",
};

describe("lead form validation (spec section 5)", () => {
  it("accepts required fields with a blank optional phone and trims values", () => {
    const r = parseLeadForm(form(valid));
    expect(r.success).toBe(true);
    expect(r.data?.full_name).toBe("Maria Santos");
    expect(r.data?.phone_optional).toBeNull();
    expect(r.data?.marketing_opt_in).toBe(false);
  });

  it("rejects a bad email, short company and missing size with field messages", () => {
    const r = parseLeadForm(form({ ...valid, email: "not-an-email", company_name: "A", employee_count_band: "" }));
    expect(r.success).toBe(false);
    const fields = r.error!.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["email", "company_name", "employee_count_band"]));
  });

  it("limits phone to 20 characters with a country-code style format", () => {
    expect(parseLeadForm(form({ ...valid, phone_optional: "+63 917 123 4567" })).success).toBe(true);
    expect(parseLeadForm(form({ ...valid, phone_optional: "call me maybe" })).success).toBe(false);
    expect(parseLeadForm(form({ ...valid, phone_optional: "+63 917 123 4567 8910 11" })).success).toBe(false);
  });

  it("keeps marketing consent separate and unchecked by default", () => {
    expect(parseLeadForm(form({ ...valid, marketing_opt_in: "on" })).data?.marketing_opt_in).toBe(true);
  });

  it("only hints about personal email; it never blocks it", () => {
    expect(isPersonalEmail("someone@gmail.com")).toBe(true);
    expect(parseLeadForm(form({ ...valid, email: "someone@gmail.com" })).success).toBe(true);
  });
});

describe("CSV export", () => {
  it("neutralizes spreadsheet formulas and escapes quotes", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell("+639171234567")).toBe(`"'+639171234567"`);
    expect(csvCell(null)).toBe(`""`);
  });

  it("writes a header and one quoted row per lead", () => {
    const row: LeadRow = {
      lead_id: "1",
      source: "website",
      reference: "DEMO-ABC123",
      notified_at: null,
      created_at: "2026-10-19T00:00:00Z",
      last_seen_at: "2026-10-19T00:00:00Z",
      full_name: "Maria",
      email_normalized: "maria@example.com",
      company_name: "Acme",
      employee_count_band: "1-49",
      phone_optional: null,
      role_optional: null,
      interest_categories: ["HR", "IT"],
      marketing_opt_in: false,
      notice_version: "v1",
      expires_at: "2027-01-17T00:00:00Z",
    };
    const csv = leadsToCsv([row]).split("\r\n");
    expect(csv[0].startsWith("lead_id,source,reference,created_at")).toBe(true);
    expect(csv[1]).toContain(`"website","DEMO-ABC123"`);
    expect(csv[1]).toContain(`"HR; IT"`);
  });
});
