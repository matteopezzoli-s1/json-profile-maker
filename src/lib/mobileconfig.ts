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

export function buildMobileconfig(
  activePayloads: string[],
  payloadValues: Record<string, Record<string, unknown>>,
  schema: Record<string, { displayName: string }>
): string {
  const profileUUID = generateUUID();
  const profileIdentifier = "com.configurator.profile";

  const payloadContents: string[] = [];

  for (const key of activePayloads) {
    const vals = payloadValues[key] || {};
    const cleaned: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(vals)) {
      if (value !== undefined && value !== "" && value !== null) {
        cleaned[field] = value;
      }
    }

    const payloadDict: Record<string, unknown> = {
      ...cleaned,
      PayloadType: key,
      PayloadVersion: 1,
      PayloadIdentifier: `${profileIdentifier}.${key}`,
      PayloadUUID: generateUUID(),
      PayloadDisplayName: schema[key]?.displayName || key,
    };

    payloadContents.push(dictToPlist(payloadDict, 2));
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
\t<string>Configured Profile</string>
\t<key>PayloadIdentifier</key>
\t<string>${profileIdentifier}</string>
\t<key>PayloadType</key>
\t<string>Configuration</string>
\t<key>PayloadUUID</key>
\t<string>${profileUUID}</string>
\t<key>PayloadVersion</key>
\t<integer>1</integer>
</dict>
</plist>`;

  return plist;
}
