import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Demo } from "@/components/demo/demo";
import { isScenarioId } from "@/lib/demo/scenarios";
import { REGISTRATION_REQUIRED } from "@/lib/leads/config";
import { readSession } from "@/lib/leads/session";

export const metadata: Metadata = { title: "Sydkyk Enterprise Demo" };

type Search = Promise<{ scenario?: string }>;

/** Opens the demo, keeping deep links (?scenario=S04). Sends visitors to sign-up only when registration is on. */
async function DemoEntry({ searchParams }: { searchParams: Search }) {
  const { scenario } = await searchParams;
  const target = isScenarioId(scenario) ? scenario : undefined;
  if (REGISTRATION_REQUIRED && !(await readSession())) redirect(target ? `/register?scenario=${target}` : "/register");
  return <Demo initialScenario={target} />;
}

export default function DemoPage({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<p className="wrap meta">Loading the demo…</p>}>
      <DemoEntry searchParams={searchParams} />
    </Suspense>
  );
}
