import FavoriteButton from "@/components/favorites/FavoriteButton";
import { MarkdownBody } from "@/components/docs/markdown-body";
import { Button } from "@/components/ui";
import type { Idea } from "@/lib/db/ideas-db";
import {
  DetailBodySection,
  DetailBodyStack,
  DetailFactList,
  DetailPageShell,
  DetailProfileHero,
  DetailRailActions,
  DetailRailSection,
  DetailTagList,
} from "./detail-layout";

export default function IdeaDetailPage({ idea }: { idea: Idea }) {
  const initials = idea.title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const chips = [
    { label: "Idea" },
    ...(idea.featured ? [{ label: "Featured", accent: true as const }] : []),
    ...idea.categories.slice(0, 2).map((c) => ({ label: c })),
  ];

  const facts = [
    { label: "Type", value: "Idea" },
    ...(idea.authorName ? [{ label: "Author", value: idea.authorName }] : []),
    ...(idea.categories.length
      ? [{ label: "Categories", value: idea.categories.join(", ") }]
      : []),
    { label: "Score", value: String(idea.score) },
  ];

  return (
    <DetailPageShell
      hero={
        <DetailProfileHero
          initials={initials}
          chips={chips}
          title={idea.title}
          tagline={idea.summary}
          highlights={idea.highlights}
          actions={
            <FavoriteButton
              itemId={idea.slug}
              itemTitle={idea.title}
              itemSubtitle={idea.summary}
            />
          }
        />
      }
      rail={
        <>
          <DetailRailActions>
            <Button href="/ideas" variant="secondary" className="w-full justify-center">
              Browse more ideas
            </Button>
            <Button href="/submit" variant="primary" className="w-full justify-center">
              Submit an idea
            </Button>
          </DetailRailActions>
          <DetailRailSection title="About">
            <DetailFactList items={facts} />
          </DetailRailSection>
        </>
      }
    >
      <DetailBodyStack>
        {idea.body ? (
          <DetailBodySection title="Details">
            <div className="max-w-[68ch]">
              <MarkdownBody markdown={idea.body} />
            </div>
          </DetailBodySection>
        ) : null}
        {idea.tags.length > 0 ? (
          <DetailBodySection title="Tags">
            <DetailTagList items={idea.tags.map((t) => `#${t}`)} />
          </DetailBodySection>
        ) : null}
      </DetailBodyStack>
    </DetailPageShell>
  );
}
