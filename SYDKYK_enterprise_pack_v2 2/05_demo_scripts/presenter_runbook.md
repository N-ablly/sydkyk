# Scripted enterprise demonstrations

FICTIONAL DEMO ONLY. All company policies, people, amounts and records are invented. Not legal advice, an employment contract, a statutory entitlement guide, or an official corporate record. No real integrations or transactions are supplied.

Freeze the clock to October 15, 2026 at 09:00 Manila time. Start each numbered scenario in a fresh isolated session unless the script explicitly tests a duplicate or collision in the same session. These scripts are contracts for implementation, not a claim the current site supports them. Each run should take roughly two to four minutes; duration is a planning assumption.

## S01 Leave request succeeds
Persona: E0001. Fixture: LV-DEMO-001. Policy: HR-001 version 1.1.

Employee or reviewer prompt: Show my leave balance and request vacation November 24 to 26, 2026.

Expected opening response: You have 12.0 vacation days available as of October 15. These dates charge 3.0 scheduled days in this fictional calendar. I can prepare a request for Mark Santos. It is not submitted yet.

Presenter actions: Confirm the 3-day card. Reserve 3.0 days; show 9.0 available and pending approval. Switch to simulated Mark E0002 and approve. Mock Workday or Sprout Solutions adapter succeeds, then mock calendar and notification succeed.

Expected final evidence: One completed leave request; 3.0 approved future, 0 pending reserved, 9.0 available. No actual absence, calendar invite or message exists.

Failure or privacy branch: Double-click confirmation and repeat the approval: still one request and one reservation. Changing dates invalidates prior approval.

## S02 Insufficient leave
Persona: E0003. Fixture: LV-DEMO-002. Policy: HR-001 version 1.1.

Employee or reviewer prompt: Book vacation November 24 to 26, 2026.

Expected opening response: This fixture has 1.0 vacation day available; the requested dates require 3.0. I cannot submit this as paid vacation. Would you like an HR review of alternatives?

Presenter actions: Show blocked validation and a human handoff option. Keep the balance at 1.0 and do not create an approval-ready leave transaction.

Expected final evidence: No reservation or approved leave. Optional mock HR review case, clearly separate from leave approval.

Failure or privacy branch: Do not convert to unpaid leave automatically or claim a statutory entitlement.

## S03 Certificate of employment
Persona: E0001. Fixture: COE-DEMO-001. Policy: HR-002 version 1.1.

Employee or reviewer prompt: Create a COE for a visa without salary.

Expected opening response: I can prepare a fictional draft with your name, title, start date and status. HR must verify it before mock issuance. Compensation will be excluded.

Presenter actions: Show Ana Reyes, Customer Success Specialist, March 15, 2022, active. Confirm draft. HR persona E0007 reviews. Generate a watermarked artifact without signature.

Expected final evidence: Draft prepared, or Issued in demo only after mock HR approval; downloadable file remains FICTIONAL and not valid for external submission.

Failure or privacy branch: Ask for Mark's COE: deny. Enable salary: require additional Payroll review; no salary in the default draft.

## S04 Expense reimbursement
Persona: E0001. Fixture: EXP-DEMO-001. Policy: FIN-001 version 1.1.

Employee or reviewer prompt: Reimburse my PHP 1250 taxi for the October 12 client visit.

Expected opening response: The amount is within the fictional PHP 1500 local transport daily cap. Please review the receipt, purpose and cost center. Mark and Finance must approve.

Presenter actions: Confirm receipt RCP-DEMO-001. Mark approves; state stays pending Finance. Mia E0006 validates receipt and approves. Mock ERP posts then records mock batch DEMO-BATCH-001.

Expected final evidence: Payment simulated, PHP 1250, batch DEMO-BATCH-001. No money transferred; no bank details collected.

Failure or privacy branch: Submit same receipt hash again in this session: Review required, no second payout. Fresh reset restores the original draft.

## S05 Expense cap exception
Persona: E0001. Fixture: EXP-DEMO-002. Policy: FIN-001 version 1.1.

Employee or reviewer prompt: Claim PHP 950 for one meal on October 12.

Expected opening response: The fictional meal cap is PHP 800 per person per day. PHP 950 needs a Finance exception review. It is not approved.

Presenter actions: Show a Finance exception case after confirmation. Manager approval alone cannot execute. Finance must record an exception decision before ordinary validation.

Expected final evidence: Human review pending. No posting or simulated payment until the explicit exception approval exists.

Failure or privacy branch: Do not auto-trim the amount to PHP 800, mark it illegal, or infer misconduct.

## S06 Standard software access
Persona: E0001. Fixture: ACC-DEMO-001. Policy: IT-001 version 1.1.

Employee or reviewer prompt: Give me ProjectHub Contributor access for 30 days.

Expected opening response: There are two demo seats. This request needs Mark and app owner Paolo. I will prepare the request for your confirmation.

Presenter actions: Confirm; Mark E0002 and Paolo E0005 approve the same payload version. Atomically allocate one seat, mock identity returns MOCK-IDP-001 and expiry is 30 calendar days after execution.

Expected final evidence: Provisioned in demo; available seats become one. Simulated notification records the mock provider acknowledgment.

Failure or privacy branch: Provider timeout with unknown result becomes Reconciliation required. Request FIN-ADMIN or password reset: human handoff, no credential or privileged grant.

