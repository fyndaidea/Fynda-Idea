/** Split plain text on blank lines into paragraphs (blog/news body). */
export function toParagraphs(text: string) {
  return text
    .split(/\n{2,}/g)
    .map((p) => p.trim())
    .filter(Boolean);
}
