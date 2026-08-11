const { matchRoleCategory } = require("./roleMatcher");
const { parseSalary } = require("./salaryParser");
const { parseLocation } = require("./locationParser");

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

async function fetchJson(url, opts = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs || 15000);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function makeId(source, company, nativeId) {
  return `${source}:${company}:${nativeId}`;
}

// ---------------- Greenhouse ----------------
async function fetchGreenhouse(company, cutoffDate, log) {
  const results = [];
  const url = `https://boards-api.greenhouse.io/v1/boards/${company.slug}/jobs`;
  let data;
  try {
    data = await fetchJson(url);
  } catch (e) {
    log(`[greenhouse] ${company.name}: list fetch failed - ${e.message}`);
    return results;
  }
  const jobs = data.jobs || [];
  const candidates = jobs.filter((j) => {
    const updated = new Date(j.updated_at);
    return updated >= cutoffDate && matchRoleCategory(j.title);
  });

  for (const job of candidates) {
    try {
      const detailUrl = `https://boards-api.greenhouse.io/v1/boards/${company.slug}/jobs/${job.id}`;
      const detail = await fetchJson(detailUrl);
      const salary = parseSalary(detail.content || "");
      const loc = parseLocation((job.location && job.location.name) || "");
      results.push({
        id: makeId("greenhouse", company.slug, job.id),
        source: "greenhouse",
        company: company.name,
        title: job.title,
        roleCategory: matchRoleCategory(job.title),
        location: loc,
        datePosted: job.updated_at,
        url: job.absolute_url,
        salaryMin: salary.salaryMin,
        salaryMax: salary.salaryMax,
        salaryCurrency: salary.salaryCurrency,
        salaryRaw: salary.salaryRaw,
        fetchedAt: new Date().toISOString()
      });
    } catch (e) {
      log(`[greenhouse] ${company.name}: detail fetch failed for job ${job.id} - ${e.message}`);
    }
  }
  return results;
}

// ---------------- Lever ----------------
async function fetchLever(company, cutoffDate, log) {
  const results = [];
  const url = `https://api.lever.co/v0/postings/${company.slug}?mode=json`;
  let postings;
  try {
    postings = await fetchJson(url);
  } catch (e) {
    log(`[lever] ${company.name}: list fetch failed - ${e.message}`);
    return results;
  }
  if (!Array.isArray(postings)) return results;

  const candidates = postings.filter((p) => {
    const created = new Date(p.createdAt);
    return created >= cutoffDate && matchRoleCategory(p.text);
  });

  for (const p of candidates) {
    const listsText = (p.lists || []).map((l) => `${l.text || ""} ${l.content || ""}`).join(" ");
    const fullText = `${p.descriptionPlain || p.description || ""} ${listsText}`;
    const salary = parseSalary(fullText);
    const locRaw = (p.categories && (p.categories.location || p.categories.allLocations)) || "";
    const loc = parseLocation(Array.isArray(locRaw) ? locRaw.join(", ") : locRaw);
    results.push({
      id: makeId("lever", company.slug, p.id),
      source: "lever",
      company: company.name,
      title: p.text,
      roleCategory: matchRoleCategory(p.text),
      location: loc,
      datePosted: new Date(p.createdAt).toISOString(),
      url: p.hostedUrl,
      salaryMin: salary.salaryMin,
      salaryMax: salary.salaryMax,
      salaryCurrency: salary.salaryCurrency,
      salaryRaw: salary.salaryRaw,
      fetchedAt: new Date().toISOString()
    });
  }
  return results;
}

async function fetchCompany(company, log) {
  const cutoff = new Date(Date.now() - TWO_WEEKS_MS);
  if (company.platform === "greenhouse") return fetchGreenhouse(company, cutoff, log);
  if (company.platform === "lever") return fetchLever(company, cutoff, log);
  log(`Unknown platform for ${company.name}: ${company.platform}`);
  return [];
}

module.exports = { fetchCompany, TWO_WEEKS_MS };
