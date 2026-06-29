import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { OptionsMap } from "@/lib/options";

export interface ProposedOrg {
  name: string | null;
  org_type: string | null;
  age_band: string | null;
  denomination: string | null;
  city: string | null;
  country: string | null;
  size: string | null;
  affiliation: string | null;
  segment: string | null;
  status: string | null;
  notes: string | null;
}
export interface ProposedPerson {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role_title: string | null;
  org_name: string | null;
  city: string | null;
  country: string | null;
  segment: string | null;
  source: string | null;
  lifecycle: string | null;
  owner: string | null;
  next_step: string | null;
  next_step_date: string | null;
  notes: string | null;
}
export interface ProposedInteraction {
  date: string | null;
  person_name: string | null;
  org_name: string | null;
  type: string | null;
  owner: string | null;
  outcome: string | null;
  verbatim_quote: string | null;
  next_step: string | null;
  next_step_date: string | null;
}
export interface ProposedDeal {
  name: string | null;
  org_name: string | null;
  stage: string | null;
  priority: string | null;
  has_hebrew: string | null;
  current_solution: string | null;
  current_state: string | null;
  pains: string | null;
  ideal_state: string | null;
  eval_timing: string | null;
  decision_timeline: string | null;
  owner: string | null;
  notes: string | null;
}
export interface Proposal {
  organizations: ProposedOrg[];
  people: ProposedPerson[];
  interactions: ProposedInteraction[];
  deals: ProposedDeal[];
  to_chase_next: string[];
}

const SYSTEM = `You are the data-entry assistant for the EBY GTM CRM. You convert a discovery-call transcript or rough notes into clean draft records for a human to review.

STRICT RULES (follow exactly):
1. NEVER invent or infer a value that is not supported by the text. If a field is unknown, return null. A null field is correct; a guessed field is a bug.
2. For "pains", "verbatim_quote", and "outcome", use the person's OWN WORDS. Quote verbatim where possible. Do not soften or paraphrase emotion.
3. Dropdown fields accept ONLY the exact allowed values provided in the tool schema. Map what the person said onto the single closest allowed value. If nothing clearly matches, return null. Never output a near-miss or a made-up category.
4. Dates must be YYYY-MM-DD. If a date is relative ("next term"), put it in a timing field if one fits, otherwise leave the date null and mention it in notes.
5. Link records by name: a person's org_name and an interaction's person_name/org_name should match the name you used for that organization/person in this same output.
6. Always produce one interaction summarizing the conversation. Put the single sharpest verbatim quote in verbatim_quote.
7. "to_chase_next": list the important fields the conversation left blank, so the team knows what to ask next time.
8. Tools, products, apps, curricula, or current vendors the person mentions go in the deal's "current_solution" (and notes if several). Capture every pain in their own words in "pains".
9. Discovery-call completeness: if the recording is one person describing their situation, always return that person, one interaction, and (if any buying context, pains, or tools are present) one deal linked to them, so the call is fully captured.`;

function enumProp(values: string[], description: string) {
  // string limited to allowed values, or null when unknown
  return { type: ["string", "null"], enum: [...values, null], description };
}
const text = (d: string) => ({ type: ["string", "null"], description: d });

