import "server-only";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getIdeaBySlug,
  listIdeas,
  searchIdeas,
  type Idea,
} from "@/lib/db/ideas-db";
import {
  createIdeaSubmission,
  listIdeaSubmissions,
} from "@/lib/db/submissions-db";
import {
  addFavorite,
  favoritesToRows,
  getProfileFavorites,
  removeFavorite,
  saveProfileFavorites,
} from "@/lib/favorites/store";
import { isFavoriteItemType } from "@/lib/favorites/types";
import {
  getMcpUserId,
  requireMcpAdmin,
  requireMcpSubscription,
  requireMcpToolAccess,
} from "@/lib/mcp/context";
import {
  mcpCreateIdea,
  mcpCreateIdeaSchema,
  mcpDeleteIdea,
  mcpDeleteIdeaInputSchema,
  mcpDeleteIdeaSchema,
  mcpUpdateIdea,
  mcpUpdateIdeaInputSchema,
  mcpUpdateIdeaSchema,
} from "@/lib/mcp/idea-write";
import {
  mcpCreateCategory,
  mcpCreateCategorySchema,
  mcpDeleteCategory,
  mcpDeleteCategoryInputSchema,
  mcpDeleteCategorySchema,
  mcpListCategories,
  mcpUpdateCategory,
  mcpUpdateCategoryInputSchema,
  mcpUpdateCategorySchema,
} from "@/lib/mcp/category-write";
import {
  mcpCreateCollection,
  mcpCreateCollectionSchema,
  mcpDeleteCollection,
  mcpDeleteCollectionInputSchema,
  mcpDeleteCollectionSchema,
  mcpListCollections,
  mcpUpdateCollection,
  mcpUpdateCollectionInputSchema,
  mcpUpdateCollectionSchema,
} from "@/lib/mcp/collection-write";

function jsonText(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function toolError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error: message }, null, 2) }],
    isError: true,
  };
}

function serializeIdeaSummary(idea: Idea) {
  return {
    id: idea.id,
    slug: idea.slug,
    title: idea.title,
    summary: idea.summary,
    status: idea.status,
    featured: idea.featured,
    score: idea.score,
    categories: idea.categories,
    tags: idea.tags,
    highlights: idea.highlights,
    authorName: idea.authorName,
  };
}

