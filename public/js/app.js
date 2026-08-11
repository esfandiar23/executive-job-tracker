let META = { statuses: [], sources: [], roles: [], roleCategories: [], companyCount: 0 };
let APPLICATIONS = [];
let RECRUITERS = [];
let LISTINGS = [];
let LISTINGS_META = { lastRunAt: null, lastRunStats: null, running: false };
let currentTab = "applications";
let refreshPollTimer = null;

async function api(path, opts) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...opts
  });
  return res.json();
}

async function init() {
  META = await api("/api/meta");
  await refreshApplications();
  await refreshRecruiters();
  await refreshListings();
  renderKanban();
  renderRecruiters();
  populateListingFilters();
  renderListings();
  bindNav();
  bindButtons();
  pollRefreshStatusOnce();
}

async function refreshApplications() {
  APPLICATIONS = await api("/api/applications");
}
async function refreshRecruiters() {
  RECRUITERS = await api("/api/recruiters");
}
async function refreshListings() {
  const res = await api("/api/job-listings");
  LISTINGS = res.listings || [];
  LISTINGS_META = res.meta || LISTINGS_META;
}

function bindNav() {
  document.getElementById("tab-applications").addEventListener("click", () => switchTab("applications"));
  document.getElementById("tab-listings").addEventListener("click", () => switchTab("listings"));
  document.getElementById("tab-recruiters").addEventListener("click", () => switchTab("recruiters"));
  switchTab("applications");
}

function switchTab(tab) {
  currentTab = tab;
  document.getElementById("view-applications").classList.toggle("hidden", tab !== "applications");
  document.getElementById("view-listings").classList.toggle("hidden", tab !== "listings");
  document.getElementById("view-recruiters").classList.toggle("hidden", tab !== "recruiters");
  document.getElementById("tab-applications").classList.toggle("active", tab === "applications");
  document.getElementById("tab-listings").classList.toggle("active", tab === "listings");
  document.getElementById("tab-recruiters").classList.toggle("active", tab === "recruiters");
}

function bindButtons() {
  document.getElementById("btn-add-application").addEventListener("click", () => openApplicationModal());
  document.getElementById("btn-add-recruiter").addEventListener("click", () => openRecruiterModal());
  document.getElementById("search-box").addEventListener("input", (e) => renderKanban(e.target.value));

  document.getElementById("btn-refresh-listings").addEventListener("click", onRefreshClick);
  ["lf-search", "lf-role", "lf-country", "lf-minsalary", "lf-sort"].forEach((id) => {
    document.getElementById(id).addEventListener("input", renderListings);
    document.getElementById(id).addEventListener("change", renderListings);
  });
}

// ---------------- Kanban ----------------
function renderKanban(filterText) {
  const kanban = document.getElementById("kanban");
  kanban.innerHTML = "";
  const filter = (filterText || "").toLowerCase();

  META.statuses.forEach((status) => {
    const col = document.createElement("div");
    col.className = "kanban-col";
    const items = APPLICATIONS.filter((a) => a.status === status && matchesFilter(a, filter));
    col.innerHTML = `<h3>${status} <span>${items.length}</span></h3>`;
    const list = document.createElement("div");
    items.forEach((a) => list.appendChild(renderCard(a)));
    col.appendChild(list);
    kanban.appendChild(col);
  });
}

function matchesFilter(a, filter) {
  if (!filter) return true;
  return (
    (a.company || "").toLowerCase().includes(filter) ||
    (a.role || "").toLowerCase().includes(filter) ||
    (a.location || "").toLowerCase().includes(filter)
  );
}

function renderCard(a) {
  const div = document.createElement("div");
  div.className = "card";
  const comp = a.compMin || a.compMax ? `$${a.compMin || "?"}k–$${a.compMax || "?"}k` : "";
  div.innerHTML = `
    <div class="company">${escapeHtml(a.company || "(no company)")}</div>
    <div class="role">${escapeHtml(a.role || "")}</div>
    <div class="meta">${escapeHtml(a.location || "")}${comp ? " · " + comp : ""}</div>
    <div class="meta">${escapeHtml(a.source || "")}${a.dateApplied ? " · " + a.dateApplied : ""}</div>
  `;
  div.addEventListener("click", () => openApplicationModal(a));
  return div;
}

