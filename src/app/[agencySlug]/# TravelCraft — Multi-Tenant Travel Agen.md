# TravelCraft — Multi-Tenant Travel Agency SaaS
**Project context file — read this fully before continuing any work.**
**Last updated: this session (Transport + Visa CRUD built but each has an unresolved bug;
Flight NOT rebuilt yet and old CRUD confirmed to have mismatched fields; Full Package wizard
spec clarified — see §3 and §3a).**

---

## 1. What this project is

A multi-tenant SaaS platform for travel agencies (Hajj/Umrah + general tours), built by a
solo, self-taught developer (beginner-to-intermediate level — explanations should stay
plain-language, one confirmed step at a time, no jargon without a definition).

- **First real client:** Travel Craft Tours, Hyderabad, Pakistan (agency slug: `travelcraft`)
- **Developer = Super Admin** of the whole platform, manages all agencies
- **Business model:** sell subscription access to multiple travel agencies, each agency gets
  an isolated account (data, public site) but runs on one shared codebase/database
- **Payment collection:** manual bank transfer (no payment gateway integration planned yet)
- **Live URL:** https://management-teal-zeta.vercel.app/
- **Domain:** a custom domain was purchased via GitHub Student Developer Pack; not yet
  connected — public agency sites are meant to eventually live at `yourdomain.com/travelcraft` etc.

---

## 2. Tech stack (confirmed working combination — do not casually upgrade major versions)

- **Next.js** (App Router, currently v16, using Turbopack) — TypeScript
- **Tailwind CSS** — installed, but intentionally **not yet used for real design**. All UI so
  far is deliberately plain/unstyled (`border`, `p-4`, basic utility classes only). A full
  CSS/animation pass is a planned LATER phase, not started.
- **Prisma ORM v6** (⚠️ pinned intentionally — Prisma v7 introduced a breaking config change
  requiring driver adapters; we downgraded to v6 for stability. Do not upgrade to v7 without
  planning a real migration.)
- **Database:** Supabase (Postgres), region `ap-northeast-1` (Tokyo) — ⚠️ known latency issue
  for users in Pakistan; flagged for a possible future migration to a Singapore-region project
  before heavy production use, not urgent yet.
- **Auth:** Auth.js / NextAuth v5 (`next-auth@beta`), Credentials provider, JWT session
  strategy, `bcryptjs` for password hashing. Central config at project root `auth.ts`.
  ⚠️ **Import path note:** from inside `src/app/api/...` route files, importing `auth` needs a
  relative path back to the project root (e.g. `../../../../auth`, depth varies by folder
  nesting) — always confirm against an existing working route file
  (`src/app/api/hotel-bookings/[id]/route.ts`) before assuming the depth.
- **Deployment:** Vercel (must be Pro plan once actually selling — Hobby plan prohibits
  commercial use)
- **OS/environment:** Windows, PowerShell. Project was originally inside OneDrive, which
  caused file-locking (`EPERM`) errors during `prisma generate` — may still be inside OneDrive,
  worth confirming/moving if build issues resembling file locks recur.
- ⚠️ **Migration note:** `npx prisma migrate dev` did not run cleanly in this environment.
  `npx prisma db push` was used instead and updated the database correctly. Keep using
  `db push` for schema changes going forward unless `migrate dev` is specifically fixed later.

---

## 3. Major redesign — the "5-section form" spec (standing design for all booking types)

The user supplied a detailed spec PDF describing exactly how every booking form should be
laid out. Key ideas, standing design for ALL booking types (Hotel/Transport/Flight/Visa/Package):

- **A shared "Global Header"** at the top of every form — but as **separate columns in each
  agency's own table** (user's explicit choice: "own copy" per form, not one shared table).
  Fields: Agent/Company Name, Guest/Group Leader Name, Nationality (searchable dropdown),
  Mobile/WhatsApp, Reference/PNR Number, Currency (USD/SAR/PKR/AED/EUR/GBP).
- **Every price field is now a Buying Cost + Selling Price pair** (previously a single rate).
  Buying cost is never shown to the client; selling price (or the resulting total) is.
- **A shared "Unified Pricing & Profit Module"** at the bottom of every form: Gross Buying,
  Gross Selling, Discount Allowed, Tax/VAT Percent, Tax Amount, Net Invoiced Grand Total, and
  Net Margin/Profit Earned — all **calculated live, never stored** (matches the pre-existing
  project rule: never store a value that can be derived from other stored fields).
- **Payment Type and Note** — optional fields on every booking's footer (Cash / Bank
  Transfer / Card / Cheque).
