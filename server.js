const express = require("express");
const path = require("path");
const { load, save, uid } = require("./data/store");
const { runRefresh } = require("./lib/refresh");
const { allCategories } = require("./lib/roleMatcher");
const companies = require("./lib/companies");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const STATUSES = [
  "Researching",
  "Applied",
  "Recruiter Screen",
  "Interviewing",
  "Offer",
  "Closed"
];
const SOURCES = ["Job Board", "Search Firm", "Referral", "Direct"];
const ROLES = [
  "Infrastructure Architect",
  "Enterprise Architect",
  "Cloud Architect",
  "IT Director",
  "AI Director",
  "CTO",
  "CIO",
  "CISO",
  "Other"
];

app.get("/api/meta", (req, res) => {
  res.json({
    statuses: STATUSES,
    sources: SOURCES,
    roles: ROLES,
    roleCategories: allCategories(),
    companyCount: companies.length
  });
});

// ---- Applications ----
app.get("/api/applications", (req, res) => {
  const data = load();
  res.json(data.applications);
});

app.post("/api/applications", (req, res) => {
  const data = load();
  const now = new Date().toISOString();
  const app_ = {
    id: uid(),
    company: req.body.company || "",
    role: req.body.role || ROLES[0],
    status: req.body.status || STATUSES[0],
    source: req.body.source || SOURCES[0],
    recruiterId: req.body.recruiterId || null,
    location: req.body.location || "",
    compMin: req.body.compMin || "",
    compMax: req.body.compMax || "",
    dateApplied: req.body.dateApplied || now.slice(0, 10),
    notes: req.body.notes || "",
    resumeVersion: req.body.resumeVersion || "",
    coverLetter: req.body.coverLetter || "",
    jobLink: req.body.jobLink || "",
    sourceListingId: req.body.sourceListingId || null,
    createdAt: now,
    updatedAt: now
  };
  data.applications.unshift(app_);
  save(data);
  res.json(app_);
});

app.put("/api/applications/:id", (req, res) => {
  const data = load();
  const idx = data.applications.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "not found" });
  data.applications[idx] = {
    ...data.applications[idx],
    ...req.body,
    id: data.applications[idx].id,
    updatedAt: new Date().toISOString()
  };
  save(data);
  res.json(data.applications[idx]);
});

app.delete("/api/applications/:id", (req, res) => {
  const data = load();
  data.applications = data.applications.filter((a) => a.id !== req.params.id);
  save(data);
  res.json({ ok: true });
});

// ---- Recruiters / Search Firms ----
app.get("/api/recruiters", (req, res) => {
  const data = load();
  res.json(data.recruiters);
});

app.post("/api/recruiters", (req, res) => {
  const data = load();
  const now = new Date().toISOString();
  const r = {
    id: uid(),
    name: req.body.name || "",
    firm: req.body.firm || "",
    email: req.body.email || "",
    phone: req.body.phone || "",
    notes: req.body.notes || "",
    createdAt: now,
    updatedAt: now
  };
  data.recruiters.unshift(r);
  save(data);
  res.json(r);
});

app.put("/api/recruiters/:id", (req, res) => {
  const data = load();
  const idx = data.recruiters.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "not found" });
  data.recruiters[idx] = {
    ...data.recruiters[idx],
    ...req.body,
    id: data.recruiters[idx].id,
    updatedAt: new Date().toISOString()
  };
  save(data);
  res.json(data.recruiters[idx]);
});

app.delete("/api/recruiters/:id", (req, res) => {
  const data = load();
  data.recruiters = data.recruiters.filter((r) => r.id !== req.params.id);
  save(data);
  res.json({ ok: true });
});

// ---- Job Listings (auto-pulled from company career pages) ----
app.get("/api/job-listings", (req, res) => {
  const data = load();
  res.json({ listings: data.jobListings, meta: data.refreshMeta, companyCount: companies.length });
});

app.post("/api/job-listings/refresh", (req, res) => {
  const data = load();
  if (data.refreshMeta.running) {
    return res.json({ started: false, message: "A refresh is already running." });
  }
  runRefresh().catch((e) => console.error("[refresh] failed:", e));
  res.json({ started: true, message: `Refresh started across ${companies.length} companies.` });
});

app.get("/api/job-listings/refresh-status", (req, res) => {
  const data = load();
  res.json(data.refreshMeta);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Job tracker running at http://localhost:${PORT}`);

  setTimeout(() => {
    console.log("[refresh] running startup refresh");
    runRefresh().catch((e) => console.error("[refresh] startup refresh failed:", e));
  }, 15000);
  setInterval(() => {
    runRefresh().catch((e) => console.error("[refresh] scheduled refresh failed:", e));
  }, 24 * 60 * 60 * 1000);
});
