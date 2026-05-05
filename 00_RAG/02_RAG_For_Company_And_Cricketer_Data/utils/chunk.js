export function chunkText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n\n")
    .map(c => c.trim())
    .filter(Boolean);
}