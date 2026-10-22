# Sydkyk

Clickable demo of Sydkyk, the autonomous AI teammate for HR, IT and Finance.

This is a **front-end-only demo**. All data is fictional sample data, and no chat, HR, finance or identity systems are connected.

## What the demo shows

Twenty scripted journeys, grouped by pillar and filterable in the left rail. Each one runs request → policy check → (approval) → execute or hand off → notify, with "Try this" guardrails.

| Pillar | Journeys |
| --- | --- |
| Automation | S01–S12 from the enterprise pack runbook (leave, COE, expenses, access, payslip, lost laptop, desk booking, onboarding, NTE draft, invoice match), S17 question → auto-categorized ticket with SLA escalation, S18 exit and clearance workflow |
| Listening | S13 anonymous pulse survey to a cohort (10-person minimum), S14 people-to-meet 1:1 suggestions, S15 sensitive-feedback keyword alert routed to Employee Relations, S16 action plan from survey themes |
| Communication | S19 cohort announcement across Teams, email and WhatsApp with publisher approval, S20 quiet nudge plus engagement stats |

Each one can be shown in four channels: **Microsoft Teams**, **Google Chat**, **Slack** or the **Sydkyk mobile app**.

## Run locally

Copy `.env.example` to `.env.local` and fill in the values, or pull them from Vercel:

```bash
vercel env pull .env.local --environment=production --scope storm-learning
```

Secret-type variables come back as `[SENSITIVE]`; paste those two values in yourself.
Without Supabase and Anthropic keys the demo still runs: sign-up is in test mode and typed questions say AI is off.


```bash
npm install
npm run dev
```

Open http://localhost:3000/experience (the app is served under the `/experience` base path, as on www.sydkyk.ai/experience).

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
  page.tsx              landing page listing every journey
  demo/page.tsx         renders the demo
  globals.css           brand tokens (light + dark) and all component styles
components/demo/
  demo.tsx              header, scenario and channel switchers, presenter guide
  employee-pane.tsx     chat view (Teams / Google Chat / Slack / phone)
  approver-pane.tsx     approval console, execution steps, audit trail
  request-card.tsx      the request card for each journey
  scenario-rail.tsx     scenario list with pillar and area filters
  evidence-panel.tsx    guardrails, sources, outcome evidence, audit trail
  chrome.tsx            mascot, phone status bar, tab bar, push notification
lib/demo/
  types.ts              domain types (scenarios, stages, audit entries)
  scenarios.ts          the 20 journeys: copy, policy checks, execution steps
  sources.generated.ts  policy sections the journeys cite (from content/sydkyk-pack)
  channels.ts           channel labels
  reducer.ts            the whole flow as a pure reducer (tested)
  use-demo.ts           timers, push notifications, remembered tab/channel
```

### Adding a use case

1. Add its id to `ScenarioId` in `lib/demo/types.ts`.
2. Define the scenario (with its `pillar`) in `lib/demo/scenarios.ts` and add it to `SCENARIOS`.
3. Cite only policy sections listed in `lib/demo/sources.generated.ts`; add any new ones from `content/sydkyk-pack/chunks.jsonl`.

## Path to the real product

The demo keeps the flow logic in `lib/demo/reducer.ts`, separate from the UI. When the backend arrives, the reducer's actions map onto API calls (`send` → conversation endpoint, `submit` → create request, `approve` / `decline` → approval decision), and the audit trail comes from the server's append-only audit log instead of being simulated.
