# Before TestFlight — 10 high-impact improvements

Ship the current build first; these are the best next wins for a polished v1.

1. **First-run onboarding → first bot** — After sign-up, guide: pick DEFAULT preset → deploy → open Bots → see first autopilot run log (not preferences-only).
2. **Legal + trust footer** — Privacy, Terms, and paper-trading disclaimer on web sign-up, mobile settings, and share cards (App Store expects this).
3. **Pull-to-refresh everywhere** — Dashboard, portfolio, leaderboard, Bots, Compete on mobile (web has partial refresh).
4. **Offline / error states** — Clear “can’t reach API” banner with retry when `auxano-red.vercel.app` is down (partially exists via ApiStatusBanner).
5. **Friends-only leaderboard filter** — Match strategy visibility: toggle global vs friends on Leaders.
6. **Bot push on trade** — Notify when autopilot buys/sells (types exist; ensure mobile push prefs default on).
7. **Strategy detail on mobile** — Open community strategies from marketplace with deploy + follow (web has this; mobile is thinner).
8. **Haptic + polish on trade confirm** — Success/error feedback on paper order submit (mobile Trade tab).
9. **App Store screenshots + subtitle** — 6.7" screenshots from web; subtitle “Paper trading OS” in App Store Connect.
10. **Simulated data label** — Small “Paper · simulated quotes” on Trade/Bots when Finnhub fallback is used (honesty for reviewers).

## Production checklist (mobile)

- [x] Bundle ID `app.auxano.mobile`
- [x] Icon from `auxano.png` → `apps/mobile/assets/`
- [x] EAS `image: latest` (Xcode 26.4 / iOS 26 SDK)
- [x] Clerk `pk_*` on EAS + `.env.production`
- [x] API `https://auxano-red.vercel.app`
- [ ] New `npm run build:ios` after icon/SDK fix
- [ ] `npm run submit:ios`
- [ ] TestFlight internal tester added
