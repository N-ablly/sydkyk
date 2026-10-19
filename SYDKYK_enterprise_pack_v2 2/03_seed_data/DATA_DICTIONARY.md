# Seed data dictionary and loading instructions

FICTIONAL DATA ONLY. No real identity, statutory identifiers, phone numbers, medical details, bank accounts or credentials are supplied. Names may resemble real names by coincidence. Emails use the reserved .example domain. Name uniqueness is not guaranteed; employee_id is the key.

## Snapshot and joins
Snapshot date is October 15, 2026. Freeze the demo clock to 2026-10-15T01:00:00Z for scripts. The tenant is sydkyk-ph. All times are UTC unless a field is explicitly a local date or time. Amounts are decimal PHP. Dates are ISO 8601. CSV blank means not applicable or unknown, never zero. Boolean CSV fields use True and False; JSON uses true and false.

employees.csv has exactly 4,000 employee rows, including 3,999 active and one preboarding joiner, not 4,000 plus managers. employee_id is primary key, tenant_id is mandatory, manager_id is a self-referencing foreign key and blank only for E0002, the root manager. office is assigned location, including remote workers. hire_date is historical; employment_type is a fixture, not a legal determination. salary is intentionally excluded from the directory.
leave_balances.csv has three rows per employee and primary key employee_id plus leave_type. allocation, adjustment, taken, approved_future, pending_reserved and available are days. Nonregular employees have blank entitlement fields and eligibility hr_review. available = allocation + adjustment - taken - approved_future - pending_reserved for eligible rows. version supports optimistic concurrency. This is an opening snapshot; drafts reserve nothing.
payslips_restricted.csv has one synthetic October 15 period per employee. payslip_id is unique and employee_id joins the directory. gross minus demo_deductions minus attendance_adjustment equals net. These amounts do not model Philippine payroll law. Restrict access before lookup; never embed this file.
assets.csv has one laptop per employee. asset_id is primary key and custodian_id joins employee_id. The invented model is not a product recommendation. compliance and warranty are demonstration states.

## Transaction records
transactions.json contains 12 named scenario fixtures. request_id is unique, employee_id is the subject, required_approvers lists necessary actors, and approvals is initially empty. version begins at 1; payload fields vary by kind. These fixtures are isolated per session. Scenario scripts explain the expected transitions. submitted onboarding is an existing workflow; all other draft records are editable examples except the restricted ER case. INV-DEMO-001 deliberately contains a mismatch. The requesting Finance reviewer must not self-approve; route to a different authorized AP reviewer if a future matching scenario needs approval.
applications.json holds catalog roles, seat counts and approver requirements. The literal current_manager resolves server-side from employees.csv. FIN-ADMIN is handoff-only. resources.json holds desks, rooms, courses and a fictional service status. Calendar dates are invented company closures, not a holiday source. schedules.json defines weekday integers Monday=0 through Sunday=6; overnight leave is charged to the shift start date. receipts.json provides synthetic extracted fields; no real receipt scan is included. delegations.json supplies one future effective-dated leave delegation, inactive at the snapshot clock.
demo_personas.json contains allowlisted presentation roles and limited grants. Do not convert these client-selectable roles into production authorization. Seed role bindings server-side in a non-production namespace.

## Load order and session behavior
Load employees, schedules, calendar, role bindings, balances, restricted payslips, assets, catalogs/resources, receipts, delegations, then transaction templates. Enforce tenant and foreign keys. Clone mutable transaction, balance, seat and booking state into a new random session namespace. Reset restores those clones and invalidates generated links, reservations and caches. Never alter the shared opening snapshot from a browser session. Leads live in an entirely separate store. Do not index seed CSV or JSON records as free-text knowledge.

## Coverage limits
The roster is complete at 4,000 people; transaction history is a curated scenario set, not 4,000 people's full history. There is no historical turnover, real payroll engine, legal holiday service, real attendance feed, official tax document, medical file or payment rail. Catalog items without a named seed transaction use a draft or handoff contract until separately implemented and tested.


## Updated company and system convention
Company: SYDKYK. Employee records: Workday. Payroll: ADP. Leave management: Sprout Solutions. Corporate policies are version 1.1 and written in ordinary company language. All adapters remain mock and unconnected; naming these vendors does not validate their APIs or capabilities. See 00_PACKAGE_DISCLOSURE.md.
