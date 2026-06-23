# Before TestFlight — checklist

**Full launch guide (what you must provide):** **[PRODUCTION_LAUNCH.md](./PRODUCTION_LAUNCH.md)**

## Code complete ✅

- [x] Email/password auth (OAuth removed)
- [x] Mobile Settings (logout, legal, forgot password)
- [x] Auth guards + logout redirect
- [x] Legal pages + footer on auth screens
- [x] Paper trading disclaimers
- [x] Onboarding → deploy first bot
- [x] Server-side autopilot cron
- [x] EAS bundle ID + Clerk key in `eas.json`
- [x] 6.7" screenshots in `apps/mobile/app-store-screenshots/6.7-inch/`
- [x] Web/mobile layout polish

## Your manual steps ☐

- [ ] Supabase `DATABASE_URL` on Vercel → redeploy
- [ ] `npm run verify:deploy -- https://auxano-red.vercel.app` passes
- [ ] Clerk: disable Apple/Google, webhook secret on Vercel
- [ ] TestFlight smoke test on real iPhone
- [ ] Upload screenshots to App Store Connect
- [ ] `npm run mobile:build:ios` + `npm run mobile:submit:ios`
- [ ] Submit for review

```bash
npm run verify:production-ready
```
