import Link from "next/link";
import { Mascot } from "@/components/demo/chrome";
import { MODE_LABEL, PILLARS, SCENARIOS, SCENARIO_ORDER } from "@/lib/demo/scenarios";

const PILLAR_BLURB: Record<(typeof PILLARS)[number], string> = {
  Listening: "Anonymous pulse surveys, people-to-meet suggestions, sensitive-feedback alerts and action plans.",
  Automation: "HR, IT, Finance and Workplace requests and tickets, with approvals in the right order and human handoffs.",
  Communication: "Cohort announcements across Teams, email and WhatsApp, quiet nudges and engagement stats.",
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
          <p className="kicker">{`Guided enterprise demo · ${SCENARIO_ORDER.length} scenarios`}</p>
          <h2>See an AI teammate listen to employees, handle HR, IT, Finance and Workplace requests, and keep everyone informed, with people in control.</h2>
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
          {PILLARS.map((p) => {
            const list = SCENARIO_ORDER.filter((id) => SCENARIOS[id].pillar === p);
            return (
              <div key={p} className="dcard">
                <h3>{p}</h3>
                <p>{PILLAR_BLURB[p]}</p>
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
