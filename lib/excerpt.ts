export function truncateSmart(text: string, maxChars = 360): string {
  const input = text.trim().replace(/\s+/g, " ");

  if (!input) {
    return "";
  }

  if (input.length <= maxChars) {
    return input;
  }

  const head = input.slice(0, maxChars);

  const sentenceEnd = Math.max(
    head.lastIndexOf(". "),
    head.lastIndexOf("! "),
    head.lastIndexOf("? "),
    head.lastIndexOf("."),
    head.lastIndexOf("!"),
    head.lastIndexOf("?")
  );

  if (sentenceEnd >= Math.floor(maxChars * 0.6)) {
    return head.slice(0, sentenceEnd + 1).trim();
  }

  const lastSpace = head.lastIndexOf(" ");
  if (lastSpace >= Math.floor(maxChars * 0.6)) {
    return `${head.slice(0, lastSpace).trim()}...`;
  }

  return `${head.trim()}...`;
}
