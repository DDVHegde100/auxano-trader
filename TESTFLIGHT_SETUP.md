# TestFlight setup (step-by-step)

**You are logged into EAS as:** `dhruvh` (confirmed).  
**Bundle ID (fixed in repo):** `app.auxano.mobile`  
**Production API:** `https://auxano-red.vercel.app`

I cannot log into Apple Developer or App Store Connect for you. Follow the sections below, paste the two Apple IDs into `apps/mobile/eas.json`, then run the terminal commands at the end.

---

## Part A — Apple Developer (developer.apple.com)

1. Sign in at [https://developer.apple.com/account](https://developer.apple.com/account).
2. **Membership** (left sidebar) → copy **Team ID** (10 characters, e.g. `AB12CD34EF`).  
   → Paste into `apps/mobile/eas.json` → `submit.production.ios.appleTeamId`.
3. **Certificates, Identifiers & Profiles** → **Identifiers** → **+**:
   - Type: **App IDs** → Continue
   - **App** → Continue
   - Description: `Auxano`
   - Bundle ID: **Explicit** → `app.auxano.mobile`
   - Capabilities: enable **Push Notifications** (optional but recommended)
   - Register
4. You do **not** need to create certificates manually if you use EAS — EAS will create distribution cert + profile on first build.

---

## Part B — App Store Connect (appstoreconnect.apple.com)

1. Sign in at [https://appstoreconnect.apple.com](https://appstoreconnect.apple.com).
2. **Apps** → **+** → **New App**:
   | Field | Value |
   |-------|--------|
   | Platforms | iOS |
   | Name | `Auxano` |
   | Primary language | English (U.S.) |
   | Bundle ID | Select **`app.auxano.mobile`** (must exist from Part A) |
   | SKU | `auxano-ios-1` (any unique string) |
   | User Access | Full Access |
3. Create app → open the app → **App Information** (under General):
   - Copy **Apple ID** (numeric only, e.g. `6738291045`)  
   → Paste into `apps/mobile/eas.json` → `submit.production.ios.ascAppId`.
4. **TestFlight** tab (you’ll use this after the first EAS upload):
   - **Internal Testing** → create a group (e.g. `Team`) → add your Apple ID email as tester.
   - First build must pass **Export Compliance**; the repo sets `usesNonExemptEncryption: false` in `app.config.ts`.

---

## Part C — Clerk (required for sign-in on device)

Mobile builds **do not** use dev auth (`EXPO_PUBLIC_USE_DEV_AUTH=false`).

1. [https://dashboard.clerk.com](https://dashboard.clerk.com) → your Auxano application.
2. **API Keys** → copy **Publishable key** (`pk_test_...` or `pk_live_...`).
3. Paste into **`apps/mobile/.env.production`**:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx
```

(Use the **same** publishable key as Vercel web if you want one environment.)

4. **Configure** → **Paths** / **Domains** (wording varies):
   - Allowed redirect / origins include:
     - `https://auxano-red.vercel.app`
     - `auxano://` (mobile deep link scheme)
5. **Configure** → **Social connections** → disable **Apple** and **Google** (mobile uses email + password only).
6. If web sign-in broke after `vercel link`, restore web keys in **`apps/web/.env.local`** from Clerk (Publishable + Secret) or Vercel → Project → Settings → Environment Variables.

---

## Part D — Files in this repo (what to paste)

### `apps/mobile/.env.production`

```env
EXPO_PUBLIC_API_URL=https://auxano-red.vercel.app
EXPO_PUBLIC_USE_DEV_AUTH=false
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=<paste from Clerk Dashboard>
```

### `apps/mobile/eas.json` → `submit.production.ios`

Replace placeholders:

```json
"appleTeamId": "YOUR_10_CHAR_TEAM_ID",
"ascAppId": "YOUR_NUMERIC_APP_STORE_CONNECT_APP_ID"
```

Build profiles already set API URL and disable dev auth for preview/production.

**iOS SDK (2026):** `eas.json` sets `"image": "latest"` on preview/production iOS builds (Xcode 26.4 / iOS 26 SDK). The default Expo SDK 52 image (Xcode 16.2) triggers App Store Connect error **90725**.

### EAS environment variables (for cloud builds)

After `eas init`, set Clerk on Expo (so CI builds don’t rely on local `.env.production` only):

```bash
cd apps/mobile
npx eas-cli env:create --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "pk_test_xxx" --environment production --visibility plaintext
npx eas-cli env:create --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "pk_test_xxx" --environment preview --visibility plaintext
```

Or: [expo.dev](https://expo.dev) → project **auxano** → **Environment variables**.

Optional: `EAS_PROJECT_ID` — written automatically when you run `eas init` (see below).

---

## Part E — Terminal (you run these)

**EAS project (done):** [@dhruvh/auxano](https://expo.dev/accounts/dhruvh/projects/auxano) · ID `67a39614-b3cf-4e79-bbea-c63496891ead`  
**Clerk on EAS:** `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` set for preview + production.

### One-time Apple login (must be **interactive** — cannot run headless)

Open **Terminal** on your Mac and run **without** `--non-interactive`:

```bash
cd /Users/dhruvhegde/auxano_sims/apps/mobile
npx eas-cli build --platform ios --profile production
```

When prompted:
- Log in with your **Apple Developer** Apple ID (team `D49RVY375B`)
- Allow EAS to create **distribution certificate** + **provisioning profile** for `app.auxano.mobile`
- Use **app-specific password** if you have 2FA ([appleid.apple.com](https://appleid.apple.com) → App-Specific Passwords)

> **TestFlight uses the `production` profile** (`distribution: store`), not `preview`. Preview is for direct internal installs via Expo, not the TestFlight app.

### Upload to App Store Connect (after build succeeds)

```bash
cd /Users/dhruvhegde/auxano_sims/apps/mobile
npx eas-cli submit --platform ios --profile production --latest
```

Or: [expo.dev](https://expo.dev) → **auxano** → latest iOS build → **Submit to App Store**.

---

## Part F — After build appears in App Store Connect

1. App Store Connect → **Auxano** → **TestFlight**.
2. Wait for **Processing** to finish (often 5–15 minutes).
3. Answer **Export Compliance** if asked (standard encryption → No / exempt).
4. **Internal Testing** → add build to group → install **TestFlight** app on iPhone → accept invite.

---

## Checklist

| Step | Done? |
|------|--------|
| Team ID in `eas.json` | ☑ |
| App Store Connect app created (`app.auxano.mobile`) | ☑ |
| `ascAppId` in `eas.json` | ☑ |
| Clerk `pk_*` in `.env.production` + EAS env | ☑ |
| Clerk allows `auxano://` + Vercel URL | ☐ verify in dashboard |
| Mobile Clerk sign-in (email + password) | ☑ |
| `eas init` completed | ☑ |
| iOS build 1.0.0 (5+) with `image: latest` | ☑ build 5 |
| Submit to App Store Connect | ☐ retry `npm run submit:ios` or Transporter |
| TestFlight internal group + tester added | ☐ |
| Export compliance answered in ASC | ☐ |
| 6.7" screenshots uploaded | ☐ see `scripts/capture-app-store-screenshots.md` |

**Build 6** (includes auth, onboarding, legal):

```bash
cd apps/mobile
npm run build:ios
npm run submit:ios
```

See also [MOBILE_EAS.md](./MOBILE_EAS.md).
