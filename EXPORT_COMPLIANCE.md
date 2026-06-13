# Export compliance (iOS)

Auxano uses **standard HTTPS/TLS only** (Clerk auth, Vercel API). No custom encryption.

## In the app (`app.config.ts`)

- `ios.config.usesNonExemptEncryption: false`
- `ITSAppUsesNonExemptEncryption: false` in `infoPlist`

This tells Apple the app qualifies for **exempt** encryption (no annual self-classification report for basic TLS).

## App Store Connect (per build)

When build **1.0.0 (N)** appears in TestFlight:

1. **TestFlight** → select build → **Missing Compliance** (if shown)
2. **Does your app use encryption?** → **Yes**
3. **Is it exempt?** → **Yes** (only standard Apple/OS encryption or HTTPS)
4. Save

## EAS / TestFlight checklist

- [x] `usesNonExemptEncryption: false` in Expo config
- [x] No custom crypto libraries in dependencies
- [ ] Answer compliance prompt in ASC after each new build upload
- [ ] Internal tester can install after Processing completes

## Reference

[Apple — Complying with encryption export regulations](https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations)