- **Voucher vs. Invoice** — two PDF outputs planned per booking (not built yet): Voucher hides
  buying cost and profit (client-facing), Invoice shows everything (internal/dealer-facing).
  `showProfit` prop already exists on the shared footer component for this purpose.
- **Profit must be visible on every Manage list page** (per-row, not just inside each booking) —
  implemented for Hotel, Transport, and Visa. Still needs doing for Flight once rebuilt.
- **Full Package Booking** (the previously-deferred "combined Traveler Booking" from the old
  roadmap) is spec'd as a wizard: one Global Header, four checkboxes (Include Hotels /
  Transports / Flights / Visas) that reveal the relevant repeatable sections.
  **Important clarification (this session):** each toggled section must use the **same full
  field set as that service's own standalone form** — e.g. if "Include Hotels" is checked,
  the hotel rows inside the wizard need every field the standalone Hotel Booking form has
  (room type, meal plan, infants, confirmation no., etc.), not a shortened/simplified version.
  The wizard is meant to literally reuse the same row-editing UI/fields as the standalone
  forms, just assembled together under one shared header + one shared footer covering all
  toggled services combined. "+ Add Another" works the same way in each section as it does
  standalone. **Not built yet** — schema is ready for it (see §5), UI is not. This full-field-
  parity requirement must be respected when it IS built — a previous explanation of this was
  apparently unclear, so re-confirm field-by-field parity against each standalone form's
  actual field list before building anything.

**Per-type spec changes (details in §5 schema):**
- **Hotel:** ✅ DONE — added Buying/Selling per night (was one `dayRate`), added Infants
  count, Meal Plan dropdown (RO/BB/HB/FB), kept Room Type dropdown and Confirmation No.
  Confirmed working end-to-end (add/edit/manage/API), profit column on Manage page working.
  This is the reference implementation every other booking type should match.
- **Transport:** ✅ Built this session — removed separate From/To fields, replaced with one
  `sector` text field (e.g. "Jeddah to Makkah"). Vehicle is a dropdown (Sedan/SUV/Minivan/
  Coach/Luxury Bus/Train Ticket). Buying/Selling are totals per segment, not a per-unit rate.
  Add + Manage + API confirmed working, profit column on Manage page working.
  ⚠️ **BUG: Edit page throws an error.** Not yet diagnosed — needs the full browser console
  error AND the Network tab response for the failing request before attempting a fix.
- **Visa:** ✅ Built this session — added Passport Number (new field, wasn't in the old
  schema at all). `visaType`/`serviceCharge` replaced with `visaCategory` + Buying/Selling
  pair. Manage + API built, profit column on Manage page working.
  ⚠️ **BUG: Add page throws an error** at the `if (!res.ok) throw new Error(...)` check in
  the submit handler — meaning the POST request itself is failing or returning a non-OK
  status. Not yet diagnosed — needs the actual response body from the Network tab (not just
  "res.ok failed") before attempting a fix. Likely candidates to check first: a field-name
  mismatch between what the Add form sends and what `api/visa-bookings/route.ts` expects, or
  a Prisma validation error (e.g. a required field arriving empty or the wrong type).
- **Flight:** ⚠️ **NOT rebuilt yet.** Old CRUD is still in place and does **not** match the
  new spec — confirmed to have extra/unwanted fields left over from the old shape. Needs a
  full rebuild from scratch (not a patch), following the same pattern as Hotel/Transport/Visa:
  airport fields renamed to `departureAirport`/`arrivalAirport`, date+time merged into single
  `departureDateTime`/`arrivalDateTime`, keep `pnr` per-leg (separate from the booking-level
  `referenceNo` in the Global Header), Buying/Selling now totals per leg. Before writing this
  rebuild, confirm the exact field list against the schema in §5 line by line — do not carry
  over any field from the old flight-bookings pages without checking it's still in the schema.

---

## 3a. Known bugs — needs fixing next, before moving on to Flight

- **Transport Booking Edit page** throws an error. Root cause not yet known. Next step: open
  the Edit page, reproduce the error, and paste (1) the full browser console error text and
  (2) the Network tab response body for whichever request fails (likely the GET to
  `/api/transport-bookings/[id]` or the PUT on submit).
