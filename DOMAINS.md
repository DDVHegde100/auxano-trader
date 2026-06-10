# Domains for Auxano (SEO + branding)

## Can you get `auxano.com` (or `.net` / `.org`) for free?

**Not in a legitimate, Google-friendly way.** Premium TLDs (`.com`, `.net`, `.org`) are rented from registrars for roughly **$10–15/year**. There is no reputable registrar that gives away those TLDs long-term.

“Free domain” offers usually mean:

- **Subdomains** (e.g. `auxano-red.vercel.app`) — fine for staging; weaker brand than your own domain.
- **Odd TLDs** (`.tk`, `.ml`, etc.) — often abused for spam; **poor trust signals** for users and search engines.
- **Trials** that convert to paid — read the fine print.

For a product you want indexed and trusted, **budget ~$12/year** for a domain.

## What actually helps Google indexing

Google does **not** require `.com`. Ranking depends more on:

1. **Public HTTPS site** with real content (landing, docs, legal pages).
2. **Google Search Console** — verify domain, submit sitemap.
3. **Consistent canonical URL** (`NEXT_PUBLIC_APP_URL`, Clerk, sitemap).
4. **Performance + mobile-friendly** (your Vercel app).
5. **Backlinks and brand searches** over time.

Using `auxano-red.vercel.app` **can** be indexed, but a custom domain looks more credible and is easier to put on the App Store and Clerk.

## Practical options (cheapest → best brand)

| Option | Cost | Notes |
|--------|------|--------|
| Keep **auxano-red.vercel.app** | $0 | Good for now; add to Search Console as URL-prefix property. |
| **Vercel custom domain** on cheap TLD | ~$10–15/yr + $0 hosting | Point DNS to Vercel; set `NEXT_PUBLIC_APP_URL` + Clerk allowed origins. |
| **getauxano.com** / **tradeauxano.com** / **auxano.app** | varies | Often available if `auxano.com` is taken. |
| **auxano.com** | premium if taken | Check Namecheap, Cloudflare Registrar, Google Domains (Squarespace). |

### Registrars (at-cost or low markup)

- [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) — at-cost renewals.
- Namecheap, Porkbun — frequent first-year promos.

### Student / startup credits

- **GitHub Student Developer Pack** sometimes includes domain credits.
- Startup programs (Cloudflare, Google Cloud) — hosting credits, not usually free `.com`.

## Wiring a custom domain to this project

1. Buy domain → add **A/CNAME** to Vercel project **auxano** → Domains.
2. Vercel env: `NEXT_PUBLIC_APP_URL=https://yourdomain.com`
3. Clerk: allowed origins + redirect URLs for new host.
4. Mobile: `EXPO_PUBLIC_API_URL=https://yourdomain.com` (EAS env + `.env.production`).
5. Search Console: add property, sitemap `https://yourdomain.com/sitemap.xml` (when you add one).

**Recommendation:** Ship on **auxano-red.vercel.app** now; buy **auxano.com** or **auxano.trade** when you are ready to spend ~$12/year for brand + App Store polish.