// ---------------- Job Listings ----------------
function populateListingFilters() {
  const roleSel = document.getElementById("lf-role");
  (META.roleCategories || []).forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    roleSel.appendChild(opt);
  });

  const countrySel = document.getElementById("lf-country");
  const countries = Array.from(new Set(LISTINGS.map((l) => l.location && l.location.country).filter(Boolean))).sort();
  countries.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    countrySel.appendChild(opt);
  });
}

function salaryHighCad(listing) {
  if (listing.salaryMax == null) return null;
  const isCanada = listing.location && listing.location.country === "Canada";
  const currency = listing.salaryCurrency || (isCanada ? "CAD" : "USD");
  return currency === "USD" ? Math.round(listing.salaryMax * 1.38) : listing.salaryMax;
}

function renderListings() {
  const search = document.getElementById("lf-search").value.toLowerCase();
  const role = document.getElementById("lf-role").value;
  const country = document.getElementById("lf-country").value;
  const minSalary = parseFloat(document.getElementById("lf-minsalary").value) || 0;
  const sort = document.getElementById("lf-sort").value;

  let rows = LISTINGS.filter((l) => {
    if (search && !((l.title || "").toLowerCase().includes(search) || (l.company || "").toLowerCase().includes(search))) return false;
    if (role && l.roleCategory !== role) return false;
    if (country && (!l.location || l.location.country !== country)) return false;
    if (minSalary) {
      const high = salaryHighCad(l);
      // Keep listings with no parsed salary visible only when no minimum is requested,
      // otherwise a job we couldn't parse would wrongly look excluded vs included.
      if (high == null) return false;
      if (high < minSalary) return false;
    }
    return true;
  });

  rows.sort((a, b) => {
    if (sort === "date-desc") return new Date(b.datePosted) - new Date(a.datePosted);
    if (sort === "date-asc") return new Date(a.datePosted) - new Date(b.datePosted);
    if (sort === "salary-desc") return (salaryHighCad(b) || 0) - (salaryHighCad(a) || 0);
    if (sort === "salary-asc") return (salaryHighCad(a) || 0) - (salaryHighCad(b) || 0);
    if (sort === "company-asc") return (a.company || "").localeCompare(b.company || "");
    return 0;
  });

  const body = document.getElementById("listings-body");
  const empty = document.getElementById("listings-empty");
  body.innerHTML = "";

  if (!rows.length) {
    empty.classList.remove("hidden");
    empty.textContent = LISTINGS.length
      ? "No listings match these filters."
      : "No listings yet. Click \"Refresh Now\" to pull the latest postings, or wait for the daily auto-refresh.";
  } else {
    empty.classList.add("hidden");
  }

  rows.forEach((l) => {
    const tr = document.createElement("tr");
    tr.className = "border-t hover:bg-slate-50";
    const salaryText = l.salaryMin || l.salaryMax
      ? `$${(l.salaryMin || 0).toLocaleString()}–$${(l.salaryMax || 0).toLocaleString()} ${l.salaryCurrency || ""}`
      : "—";
    const loc = l.location ? [l.location.city, l.location.country].filter(Boolean).join(", ") : "";
    const daysAgo = Math.round((Date.now() - new Date(l.datePosted).getTime()) / (24 * 60 * 60 * 1000));
    tr.innerHTML = `
      <td class="px-4 py-2 font-medium"><a href="${escapeAttr(l.url)}" target="_blank" rel="noopener" class="hover:underline">${escapeHtml(l.title)}</a></td>
      <td class="px-4 py-2">${escapeHtml(l.company)}</td>
      <td class="px-4 py-2">${escapeHtml(loc)}</td>
      <td class="px-4 py-2 text-slate-500">${daysAgo === 0 ? "today" : daysAgo + "d ago"}</td>
      <td class="px-4 py-2">${escapeHtml(salaryText)}</td>
      <td class="px-4 py-2"><span class="text-xs bg-slate-100 rounded px-2 py-0.5">${escapeHtml(l.roleCategory || "")}</span></td>
      <td class="px-4 py-2 text-slate-500 capitalize">${escapeHtml(l.source)}</td>
      <td class="px-4 py-2 text-right"><button class="add-to-app text-indigo-600 text-xs font-medium">+ Add to Applications</button></td>
    `;
    tr.querySelector(".add-to-app").addEventListener("click", () => openApplicationModal(null, l));
    body.appendChild(tr);
  });
}