- **Visa Booking Add page** throws an error on submit (the generic "Server rejected the
  booking" message from the `if (!res.ok)` check). Root cause not yet known. Next step: open
  browser DevTools → Network tab, submit the form, click the failed `POST
  /api/visa-bookings` request, and paste the actual response body (it will contain the real
  Prisma/validation error, not just "not ok").
- **General reporting convention (re-emphasizing §10's existing rule, which was skipped for
  both bugs above):** always paste the FULL browser console error and the Network tab
  response body for the failing request — a vague description like "gives an error" is not
  enough to diagnose from.

---

## 4. Folder structure (current, as of this session)

```
travelcraft/
├── auth.ts                          # Auth.js central config (project root)
├── next-auth.d.ts                   # TypeScript session type augmentation (project root)
├── prisma/schema.prisma             # confirmed live via `prisma db push` — see §5
├── src/
│   ├── proxy.ts                     # route protection (renamed from middleware.ts — Next 16 convention)
│   ├── lib/
│   │   ├── prisma.ts                # shared Prisma client singleton
│   │   ├── sharedBookingFields.ts   # GlobalHeaderData, FooterData types + constants
│   │   ├── pricingCalculations.ts   # nights, line totals, tax, net total, profit math
│   │   ├── countryList.ts           # country array for Nationality dropdown
│   │   ├── formatDate.ts            # ✅ NEW this session — formatDateDDMMYYYY(), central
│   │   │                            #   place for displaying stored dates as DD/MM/YYYY
│   │   ├── hotelBookingTypes.ts     # ✅ confirmed working — HotelRow, ROOM_TYPES,
│   │   │                            #   MEAL_PLANS, emptyHotelRow()
│   │   ├── transportBookingTypes.ts # ✅ NEW this session — TransportRow, VEHICLE_TYPES,
│   │   │                            #   emptyTransportRow()
│   │   ├── flightBookingTypes.ts    # ⚠️ STILL OLD SHAPE — needs updating to departure/arrival
│   │   │                            #   DateTime + totals when Flight is rebuilt
│   │   └── visaBookingTypes.ts      # ✅ NEW this session — VisaRow, PROCESSING_TYPES,
│   │                                #   emptyVisaRow()
│   ├── components/
│   │   ├── Providers.tsx            # wraps app in <SessionProvider> for useSession()
│   │   └── booking/
│   │       ├── GlobalHeaderFields.tsx   # shared header form block, used by Hotel/Transport/Visa now
│   │       └── PricingFooterFields.tsx  # shared footer form block (discount/VAT/profit/payment/note)
│   └── app/
│       ├── layout.tsx               # ROOT layout — must always exist, must have <html>/<body>,
│       │                            #   must wrap children in <Providers>. Losing/emptying this
│       │                            #   file has caused full-app crashes twice before.
│       ├── [agencySlug]/            # PUBLIC per-agency site
│       │   ├── page.tsx             #   packages grid homepage
│       │   ├── packages/[id]/page.tsx
│       │   └── book/[packageId]/page.tsx
│       ├── admin/                   # SUPER ADMIN area (isSuperAdmin only)
│       │   ├── layout.tsx
│       │   ├── page.tsx             #   list agencies, toggle active/inactive
│       │   └── add/page.tsx         #   create new agency + its one login
│       ├── portal/
│       │   ├── login/page.tsx       #   OUTSIDE the (protected) group — no sidebar
│       │   └── (protected)/         #   route group — sidebar layout wraps everything inside
│       │       ├── layout.tsx       #   sidebar grouped into 5 sections (Traveler / Hotel /
│       │       │                    #   Transport / Flight / Visa Booking), each with Add +
│       │       │                    #   Manage links, plus Packages + Notifications below.
│       │       ├── page.tsx         #   dashboard (stat cards)
│       │       ├── travelers/{add,manage,[id]/edit}/page.tsx
│       │       │                    #   ⚠️ OLD simplified 3-field version — superseded in
│       │       │                    #   concept by the new PackageBooking model (§5), but the
│       │       │                    #   UI for the Full Package wizard hasn't been built yet.
│       │       │                    #   These routes/pages still point at the old Traveler
│       │       │                    #   shape, which NO LONGER EXISTS in the schema — ⚠️ this
│       │       │                    #   will currently be broken/erroring until rebuilt.
│       │       ├── packages/{add,manage,[id]/edit}/page.tsx
│       │       ├── notifications/page.tsx   # 10-second polling, not yet Supabase Realtime
│       │       ├── hotel-bookings/          # ✅ CONFIRMED WORKING end-to-end
│       │       │   ├── add/page.tsx
│       │       │   ├── manage/page.tsx      #   shows Profit column
│       │       │   └── [id]/edit/page.tsx
│       │       ├── transport-bookings/      # ✅ Add/Manage confirmed working, profit column
│       │       │   ├── add/page.tsx         #   working. ⚠️ Edit page has an unresolved bug
│       │       │   ├── manage/page.tsx      #   (see §3a).
│       │       │   └── [id]/edit/page.tsx
│       │       ├── flight-bookings/         # ⚠️ OLD CRUD, built against the OLD schema shape,
│       │       │   ├── add/page.tsx         #   confirmed to have mismatched/unwanted fields.
│       │       │   ├── manage/page.tsx      #   Needs a full rebuild, same pattern as Hotel/
│       │       │   └── [id]/edit/page.tsx   #   Transport/Visa. NEXT UP after §3a bugs are fixed.
│       │       └── visa-bookings/           # ✅ Manage confirmed working, profit column
│       │           ├── add/page.tsx         #   working. ⚠️ Add page has an unresolved bug
│       │           ├── manage/page.tsx      #   (see §3a).
│       │           └── [id]/edit/page.tsx
│       └── api/
│           ├── auth/[...nextauth]/route.ts
│           ├── portal/check-agency/route.ts     # pre-login agency-exists check
│           ├── admin/agencies/{route.ts,[id]/route.ts}
│           ├── travelers/{route.ts,[id]/route.ts}   # ⚠️ points at the now-removed Traveler
│           │                                        #   model — currently broken, needs
│           │                                        #   rebuilding against PackageBooking
│           ├── packages/route.ts                # PUBLIC GET (?agencySlug=), PROTECTED POST
│           ├── packages/mine/route.ts           # PROTECTED GET — portal's own listing
│           ├── packages/[id]/route.ts           # PROTECTED GET/PUT/DELETE, ownership-checked
│           ├── inquiries/route.ts               # PUBLIC POST, PROTECTED GET
│           ├── hotel-bookings/{route.ts,[id]/route.ts}      # ✅ CONFIRMED WORKING
│           ├── transport-bookings/{route.ts,[id]/route.ts}  # ✅ built, PUT path linked to
│           │                                                #   the Edit-page bug (§3a)
│           ├── flight-bookings/{route.ts,[id]/route.ts}     # ⚠️ OLD shape, needs rebuild
│           └── visa-bookings/{route.ts,[id]/route.ts}       # ✅ built, POST path linked to
│                                                             #   the Add-page bug (§3a)
```

**Note on file naming — this bit beginners on this project multiple times:** Next.js App
Router routing is driven by *exact* filenames. `page.tsx` must be exactly that (not
`pages.tsx`, not `Page.tsx`). `route.ts` must be exactly that. An empty or missing
`layout.tsx` breaks every page beneath it. Folder names in `()` (route groups) don't affect
the URL; folder names in `[]` are dynamic URL params.

---

## 5. Database schema (current — confirmed live via `prisma db push`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Agency {
  id            String   @id @default(cuid())
  slug          String   @unique
  name          String
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())

  bankAccountName    String?
  bankName           String?
  bankAccountNo      String?
  bankIban           String?
  bankAddress        String?
  cancellationPolicy String?
  noShowPolicy       String?
  importantContact   String?

  users             User[]
  packageBookings   PackageBooking[]
  packages          Package[]
  inquiries         Inquiry[]
  hotelBookings     HotelBooking[]
  transportBookings TransportBooking[]
  flightBookings    FlightBooking[]
  visaBookings      VisaBooking[]
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  isSuperAdmin Boolean  @default(false)
  agencyId     String?
  agency       Agency?  @relation(fields: [agencyId], references: [id])
  createdAt    DateTime @default(now())
}

