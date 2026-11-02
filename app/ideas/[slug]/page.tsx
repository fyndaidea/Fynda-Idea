import { notFound, redirect } from "next/navigation";
import { getIdeaBySlug } from "@/lib/db/ideas-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function IdeaSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idea = await getIdeaBySlug(slug).catch(() => null);
  if (!idea) notFound();
  redirect(`/ideas?view=split&idea=${encodeURIComponent(idea.slug)}`);
}
