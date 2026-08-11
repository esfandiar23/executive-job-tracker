# Executive Job Tracker

Job search platform for executive tech roles (Infrastructure Architect, EA, IT Director,
AI Director, CTO, CIO, CISO) — search, track, and manage applications.

## Run it

```
cd tracker-app
npm install
npm start
```

Open **http://localhost:3000**.

## Tabs

- **Applications** — Kanban pipeline: Researching → Applied → Recruiter Screen →
  Interviewing → Offer → Closed. Add manually or from Job Listings.
- **Job Listings** — Auto-pulled from company career pages, refreshed daily
  (plus a manual "Refresh Now" button). Filter by title/company, role category,
  country, minimum salary (CAD), sort by date/salary/company. "+ Add to
  Applications" on any row seeds a new application record from that listing.
- **Recruiters & Firms** — CRM for headhunters/search firms, since most senior
  IT/security roles are filled through relationships, not job boards.

## How Job Listings sourcing works

Listings are pulled directly from ~60 companies' own public Greenhouse/Lever
career-page APIs (see `lib/companies.js` for the list) — not from LinkedIn,
Indeed, or Glassdoor. Scraping those three sites would violate their Terms of
Service and trigger anti-bot defenses, so they're intentionally excluded.
Add a listing you find there yourself via "+ Add Application" instead.

Each refresh: pulls postings updated in the last 14 days, keeps only titles
matching the target role categories, and best-effort parses a salary range out
of the job description text (many postings don't list one, or list it in
USD — those are converted to CAD at an approximate fixed rate for filtering).

Not yet covered: large traditional enterprises (banks, telecoms, most
Fortune 500 non-tech employers) mostly run Workday/Taleo/SuccessFactors,
which need a different integration — planned as a later phase, alongside
major Canadian recruiting/search firms.

## Data

Stored in `data/db.json` on a persistent volume when deployed to Railway.
