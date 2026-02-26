/**
 * Convert a JS value to plist XML string
 */
function toPlistValue(value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "<true/>" : "<false/>";
  }
  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return `<integer>${value}</integer>`;
    }
    return `<real>${value}</real>`;
  }
  if (typeof value === "string") {
    const escaped = value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<string>${escaped}</string>`;
  }
  if (Array.isArray(value)) {
    const items = value.map((v) => `\t${toPlistValue(v)}`).join("\n");
    return `<array>\n${items}\n</array>`;
  }
  if (value && typeof value === "object") {
    return dictToPlist(value as Record<string, unknown>, 0);
  }
  return `<string></string>`;
}

function dictToPlist(dict: Record<string, unknown>, indent: number): string {
  const tab = "\t".repeat(indent);
  const inner = "\t".repeat(indent + 1);
  const entries = Object.entries(dict)
    .map(([k, v]) => `${inner}<key>${k}</key>\n${inner}${toPlistValue(v)}`)
    .join("\n");
  return `${tab}<dict>\n${entries}\n${tab}</dict>`;
}

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16).toUpperCase();
  });
}

interface GeneralSettingsInput {
  PayloadDisplayName: string;
  PayloadIdentifier: string;
  PayloadOrganization: string;
  PayloadDescription: string;
  ConsentText: string;
  PayloadRemovalDisallowed: string;
  RemovalDate: string;
}

export function buildMobileconfig(
  activePayloads: string[],
  payloadValues: Record<string, Record<string, unknown>[]>,
  schema: Record<string, { displayName: string; fields?: Record<string, { default?: unknown }> }>,
  general: GeneralSettingsInput
): string {
  const profileUUID = generateUUID();
  const profileIdentifier = general.PayloadIdentifier || "com.configurator.profile";

  const payloadContents: string[] = [];

  for (const key of activePayloads) {
    const instances = payloadValues[key] || [{}];
    for (let idx = 0; idx < instances.length; idx++) {
      const vals = instances[idx] || {};
      // Start with all schema defaults, then overlay user values
      const cleaned: Record<string, unknown> = {};
      const fieldDefs = schema[key]?.fields;
      if (fieldDefs) {
        for (const [field, def] of Object.entries(fieldDefs)) {
          if (def.default !== undefined && def.default !== null && def.default !== "") {
            cleaned[field] = def.default;
          }
        }
      }
      for (const [field, value] of Object.entries(vals)) {
        if (value !== undefined && value !== null && value !== "") {
          cleaned[field] = value;
        }
      }

      const suffix = instances.length > 1 ? `${key}.${idx}` : key;
      const payloadDict: Record<string, unknown> = {
        ...cleaned,
        PayloadType: key,
        PayloadVersion: 1,
        PayloadIdentifier: `${profileIdentifier}.${suffix}`,
        PayloadUUID: generateUUID(),
        PayloadDisplayName: schema[key]?.displayName || key,
      };

      payloadContents.push(dictToPlist(payloadDict, 2));
    }
  }

  // Build optional top-level keys
  const optionalKeys: string[] = [];
  const addOpt = (key: string, val: string) => {
    if (val) optionalKeys.push(`\t<key>${key}</key>\n\t<string>${val}</string>`);
  };
  addOpt("PayloadOrganization", general.PayloadOrganization);
  addOpt("PayloadDescription", general.PayloadDescription);
  if (general.ConsentText) {
    optionalKeys.push(`\t<key>ConsentText</key>\n\t<dict>\n\t\t<key>default</key>\n\t\t<string>${general.ConsentText.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</string>\n\t</dict>`);
  }
  if (general.PayloadRemovalDisallowed === "never") {
    optionalKeys.push(`\t<key>PayloadRemovalDisallowed</key>\n\t<false/>`);
  } else if (general.PayloadRemovalDisallowed === "with-auth") {
    optionalKeys.push(`\t<key>PayloadRemovalDisallowed</key>\n\t<true/>`);
  }

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>PayloadContent</key>
\t<array>
${payloadContents.join("\n")}
\t</array>
\t<key>PayloadDisplayName</key>
\t<string>${general.PayloadDisplayName || "Senza nome"}</string>
\t<key>PayloadIdentifier</key>
\t<string>${profileIdentifier}</string>
\t<key>PayloadType</key>
\t<string>Configuration</string>
\t<key>PayloadUUID</key>
\t<string>${profileUUID}</string>
\t<key>PayloadVersion</key>
\t<integer>1</integer>
${optionalKeys.join("\n")}
</dict>
</plist>`;

  return plist;
}
