# CLAUDE.md

Before any work, read `CONTEXT.md` (what we build and why) and `PLAN.md` (phases and progress).

## Rules
- Keep it simple: one seller, one owner login. Don't add SaaS features (multi-user, roles, billing) unless asked.
- Ease of use and reliability come before extra features.
- Clean dashboard UI with shadcn/ui + Tailwind. Arabic (RTL) is the default language, French second; every UI string goes through i18n.
- Money is stored as integers in DZD.
- No paid or external APIs in v1.
- Work phase by phase from `PLAN.md`. Tick the boxes when a task is done and tested.
- After each phase: run lint/typecheck/build and check the pages in the browser before calling it done.
- Never commit `.env`. Keep `.env.example` up to date.
