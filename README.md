# Tomasz Brzoza — IBM Planning Analytics / TM1 Consulting

Landing page for a freelance IBM Planning Analytics / TM1 architect based in Munich.
Bilingual (English + German), no build step — plain HTML, CSS and JavaScript.

## Highlights

- **Zero build step** — upload the folder to any static host and it works.
- **Self-hosted assets** — fonts (Space Grotesk, Inter, IBM Plex Mono) and JS
  libraries (GSAP, ScrollTrigger, Lenis) are served locally. No third-party
  requests (better performance, cleaner GDPR footprint).
- **Bilingual with dedicated URLs** — `/` (English) and `/de/` (German), linked
  with `hreflang` and per-page canonicals for SEO. German browsers are
  auto-redirected on first visit; a manual choice is remembered.
- **SEO** — JSON-LD structured data, `sitemap.xml`, `robots.txt`, Open Graph.
- **Motion** — GSAP + ScrollTrigger animations with a Lenis smooth-scroll layer,
  fully degradable (works without JS and respects `prefers-reduced-motion`).

## Structure

```
index.html          English landing page
de/index.html       German landing page
legal.html          Impressum & Datenschutz (fill in before go-live)
css/                style.css, fonts.css
js/                 main.js + vendored GSAP / ScrollTrigger / Lenis
assets/             images, fonts, Open Graph image
robots.txt, sitemap.xml
```

## Local preview

Any static file server works, e.g.:

```bash
python -m http.server 4173
# then open http://localhost:4173
```

## Before go-live

- Replace every `https://your-domain.com` placeholder (in `index.html`,
  `de/index.html`, `sitemap.xml`, `robots.txt`) with the real domain.
- Fill in the legal details in `legal.html` (address, phone, VAT ID).
- Submit both language versions to Google Search Console and upload the sitemap.
