export function plainTextExcerpt(value: string | null | undefined, maxLength = 160) {
  const text = (value ?? "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[*_#>`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "";
  if (text.length <= maxLength) return text;

  const clipped = text.slice(0, maxLength - 1);
  const safe = clipped.slice(0, Math.max(clipped.lastIndexOf("."), clipped.lastIndexOf(","), clipped.lastIndexOf(" ")));
  return `${(safe || clipped).trim()}…`;
}

export function buildIdeaMetaDescription(input: {
  summary?: string | null;
  body?: string | null;
}) {
  const summary = plainTextExcerpt(input.summary, 110);
  const body = plainTextExcerpt(input.body, 220);

  if (summary && body && !body.toLowerCase().startsWith(summary.toLowerCase())) {
    return plainTextExcerpt(`${summary} ${body}`, 160);
  }
  return summary || plainTextExcerpt(body, 160);
}