function onRefreshClick() {
  api("/api/job-listings/refresh", { method: "POST" }).then((res) => {
    setListingsSubtext(res.message || "Refresh started.");
    pollRefreshStatus();
  });
}

function pollRefreshStatusOnce() {
  if (LISTINGS_META.running) pollRefreshStatus();
  else setListingsSubtextFromMeta();
}

function pollRefreshStatus() {
  if (refreshPollTimer) clearInterval(refreshPollTimer);
  refreshPollTimer = setInterval(async () => {
    const meta = await api("/api/job-listings/refresh-status");
    LISTINGS_META = meta;
    if (!meta.running) {
      clearInterval(refreshPollTimer);
      refreshPollTimer = null;
      await refreshListings();
      populateListingFilters();
      renderListings();
      setListingsSubtextFromMeta();
    } else {
      setListingsSubtext("Refreshing job listings across " + (META.companyCount || "") + " companies...");
    }
  }, 3000);
}

function setListingsSubtext(text) {
  document.getElementById("listings-subtext").textContent = text;
}
function setListingsSubtextFromMeta() {
  const stats = LISTINGS_META.lastRunStats;
  if (!stats) {
    setListingsSubtext("Pulled directly from company career pages · last 2 weeks · $200,000+ CAD target. No refresh has run yet.");
    return;
  }
  const when = LISTINGS_META.lastRunAt ? new Date(LISTINGS_META.lastRunAt).toLocaleString() : "";
  setListingsSubtext(
    `Last refreshed ${when} · ${stats.listingsFound} matching listings from ${stats.companiesOk}/${stats.companies} companies`
  );
}

