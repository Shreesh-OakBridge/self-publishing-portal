# Deploy — `uat → main`

Copy-paste this whole block in your terminal, from the project folder
(`C:\Users\Rohan\Desktop\Self-publishing-2-main`). It runs start-to-finish with
no editor pop-ups and deploys to production.

```bash
git add -A
git commit -m "Deploy updates"
git push origin uat
git checkout main
git pull origin main --no-rebase --no-edit
git merge uat --no-edit
git push origin main
git checkout uat
```

## What each line does

| Command | Purpose |
|---|---|
| `git add -A` | Stage every change |
| `git commit -m "Deploy updates"` | Commit them (edit the message if you like; "nothing to commit" is harmless) |
| `git push origin uat` | Save work to the `uat` branch (preview) |
| `git checkout main` | Switch to the production branch |
| `git pull origin main --no-rebase --no-edit` | Pull latest `main` so the push can't be rejected |
| `git merge uat --no-edit` | Bring `uat` work into `main` |
| `git push origin main` | **Triggers the Vercel production deploy** |
| `git checkout uat` | Return to your working branch |

The two `--no-edit` flags stop the vim/commit-message screen from ever popping up.

## Before you deploy

- **Database changes?** If a change added tables, RLS, or functions (e.g. the
  Project Workspace tranches), run that SQL in **Supabase → SQL Editor first**.
  Re-running `supabase/setup_all.sql` applies everything and is safe to re-run
  (idempotent). **Pure frontend changes** (copy, layout, pricing) need only the
  block above — no SQL.

## After you deploy

1. Watch the **Vercel** deployment go green (~1–2 min).
2. Hard-refresh production (**Ctrl + Shift + R**) to see it live.

## If something goes wrong

- **Push rejected (non-fast-forward):** the `git pull origin main --no-rebase
  --no-edit` line already prevents this. If you still see it, run that line, then
  `git push origin main` again.
- **A file is "locked" / unlink failed:** close the file (e.g. an open Word/PDF)
  and re-run the block.
- **Merge conflict:** rare here, since `uat` is the source of truth. Resolve the
  flagged files, `git add -A`, `git commit --no-edit`, then `git push origin main`.

## Reference

- Repo: https://github.com/Shreesh-OakBridge/self-publishing-portal
- Branches: `uat` = preview, `main` = production (auto-deploys via Vercel)
