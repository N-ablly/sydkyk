import { z } from "zod";

export const EMPLOYEE_BANDS = ["1-49", "50-199", "200-999", "1000-3999", "4000-9999", "10000+"] as const;
export const BAND_LABEL: Record<(typeof EMPLOYEE_BANDS)[number], string> = {
  "1-49": "1 to 49",
  "50-199": "50 to 199",
  "200-999": "200 to 999",
  "1000-3999": "1,000 to 3,999",
  "4000-9999": "4,000 to 9,999",
  "10000+": "10,000 or more",
};
export const INTERESTS = ["HR", "IT", "Finance", "Workplace"] as const;

const optional = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, { error: message })
    .transform((v) => (v === "" ? null : v));

/** Lead form rules from the spec (section 5). Shared by the form and the server action. */
export const leadSchema = z.object({
  full_name: z.string().trim().min(2, { error: "Enter your full name (at least 2 characters)." }).max(100, { error: "Use 100 characters or fewer." }),
  email: z
    .string()
    .trim()
    .max(254, { error: "Use 254 characters or fewer." })
    .pipe(z.email({ error: "Enter an email address like name@company.com." })),
  company_name: z.string().trim().min(2, { error: "Enter your company name." }).max(150, { error: "Use 150 characters or fewer." }),
  employee_count_band: z.enum(EMPLOYEE_BANDS, { error: "Choose your company size." }),
  phone_optional: optional(20, "Use 20 characters or fewer, including the country code.").refine(
    (v) => v === null || /^\+?[0-9 ()-]{6,20}$/.test(v),
    { error: "Use digits with a country code, like +63 917 123 4567." },
  ),
  role_optional: optional(100, "Use 100 characters or fewer."),
  interest_categories: z.array(z.enum(INTERESTS)).max(INTERESTS.length),
  marketing_opt_in: z.boolean(),
});

export type LeadInput = z.infer<typeof leadSchema>;
export type LeadField = keyof LeadInput;

/** Field order, used to focus the first invalid field. */
export const FIELD_ORDER: LeadField[] = ["full_name", "email", "company_name", "employee_count_band", "phone_optional", "role_optional"];

export function parseLeadForm(form: FormData) {
  return leadSchema.safeParse({
    full_name: String(form.get("full_name") ?? ""),
    email: String(form.get("email") ?? ""),
    company_name: String(form.get("company_name") ?? ""),
    employee_count_band: String(form.get("employee_count_band") ?? ""),
    phone_optional: String(form.get("phone_optional") ?? ""),
    role_optional: String(form.get("role_optional") ?? ""),
    interest_categories: form.getAll("interest_categories").map(String),
    marketing_opt_in: form.get("marketing_opt_in") === "on",
  });
}

const PERSONAL_DOMAINS = new Set(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "live.com", "ymail.com", "proton.me"]);

/** A gentle hint only; personal addresses are accepted (spec: no blanket rejection). */
export const isPersonalEmail = (email: string) => PERSONAL_DOMAINS.has(email.trim().toLowerCase().split("@")[1] ?? "");