export function buildSchema(o: OptionsMap) {
  const org = {
    type: "object",
    properties: {
      name: text("Organization name as stated."),
      org_type: enumProp(o.org_type ?? [], "Type of organization."),
      age_band: enumProp(o.age_band ?? [], "Age / grade band."),
      denomination: enumProp(o.denomination ?? [], "Religious denomination."),
      city: text("City."),
      country: enumProp(o.country ?? [], "Country."),
      size: text("Size in students or seats, as stated."),
      affiliation: text("Affiliation / network."),
      segment: enumProp(o.segment ?? [], "GTM segment."),
      status: enumProp(o.org_status ?? [], "Outreach status."),
      notes: text("Anything else relevant, verbatim where it matters."),
    },
    required: ["name"],
  };
  const person = {
    type: "object",
    properties: {
      first_name: text("First name."),
      last_name: text("Last name."),
      email: text("Email if stated."),
      role_title: enumProp(o.person_role ?? [], "Role / title."),
      org_name: text("Name of the organization this person belongs to, matching an organization above. Null for an individual."),
      city: text("City."),
      country: enumProp(o.country ?? [], "Country."),
      segment: enumProp(o.segment ?? [], "GTM segment."),
      source: enumProp(o.source ?? [], "How we found them."),
      lifecycle: enumProp(o.lifecycle ?? [], "Lifecycle stage."),
      owner: enumProp(o.owner ?? [], "EBY team member who owns this contact."),
      next_step: text("Agreed next step."),
      next_step_date: text("Next-step date, YYYY-MM-DD."),
      notes: text("Original descriptor / context, verbatim where it matters."),
    },
    required: [],
  };
  const interaction = {
    type: "object",
    properties: {
      date: text("Date of the conversation, YYYY-MM-DD."),
      person_name: text("Name of the person, matching a person above."),
      org_name: text("Organization name, matching an organization above."),
      type: enumProp(o.interaction_type ?? [], "Interaction type."),
      owner: enumProp(o.owner ?? [], "EBY team member on the call."),
      outcome: text("What happened / outcome."),
      verbatim_quote: text("The single sharpest quote, in their exact words."),
      next_step: text("Agreed next step."),
      next_step_date: text("Next-step date, YYYY-MM-DD."),
    },
    required: [],
  };
  const deal = {
    type: "object",
    properties: {
      name: text("Short deal name, e.g. 'Hartman - K8 spoken Hebrew pilot'."),
      org_name: text("Organization name, matching an organization above."),
      stage: enumProp(o.b2b_stage ?? [], "Deal stage."),
      priority: enumProp(o.priority ?? [], "Priority."),
      has_hebrew: enumProp(o.yes_no_unknown ?? [], "Has a Hebrew program today?"),
      current_solution: text("Current solution / curriculum."),
      current_state: text("How it is going today."),
      pains: text("Pains in their own words, verbatim."),
      ideal_state: text("What good looks like to them."),
      eval_timing: enumProp(o.eval_timing ?? [], "Eval start timing."),
      decision_timeline: enumProp(o.decision_timeline ?? [], "Decision timeline."),
      owner: enumProp(o.owner ?? [], "EBY team owner."),
      notes: text("Anything else relevant."),
    },
    required: [],
  };
  return {
    type: "object",
    properties: {
      organizations: { type: "array", items: org },
      people: { type: "array", items: person },
      interactions: { type: "array", items: interaction },
      deals: { type: "array", items: deal },
      to_chase_next: { type: "array", items: { type: "string" } },
    },
    required: ["organizations", "people", "interactions", "deals", "to_chase_next"],
  };
}

/** Run extraction. Throws a clear error if the API key is missing. */
export async function extractRecords(transcript: string, options: OptionsMap): Promise<Proposal> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set. Add it to enable the AI logger.");
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

  const client = new Anthropic({ apiKey });
  const schema = buildSchema(options);

  const res = await client.messages.create({
    model,
    max_tokens: 4096,
    system: SYSTEM,
    tools: [
      {
        name: "save_records",
        description: "Save the extracted CRM records for human review.",
        input_schema: schema as any,
      },
    ],
    tool_choice: { type: "tool", name: "save_records" },
    messages: [{ role: "user", content: `Here is the transcript or notes:\n\n${transcript}` }],
  });

  const tool = res.content.find((c) => c.type === "tool_use");
  if (!tool || tool.type !== "tool_use") throw new Error("The AI did not return structured records.");
  const p = tool.input as Partial<Proposal>;
  return {
    organizations: p.organizations ?? [],
    people: p.people ?? [],
    interactions: p.interactions ?? [],
    deals: p.deals ?? [],
    to_chase_next: p.to_chase_next ?? [],
  };
}
