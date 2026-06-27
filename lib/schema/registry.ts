import type { ObjectDef } from "./types";
import { organizationsDef } from "./organizations";
import { peopleDef } from "./people";

/**
 * The object registry. Objects routed through the generic framework live here.
 * As more objects are ported (deals, pilots, partners, interactions), add them.
 */
export const REGISTRY: Record<string, ObjectDef> = {
  organizations: organizationsDef,
  people: peopleDef,
};

export function getObjectDef(key: string): ObjectDef | null {
  return REGISTRY[key] ?? null;
}

export const FRAMEWORK_OBJECTS = Object.keys(REGISTRY);
