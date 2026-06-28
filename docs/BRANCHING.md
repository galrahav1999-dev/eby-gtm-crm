# EBY GTM CRM — Branching and Release Workflow

How we ship safely, even building solo. One branch per change, a PR every time,
a preview to click before anything moves up, and a sacred production branch we can
roll back in one click.

## The branches

| Branch | Role | Vercel | Protected |
|---|---|---|---|
| `eby-gtm-crm` | **Production (our "main")**. What the live URL serves. | Production deploy (https://eby-gtm-crm.vercel.app) | Yes (required PR + review) |
| `staging` | Dress rehearsal. Mirrors production; final check before release. | Preview URL | Yes (required PR) |
| `develop` | Active integration. Where features come together. | Preview URL | Optional |
| `feature/*` | One per feature or fix (e.g. `feature/deals-framework`). | Preview URL per push | No |

## The flow (always PR, never push to production)

```
feature/x  ──PR──▶  develop  ──PR──▶  staging  ──PR──▶  eby-gtm-crm (production)
   build              integrate         rehearse           release
```

1. Branch off `develop`: `git checkout develop && git pull && git checkout -b feature/x`.
2. Build, commit, push the feature branch. Open a PR into `develop`. Vercel posts a
   preview link on the PR. Review the preview, then merge.
3. When a batch is ready, open a PR `develop -> staging`. Check the staging preview
   (it mirrors production). Merge.
4. To release, open a PR `staging -> eby-gtm-crm`. This is the only way to change
   production. Merge, and Vercel deploys live.

## Rollback (the 2 a.m. insurance)

- In Vercel: Deployments -> pick the last good production deployment -> **Promote
  to Production**. One click, instantly live again.
- Or in Git: revert the merge commit on `eby-gtm-crm` via a PR.

## One-time setup (Gal, in GitHub repo Settings -> Branches)

Add a branch protection rule for `eby-gtm-crm` (and ideally `staging`):
- Require a pull request before merging.
- Require approvals: 1 (you approve my PRs; nothing reaches production directly).
- Optionally require status checks (the Vercel build) to pass.

Vercel needs no change: production branch stays `eby-gtm-crm`; every other branch
and PR gets an automatic preview URL.

## Hotfixes

For an urgent production fix: branch `hotfix/x` off `eby-gtm-crm`, PR straight back
into `eby-gtm-crm`, then merge that back down into `staging` and `develop` so they
stay in sync.

## Notes for this project

- Database migrations live in `supabase/migrations/*`. Run new ones in the
  Supabase SQL editor as part of a release (staging project first if we add one).
- Commits are authored as `Claude <noreply@anthropic.com>`.
