# Sydkyk

Clickable demo of Sydkyk, the autonomous AI teammate for HR, IT and Finance.

This is a **front-end-only demo**. All data is fictional sample data, and no chat, HR, finance or identity systems are connected.

## What the demo shows

Three use cases, each running the same flow (request → policy check → human approval → execute → notify):

| Use case | Employee asks | Approver | Systems |
| --- | --- | --- | --- |
| Leave request | Leave balances + vacation request | Line manager | Darwinbox, Outlook calendar |
| Reimbursement | ₱3,500 client dinner with receipt | Line manager | Receipt OCR, NetSuite |
| IT access | Salesforce access for a new role | App owner | Entra ID, Salesforce, ServiceNow |

Each one can be shown in three channels: **Microsoft Teams**, **Google Chat** or the **Sydkyk mobile app**. In the mobile app view, both people use phones and get push notifications.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm test          # reducer + date logic (Vitest)
npm run lint
npm run typecheck
npm run build
```

## Project structure

```
app/
  layout.tsx            fonts (Manrope, DM Sans, JetBrains Mono) and metadata
  page.tsx              renders the demo
  globals.css           brand tokens (light + dark) and all component styles
components/demo/
  demo.tsx              header, scenario and channel switchers, presenter guide
  employee-pane.tsx     chat view (Teams / Google Chat / phone)
  approver-pane.tsx     approval console, execution steps, audit trail
  request-forms.tsx     the editable request card for each use case
  chrome.tsx            mascot, phone status bar, tab bar, push notification
lib/demo/
  types.ts              domain types (scenarios, stages, audit entries)
  scenarios.ts          the three use cases: copy, policy checks, execution steps
  channels.ts           channel labels
  reducer.ts            the whole flow as a pure reducer (tested)
  use-demo.ts           timers, push notifications, remembered tab/channel
```

### Adding a use case

1. Add its values type to `lib/demo/types.ts` and its id to `ScenarioId`.
2. Define the scenario in `lib/demo/scenarios.ts` and add it to `SCENARIOS` and `SCENARIO_ORDER`.
3. Add its request card to `FORMS` in `components/demo/request-forms.tsx`.

## Path to the real product

The demo keeps the flow logic in `lib/demo/reducer.ts`, separate from the UI. When the backend arrives, the reducer's actions map onto API calls (`send` → conversation endpoint, `submit` → create request, `approve` / `decline` → approval decision), and the audit trail comes from the server's append-only audit log instead of being simulated.
