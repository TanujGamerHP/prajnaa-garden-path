## Prajnaa Farm — Frontend Prototype (V1)

A fully responsive, mock-data prototype of the marketplace with three portals (Customer, Farmer, Admin), built directly to your PRD spec. No real auth, DB, or payments — every screen renders from in-memory mock data so the visual + UX layer is locked before backend work begins (which you'll do in Next.js/NestJS separately).

### Design system (foundation, built first)
- Tokens in `src/styles.css` via Tailwind v4 `@theme`:
  - Colors: primary `#0F3D2E`, secondary `#F7F3EE`, accent `#E8A317`, text `#111827`, bg `#FFFFFF`, plus success/warning/error
  - Fonts loaded via `<link>` in `__root.tsx`: Bricolage Grotesque (headings), Plus Jakarta Sans (subheads), Inter (body)
  - Spacing scale, radii, premium shadow tokens, motion timing (150–350ms)
- Shared primitives: Button, Input, Card, Badge, Skeleton (built on shadcn, restyled to spec — no default shadcn look)
- Layout shells: `MarketingHeader`, `MarketingFooter`, `DashboardSidebar`

### Mock data layer
- `src/lib/mock/` with typed fixtures: `farmers.ts`, `products.ts`, `categories.ts`, `orders.ts`, `reviews.ts`, `customers.ts`
- ~8 farmers, ~30 products across all 9 categories, ~20 orders, sample reviews/testimonials
- All images generated via the image tool (hero, category tiles, product photos, farmer portraits)

### Routes

**Customer (marketing + storefront)**
- `/` — Homepage with all 9 PRD sections
- `/shop` — Product listing with category/price filters + sort
- `/category/$slug` — Category-scoped listing
- `/product/$slug` — Product detail (images, price, farmer card, reviews, related)
- `/farmer/$slug` — Farmer story page (the differentiator: portrait, village, story, method, products, upcoming harvests)
- `/farmers` — Farmer directory grid
- `/cart` — Cart with quantity, totals
- `/checkout` — Address + payment method selector (COD / UPI / Card mock), order summary
- `/order-confirmation` — Success state with mock order ID + tracking link
- `/account` — Profile, order history, wishlist, addresses (tabbed)
- `/auth/login`, `/auth/register` — UI only, mock OTP step
- `/become-a-seller` — Farmer onboarding landing
- `/about`, `/contact` — Static content

**Farmer portal** (`/farmer-portal/*` — mock-gated, no real auth)
- `/dashboard` — KPIs (sales, orders, payout ETA), recent orders, low-stock alerts
- `/products` — Product list, add/edit product form
- `/inventory` — Stock levels, bulk update
- `/orders` — Order queue with status flow
- `/earnings` — Monthly earnings, settlement schedule
- `/profile` — Public story editor, documents, farming method

**Admin portal** (`/admin/*` — mock-gated)
- `/dashboard` — Platform KPIs
- `/vendors` — Farmer approval queue
- `/products` — Product approval queue
- `/orders` — All orders
- `/customers` — Customer list
- `/coupons`, `/banners` — Management screens
- `/settlements` — Payout runs

### Cross-cutting
- Cart state in Zustand (or React context) with localStorage persistence — mock only
- Toast notifications for add-to-cart, form submits
- Skeleton loading states on listing pages
- SEO `head()` per route with title/description/og tags
- Responsive: mobile-first, all PRD breakpoints; off-canvas mobile nav; dashboards collapse to icon sidebar
- Accessibility: semantic landmarks, ARIA labels on icon buttons, visible focus rings, keyboard nav

### Explicitly out of scope (frontend prototype only, per your choice)
- Real authentication, OTP delivery, sessions
- Database, Lovable Cloud / Supabase
- Real Razorpay integration (mock UI only)
- Email/SMS notifications
- i18n implementation (English only; structure leaves room for Hindi later)
- Blog system, support tickets, loyalty/referral logic (UI shells only if shown)

### Build sequence (suggested phases)
1. **Phase 1 — Design system + homepage** (foundation, hero, all 9 sections, header, footer, mock data for farmers/products/categories)
2. **Phase 2 — Customer storefront** (shop, category, product, farmer, cart, checkout, account, auth UI)
3. **Phase 3 — Farmer portal** (dashboard shell + all 6 screens)
4. **Phase 4 — Admin panel** (dashboard shell + all 7 screens)

Each phase is independently reviewable. After approving this plan I'll start with Phase 1 and check in before moving to the next phase so you can steer.

### Tech notes (for your reference)
Built on Lovable's stack: TanStack Start (file-based routing under `src/routes/`), React 19, Tailwind v4 (CSS-first tokens), shadcn primitives restyled. All data is in-memory mocks — easy to swap for real API calls when you wire the NestJS backend.