model Package {
  id          String    @id @default(cuid())
  agencyId    String
  agency      Agency    @relation(fields: [agencyId], references: [id])
  title       String
  description String
  imageUrl    String?
  createdAt   DateTime  @default(now())
  inquiries   Inquiry[]
}

model Inquiry {
  id          String   @id @default(cuid())
  agencyId    String
  agency      Agency   @relation(fields: [agencyId], references: [id])
  packageId   String
  package     Package  @relation(fields: [packageId], references: [id])
  phone       String
  peopleCount Int      @default(1)
  createdAt   DateTime @default(now())
}

// ============================================================
// FULL PACKAGE BOOKING — the combined wizard (schema ready, UI NOT built yet)
// One global header + footer. Section checkboxes decide which entry types
// get rows. Each entry type below can belong to EITHER a standalone booking
// OR a PackageBooking (never both) via optional foreign keys.
// See §3 for the full-field-parity requirement when this gets built.
// ============================================================
model PackageBooking {
  id          String   @id @default(cuid())
  agencyId    String
  agency      Agency   @relation(fields: [agencyId], references: [id])

  agentName   String
  guestName   String
  nationality String
  mobileNo    String
  referenceNo String?
  currency    String   @default("USD")

  includeHotels     Boolean @default(false)
  includeTransports Boolean @default(false)
  includeFlights    Boolean @default(false)
  includeVisas      Boolean @default(false)

  discount    Float    @default(0)
  vatPercent  Float    @default(0)
  paymentType String?
  note        String?

  createdAt DateTime @default(now())

  hotels            HotelBookingEntry[]
  transportSegments TransportSegment[]
  flightSegments    FlightSegment[]
  visaEntries       VisaEntry[]
}

