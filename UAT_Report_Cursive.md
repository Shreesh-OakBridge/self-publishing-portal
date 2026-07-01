# UAT Report — Cursive Publishing (Adapted)

**Site:** cursivepublishing.com
**Test type:** Heuristic UAT, adapted to Cursive's actual model
**Method:** Verified from source code + live static HTML. Items needing a real
browser/live session are marked **⚠️ Needs human**.

## 0. Important model correction

The original report was written for a **traditional book retailer/publisher**
(reader catalog, per-book "Add to Cart," "Buy on Amazon," acquisitions submissions).
**Cursive is a self-publishing *service*** — the customer is the **author**, who
buys a **publishing plan** or a **customized book** and pays via **Razorpay**.
There is no reader storefront. Test cases have been adapted accordingly; retailer-only
cases are marked **N/A**.

**Legend:** ✅ Pass (verified) · 🟡 Partial / minor finding · 🔴 Finding to fix ·
⚠️ Needs human · N/A not applicable to this model.

---

## 1. Navigation & Usability

| TC | Adapted expectation | Status | Notes |
|---|---|---|---|
| TC-01 Homepage & first impression | Loads fast; clearly a self-publishing service; nav visible | ✅ / ⚠️ | Identity & nav verified in live HTML ("Professional Self-Publishing, an Imprint of OakBridge"). Nav = Home / Get Started / Services / Testimonials / Portfolio / Plans. **Load speed ⚠️ needs PageSpeed check.** |
| TC-02 Mobile responsiveness | Hamburger works; no overflow; persistent CTA | ✅ / ⚠️ | Hamburger menu + **persistent mobile bottom nav with "Get Started"** confirmed in code. **Visual overflow/rendering ⚠️ needs a real device.** |
| TC-03 Footer | Privacy, Terms, social, newsletter | 🟡 | Privacy ✅, Terms ✅, **Publishing Agreement ✅**, contact (email/phone/address) ✅. **No social links ❌, no newsletter ❌.** |

## 2. Discovery (Portfolio) — replaces "Reader catalog"

| TC | Adapted expectation | Status | Notes |
|---|---|---|---|
| TC-04 Portfolio browse | Showcase grid: cover, title, author, category | 🟡 | Portfolio page shows covers + title + author + category ✅. **No genre/format filter** (it's a showcase, not a store) — acceptable, noted. |
| TC-05 Book detail page | Synopsis, price, Add to Cart, "Look Inside" | N/A | Cursive doesn't sell books to readers. |
| TC-07 "Buy on Amazon" per book | External link to product | N/A | No per-book buy links (portfolio items have an optional link only). |

## 3. Money Path (Author) — the real purchase flow

| TC | Adapted expectation | Status | Notes |
|---|---|---|---|
| TC-06 Buy a plan / customized book | Select plan or customizer → checkout → pay | ✅ / ⚠️ | Flow verified in code: Get Started → Plans/Customizer → `/checkout` → **Razorpay**. SSL active (https) ✅. **Completing a real payment + receiving the order email ⚠️ needs human.** |
| (prior fixes) | — | ✅ | Duplicate-order prevention, correct paid/pending copy, and required State were fixed in the pending deploy. |

## 4. Author Journey (Submissions)

| TC | Adapted expectation | Status | Notes |
|---|---|---|---|
| TC-08 Onboarding clarity | Clear path to start (funnel, services, plans) | ✅ | Single "Get Started" funnel (journey → language → status → Expert/Self) + Services + FAQ. Traditional "genres/word-count/response-time" guidelines are N/A for self-publishing. |
| TC-09 Manuscript upload | Accepts standard file types; size limit stated | 🔴 | Accepts `.doc, .docx, .pdf, .rtf, .odt, .epub` ✅. **No file-size limit is stated or enforced** in the UI. |
| TC-10 Submission confirmation | On-screen success **and** auto email | 🔴 | On-screen success ✅ ("Manuscript submitted…"). **No automated confirmation email to the author for manuscript uploads** (orders, leads and quotes *do* email; manuscripts don't). |

## 5. Accessibility & SEO

| TC | Adapted expectation | Status | Notes |
|---|---|---|---|
| TC-11 Image alt text | Covers describe title/author | ✅ | Portfolio covers use `alt = coverAlt || book title` ✅. **Hero image alt falls back to empty** 🟡 (set it in CMS if the hero image is meaningful). |
| SEO on-page | Title, meta, canonical, OG, sitemap, schema | ✅ | Strong: title, meta description, canonical, robots, OG/Twitter, sitemap.xml, robots.txt, crawlable `<noscript>` content, **Organization schema**. |
| SEO indexation | Indexed by Google | 🔴 | `site:cursivepublishing.com` returns nothing — **not yet indexed**. Needs Search Console submission + backlinks + time. |
| Book schema | Rich snippets on portfolio | 🟡 | No Book/Product schema on portfolio items (enhancement, not a defect). |

---

## 6. Bug Log (adapted)

| ID | Description | Severity | Status | Fix |
|---|---|---|---|---|
| BUG-01 | Broken per-book buy links | — | N/A | No per-book buy links in this model |
| BUG-02 | Mobile "Submit/Start" CTA hidden in menu | Medium | ✅ Resolved | Persistent mobile bottom-nav "Get Started" already present |
| BUG-03 | 404 on old blog posts | — | N/A | No blog yet; a friendly 404 page now exists |
| BUG-04 | Inconsistent typography across pages | Low | ⚠️ | Tailwind globals — likely consistent; confirm visually |
| BUG-05 | Public forms lack spam protection | Medium | 🟡 | **Honeypot on the Contact form only.** Talk-to-us & Quote forms have **no** spam protection; no CAPTCHA anywhere |

## 7. Real findings to fix (from this pass)

1. **Manuscript upload sends no author confirmation email** (Medium) — add a `notify-manuscript` trigger so authors get a "we received your manuscript" email, matching the order/lead/quote flows.
2. **No stated/enforced manuscript file-size limit** (Medium) — show and enforce a limit (e.g. "Max 25 MB") to avoid silent upload failures.
3. **Inconsistent form spam protection** (Medium) — add the honeypot (or Cloudflare Turnstile) to Talk-to-us and Quote forms.
4. **Footer has no social links / newsletter** (Low) — add social icons and, optionally, a newsletter capture.
5. **Hero image alt falls back to empty** (Low) — set `imageAlt` in the CMS.
6. **Not indexed** (High for growth) — submit sitemap in Google Search Console + build backlinks (see SEO note).

## 8. Still needs a human on the live site

These cannot be verified from code:

- **Homepage load speed / Core Web Vitals** → run the URL through Google PageSpeed Insights.
- **Mobile visual rendering** on a real phone (overflow, cover resizing).
- **Complete a real Razorpay payment** (test then refund) and confirm the **order email** arrives and looks right.
- **Confirm lead/quote/order emails actually deliver** to an inbox (and not spam).

## 9. Recommended immediate actions

1. Add the **manuscript confirmation email** and a **file-size limit** (findings #1, #2).
2. Extend **spam protection** to all public forms (#3).
3. **Search Console**: verify domain, submit `sitemap.xml`, request indexing (#6).
4. Do the four **human checks** in §8 — especially the money path and email deliverability.
