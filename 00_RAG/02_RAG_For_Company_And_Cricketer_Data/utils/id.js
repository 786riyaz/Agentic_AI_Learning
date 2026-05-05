import crypto from "crypto";

// Stable ID from content (+ optional namespace)
export function makeId(text, namespace = "default") {
  const hash = crypto
    .createHash("sha256")
    .update(namespace + "::" + text)
    .digest("hex");
  // convert first 32 hex chars to UUID v4-like
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}