// ---------------- Application Modal ----------------
// prefillListing: when set, this is a brand-new application seeded from a
// Job Listings row (company/role/location/comp/link filled in for you).
function openApplicationModal(existing, prefillListing) {
  const root = document.getElementById("modal-root");
  const isEdit = !!existing;
  let a;
  if (isEdit) {
    a = existing;
  } else if (prefillListing) {
    a = {
      company: prefillListing.company || "",
      role: mapRoleCategoryToRole(prefillListing.roleCategory),
      status: "Researching",
      source: "Job Board",
      recruiterId: "",
      location: prefillListing.location ? prefillListing.location.raw : "",
      compMin: prefillListing.salaryMin ? Math.round(prefillListing.salaryMin / 1000) : "",
      compMax: prefillListing.salaryMax ? Math.round(prefillListing.salaryMax / 1000) : "",
      dateApplied: new Date().toISOString().slice(0, 10),
      notes: "Added from Job Listings",
      resumeVersion: "",
      coverLetter: "",
      jobLink: prefillListing.url || "",
      sourceListingId: prefillListing.id || null
    };
  } else {
    a = {
      company: "", role: META.roles[0], status: META.statuses[0], source: META.sources[0],
      recruiterId: "", location: "", compMin: "", compMax: "", dateApplied: new Date().toISOString().slice(0, 10),
      notes: "", resumeVersion: "", coverLetter: "", jobLink: "", sourceListingId: null
    };
  }

  const recruiterOptions = ['<option value="">— none —</option>']
    .concat(RECRUITERS.map((r) => `<option value="${r.id}" ${r.id === a.recruiterId ? "selected" : ""}>${escapeHtml(r.name)} (${escapeHtml(r.firm || "")})</option>`))
    .join("");

  root.innerHTML = `
    <div class="modal-backdrop" id="backdrop">
      <div class="modal-box">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-base">${isEdit ? "Edit Application" : "Add Application"}</h3>
          <button id="close-modal" class="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        ${prefillListing ? '<div class="text-xs bg-indigo-50 text-indigo-700 rounded px-3 py-2 mb-3">Prefilled from Job Listings — review and save.</div>' : ""}
        <div class="field"><label>Company</label><input id="f-company" value="${escapeAttr(a.company)}" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div class="field"><label>Role</label>
            <select id="f-role">${META.roles.map((r) => `<option ${r === a.role ? "selected" : ""}>${r}</option>`).join("")}</select>
          </div>
          <div class="field"><label>Status</label>
            <select id="f-status">${META.statuses.map((s) => `<option ${s === a.status ? "selected" : ""}>${s}</option>`).join("")}</select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="field"><label>Source</label>
            <select id="f-source">${META.sources.map((s) => `<option ${s === a.source ? "selected" : ""}>${s}</option>`).join("")}</select>
          </div>
          <div class="field"><label>Recruiter / Firm contact</label>
            <select id="f-recruiter">${recruiterOptions}</select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="field"><label>Location</label><input id="f-location" value="${escapeAttr(a.location)}" placeholder="e.g. Toronto, ON / Remote" /></div>
          <div class="field"><label>Date applied</label><input id="f-date" type="date" value="${escapeAttr(a.dateApplied)}" /></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="field"><label>Comp min ($k)</label><input id="f-compmin" value="${escapeAttr(a.compMin)}" /></div>
          <div class="field"><label>Comp max ($k)</label><input id="f-compmax" value="${escapeAttr(a.compMax)}" /></div>
        </div>
        <div class="field"><label>Job link</label><input id="f-link" value="${escapeAttr(a.jobLink)}" /></div>
        <div class="field"><label>Resume version used</label><input id="f-resume" value="${escapeAttr(a.resumeVersion)}" placeholder="e.g. Resume_CTO_v3.docx" /></div>
        <div class="field"><label>Notes</label><textarea id="f-notes" rows="3">${escapeHtml(a.notes)}</textarea></div>
        <div class="flex items-center justify-between mt-2">
          <div>
            ${isEdit ? '<button id="delete-app" class="text-red-600 text-sm font-medium">Delete</button>' : ""}
          </div>
          <div class="flex gap-2">
            <button id="cancel-modal" class="px-4 py-2 text-sm rounded-md border">Cancel</button>
            <button id="save-modal" class="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white font-medium">Save</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("close-modal").onclick = closeModal;
  document.getElementById("cancel-modal").onclick = closeModal;
  document.getElementById("backdrop").addEventListener("click", (e) => {
    if (e.target.id === "backdrop") closeModal();
  });

  if (isEdit) {
    document.getElementById("delete-app").onclick = async () => {
      if (confirm("Delete this application?")) {
        await api(`/api/applications/${a.id}`, { method: "DELETE" });
        await refreshApplications();
        renderKanban();
        closeModal();
      }
    };
  }

  document.getElementById("save-modal").onclick = async () => {
    const payload = {
      company: document.getElementById("f-company").value,
      role: document.getElementById("f-role").value,
      status: document.getElementById("f-status").value,
      source: document.getElementById("f-source").value,
      recruiterId: document.getElementById("f-recruiter").value || null,
      location: document.getElementById("f-location").value,
      dateApplied: document.getElementById("f-date").value,
      compMin: document.getElementById("f-compmin").value,
      compMax: document.getElementById("f-compmax").value,
      jobLink: document.getElementById("f-link").value,
      resumeVersion: document.getElementById("f-resume").value,
      notes: document.getElementById("f-notes").value,
      sourceListingId: a.sourceListingId || null
    };
    if (isEdit) {
      await api(`/api/applications/${a.id}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      await api("/api/applications", { method: "POST", body: JSON.stringify(payload) });
    }
    await refreshApplications();
    renderKanban();
    closeModal();
    if (prefillListing) switchTab("applications");
  };
}

