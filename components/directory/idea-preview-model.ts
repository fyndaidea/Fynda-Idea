/** Shared list/preview shape; full directory results already include the body. */
export type IdeaPreviewModel = {
  slug: string;
  title: string;
  summary: string;
  featured?: boolean;
  categories?: string[];
  highlights?: string[];
  body?: string;
  tags?: string[];
  authorName?: string | null;
  updatedAt?: Date | string;
};
