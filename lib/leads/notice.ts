/**
 * Privacy notice shown on the sign-up form.
 *
 * Real leads are saved only when `approved` is true AND Supabase is configured. Until the operator
 * approves this text (company name, contact and retention are filled in), the form runs in test mode:
 * it validates and opens the demo but stores nothing. See spec section 5.
 */
export const NOTICE = {
  version: "2026-10-19-draft",
  approved: false,
  controller: "the Sydkyk team",
  contactEmail: "hello@sydkyk.com",
  policyUrl: null as string | null,
  retentionDays: 90,
};

export const noticeSummary = () =>
  `We use your details to give you access to this demo and to follow up with you about Sydkyk. ` +
  `We keep them for ${NOTICE.retentionDays} days after your last visit, then delete them. ` +
  `To see or delete your details sooner, email ${NOTICE.contactEmail}. ` +
  `We never ask for payroll data, government IDs or employee lists.`;
