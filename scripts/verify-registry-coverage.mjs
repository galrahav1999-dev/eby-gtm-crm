// Registry coverage check: every object's field-registry definition must expose
// exactly the editable columns of its Supabase table (no missing fields, no
// stray fields). This enforces the data-capture PRD's core promise that the UI
// maps one to one to the database. Run with: npm run verify:registry
//
// The expected columns below are the authoritative editable set per table
// (every column except the ones the app never writes: id, display_id,
// created_at, updated_at, archived_at). If you add or drop a DB column, update
// both the migration and this map; the check will flag the registry until the
// FieldDef is added or removed.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// registry key -> { file, columns }
const EXPECTED = {
  organizations: {
    file: "lib/schema/organizations.ts",
    columns: ["name", "domain", "org_type", "age_band", "denomination", "city", "country", "size", "affiliation", "segment", "owner", "status", "notes"],
  },
  people: {
    file: "lib/schema/people.ts",
    columns: ["first_name", "last_name", "email", "role_title", "org_id", "country", "city", "segment", "source", "lifecycle", "owner", "next_step", "next_step_date", "notes"],
  },
  deals: {
    file: "lib/schema/deals.ts",
    columns: ["name", "org_id", "economic_buyer_id", "poc_id", "champion_id", "stage", "priority", "has_hebrew", "current_solution", "current_state", "pains", "ideal_state", "eval_timing", "decision_timeline", "seats", "acv", "opportunity_start", "expected_close", "owner", "next_step", "next_step_date", "closed_won_reason", "closed_lost_reason", "notes"],
  },
  pilots: {
    file: "lib/schema/pilots.ts",
    columns: ["org_id", "champion_id", "stage", "urgency", "capability", "representativeness", "success_metric", "feedback_cadence", "dpa_signed", "convert_by", "owner", "next_step", "notes"],
  },
  partners: {
    file: "lib/schema/partners.ts",
    columns: ["partner_org", "partner_type", "primary_contact_id", "stage", "what_they_give", "expected_reach", "terms", "owner", "next_step", "next_step_date", "notes"],
  },
  interactions: {
    file: "lib/schema/interactions.ts",
    columns: ["date", "person_id", "org_id", "deal_id", "type", "owner", "outcome", "verbatim_quote", "next_step", "next_step_date"],
  },
  waitlist: {
    file: "lib/schema/waitlist_cohorts.ts",
    columns: ["cohort_label", "segment", "signups", "confirmed", "activated", "retained_d30", "paid", "notes"],
  },
};

// Pull the field `name: "..."` values out of a def file.
function fieldNames(src) {
  return [...src.matchAll(/\bname:\s*"([^"]+)"/g)].map((m) => m[1]);
}

let failures = 0;
for (const [key, { file, columns }] of Object.entries(EXPECTED)) {
  const src = readFileSync(join(root, file), "utf8");
  const names = fieldNames(src);
  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  const have = new Set(names);
  const want = new Set(columns);
  const missing = columns.filter((c) => !have.has(c)); // in DB, not in UI
  const extra = names.filter((n) => !want.has(n)); // in UI, no such column

  if (missing.length || extra.length || dupes.length) {
    failures++;
    console.error(`FAIL ${key} (${file})`);
    if (missing.length) console.error(`  missing field for DB column: ${missing.join(", ")}`);
    if (extra.length) console.error(`  field has no DB column:        ${extra.join(", ")}`);
    if (dupes.length) console.error(`  duplicate field name:          ${dupes.join(", ")}`);
  } else {
    console.log(`ok   ${key}: ${columns.length} columns all mapped`);
  }
}

if (failures) {
  console.error(`\n${failures} object(s) out of sync with the database.`);
  process.exit(1);
}
console.log("\nAll objects map exactly to their editable DB columns.");
