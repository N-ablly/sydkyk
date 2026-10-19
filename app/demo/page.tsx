import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Demo } from "@/components/demo/demo";
import { isScenarioId } from "@/lib/demo/scenarios";
import { readSession } from "@/lib/leads/session";

export const metadata: Metadata = { title: "Sydkyk Enterprise Demo" };

type Search = Promise<{ scenario?: string }>;

/** Reads the session cookie at request time; visitors without one go to sign-up, keeping the deep link. */
async function GatedDemo({ searchParams }: { searchParams: Search }) {
  const { scenario } = await searchParams;
  const target = isScenarioId(scenario) ? scenario : undefined;
  if (!(await readSession())) redirect(target ? `/register?scenario=${target}` : "/register");
  return <Demo initialScenario={target} />;
}

export default function DemoPage({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<p className="wrap meta">Loading the demo…</p>}>
      <GatedDemo searchParams={searchParams} />
    </Suspense>
  );
}
