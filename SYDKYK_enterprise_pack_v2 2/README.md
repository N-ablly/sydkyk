# SYDKYK enterprise demo pack

FICTIONAL DEMO ONLY. All company policies, people, amounts and records are invented. Not legal advice, an employment contract, a statutory entitlement guide, or an official corporate record. No real integrations or transactions are supplied.

## Start here
Read 01_specification/SYDKYK_enterprise_demo_specification.pdf, then use_case_catalog.csv and 05_demo_scripts/presenter_runbook.pdf. The pack specifies an expanded demo; it does not implement or deploy it.

## Contents
01_specification: comprehensive build specification, reference review and 86-use-case catalog in CSV and JSON.
02_knowledge_corpus: 17 individual fictional corporate knowledge documents in PDF and Markdown. These cover handbook, leave/attendance, employee documents, payroll/benefits, lifecycle/talent, conduct, restricted NTE, identity/software, incidents/security, devices, expenses/travel, procurement/invoices, Workplace, privacy, approvals, FAQs and communications/learning.
03_seed_data: 4,000 synthetic employee records (3,999 active and one preboarding), 12,000 leave-balance rows, 4,000 restricted payslips, 4,000 assets, 12 scenario transaction fixtures, catalogs, schedules, fictional calendar, personas, receipts, delegations and data dictionary.
04_rag: 17-document metadata manifest, 95 heading-level starter chunks, access policy, ingestion guide and 20 retrieval/security benchmark cases. No embeddings or running retrieval service are included.
05_demo_scripts: 12 scripted journeys with prompts, expected responses, steps, outcomes and negative branches; JSON equivalents; standalone fictional COE and NTE draft PDFs.
06_engineering: API and workflow contracts, request envelope schema, sample audit events and 30 unrun application acceptance criteria.

## Load and demonstrate
Freeze the demo clock at 2026-10-15T01:00:00Z. Follow the data dictionary load order. Index only the curated Markdown policy sources with metadata and pre-retrieval authorization; do not index their PDF duplicates, seed records, scripts or specification. Use structured tools for personal data. Clone mutable records by session and keep all adapters in mock mode. ER material requires an assigned case grant even though all sample content is fictional.

## Important limits
All policies are authored fictional company rules, not Philippine law or legal advice; see 00_PACKAGE_DISCLOSURE.md. Payroll deductions and company closures are invented. No production credentials, statutory payroll engine, real receipts, official signatures or actual external transactions are supplied. Persona selection is for presentation only. Lead capture is specified in test mode; real personal data needs approved notice/storage before launch. The full roster is synthetic; historical transactions are curated scenario fixtures rather than a complete enterprise history.

## Validation
validation_report.json records generated-content checks. It does not report application tests as passed. acceptance_criteria.csv remains not_run_application_not_implemented. Version 2 corporate PDFs were rewritten for SYDKYK and visually checked; Markdown and CSV/JSON are the editable import sources.

## Review provenance
Both original screenshots and the live site's initial/leave experience were inspected. Lovable plugin access allowed a source and screenshot review of the 13-slide deck. See reference_review.md for scope and localization findings. No app was edited or deployed and no build-agent message was sent.


## Updated company and system convention
Company: SYDKYK. Employee records: Workday. Payroll: ADP. Leave management: Sprout Solutions. Corporate policies are version 1.1 and written in ordinary company language. All adapters remain mock and unconnected; naming these vendors does not validate their APIs or capabilities. See 00_PACKAGE_DISCLOSURE.md.
