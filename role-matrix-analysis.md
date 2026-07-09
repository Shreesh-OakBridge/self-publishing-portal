# Cursive Admin Role Matrix — Analysis & Recommendations

Analysis of the reference role matrix (SuperAdmin / Admin / Manager / Institution Admin) against Cursive's current codebase, with concrete recommendations.

## What Cursive already has

Cursive's admin roles are not flat — `admin_users.role` already supports three tiers: **owner, admin, editor** (`supabase/migrations/20260620100000_admin_roles.sql`). `AdminsPanel.tsx` lets an owner create/edit/remove admins and assign roles today. `AdminDashboard.tsx` filters its tab list per role, covering Leads, Manuscripts, Orders, Workspace, Quotes, Authors, Books, Promotions, Activity Log, Layout, Site Content, Media, and Admins.

The catch: outside of the `admin_users` table itself, every other table's row-level security only checks a single `is_admin()` boolean. Role-based restriction in `AdminDashboard.tsx` is a client-side array filter, not a database-enforced permission — any admin account, regardless of assigned role, can currently reach the underlying data if they call the API directly. This matters more once a Manager-tier role has narrower intended access, per below.

## Mapping the reference matrix onto Cursive

| Reference role | Cursive equivalent | Gap |
|---|---|---|
| SuperAdmin | `owner` | Already exists — full access, only owner can manage admins. |
| Admin | `admin` | Already exists — book publishing, content, manuscripts, etc. |
| Manager | **New tier, doesn't exist yet** | Would need a 4th value added to the `role` CHECK constraint, plus its own tab-visibility rules. |
| Institution Admin | **Doesn't exist in any form** | This isn't an internal staff role at all — it's a customer-facing "organization account" concept. See below. |

## Flagging the issue already called out in red

The reference matrix flags a real problem: giving Manager "Report export" implicitly grants revenue access if revenue figures live inside the same reports. This is worth taking seriously for Cursive specifically, because `estimated_price`, `amount`, `discount`, and `quoted_price` columns are woven directly into `orders`, `quotes`, and `book_customizations` — the same tables a Manager would need for operational reporting (order status, production stage, manuscript queue).

Two ways to resolve it, from simplest to most robust:

1. **Column-level suppression in the UI** — keep Manager on the same Orders/Quotes panels, but strip the price columns from what a Manager-role session renders and exports. Fast to build, but not airtight (still client-side).
2. **Dedicated Revenue/Finance view + real RLS** — carve financial figures into their own reporting view backed by a Postgres policy that checks `admin_role() IN ('owner','admin')`, so a Manager's Supabase session genuinely cannot query the numbers, not just doesn't see a button for them. This is the only version that closes the gap the red text is warning about, and it reuses the `admin_role()` SQL helper that already exists but currently isn't used for anything beyond the admin roster.

Given Cursive doesn't yet enforce any role beyond owner/admin/editor at the database layer, adding a Manager tier is the right moment to also add the first real RLS-based permission split, rather than layering another client-side-only convention on top.

## Institution Admin needs to be treated as a separate system, not a 4th internal role

This is the biggest gap, and conflating it with SuperAdmin/Admin/Manager would be a design mistake. Cursive today has zero concept of an organization/institution — no table, no membership model, nothing beyond marketing copy mentioning "institutional buyers." An Institution Admin is a *customer* who manages a limited roster of authors under their own account (think: a college publishing program, a corporate imprint), not a member of your internal team. Recommend building it as:

- A new `institutions` table (name, plan/seat limit, owner `user_id`) and an `institution_members` join table linking author accounts to an institution, capped by seat count.
- A lightweight "Institution Portal" — closer to a scoped-down `AccountPage.tsx` than to `AdminDashboard.tsx` — where the Institution Admin can invite/remove authors up to their seat limit and see aggregated (not per-author financial) progress across their cohort.
- RLS on `institution_members` so an Institution Admin can only ever touch rows scoped to their own institution — this one should be database-enforced from day one since it's customer-facing, unlike the internal-only tiers above.

## What the reference matrix assumes exists but Cursive doesn't have yet

Several reference-matrix capabilities are either missing entirely or only exist as unrelated CMS copy, worth calling out before scoping any of this as "just a permissions change":

- **Review and Rating Approval** — no submission or moderation workflow exists; `Testimonials.tsx` renders admin-authored CMS content, not user-submitted reviews. This would be new: a `reviews` table, a submission form, and a moderation queue panel.
- **Banner / Categories / Analytics** as distinct permissioned features — today these are just fields inside the generic Site Content CMS editor (hero banner text, portfolio categories) or outbound tracking (GA/PostHog), not standalone admin capabilities with their own access boundary. If the intent is "Manager can manage banners but not touch pricing," that requires splitting today's single big Site Content permission into smaller ones, since `ContentEditor.tsx` currently gates the whole CMS as one block.
- **User Logs** — this one already exists (`ActivityPanel.tsx` + `activity_log` table) and is easy to slot into a new Manager tier's allowed tabs with zero new engineering.

## Suggested next step

Before writing migrations, worth deciding: (1) do you want the Manager tier now, with real RLS-backed revenue separation, or a lighter client-side-only version to start; and (2) is Institution Admin in scope for this round or a later phase, given it's a genuinely separate multi-tenant feature rather than a role tweak. Happy to draft the actual migration + `AdminDashboard.tsx` tab changes once you've picked a direction.
