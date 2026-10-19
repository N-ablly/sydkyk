# Engineering implementation contract

## Build status
This pack supplies requirements, policy sources, fixture data and expected tests. It does not contain the expanded web application, a running RAG system, working connectors or completed application test results. All 30 acceptance criteria are unrun until implementation. Use the scripts as golden journeys and the benchmark as retrieval/authorization cases.

## Suggested API surface
GET /api/demo/catalog returns scenario metadata, actual readiness and source IDs. POST /api/demo/sessions creates an isolated namespace with fixture roles; POST /api/demo/session/reset invalidates the old namespace and links. GET /api/demo/me returns server-bound persona and permitted actions. Public persona selection accepts only an allowlisted fixture key and clears context, never arbitrary roles.
POST /api/demo/answers accepts message and scenario_id; the server derives tenant and subject, retrieves permitted policies and calls scoped fixture read tools. Return answer, citations, record_evidence and outcome=answer|clarify|handoff|denied|unavailable. Do not include private reasoning.
POST /api/demo/requests/preview accepts kind and editable fields. Return normalized payload, calculated impact, policy versions, required approvals, missing_fields and a short-lived preview token bound to payload hash and session. Preview has no side effect.
POST /api/demo/requests confirms the exact preview with Idempotency-Key. Return request_id, version, state and outstanding approvals. Server revalidates fields, permission, freshness, balance and policy before atomically recording reservation and request.
POST /api/demo/requests/{id}/decisions accepts approve|reject|return_for_information, expected_version and reason. The server derives actor, validates authority and payload hash and appends a decision. A changed payload invalidates relevant approvals. Decisions do not directly fabricate execution success.
POST /api/demo/requests/{id}/execute is an internal worker action after the complete approval set. Adapter choice is server configured. GET request status and event stream return only authorized fields. GET /api/demo/artifacts/{id} rechecks scope and expiry on each request.

## Validation and errors
Use 400 for malformed syntax, 401 for missing valid session, 403 or non-enumerating 404 for unauthorized resources, 409 for version/capacity/idempotency conflicts, 422 for business validation, 429 for rate limit and 503 for unavailable dependencies. Return a safe error code, human message, correlation_id and retryable flag. Never echo unauthorized field values or provider secrets.
Dates must be ISO local dates in the relevant schedule; start cannot exceed end. Monetary fields must be nonnegative exact decimals with explicit currency. Validate requested role against catalog. Attachments are disabled in the public release or restricted to size/type-scanned synthetic demo fixtures. Reject executable content and unsafe filenames. Never render unescaped extracted text as HTML.

## State machine and atomicity
Draft -> Submitted -> Pending approval -> Approved -> Executing -> Completed is the ordinary path. Submitted may go directly to Executing only when the deterministic policy requires no approval. Answers never traverse a fake execution path. Alternative states include Validation blocked, Returned for information, Rejected, Cancelled, Failed, Partially completed and Reconciliation required.
Use database transactions or equivalent locking to combine capacity/balance checks with reservations. Unique idempotency tuple is tenant_id, session_id, operation, request_id, version; store the canonical payload hash and response. Reusing a key with different content returns conflict. Append-only audit events have event IDs and server timestamps. A worker lease prevents parallel execution of the same request.
Provider adapters implement validate, execute, reconcile and optional compensate. Unknown outcome must reconcile against the same provider request ID before retry. For multiple systems, record each task and dependency. A calendar failure after an HRIS success is partial completion; retry only the failed step. Cancellation needs an explicit domain compensation rule, never silent rollback of an external action.

## Storage and deployment separation
Use separate policy, structured fixture, session mutation, artifact, audit and real-lead stores with distinct access rules. Seeds are read-only templates; mutations occur in session copies. Mark every record synthetic and adapter_mode mock. Outbound adapters are disabled by default. Do not load production data into the public deployment.
Suggested tables are employees, schedules, calendar, role_bindings, request_grants, balances, payslips, assets, catalogs, session_requests, approvals, reservations, adapter_operations, artifacts and audit_events. Add tenant_id to every table and session_id to mutable demo records. Enforce employee and request references and unique scoped keys. Use exact decimal types for money and leave, UTC instants for events and local dates for schedules.

## Frontend implementation sequence
Preserve the current employee/approver/audit experience and add the catalog rail, mode labels, source drawer and persona disclaimer. Build reusable request cards and state views rather than independent success animations. Wire them to the deterministic mock service. Add signup in test mode first. Implement session reset before enabling concurrent public use. Add mobile drawer/tabs and keyboard testing. Only expose scenarios whose acceptance cases pass.

## Live adapter readiness gate
A future connected adapter needs customer authorization, a sandbox, documented API contract and scopes, field mapping, identity binding, approval evidence, timeout/reconciliation behavior, audit trace, rollback or compensation rules and acceptance signoff. Payment rails and high-impact employment actions require their own controlled human process. This pack does not authorize sending real communications, issuing valid notices, changing pay or granting real access.

## Definition of done
All P0 acceptance rows pass with actual evidence, all 20 benchmark cases meet retrieval and disclosure assertions, the 12 scripted outcomes match fixtures, session isolation and reset hold under concurrency, and authorized product/domain/security reviewers sign off on displayed claims. Track each criterion with environment, build, run timestamp, actual result, evidence and reviewer. Do not prefill Pass because sample content is present.


## Updated company and system convention
Company: SYDKYK. Employee records: Workday. Payroll: ADP. Leave management: Sprout Solutions. Corporate policies are version 1.1 and written in ordinary company language. All adapters remain mock and unconnected; naming these vendors does not validate their APIs or capabilities. See 00_PACKAGE_DISCLOSURE.md.
