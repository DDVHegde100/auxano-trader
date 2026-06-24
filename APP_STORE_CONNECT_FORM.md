# App Store Connect — Version 1.0 (copy/paste)

Open **App Store Connect → Auxano Trading → iOS App → Version 1.0** and paste each field below.

Screenshots: upload from `apps/mobile/app-store-screenshots/6.5-inch/` (1284×2778).

---

## Previews and Screenshots (6.5" Display)

Upload **in this order** (first 3 appear on install sheets):

| # | File | Screen |
|---|------|--------|
| 1 | `01-sign-in.png` | Sign in |
| 2 | `02-dashboard.png` | Dashboard |
| 3 | `03-marketplace.png` | Marketplace |
| 4 | `04-trade.png` | Trade |
| 5 | `05-bots.png` | Bots |
| 6 | `06-compete.png` | Compete |
| 7 | `07-strategy-detail.png` | Strategy detail |
| 8 | `08-profile-settings.png` | Profile / settings |

**App Previews:** leave empty for v1 (optional).

---

## Promotional Text (170 chars max)

```
Build and deploy paper-trading strategies, compete in leagues, and run autopilot bots — all with $100k virtual capital. No real money at risk.
```

---

## Description (4,000 chars max)

```
Auxano is a paper-trading platform for learning and testing investment ideas without risking real money.

• $100,000 virtual portfolio to practice buying and selling stocks
• Pre-built algorithm presets with plain-English strength scores
• Strategy marketplace — follow, deploy, and compete with friends
• Autopilot bots that trade on a schedule using your rules
• Leagues and 1v1 duels on simulated returns
• Leaderboards, notifications, and shareable performance cards

All prices and trades are simulated. Auxano is for education and entertainment — not financial advice.
```

---

## Keywords (100 chars max, comma-separated, no spaces after commas)

```
paper trading,stocks,portfolio,algorithm,strategy,simulation,finance,learn,invest
```

---

## Support URL (required)

```
https://auxano-red.vercel.app
```

---

## Marketing URL (optional)

```
https://auxano-red.vercel.app
```

---

## Version

```
1.0
```

(Must match build version from TestFlight / EAS.)

---

## Copyright

```
© 2026 Dhruv Hegde
```

---

## Routing App Coverage File

Leave empty (not a routing/maps app).

---

## Build

1. Upload via EAS: `cd apps/mobile && npm run build:ios && npm run submit:ios`
2. After processing (~5–30 min), click **Add Build** and select the latest **1.0** build.

---

## Game Center

Off (not used).

---

## App Review Information

### Sign-In Information

- **Sign-in required:** Yes
- **User name:** *(create a dedicated review account — see below)*
- **Password:** *(same account)*

**Before submission:** In the production app (TestFlight build), tap **Sign up** and create:

| Field | Suggested value |
|-------|-----------------|
| Email | `auxano.review@yourdomain.com` (or any email you control) |
| Password | Strong password you paste here for Apple |

Apple reviewers use this to sign in. Do **not** use `test@gmail.com` (dev-only).

### Contact Information

| Field | Value |
|-------|--------|
| First name | Dhruv |
| Last name | Hegde |
| Phone | *(your phone with country code)* |
| Email | *(your email — same as Apple ID contact is fine)* |

### Notes (4,000 chars max)

```
Auxano is a paper-trading simulator. No real money, brokerage, or live trading.

Sign in with the email and password provided above (Sign-In Information).

How to test:
1. Sign in → complete onboarding → a preset bot is deployed automatically.
2. Dashboard shows $100,000 paper balance.
3. Trade tab → search a symbol (e.g. AAPL) → buy shares.
4. Bots tab → view autopilot status (server runs trades on a schedule).
5. More → Settings → Privacy / Terms / Sign out.

All market data is simulated or delayed for education. Autopilot runs on our server when the app is closed.

Export compliance: app uses only standard HTTPS — no custom encryption (ITSAppUsesNonExemptEncryption = false).
```

### Attachment

Optional — leave empty unless Apple requests something.

---

## App Store Version Release

Choose one:

- **Manually release this version** — recommended for first launch (you control go-live).
- Or **Automatically release** after approval.

---

## App Information (separate page)

| Field | Value |
|-------|--------|
| **Name** | Auxano |
| **Subtitle** | Paper trading OS |
| **Bundle ID** | `app.auxano.mobile` |
| **Primary category** | Finance |
| **Secondary category** | Education |
| **Content rights** | Does not contain third-party content |
| **Age rating** | Complete questionnaire → expect **4+** |

---

## App Privacy (separate page)

**Privacy Policy URL:** `https://auxano-red.vercel.app/privacy`  
**Terms URL (optional):** `https://auxano-red.vercel.app/terms`

| Data type | Collected | Linked to user | Tracking |
|-----------|-----------|----------------|----------|
| Email address | Yes | Yes | No |
| User ID | Yes | Yes | No |
| Product interaction (paper trades) | Yes | Yes | No |
| Crash data | Optional | No | No |

**Tracking:** No — app does not track users across apps.

---

## Export compliance (when adding build)

**Does your app use encryption?**  
→ **No** (or exempt — standard HTTPS only; `ITSAppUsesNonExemptEncryption` is false in the app).

---

## Screenshot folder

```
apps/mobile/app-store-screenshots/6.5-inch/
```

Regenerate anytime:

```bash
cd apps/web && npm run dev:clean   # terminal 1
npm run screenshots:6.5            # terminal 2
```