// ============================================================
// HOTEL BOOKING — ✅ confirmed working end-to-end
// ============================================================
model HotelBooking {
  id          String   @id @default(cuid())
  agencyId    String
  agency      Agency   @relation(fields: [agencyId], references: [id])

  agentName   String
  guestName   String
  nationality String
  mobileNo    String
  referenceNo String?
  currency    String   @default("USD")

  discount    Float    @default(0)
  vatPercent  Float    @default(0)
  paymentType String?
  note        String?

  createdAt DateTime @default(now())
  hotels    HotelBookingEntry[]
}

model HotelBookingEntry {
  id             String   @id @default(cuid())

  hotelBookingId String?
  hotelBooking   HotelBooking?   @relation(fields: [hotelBookingId], references: [id], onDelete: Cascade)
  packageBookingId String?
  packageBooking PackageBooking? @relation(fields: [packageBookingId], references: [id], onDelete: Cascade)

  hotelName      String
  city           String
  roomType       String    // Single, Double, Triple, Quad, Quint Suite, Family Room
  checkIn        DateTime
  checkOut       DateTime
  rooms          Int       @default(1)
  adults         Int       @default(1)
  children       Int       @default(0)
  infants        Int       @default(0)
  mealPlan       String?   // RO, BB, HB, FB
  confirmationNo String?

  buyingCostPerNight   Float
  sellingPricePerNight Float
  // nights & line totals are CALCULATED on screen/PDF, never stored
}

// ============================================================
// TRANSPORT BOOKING — ✅ built this session, Edit page has an unresolved bug (§3a)
// ============================================================
model TransportBooking {
  id          String   @id @default(cuid())
  agencyId    String
  agency      Agency   @relation(fields: [agencyId], references: [id])

  agentName   String
  guestName   String
  nationality String
  mobileNo    String
  referenceNo String?
  currency    String   @default("USD")

  discount    Float    @default(0)
  vatPercent  Float    @default(0)
  paymentType String?
  note        String?

  createdAt DateTime @default(now())
  segments  TransportSegment[]
}

model TransportSegment {
  id                  String   @id @default(cuid())

  transportBookingId  String?
  booking             TransportBooking? @relation(fields: [transportBookingId], references: [id], onDelete: Cascade)
  packageBookingId    String?
  packageBooking      PackageBooking?   @relation(fields: [packageBookingId], references: [id], onDelete: Cascade)

  vehicle      String   // Sedan, SUV, Minivan, Coach, Luxury Bus, Train Ticket
  sector       String   // e.g. "Jeddah to Makkah" — replaces old fromLoc/toLoc
  pickupDate   DateTime
  pickupTime   String
  qty          Int      @default(1)

  buyingCost   Float    // Total Buying Cost for this segment
  sellingPrice Float    // Total Selling Price for this segment
}

// ============================================================
// FLIGHT BOOKING — ⚠️ schema updated, CRUD/UI still needs full rebuild (NEXT UP,
// old pages currently in place have mismatched/unwanted fields — see §3)
// ============================================================
model FlightBooking {
  id          String   @id @default(cuid())
  agencyId    String
  agency      Agency   @relation(fields: [agencyId], references: [id])

  agentName   String
  guestName   String
  nationality String
  mobileNo    String
  referenceNo String?
  currency    String   @default("USD")

  discount    Float    @default(0)
  vatPercent  Float    @default(0)
  paymentType String?
  note        String?

  createdAt DateTime @default(now())
  segments  FlightSegment[]
}

model FlightSegment {
  id                String   @id @default(cuid())

  flightBookingId   String?
  booking           FlightBooking?  @relation(fields: [flightBookingId], references: [id], onDelete: Cascade)
  packageBookingId  String?
  packageBooking    PackageBooking? @relation(fields: [packageBookingId], references: [id], onDelete: Cascade)

  airline           String
  flightNo          String
  pnr               String?
  departureAirport  String
  arrivalAirport    String
  departureDateTime DateTime
  arrivalDateTime   DateTime
  travelClass       String?  // Economy, Premium Economy, Business, First Class
  adults            Int      @default(1)
  children          Int      @default(0)
  infants           Int      @default(0)
  baggage           String?

  buyingCost   Float   // Total Buying Cost for this leg
  sellingPrice Float   // Total Selling Price for this leg
}

