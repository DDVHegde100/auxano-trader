# Before TestFlight — 10 high-impact improvements

Ship the current build first; these are the best next wins for a polished v1.

1. **First-run onboarding → first bot** — After sign-up, guide: pick DEFAULT preset → deploy → open Bots → see first autopilot run log (not preferences-only). ✅ Mobile onboarding implemented
2. **Legal + trust footer** — Privacy, Terms, and paper-trading disclaimer on web sign-up, mobile settings, and share cards (App Store expects this). ✅ Web + mobile legal pages
3. **Pull-to-refresh everywhere** — Dashboard, portfolio, leaderboard, Bots, Compete on mobile (web has partial refresh). ✅ Compete, More, Marketplace, Bots, Dashboard, Portfolio
4. **Offline / error states** — Clear “can’t reach API” banner with retry when `auxano-red.vercel.app` is down (partially exists via ApiStatusBanner). ✅ Retry + polling
5. **Friends-only leaderboard filter** — Match strategy visibility: toggle global vs friends on Leaders.
6. **Bot push on trade** — Notify when autopilot buys/sells (types exist; ensure mobile push prefs default on). ✅ Default prefs on push register
7. **Strategy detail on mobile** — Open community strategies from marketplace with deploy + follow (web has this; mobile is thinner). ✅ Deploy + autopilot deploy
8. **Haptic + polish on trade confirm** — Success/error feedback on paper order submit (mobile Trade tab). ✅ expo-haptics
9. **App Store screenshots + subtitle** — 6.7" screenshots from web; subtitle “Paper trading OS” in App Store Connect. See `scripts/capture-app-store-screenshots.md`
10. **Simulated data label** — Small “Paper · simulated quotes” on Trade/Bots when Finnhub fallback is used (honesty for reviewers). ✅ Disclaimer banner

## Production checklist (mobile)

- [x] Bundle ID `app.auxano.mobile`
- [x] Icon from `auxano.png` → `apps/mobile/assets/`
- [x] EAS `image: latest` (Xcode 26.4 / iOS 26 SDK)
- [x] Clerk `pk_*` on EAS + `.env.production`
- [x] API `https://auxano-red.vercel.app`
- [x] Clerk email/password + OAuth sign-in on mobile
- [x] Onboarding → deploy first bot flow
- [x] Legal pages (web `/privacy`, `/terms` + mobile)
- [x] Build **1.0.0 (5)** succeeded with new icon/SDK
- [ ] Submit build 5 or 6 to App Store Connect (retry `npm run submit:ios` or Transporter)
- [ ] TestFlight internal tester added
- [ ] Export compliance answered in ASC
- [ ] 6.7" screenshots uploaded

## Next build (6)

```bash
cd apps/mobile
npm run build:ios
npm run submit:ios
```
