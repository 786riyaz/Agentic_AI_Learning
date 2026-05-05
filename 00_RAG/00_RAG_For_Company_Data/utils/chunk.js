export function chunkText(text) {
  return text
    .replace(/\r\n/g, "\n")   // normalize Windows line endings
    .split("\n\n")            // split by paragraphs
    .map(c => c.trim())
    .filter(c => c.length > 0);
}