function mapRoleCategoryToRole(cat) {
  if (!cat) return META.roles[0];
  if (META.roles.includes(cat)) return cat;
  return "Other";
}

// ---------------- Recruiters ----------------
function renderRecruiters() {
  const body = document.getElementById("recruiters-body");
  body.innerHTML = "";
  RECRUITERS.forEach((r) => {
    const linked = APPLICATIONS.filter((a) => a.recruiterId === r.id);
    const tr = document.createElement("tr");
    tr.className = "border-t hover:bg-slate-50 cursor-pointer";
    tr.innerHTML = `
      <td class="px-4 py-2 font-medium">${escapeHtml(r.name)}</td>
      <td class="px-4 py-2">${escapeHtml(r.firm)}</td>
      <td class="px-4 py-2">${escapeHtml(r.email)}</td>
      <td class="px-4 py-2">${escapeHtml(r.phone)}</td>
      <td class="px-4 py-2">${linked.map((a) => escapeHtml(a.company)).join(", ") || "—"}</td>
      <td class="px-4 py-2 text-slate-500 max-w-[220px] truncate">${escapeHtml(r.notes)}</td>
      <td class="px-4 py-2 text-right"><button class="text-indigo-600 text-xs font-medium">Edit</button></td>
    `;
    tr.addEventListener("click", () => openRecruiterModal(r));
    body.appendChild(tr);
  });
}

function openRecruiterModal(existing) {
  const root = document.getElementById("modal-root");
  const isEdit = !!existing;
  const r = existing || { name: "", firm: "", email: "", phone: "", notes: "" };
  root.innerHTML = `
    <div class="modal-backdrop" id="backdrop">
      <div class="modal-box">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-base">${isEdit ? "Edit Recruiter" : "Add Recruiter"}</h3>
          <button id="close-modal" class="text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <div class="field"><label>Name</label><input id="r-name" value="${escapeAttr(r.name)}" /></div>
        <div class="field"><label>Firm</label><input id="r-firm" value="${escapeAttr(r.firm)}" placeholder="e.g. Heidrick & Struggles" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div class="field"><label>Email</label><input id="r-email" value="${escapeAttr(r.email)}" /></div>
          <div class="field"><label>Phone</label><input id="r-phone" value="${escapeAttr(r.phone)}" /></div>
        </div>
        <div class="field"><label>Relationship notes</label><textarea id="r-notes" rows="3">${escapeHtml(r.notes)}</textarea></div>
        <div class="flex items-center justify-between mt-2">
          <div>${isEdit ? '<button id="delete-r" class="text-red-600 text-sm font-medium">Delete</button>' : ""}</div>
          <div class="flex gap-2">
            <button id="cancel-modal" class="px-4 py-2 text-sm rounded-md border">Cancel</button>
            <button id="save-modal" class="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white font-medium">Save</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById("close-modal").onclick = closeModal;
  document.getElementById("cancel-modal").onclick = closeModal;
  document.getElementById("backdrop").addEventListener("click", (e) => {
    if (e.target.id === "backdrop") closeModal();
  });
  if (isEdit) {
    document.getElementById("delete-r").onclick = async () => {
      if (confirm("Delete this recruiter?")) {
        await api(`/api/recruiters/${r.id}`, { method: "DELETE" });
        await refreshRecruiters();
        renderRecruiters();
        closeModal();
      }
    };
  }
  document.getElementById("save-modal").onclick = async () => {
    const payload = {
      name: document.getElementById("r-name").value,
      firm: document.getElementById("r-firm").value,
      email: document.getElementById("r-email").value,
      phone: document.getElementById("r-phone").value,
      notes: document.getElementById("r-notes").value
    };
    if (isEdit) {
      await api(`/api/recruiters/${r.id}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      await api("/api/recruiters", { method: "POST", body: JSON.stringify(payload) });
    }
    await refreshRecruiters();
    await refreshApplications();
    renderRecruiters();
    renderKanban();
    closeModal();
  };
}

function closeModal() {
  document.getElementById("modal-root").innerHTML = "";
}

function escapeHtml(str) {
  return (str || "").toString()
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}

init();
