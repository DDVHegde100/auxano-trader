# Start Auxano

## One command (recommended)

**1. Open Docker Desktop** and wait until it says “Running”.

**2. Run:**

```bash
cd auxano_sims
npm run start
```

This starts Postgres (port **5433**), the API, and Expo with a **QR code in the terminal**.

**3. On iPhone:** install **Expo Go** → scan the QR → sign in:

| | |
|---|---|
| Email | `test@gmail.com` |
| Password | `Test1234!` |

---

## Fix: `P1010: User was denied access`

This almost always means Prisma hit the **wrong** Postgres on port **5432** (Mac’s own Postgres), not Auxano’s Docker database.

**Fix:**

```bash
npm run fix:db
```

Then:

```bash
npm run start
```

Auxano uses port **5433** on purpose so it does not fight with port 5432.

---

## Fix: No QR code when running Expo

Run Expo **from the mobile app folder**, not the repo root:

```bash
cd auxano_sims/apps/mobile
npx expo start --lan
```

Or from the repo root:

```bash
npm run expo
```

**QR code tips:**

- Use a normal Terminal window (not a log-only panel).
- If you still don’t see it, press **`?`** in the Expo terminal for the menu, or open **`http://localhost:8081`** in the browser for the dev tools page with QR.
- Try tunnel mode (slower but works on tricky networks):

  ```bash
  cd apps/mobile && npx expo start --tunnel
  ```

**Do not** run only `npx expo start` from `auxano_sims` root — that’s the wrong folder.

---

## Physical iPhone checklist

- [ ] Docker Desktop running  
- [ ] `npm run start` completed without DB errors  
- [ ] Phone and Mac on **same Wi‑Fi**  
- [ ] Expo Go installed  
- [ ] API URL in `apps/mobile/.env` uses your Mac IP (the start script sets this), not `localhost`

---

## Test login (no Clerk needed)

`EXPO_PUBLIC_USE_DEV_AUTH=true` — credentials are prefilled on the sign-in screen.
