## Shell

Admin lives under `/admin` with:

- Dark/light theme (`admin-theme.css`, `data-admin-theme`)
- Collapsible sidebar (`AdminSidebar` + `lib/admin/nav.ts`)
- Top bar (`AdminTopBar`)
- Full-bleed layout for idea editor paths (`/admin/ideas/new`, `/admin/ideas/[id]`)

## Navigation

| Group | Pages |
|-------|-------|
| Overview | Dashboard |
| Catalog | Ideas, Categories, Collections |
| Community | Submissions, Feedback |
| Product | Roadmap, Releases |
| System | Users, Utilities |

## CRUD

List pages use `DataTable` (TanStack Table v8) with search and pagination. Idea create/edit uses `IdeaEditorClient`.

**Approve submission** creates a published idea via `POST /api/admin/submissions/[id]/approve-create-idea`.
