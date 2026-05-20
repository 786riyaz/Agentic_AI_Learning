import crypto from "crypto";

export function makeId(text, file) {
  return crypto
    .createHash("md5")
    .update(text + file)
    .digest("hex");
}