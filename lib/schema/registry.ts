import type { ObjectDef } from "./types";
import { organizationsDef } from "./organizations";
import { peopleDef } from "./people";
import { dealsDef } from "./deals";
import { pilotsDef } from "./pilots";
import { partnersDef } from "./partners";
import { interactionsDef } from "./interactions";
import { waitlistCohortsDef } from "./waitlist_cohorts";

/**
 * The object registry. Every object is described here once; generic components
 * render its list, detail, and form from the definition.
 *
 * Transitional note: the bespoke route folders for deals, pilots, partners,
 * interactions, and waitlist still exist and take routing precedence over the
 * generic `[object]` routes until those folders are removed (Tier 1 of the
 * data-capture PRD). Registering the defs now is safe and inert for routing; it
 * only improves linked-record titles on existing detail pages and makes
 * getObjectDef resolve every object.
 */
export const REGISTRY: Record<string, ObjectDef> = {
  organizations: organizationsDef,
  people: peopleDef,
  deals: dealsDef,
  pilots: pilotsDef,
  partners: partnersDef,
  interactions: interactionsDef,
  waitlist: waitlistCohortsDef,
};

export function getObjectDef(key: string): ObjectDef | null {
  return REGISTRY[key] ?? null;
}

export const FRAMEWORK_OBJECTS = Object.keys(REGISTRY);
