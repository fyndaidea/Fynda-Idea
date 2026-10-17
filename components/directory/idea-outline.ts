export type IdeaSection = { id: string; title: string };

/** Line-based IDs match the source positions supplied by ReactMarkdown. */
export function ideaOutline(markdown: string): IdeaSection[] {
  const sections: IdeaSection[] = [];
  let fence: { character: string; length: number } | null = null;
  markdown.split(/\r?\n/).forEach((line, index) => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (marker) {
      if (!fence) fence = { character: marker[1][0], length: marker[1].length };
      else if (marker[1][0] === fence.character && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
      return;
    }
    if (fence) return;
    const heading = line.match(/^ {0,3}##[ \t]+(.+?)[ \t]*$/);
    if (!heading) return;
    sections.push({
      id: `idea-body-${index + 1}`,
      title: heading[1].replace(/[ \t]+#+[ \t]*$/, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`]/g, ""),
    });
  });
  return sections;
}
