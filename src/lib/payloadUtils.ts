import type { PayloadDefinition } from "@/types/schema";

/** Returns true if any platform in the definition has multiple === true */
export function supportsMultiple(def: PayloadDefinition): boolean {
  return Object.values(def.platforms).some((p) => p.multiple === true);
}
