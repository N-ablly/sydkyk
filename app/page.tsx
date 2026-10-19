import Link from "next/link";
import { Mascot } from "@/components/demo/chrome";
import { DOMAINS, MODE_LABEL, SCENARIOS, SCENARIO_ORDER } from "@/lib/demo/scenarios";

const DOMAIN_BLURB: Record<(typeof DOMAINS)[number], string> = {
  HR: "Leave, certificates, payslips, onboarding and restricted employee-relations drafts.",
  IT: "Software access with two approvals and a lost-laptop security handoff.",
  Finance: "Expense claims, over-the-cap exceptions and invoice mismatches.",
  Workplace: "Desk booking with capacity checks and double-booking protection.",
};

/** Fully static: every link goes to /demo, which sends visitors without a session to sign-up first. */
export default function Landing() {
  return (
    <div className="wrap narrow">
      <header className="top">
        <div className="brand">
          <Mascot />
          <div>
            <h1>Sydkyk</h1>
            <small>THE AUTONOMOUS AI TEAMMATE · ENTERPRISE DEMO</small>
          </div>
        </div>
      </header>

      <main className="landing">
        <section className="hero">
          <p className="kicker">Guided enterprise demo · 12 scenarios</p>
          <h2>See an AI teammate handle HR, IT, Finance and Workplace requests, with people in control.</h2>
          <p className="lede">
            Follow a 4,000-person Philippine company through real employee requests: answers grounded in policy, approvals in the right
            order, and the cases Sydkyk deliberately hands to a person.
          </p>
          <div className="cta-row">
            <Link className="btn big" href="/demo">
              Explore the enterprise demo
            </Link>
            <span className="meta">Fictional company and simulated actions. Nothing connects to real systems.</span>
          </div>
        </section>

        <section className="domains" aria-label="What the demo covers">
          {DOMAINS.map((d) => {
            const list = SCENARIO_ORDER.filter((id) => SCENARIOS[id].domain === d);
            return (
              <div key={d} className="dcard">
                <h3>{d}</h3>
                <p>{DOMAIN_BLURB[d]}</p>
                <ul>
                  {list.map((id) => (
                    <li key={id}>
                      <Link href={`/demo?scenario=${id}`}>{SCENARIOS[id].title}</Link>
                      <span className={`mode m-${SCENARIOS[id].mode}`}>{MODE_LABEL[SCENARIOS[id].mode]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      </main>

      <p className="foot">
        SYDKYK, its people, policies and records are fictional. Vendor names (Workday, ADP, Sprout Solutions) describe the intended
        integration design only; no vendor system is connected.
      </p>
    </div>
  );
}
