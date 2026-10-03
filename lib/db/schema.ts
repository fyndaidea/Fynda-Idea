import type { Generated } from "kysely";

export interface Profiles {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  /** `{ idea: FavoriteItem[] }` — see lib/favorites/types.ts */
  favorites: unknown;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface Ideas {
  id: Generated<string>;
  title: string;
  slug: string;
  summary: string;
  body: string;
  status: string;
  featured: boolean;
  score: number;
  category_ids: string[];
  tags: string[];
  highlights: string[];
  author_name: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface IdeaSubmissions {
  id: Generated<string>;
  title: string;
  summary: string;
  body: string;
  category: string;
  tags: string[];
  submitter_email: string | null;
  submitter_name: string | null;
  status: Generated<string>;
  created_at: Generated<Date>;
  reviewed_at: Date | null;
}

export interface Categories {
  id: Generated<string>;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  published: boolean;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface Collections {
  id: Generated<string>;
  title: string;
  slug: string;
  description: string;
  published: boolean;
  sort_order: number;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface CollectionIdeas {
  collection_id: string;
  idea_slug: string;
  sort_order: number;
}

export interface FeedbackPosts {
  id: Generated<string>;
  user_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface FeedbackVotes {
  post_id: string;
  user_id: string;
  created_at: Generated<Date>;
}

export interface RoadmapItems {
  id: Generated<string>;
  title: string;
  description: string | null;
  status: string;
  target_date: Date | null;
  sort_order: number;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface ReleaseNotes {
  id: Generated<string>;
  title: string;
  body_md: string;
  published_at: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface Database {
  profiles: Profiles;
  ideas: Ideas;
  idea_submissions: IdeaSubmissions;
  categories: Categories;
  collections: Collections;
  collection_ideas: CollectionIdeas;
  feedback_posts: FeedbackPosts;
  feedback_votes: FeedbackVotes;
  roadmap_items: RoadmapItems;
  release_notes: ReleaseNotes;
}