// ============================================================
// VISA BOOKING — ✅ built this session, Add page has an unresolved bug (§3a)
// ============================================================
model VisaBooking {
  id          String   @id @default(cuid())
  agencyId    String
  agency      Agency   @relation(fields: [agencyId], references: [id])

  agentName   String
  guestName   String
  nationality String
  mobileNo    String
  referenceNo String?
  currency    String   @default("USD")

  discount    Float    @default(0)
  vatPercent  Float    @default(0)
  paymentType String?
  note        String?

  createdAt DateTime @default(now())
  entries   VisaEntry[]
}

model VisaEntry {
  id                String   @id @default(cuid())

  visaBookingId     String?
  booking           VisaBooking?    @relation(fields: [visaBookingId], references: [id], onDelete: Cascade)
  packageBookingId  String?
  packageBooking    PackageBooking? @relation(fields: [packageBookingId], references: [id], onDelete: Cascade)

  visaCategory    String   // e.g. Saudi Umrah, UK Tourist, Schengen Business
  applicantName   String
  passportNumber  String   // added — NEW field, wasn't in the old schema at all
  processingType  String?  // Normal, Urgent, Express
  submissionDate  DateTime?
  expiryDate      DateTime?

  buyingCost   Float
  sellingPrice Float
}
```

**Note:** the old `Traveler` model was **removed** and replaced conceptually by
`PackageBooking`. The `travelers/` routes and pages still exist in the codebase pointing at
the old model — they are currently broken and need to be rebuilt against `PackageBooking`
when the Full Package wizard is built (§7, roadmap item 9).

**Not yet in schema (planned):** a `Media` model (for Settings-page image uploads). Possibly a
separate `VisaListing` model for a public visa catalog page, if that's built later.

---

## 6. Auth & multi-tenancy model — read carefully, this is the core design (unchanged)

- **Login form has 3 fields:** Agency Name, Email, Password.
  - Agency name **blank** → attempts **super admin** login (checks `isSuperAdmin: true`,
    `agencyId: null`).
  - Agency name **filled** → looks up `Agency` by slug first. If no matching *active* agency,
    show **"No such agency exists."** (checked via a separate pre-flight call to
    `/api/portal/check-agency` BEFORE attempting sign-in). If agency is valid but
    email/password don't match that agency's one user, show **"Invalid email or password."**
  - Agency name matching is case/whitespace-insensitive (`.trim().toLowerCase()` on both
    login page and in `auth.ts`).
- **Session (JWT) carries:** `isSuperAdmin`, `agencyId`, `agencySlug`, `agencyName`.
  ⚠️ Whenever new fields are added to the session, **existing logged-in users must log out
  and back in** — JWT sessions don't retroactively gain new fields.
- **Route protection** (`src/proxy.ts`, matcher `/portal/:path*` and `/admin/:path*`):
  - Not logged in + on `/portal` or `/admin` → redirect to `/portal/login`
  - Logged in as agency user, tries `/admin` → redirected to `/portal`
  - Logged in as super admin, tries `/portal` → redirected to `/admin`
- **Data isolation rule (applies to EVERY table and EVERY route, no exceptions):**
  - Every business table has `agencyId`.
  - GET (list) queries filter `WHERE agencyId = session.user.agencyId`.
  - POST (create) always sets `agencyId` **from the session**, never trusts a client-sent value.
  - PUT/DELETE (single record) **must** first fetch the record and verify
    `record.agencyId === session.user.agencyId` before allowing the write. This pattern is
    confirmed working in `hotel-bookings/[id]/route.ts` and has been replicated for
    transport/visa; must also be replicated for flight when it's rebuilt.
  - **Public-facing GETs** (the agency's public site) take `?agencySlug=` as a query param —
    visitors aren't logged in, so there's no session to filter by.
  - **Public POSTs** (inquiry/booking submissions) never trust a client-supplied `agencyId` —
    derived server-side from the related record.
- **Super Admin capabilities:** list all agencies, create a new agency (name + slug + one
  login email/password in a single form), toggle `isActive`. No hard delete flow built.
- **Known gap:** true Postgres Row-Level Security (RLS) has NOT been built yet. Current
  protection is 100% application-level (the checks above). RLS is a deferred hardening pass —
  see §7.

---

## 7. Full remaining roadmap (updated order, post-redesign)

1. ~~Hotel/Transport/Flight/Visa original CRUD~~ ✅ DONE (superseded by redesign below)
2. ~~Sidebar restructuring~~ ✅ DONE
3. ~~5-section form spec redesign — schema + shared components~~ ✅ DONE
   (`sharedBookingFields.ts`, `pricingCalculations.ts`, `countryList.ts`,
   `GlobalHeaderFields.tsx`, `PricingFooterFields.tsx`)
4. ~~Hotel Booking rebuilt to new spec~~ ✅ DONE, confirmed working end-to-end
   (add/edit/manage + API, profit column on Manage page)
5. ~~Transport Booking rebuild~~ ✅ Built (Add/Manage/API + profit column working), but has
   an **unresolved Edit-page bug** (see §3a) — must fix before calling this fully done.
6. ~~Visa Booking rebuild~~ ✅ Built (Manage/API + profit column working), but has an
   **unresolved Add-page bug** (see §3a) — must fix before calling this fully done.
7. **Fix the two bugs in §3a.** Do this before starting Flight — both are blocking full use
   of Transport and Visa.
8. **Flight Booking rebuild** — NOT done. The OLD CRUD currently in place has confirmed
   extra/unwanted fields that don't match the new spec. Needs a fresh rebuild (delete and
   redo, don't patch), following the exact same pattern as Hotel/Transport/Visa: confirm the
   field list against schema §5 line by line before writing any code. Remember:
   `departureAirport`/`arrivalAirport`, merged `departureDateTime`/`arrivalDateTime`, keep
   `pnr` per-leg (separate from the booking-level `referenceNo`), totals per leg.
9. **Profit column on Flight Manage page** — same pattern as Hotel/Transport/Visa, do
   alongside the Flight rebuild above.
10. **Full "Package Booking" wizard** — the combined form (schema already supports it via
    `PackageBooking` + optional foreign keys on every entry type). See the clarified spec in
    §3: each toggled section must carry the FULL field set of that service's standalone form,
    not a simplified version. Build after Flight is rebuilt and both §3a bugs are fixed, since
    the wizard reuses the exact same row components for Hotels/Transport/Flights/Visas, just
    toggled by checkboxes. Also: rebuild the old `travelers/` routes and pages against this
    new model (they currently point at the removed `Traveler` model and are broken).
11. **Voucher vs. Invoice PDF generation** — `@react-pdf/renderer`. Two variants per booking:
    Voucher (no buying cost, no profit — client-facing) and Invoice (full pricing — internal/
    dealer-facing). `PricingFooterFields`'s `showProfit` prop pattern should carry over to the
    PDF templates conceptually. Build minimal/unstyled first (functionality before styling
    rule), branded version later using the Safar e Arabian reference captured previously.
12. **Real-time notifications** — replace current 10-second polling
    (`src/app/portal/(protected)/notifications/page.tsx`) with Supabase Realtime.
13. **Real image upload** — Supabase Storage, replacing the current "paste an image URL" field
    on Packages.
14. **Agency Settings page** — portal page to edit bank/policy fields and manage public site
    image sections (Hero carousel, About, Memories gallery) — ties to a future `Media` model
    tagged by `section`. Right now those Agency fields would need to be set directly in the
    database.
15. **Password show/hide toggle** on Admin "Add Agency" form (already exists on login page).
16. **Google login** ("Continue with Google") — not started.
17. **RLS hardening** — real Postgres Row-Level Security as defense-in-depth on top of
    existing application-level checks. Since Auth.js/Prisma is used (not Supabase Auth), this
    needs `SET LOCAL app.agency_id` per-request rather than Supabase's `auth.uid()` pattern —
    flagged as non-trivial.
18. **Full CSS/visual design pass** — original 9-section public site plan (Hero, Packages
    Grid, Network & Perks, About, Memories Gallery, Hype Wall, CTA & Booking Form, FAQ,
    Footer) — still fully valid, not started. Also applies polish to the portal itself
    (currently zero styling beyond bare Tailwind utility classes). Stack intent: Three.js /
    GSAP, scroll-triggered animations, mobile responsiveness required.
19. **Possible future: public Visa Listing/catalog page** (Title, Category, Processing Time,
    Validity, Cost, FAQs, Required Documents, What's Included) — separate from Visa Booking,
    not scoped or started, only discussed.

**Small known cleanup items, not urgent:**
- `Manage Packages` page's fetch still has no try/catch (Hotel/Transport/Visa Manage pages DO
  have it now — worth backporting the same pattern to Packages/Travelers/Notifications at some
  point).
- The `/api/dev/seed-user` one-time bootstrap route pattern — delete immediately after
  one-time use in production; don't leave a public account-creation endpoint live.

---

## 8. Reference captured for the production-grade PDF/invoice phase (roadmap item 11)

A competitor reference (Safar e Arabian admin panel) was reviewed via screenshots:
- **Hotel Booking list page:** stat cards (Total / Processing / Completed / Cancelled /
  Revenue) + searchable/filterable table + "Generate Invoice" button.
- **Invoice Detail page:** "Download Hotel Invoice" and "Download Hotel Voucher" buttons side
  by side, with an inline "Invoice Preview — identical to the downloaded PDF" section below.
- **Actual PDF layout:** branded gold/white header with logo, Booking Info + Guest Info
  two-column cards, per-hotel detail tables (one table per hotel: Hotel / Room Type /
  Check-in / Check-out / Nights / Rooms / Guests / Meal Plan / Price per Night), Payment
  Summary box (Subtotal / VAT / Total), and a bank details + cancellation/no-show policy
  footer — pulling from Agency-level settings fields (confirms the existing §5 design choice
  to store bank/policy info once at the agency level).

**Plan:** minimal unstyled PDF first (roadmap item 11, functionality-first rule), branded
version matching this reference later.

---

## 9. Test / demo credentials (as of last known state — rotate before real production use)

- **Agency login:** agency name `travelcraft`, email `demo@gmail.com`, password `demo123`
- **Super admin login:** leave agency name blank, email `admin@gmail.com`, password `admin123`
- A second test agency (`testtours` or similar) may also exist from multi-tenancy testing —
  check `/admin` agency list to confirm current state.

---

## 10. Working conventions for continuing this project (please follow these)

- The user is a **beginner/self-taught developer** — explain concepts in plain words before
  or alongside code, don't assume familiarity with jargon.
- **Build one small, testable step at a time.** Give exact file save paths. Wait for the user
  to confirm "done" or report an exact error before moving to the next step. The user has
  given permission to batch multiple files at once once a pattern is proven, but still confirm
  before moving to the NEXT booking type.
- **When something errors, ALWAYS ask for the FULL error text** (browser console AND the
  Network tab response body for the failing request) before proposing a fix — vague error
  descriptions waste a round-trip and have already caused two undiagnosed bugs this session
  (see §3a). Do not guess at a fix without this information.
- **Functionality before styling.** CSS/visual design is explicitly deferred until the full
  feature set is functionally complete. Don't add design polish unless asked.
- **Never trust client-supplied `agencyId`.** Always derive it server-side from the session
  (protected routes) or from a related record (public routes).
- **Every new mutate-by-id route needs an ownership check** (`record.agencyId ===
  session.user.agencyId`) before allowing the write — copy the pattern from
  `hotel-bookings/[id]/route.ts`, which is the current confirmed-working reference.
- **Never store a value that can be calculated from other stored fields** (nights, gross
  totals, tax amount, net total, profit, etc.) — calculate on read/render instead, using
  `src/lib/pricingCalculations.ts`.
- **Reuse the shared components** (`GlobalHeaderFields.tsx`, `PricingFooterFields.tsx`) for
  every remaining booking type rather than rewriting the header/footer fields again.
- **Before building a new booking type's fields, always confirm the exact field list against
  the schema in §5, line by line** — do not carry over fields from an old/previous version of
  a form without checking each one is still present in the current schema. This was flagged
  as the likely cause of the Flight Booking field-mismatch problem.
- **Dates are displayed as DD/MM/YYYY everywhere** using `src/lib/formatDate.ts`'s
  `formatDateDDMMYYYY()` — never format a stored date ad-hoc in a component. `<input
  type="date">` boxes themselves always store/submit `YYYY-MM-DD` internally (a browser
  behavior that can't be changed); only the DISPLAY of already-saved dates on Manage/Edit
  pages and future PDFs goes through `formatDateDDMMYYYY()`.
- User is on **Windows + PowerShell** — give PowerShell commands, not bash.
- **Schema changes:** use `npx prisma db push` (not `migrate dev`, which doesn't run cleanly
  in this environment), then `npx prisma generate`.
- **When given code as a reply preference:** user has asked at times for code shown collapsed
  by file name (not expanded inline) when giving multiple files — follow that formatting
  style if requested again.
- **New field lists from the user should be sanity-checked** before building schema/API — the
  user has caught mismatched field lists (copy-pasted from a different booking type, or a
  catalog-shaped list where a transaction record was meant) more than once. Confirm before
  building when something looks off, rather than guessing.
- **`auth` import path is fragile** — always verify against an existing working API route in
  this project before assuming the relative path depth is correct.