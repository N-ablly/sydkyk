import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Mascot } from "@/components/demo/chrome";
import { RegisterForm } from "@/components/leads/register-form";
import { SCENARIOS, isScenarioId } from "@/lib/demo/scenarios";
import { leadStorageEnabled } from "@/lib/leads/config";
import { NOTICE, noticeSummary } from "@/lib/leads/notice";
import { readSession } from "@/lib/leads/session";

export const metadata: Metadata = { title: "Register · Sydkyk Enterprise Demo" };

type Search = Promise<{ scenario?: string }>;

/** Request-time part: reads the deep link and session, and issues a fresh idempotency key per form. */
async function RegisterBody({ searchParams }: { searchParams: Search }) {
  const { scenario } = await searchParams;
  const target = isScenarioId(scenario) ? scenario : null;
  const session = await readSession();
  return (
    <>
      <p className="lede">
        A few details open the guided demo{target ? ` at ${target} · ${SCENARIOS[target].title}` : ""}. It runs on a fictional company with
        simulated systems, so there’s nothing to connect.
      </p>
      {session && (
        <p className="resume">
          You’re already registered on this browser. <Link href={target ? `/demo?scenario=${target}` : "/demo"}>Continue to the demo</Link>
        </p>
      )}
      <RegisterForm
        idempotencyKey={randomUUID()}
        scenario={target}
        testMode={!leadStorageEnabled()}
        notice={noticeSummary()}
        policyUrl={NOTICE.policyUrl}
      />
    </>
  );
}

export default function RegisterPage({ searchParams }: { searchParams: Search }) {
  return (
    <div className="wrap narrow">
      <header className="top">
        <Link href="/" className="brand">
          <Mascot />
          <div>
            <h1>Sydkyk</h1>
            <small>THE AUTONOMOUS AI TEAMMATE · ENTERPRISE DEMO</small>
          </div>
        </Link>
      </header>
      <main className="panel">
        <h2 className="ptitle">Tell us who’s exploring</h2>
        <Suspense fallback={<p className="meta">Loading the form…</p>}>
          <RegisterBody searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
