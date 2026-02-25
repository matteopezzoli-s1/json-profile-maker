/**
 * Parse a .mobileconfig (plist XML) file and extract general settings + payload data.
 */

import type { GeneralSettings } from "@/components/GeneralEditor";

interface ParsedProfile {
  general: Partial<GeneralSettings>;
  payloads: { type: string; values: Record<string, unknown> }[];
}

/** Parse a plist <dict> node into a JS object */
function parseDict(node: Element): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const children = Array.from(node.children);
  for (let i = 0; i < children.length; i += 2) {
    const keyEl = children[i];
    const valEl = children[i + 1];
    if (!keyEl || !valEl || keyEl.tagName !== "key") continue;
    result[keyEl.textContent || ""] = parsePlistValue(valEl);
  }
  return result;
}

function parsePlistValue(el: Element): unknown {
  switch (el.tagName) {
    case "string":
      return el.textContent || "";
    case "integer":
      return parseInt(el.textContent || "0", 10);
    case "real":
      return parseFloat(el.textContent || "0");
    case "true":
      return true;
    case "false":
      return false;
    case "dict":
      return parseDict(el);
    case "array":
      return Array.from(el.children).map(parsePlistValue);
    case "data":
      return el.textContent?.trim() || "";
    case "date":
      return el.textContent || "";
    default:
      return el.textContent || "";
  }
}

const TOP_LEVEL_KEYS = new Set([
  "PayloadContent",
  "PayloadDisplayName",
  "PayloadIdentifier",
  "PayloadType",
  "PayloadUUID",
  "PayloadVersion",
  "PayloadOrganization",
  "PayloadDescription",
  "ConsentText",
  "PayloadRemovalDisallowed",
  "RemovalDate",
]);

const PAYLOAD_META_KEYS = new Set([
  "PayloadType",
  "PayloadVersion",
  "PayloadIdentifier",
  "PayloadUUID",
  "PayloadDisplayName",
  "PayloadDescription",
  "PayloadOrganization",
]);

export function parseMobileconfig(xmlString: string): ParsedProfile {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "application/xml");

  const rootDict = doc.querySelector("plist > dict");
  if (!rootDict) throw new Error("File .mobileconfig non valido");

  const topLevel = parseDict(rootDict);

  // Extract general settings
  const general: Partial<GeneralSettings> = {};
  if (topLevel.PayloadDisplayName) general.PayloadDisplayName = String(topLevel.PayloadDisplayName);
  if (topLevel.PayloadIdentifier) general.PayloadIdentifier = String(topLevel.PayloadIdentifier);
  if (topLevel.PayloadOrganization) general.PayloadOrganization = String(topLevel.PayloadOrganization);
  if (topLevel.PayloadDescription) general.PayloadDescription = String(topLevel.PayloadDescription);

  // ConsentText is a dict with language keys
  if (topLevel.ConsentText && typeof topLevel.ConsentText === "object") {
    const ct = topLevel.ConsentText as Record<string, unknown>;
    general.ConsentText = String(ct.default || ct["en"] || Object.values(ct)[0] || "");
  }

  if (topLevel.PayloadRemovalDisallowed === true) {
    general.PayloadRemovalDisallowed = "with-auth";
  } else if (topLevel.PayloadRemovalDisallowed === false) {
    general.PayloadRemovalDisallowed = "never";
  } else {
    general.PayloadRemovalDisallowed = "always";
  }

  // Extract payload contents
  const payloads: ParsedProfile["payloads"] = [];
  const content = topLevel.PayloadContent;
  if (Array.isArray(content)) {
    for (const item of content) {
      if (item && typeof item === "object") {
        const dict = item as Record<string, unknown>;
        const type = String(dict.PayloadType || "");
        // Strip metadata keys, keep only user values
        const values: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(dict)) {
          if (!PAYLOAD_META_KEYS.has(k)) {
            values[k] = v;
          }
        }
        if (type) {
          payloads.push({ type, values });
        }
      }
    }
  }

  return { general, payloads };
}
