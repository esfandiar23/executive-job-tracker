const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "db.json");

function defaultData() {
  return {
    applications: [],
    recruiters: [],
    jobListings: [],
    refreshMeta: { lastRunAt: null, lastRunStats: null, running: false }
  };
}

function load() {
  if (!fs.existsSync(DB_PATH)) {
    save(defaultData());
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  try {
    const data = JSON.parse(raw);
    if (!data.jobListings) data.jobListings = [];
    if (!data.refreshMeta) data.refreshMeta = { lastRunAt: null, lastRunStats: null, running: false };
    return data;
  } catch (e) {
    return defaultData();
  }
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

module.exports = { load, save, uid };
