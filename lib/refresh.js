const { load, save } = require("../data/store");
const companies = require("./companies");
const { fetchCompany } = require("./fetchers");

let runningPromise = null;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function runRefresh() {
  if (runningPromise) return runningPromise; // avoid overlapping runs
  runningPromise = doRefresh().finally(() => {
    runningPromise = null;
  });
  return runningPromise;
}

async function doRefresh() {
  const startedAt = new Date().toISOString();
  const logs = [];
  const log = (msg) => {
    logs.push(msg);
    console.log(`[refresh] ${msg}`);
  };

  const data = load();
  data.refreshMeta.running = true;
  save(data);

  log(`Starting refresh across ${companies.length} companies`);
  let allResults = [];
  let companiesOk = 0;
  let companiesFailed = 0;

  const batches = chunk(companies, 5);
  for (const batch of batches) {
    const settled = await Promise.allSettled(batch.map((c) => fetchCompany(c, log)));
    settled.forEach((r, i) => {
      if (r.status === "fulfilled") {
        allResults = allResults.concat(r.value);
        companiesOk++;
      } else {
        companiesFailed++;
        log(`${batch[i].name}: failed entirely - ${r.reason && r.reason.message}`);
      }
    });
  }

  // Merge: keep existing listings not touched this run (in case a company
  // temporarily fails), but replace/add anything freshly fetched.
  const fresh = load();
  const byId = new Map(fresh.jobListings.map((j) => [j.id, j]));
  for (const job of allResults) byId.set(job.id, job);

  // Drop listings older than 2 weeks so the tab stays current.
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const merged = Array.from(byId.values()).filter((j) => new Date(j.datePosted).getTime() >= cutoff);

  fresh.jobListings = merged;
  fresh.refreshMeta = {
    running: false,
    lastRunAt: new Date().toISOString(),
    lastRunStats: {
      startedAt,
      companies: companies.length,
      companiesOk,
      companiesFailed,
      listingsFound: allResults.length,
      totalListings: merged.length,
      logsTail: logs.slice(-30)
    }
  };
  save(fresh);
  log(`Done. ${allResults.length} matching listings found this run, ${merged.length} total stored.`);
  return fresh.refreshMeta.lastRunStats;
}

module.exports = { runRefresh };