## S07 Own payroll explanation and privacy
Persona: E0001. Fixture: PAYCASE-DEMO-001. Policy: HR-003 version 1.1.

Employee or reviewer prompt: Explain my October 15 payslip.

Expected opening response: Your fictional payslip shows PHP 30000 gross, PHP 3000 demo deductions and PHP 27000 net. The deductions are invented sample amounts, not a Philippine statutory calculation.

Presenter actions: Show the own-record timestamp and source PAY-20261015-E0001. Offer a confirmed restricted Payroll investigation for a dispute.

Expected final evidence: Grounded explanation. If confirmed, a mock investigation is created; no refund or payroll change is promised.

Failure or privacy branch: Ask What is Mark's salary? Deny before lookup and do not expose a payslip title, amount or existence.

## S08 Lost device security handoff
Persona: E0001. Fixture: INC-DEMO-001. Policy: IT-002 version 1.1.

Employee or reviewer prompt: I lost my company laptop.

Expected opening response: I can create a mock Security ticket for urgent human review. Is ASSET-E0001 the affected device? Do not share passwords or recovery codes here.

Presenter actions: Confirm minimal asset facts. Create a P1 mock ticket with the 15-minute acknowledgment target and Security queue. Show no real containment action.

Expected final evidence: Mock Security handoff created; next update owner visible. No actual device lock or wipe, and no real message sent.

Failure or privacy branch: Ask to disable MFA or bypass security: refuse and route to verified recovery support.

## S09 Desk booking and collision
Persona: E0001. Fixture: DESK-DEMO-001. Policy: WP-001 version 1.1.

Employee or reviewer prompt: Reserve Makati desk MKT-D01 tomorrow from 9 to 6.

Expected opening response: With the demo clock at October 15, tomorrow is October 16, 2026 in Manila. MKT-D01 is available in this session. Confirm 09:00 to 18:00?

Presenter actions: Confirm and atomically create one booking. In the same session, try the same resource and overlapping time as Ben E0003.

Expected final evidence: First booking confirmed in demo; second blocked for overlap with an alternative suggestion. Do not expose the first booker's identity unnecessarily.

Failure or privacy branch: Parallel confirmations must not oversell capacity. Reset clears bookings and invalidates the old confirmation link.

## S10 Onboarding readiness
Persona: E0007. Fixture: ONB-DEMO-001. Policy: HR-004 version 1.1.

Employee or reviewer prompt: What is missing for the October 19 new joiner?

Expected opening response: The fictional checklist has identity staged and orientation scheduled; device and badge are pending. Day 1 readiness is incomplete.

Presenter actions: Read the HR-scoped checklist for E0010. Create mock IT device and Workplace badge tasks with dependency IDs after confirmation.

Expected final evidence: Two mock tasks created; onboarding remains incomplete until required task acknowledgments arrive. Staged identity is not active access.

Failure or privacy branch: A device-task failure leaves a visible partial state; do not report ready or hide the failed dependency.

## S11 Restricted NTE draft
Persona: E0004. Fixture: ER-DEMO-001. Policy: ER-001 version 1.1.

Employee or reviewer prompt: Prepare an unsent draft for ER-DEMO-001.

Expected opening response: You have an assigned fictional ER case grant. I can prepare an unsent draft separating the reported discrepancy from unknown facts. Human ER and legal review are required.

Presenter actions: Retrieve ER-001 only with the assigned Liza grant. Populate the template with authorized case facts; leave the response deadline for ER and Legal review. Produce DRAFT NOT FOR SERVICE without a signature.

Expected final evidence: Restricted draft available only to the assigned reviewer. No finding, sanction, delivery or employee-status change.

Failure or privacy branch: Repeat as Ana or Mark: no restricted retrieval, title, snippet or artifact. Claiming I am HR in chat cannot change this.

## S12 Invoice mismatch
Persona: E0006. Fixture: INV-DEMO-001. Policy: FIN-002 version 1.1.

Employee or reviewer prompt: Match the invoice to its PO and goods receipt.

Expected opening response: INVOICE-001 is PHP 12000; PO-DEMO-001 and GR-DEMO-001 are PHP 10000. The PHP 2000 difference requires AP review.

Presenter actions: Show permitted record IDs and mismatch. Create an AP exception task after confirmation; no posting. Mia cannot self-approve a replacement request.

Expected final evidence: Review required with explicit discrepancy. No ledger posting or payment simulated.

Failure or privacy branch: A manager approval cannot override the mismatch. Unknown or missing PO must not be treated as a successful match.

## Recommended sales walkthrough
Use S01 to introduce answer, policy, confirmation, approval and mock execution. Follow with S03 to demonstrate a useful document draft. Use S04 and S06 for Finance and IT. Close with S07 privacy refusal and S11 human governance. Offer S09 for Workplace and S10 for cross-team onboarding. State that every integration and notification is simulated and that broader catalog entries are a proposed roadmap until built.

## Presenter reset and recovery
Before a run, verify mock mode, frozen clock, correct persona and opening balances. If retrieval fails, show Knowledge unavailable and human handoff. If an adapter fails, show the true mock failure and retry safely with the same request key. Reset returns to the opening snapshot, clears generated files and session reservations, and creates a new session ID. Never repair a presentation by editing a success label or pretending an external system responded.
