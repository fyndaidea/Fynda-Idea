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

export type IdeaBodySection = IdeaSection & { start: number; end: number; source: string };

/** Exact source slices preserve every character outside the section being edited. */
export function ideaBodySections(markdown: string): IdeaBodySection[] {
  const lines = markdown.split(/\n/);
  const starts = [0];
  for (let i = 0; i < lines.length - 1; i++) starts.push(starts[i] + lines[i].length + 1);
  const headings = ideaOutline(markdown);
  return headings.map((heading, index) => {
    const start = starts[Number(heading.id.slice("idea-body-".length)) - 1];
    const end = index + 1 < headings.length ? starts[Number(headings[index + 1].id.slice("idea-body-".length)) - 1] : markdown.length;
    return { ...heading, start, end, source: markdown.slice(start, end) };
  });
}

export function replaceIdeaBodySection(markdown: string, section: IdeaBodySection, replacement: string): string {
  const suffix = markdown.slice(section.end);
  const separator = suffix && !replacement.endsWith("\n\n") ? replacement.endsWith("\n") ? "\n" : "\n\n" : "";
  return markdown.slice(0, section.start) + replacement + separator + suffix;
}
