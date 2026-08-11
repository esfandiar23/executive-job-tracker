// Best-effort split of a free-text ATS location string into city/country.
// Examples seen in the wild: "Toronto, ON, Canada", "San Francisco, CA",
// "Remote - Canada", "Remote - US", "New York City", "London, UK"

const CA_PROVINCES = ["ON", "BC", "AB", "QC", "MB", "SK", "NS", "NB", "PE", "NL", "YT", "NT", "NU"];
const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME",
  "MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA",
  "RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"
];

function normalizeCountry(token) {
  const t = (token || "").trim();
  const upper = t.toUpperCase();
  if (upper === "US" || upper === "USA" || upper === "U.S." || upper === "U.S.A.") return "United States";
  if (upper === "UK" || upper === "U.K.") return "United Kingdom";
  if (upper === "CANADA") return "Canada";
  return t;
}

function parseLocation(raw) {
  const text = (raw || "").trim();
  if (!text) return { raw: text, city: "", country: "" };

  const remoteMatch = text.match(/^remote\s*-\s*(.+)$/i);
  if (remoteMatch) {
    return { raw: text, city: "Remote", country: normalizeCountry(remoteMatch[1]) };
  }
  if (/^remote$/i.test(text)) return { raw: text, city: "Remote", country: "" };

  if (/canada/i.test(text)) {
    const parts = text.split(",").map((p) => p.trim());
    return { raw: text, city: parts[0] || "", country: "Canada" };
  }
  if (/\bunited states\b|\busa\b/i.test(text)) {
    const parts = text.split(",").map((p) => p.trim());
    return { raw: text, city: parts[0] || "", country: "United States" };
  }

  const parts = text.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    const stateToken = parts[1].replace(/[^A-Za-z]/g, "").toUpperCase();
    if (CA_PROVINCES.includes(stateToken)) {
      return { raw: text, city: parts[0], country: "Canada" };
    }
    if (US_STATES.includes(stateToken)) {
      return { raw: text, city: parts[0], country: "United States" };
    }
    return { raw: text, city: parts[0], country: normalizeCountry(parts[parts.length - 1]) };
  }

  return { raw: text, city: text, country: "" };
}

module.exports = { parseLocation };
