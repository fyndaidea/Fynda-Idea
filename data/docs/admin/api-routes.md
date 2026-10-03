## Public / user

| Route | Methods |
|-------|---------|
| `/api/ideas` | GET |
| `/api/ideas/[slug]` | GET |
| `/api/categories` | GET |
| `/api/collections` | GET |
| `/api/submissions` | POST |
| `/api/favorites` | GET, POST, DELETE |
| `/api/profile` | GET, PATCH |
| `/api/feedback` | GET, POST |
| `/api/feedback/[id]/vote` | POST, DELETE |
| `/api/roadmap` | GET |
| `/api/release-notes` | GET |
| `/api/auth/register` | POST |
| `/api/auth/signout` | POST |
| `/api/auth/sync-profile` | POST |

## Admin (`requireAdminApiResponse`)

| Route | Methods |
|-------|---------|
| `/api/admin/ideas` | GET, POST |
| `/api/admin/ideas/[id]` | GET, PATCH, DELETE |
| `/api/admin/categories` | GET, POST |
| `/api/admin/categories/[id]` | PATCH, DELETE |
| `/api/admin/collections` | GET, POST |
| `/api/admin/collections/[id]` | GET, PATCH, DELETE |
| `/api/admin/submissions` | GET |
| `/api/admin/submissions/[id]` | PATCH, DELETE |
| `/api/admin/submissions/[id]/approve-create-idea` | POST |
| `/api/admin/feedback` | GET |
| `/api/admin/feedback/[id]` | PATCH, DELETE |
| `/api/admin/roadmap` | GET, POST |
| `/api/admin/roadmap/[id]` | PATCH, DELETE |
| `/api/admin/release-notes` | GET, POST |
| `/api/admin/release-notes/[id]` | PATCH, DELETE |
| `/api/admin/release-notes/[id]/publish` | POST |
| `/api/admin/users` | GET |
| `/api/admin/users/[id]` | PATCH |
