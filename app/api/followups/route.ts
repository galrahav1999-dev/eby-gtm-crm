import { createClient } from "@/lib/supabase/server";
import { personName } from "@/lib/format";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface FollowUp {
  object: "people" | "deals";
  id: string;
  displayId: string | null;
  title: string;
  owner: string | null;
  orgId: string | null;
  dueDate: string;
  overdue: boolean;
  subject: string;
  body: string;
  href: string;
}

// A calm, professional draft built from the record itself. No LLM call and
// nothing is ever sent: the owner logs it as an interaction if they choose.
function draftPerson(first: string, nextStep: string | null, owner: string | null) {
  const subject = first ? `Following up, ${first}` : "Following up";
  const body =
    `Hi${first ? " " + first : ""},\n\n` +
    (nextStep
      ? `Following up on our last conversation. As a next step, ${nextStep.trim().replace(/\.$/, "")}.`
      : "Following up on our last conversation and wanted to keep it moving.") +
    `\n\nBest,\n${owner ?? "The EBY team"}`;
  return { subject, body };
}
function draftDeal(name: string, nextStep: string | null, owner: string | null) {
  const subject = `${name} — next step`;
  const body =
    `Hi,\n\n` +
    (nextStep
      ? `Following up on ${name}. As a next step, ${nextStep.trim().replace(/\.$/, "")}.`
      : `Following up on ${name} to keep things moving.`) +
    `\n\nBest,\n${owner ?? "The EBY team"}`;
  return { subject, body };
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);
  const [people, deals] = await Promise.all([
    supabase
      .from("people")
      .select("id, display_id, first_name, last_name, owner, next_step, next_step_date, org_id")
      .is("archived_at", null)
      .not("next_step_date", "is", null)
      .lte("next_step_date", today),
    supabase
      .from("deals")
      .select("id, display_id, name, owner, next_step, next_step_date, org_id")
      .is("archived_at", null)
      .not("next_step_date", "is", null)
      .lte("next_step_date", today),
  ]);

  const items: FollowUp[] = [];
  for (const p of people.data ?? []) {
    const first = p.first_name ?? "";
    const d = draftPerson(first, p.next_step, p.owner);
    items.push({
      object: "people", id: p.id, displayId: p.display_id ?? null, title: personName(p), owner: p.owner ?? null,
      orgId: p.org_id ?? null, dueDate: p.next_step_date, overdue: p.next_step_date < today,
      subject: d.subject, body: d.body, href: `/people/${p.id}`,
    });
  }
  for (const dl of deals.data ?? []) {
    const d = draftDeal(dl.name ?? "this deal", dl.next_step, dl.owner);
    items.push({
      object: "deals", id: dl.id, displayId: dl.display_id ?? null, title: dl.name ?? "(unnamed deal)", owner: dl.owner ?? null,
      orgId: dl.org_id ?? null, dueDate: dl.next_step_date, overdue: dl.next_step_date < today,
      subject: d.subject, body: d.body, href: `/deals/${dl.id}`,
    });
  }
  items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return NextResponse.json({ items });
}