export function registerFyndaMcpTools(server: McpServer) {
  server.registerTool(
    "list_ideas",
    {
      title: "List ideas",
      description: "List ideas from the catalog, sorted by score.",
      inputSchema: {
        limit: z.number().int().min(1).max(100).optional(),
        featured_only: z.boolean().optional(),
        include_drafts: z.boolean().optional().describe("Admin-only drafts when true"),
      },
    },
    async ({ limit, featured_only, include_drafts }) => {
      try {
        requireMcpToolAccess("list_ideas");
        const userId = getMcpUserId();
        await requireMcpSubscription(userId);

        let withDrafts = include_drafts === true;
        if (withDrafts) {
          await requireMcpAdmin(userId);
        }

        const ideas = await listIdeas({
          limit: limit ?? 50,
          featuredOnly: featured_only ?? false,
          includeDrafts: withDrafts,
        });
        return jsonText(ideas.map(serializeIdeaSummary));
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.registerTool(
    "search_ideas",
    {
      title: "Search ideas",
      description: "Search ideas by title, summary, or body.",
      inputSchema: {
        query: z.string().min(1).describe("Search text"),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ query, limit }) => {
      try {
        requireMcpToolAccess("search_ideas");
        const userId = getMcpUserId();
        await requireMcpSubscription(userId);

        const ideas = await searchIdeas(query, { limit: limit ?? 25 });
        return jsonText(ideas.map(serializeIdeaSummary));
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.registerTool(
    "get_idea",
    {
      title: "Get idea",
      description: "Get full details for an idea by slug.",
      inputSchema: {
        slug: z.string().min(1).describe("Idea URL slug"),
        include_drafts: z.boolean().optional(),
      },
    },
    async ({ slug, include_drafts }) => {
      try {
        requireMcpToolAccess("get_idea");
        const userId = getMcpUserId();
        await requireMcpSubscription(userId);

        let withDrafts = include_drafts === true;
        if (withDrafts) {
          await requireMcpAdmin(userId);
        }

        const idea = await getIdeaBySlug(slug.trim(), { includeDrafts: withDrafts });
        if (!idea) throw new Error("Idea not found");

        return jsonText({
          ...serializeIdeaSummary(idea),
          body: idea.body,
          categoryIds: idea.categoryIds,
          createdAt: idea.createdAt,
          updatedAt: idea.updatedAt,
        });
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.registerTool(
    "list_categories",
    {
      title: "List categories",
      description: "List idea categories.",
      inputSchema: {
        include_unpublished: z.boolean().optional(),
      },
    },
    async ({ include_unpublished }) => {
      try {
        requireMcpToolAccess("list_categories");
        const userId = getMcpUserId();
        await requireMcpSubscription(userId);
        if (include_unpublished) await requireMcpAdmin(userId);
        return jsonText(await mcpListCategories({ include_unpublished }));
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.registerTool(
    "list_collections",
    {
      title: "List collections",
      description: "List curated idea collections.",
      inputSchema: {
        include_unpublished: z.boolean().optional(),
      },
    },
    async ({ include_unpublished }) => {
      try {
        requireMcpToolAccess("list_collections");
        const userId = getMcpUserId();
        await requireMcpSubscription(userId);
        if (include_unpublished) await requireMcpAdmin(userId);
        return jsonText(await mcpListCollections({ include_unpublished }));
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.registerTool(
    "list_favorites",
    {
      title: "List favorites",
      description: "List saved idea favorites for the authenticated user.",
      inputSchema: {
        type: z.enum(["idea"]).optional(),
      },
    },
    async ({ type }) => {
      try {
        requireMcpToolAccess("list_favorites");
        const userId = getMcpUserId();
        await requireMcpSubscription(userId);

        const favorites = await getProfileFavorites(userId);
        return jsonText(favoritesToRows(favorites, type));
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.registerTool(
    "add_favorite",
    {
      title: "Add favorite",
      description: "Save an idea to favorites.",
      inputSchema: {
        item_type: z.enum(["idea"]).default("idea"),
        item_id: z.string().min(1).describe("Idea slug or id"),
        item_title: z.string().min(1),
        item_subtitle: z.string().optional(),
      },
    },
    async ({ item_type, item_id, item_title, item_subtitle }) => {
      try {
        requireMcpToolAccess("add_favorite");
        const userId = getMcpUserId();
        await requireMcpSubscription(userId);

        if (!isFavoriteItemType(item_type)) {
          throw new Error("Invalid item_type");
        }

        const current = await getProfileFavorites(userId);
        const next = addFavorite(current, item_type, {
          id: item_id.trim(),
          title: item_title.trim(),
          subtitle: item_subtitle?.trim() || null,
        });
        await saveProfileFavorites(userId, next);

        const rows = favoritesToRows(next, item_type);
        const saved = rows.find((r) => r.item_id === item_id.trim());
        return jsonText(saved ?? { ok: true });
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.registerTool(
    "remove_favorite",
    {
      title: "Remove favorite",
      description: "Remove a saved idea favorite.",
      inputSchema: {
        item_type: z.enum(["idea"]).default("idea"),
        item_id: z.string().min(1),
      },
    },
    async ({ item_type, item_id }) => {
      try {
        requireMcpToolAccess("remove_favorite");
        const userId = getMcpUserId();
        await requireMcpSubscription(userId);

        if (!isFavoriteItemType(item_type)) {
          throw new Error("Invalid item_type");
        }

        const current = await getProfileFavorites(userId);
        const next = removeFavorite(current, item_type, item_id.trim());
        await saveProfileFavorites(userId, next);
        return jsonText({ ok: true });
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.registerTool(
    "submit_idea",
    {
      title: "Submit idea",
      description: "Submit a new idea for review.",
      inputSchema: {
        title: z.string().min(1),
        summary: z.string().optional(),
        body: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        submitter_email: z.string().email().optional(),
        submitter_name: z.string().optional(),
      },
    },
    async (body) => {
      try {
        requireMcpToolAccess("submit_idea");
        const userId = getMcpUserId();
        await requireMcpSubscription(userId);

        const row = await createIdeaSubmission({
          title: body.title,
          summary: body.summary,
          body: body.body,
          category: body.category,
          tags: body.tags,
          submitter_email: body.submitter_email,
          submitter_name: body.submitter_name,
        });

        return jsonText({
          id: row.id,
          title: row.title,
          status: row.status,
          createdAt: row.created_at,
          submittedBy: userId,
        });
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.registerTool(
    "create_idea",
    {
      title: "Create idea",
      description: "Create a catalog idea (admin).",
      inputSchema: mcpCreateIdeaSchema.shape,
    },
    async (input) => {
      try {
        requireMcpToolAccess("create_idea");
        const userId = getMcpUserId();
        await requireMcpSubscription(userId);
        await requireMcpAdmin(userId);
        return jsonText(await mcpCreateIdea(mcpCreateIdeaSchema.parse(input)));
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.registerTool(
    "update_idea",
    {
      title: "Update idea",
      description: "Update a catalog idea by id or slug (admin).",
      inputSchema: mcpUpdateIdeaInputSchema.shape,
    },
    async (input) => {
      try {
        requireMcpToolAccess("update_idea");
        const userId = getMcpUserId();
        await requireMcpSubscription(userId);
        await requireMcpAdmin(userId);
        return jsonText(await mcpUpdateIdea(mcpUpdateIdeaSchema.parse(input)));
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.registerTool(
    "delete_idea",
    {
      title: "Delete idea",
      description: "Delete a catalog idea by id or slug (admin).",
      inputSchema: mcpDeleteIdeaInputSchema.shape,
    },
    async (input) => {
      try {
        requireMcpToolAccess("delete_idea");
        const userId = getMcpUserId();
        await requireMcpSubscription(userId);
        await requireMcpAdmin(userId);
        return jsonText(await mcpDeleteIdea(mcpDeleteIdeaSchema.parse(input)));
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.registerTool(
    "create_category",
    {
      title: "Create category",
      description: "Create an idea category (admin).",
      inputSchema: mcpCreateCategorySchema.shape,
    },
    async (input) => {
      try {
        requireMcpToolAccess("create_category");
        const userId = getMcpUserId();
        await requireMcpSubscription(userId);
        await requireMcpAdmin(userId);
        return jsonText(await mcpCreateCategory(mcpCreateCategorySchema.parse(input)));
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.registerTool(
    "update_category",
    {
      title: "Update category",
      description: "Update a category by id or slug (admin).",
      inputSchema: mcpUpdateCategoryInputSchema.shape,
    },
    async (input) => {
      try {
        requireMcpToolAccess("update_category");
        const userId = getMcpUserId();
        await requireMcpSubscription(userId);
        await requireMcpAdmin(userId);
        return jsonText(await mcpUpdateCategory(mcpUpdateCategorySchema.parse(input)));
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.registerTool(
    "delete_category",
    {
      title: "Delete category",
      description: "Delete a category by id or slug (admin).",
      inputSchema: mcpDeleteCategoryInputSchema.shape,
    },
    async (input) => {
      try {
        requireMcpToolAccess("delete_category");
        const userId = getMcpUserId();
        await requireMcpSubscription(userId);
        await requireMcpAdmin(userId);
        return jsonText(await mcpDeleteCategory(mcpDeleteCategorySchema.parse(input)));
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.registerTool(
    "create_collection",
    {
      title: "Create collection",
      description: "Create a curated collection (admin).",
      inputSchema: mcpCreateCollectionSchema.shape,
    },
    async (input) => {
      try {
        requireMcpToolAccess("create_collection");
        const userId = getMcpUserId();
        await requireMcpSubscription(userId);
        await requireMcpAdmin(userId);
        return jsonText(await mcpCreateCollection(mcpCreateCollectionSchema.parse(input)));
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.registerTool(
    "update_collection",
    {
      title: "Update collection",
      description: "Update a collection by id or slug (admin).",
      inputSchema: mcpUpdateCollectionInputSchema.shape,
    },
    async (input) => {
      try {
        requireMcpToolAccess("update_collection");
        const userId = getMcpUserId();
        await requireMcpSubscription(userId);
        await requireMcpAdmin(userId);
        return jsonText(await mcpUpdateCollection(mcpUpdateCollectionSchema.parse(input)));
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.registerTool(
    "delete_collection",
    {
      title: "Delete collection",
      description: "Delete a collection by id or slug (admin).",
      inputSchema: mcpDeleteCollectionInputSchema.shape,
    },
    async (input) => {
      try {
        requireMcpToolAccess("delete_collection");
        const userId = getMcpUserId();
        await requireMcpSubscription(userId);
        await requireMcpAdmin(userId);
        return jsonText(await mcpDeleteCollection(mcpDeleteCollectionSchema.parse(input)));
      } catch (e) {
        return toolError(e);
      }
    }
  );

  server.registerTool(
    "list_submissions",
    {
      title: "List submissions",
      description: "List idea submissions in the review queue (admin).",
      inputSchema: {
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        limit: z.number().int().min(1).max(200).optional(),
      },
    },
    async ({ status, limit }) => {
      try {
        requireMcpToolAccess("list_submissions");
        const userId = getMcpUserId();
        await requireMcpSubscription(userId);
        await requireMcpAdmin(userId);

        const rows = await listIdeaSubmissions({ status, limit: limit ?? 50 });
        return jsonText(
          rows.map((row) => ({
            id: String(row.id),
            title: row.title,
            summary: row.summary,
            category: row.category,
            tags: row.tags ?? [],
            status: row.status,
            submitter_email: row.submitter_email,
            submitter_name: row.submitter_name,
            created_at: row.created_at,
            reviewed_at: row.reviewed_at,
          }))
        );
      } catch (e) {
        return toolError(e);
      }
    }
  );
}
