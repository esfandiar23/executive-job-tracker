// Best-effort salary range extraction from free-text job descriptions.
// Job board APIs rarely expose salary as a structured field, so this
// regex-scans the description text for common "$X - $Y" patterns.
// Not perfect - flag results as approximate in the UI.

const USD_TO_CAD = 1.38;

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumber(numStr, hasK) {
  let n = parseFloat(numStr.replace(/,/g, ""));
  if (hasK && n < 10000) n *= 1000;
  return Math.round(n);
}

// Matches things like:
//   $150,000 - $220,000
//   $150,000-$220,000 CAD
//   $150K - $220K USD
//   C$150,000 - C$220,000
//   CAD $150,000 to $220,000
const RANGE_RE =
  /(CAD|USD)?\s*(C\$|US\$|\$)\s*(\d{2,3}(?:,\d{3})?)(k|K)?\s*(?:-|–|to)\s*(CAD|USD)?\s*(?:C\$|US\$|\$)?\s*(\d{2,3}(?:,\d{3})?)(k|K)?\s*(CAD|USD)?/;

function parseSalary(rawText) {
  const text = stripHtml(rawText);
  const match = text.match(RANGE_RE);
  if (!match) return { salaryMin: null, salaryMax: null, salaryCurrency: null, salaryRaw: null };

  const [full, prefixWord, prefixSymbol, minStr, minK, midWord, maxStr, maxK, suffixWord] = match;
  const min = parseNumber(minStr, !!minK);
  const max = parseNumber(maxStr, !!maxK);

  let currency = null;
  const wordToken = (prefixWord || midWord || suffixWord || "").toUpperCase();
  if (wordToken === "CAD") currency = "CAD";
  else if (wordToken === "USD") currency = "USD";
  else if (prefixSymbol === "C$") currency = "CAD";
  else if (prefixSymbol === "US$") currency = "USD";

  const idx = text.indexOf(full);
  const raw = text.slice(Math.max(0, idx - 20), idx + full.length + 20).trim();

  return { salaryMin: min, salaryMax: max, salaryCurrency: currency, salaryRaw: raw };
}

function toCadHigh(salary, isCanadaLocation) {
  if (salary.salaryMax == null) return null;
  const currency = salary.salaryCurrency || (isCanadaLocation ? "CAD" : "USD");
  return currency === "USD" ? Math.round(salary.salaryMax * USD_TO_CAD) : salary.salaryMax;
}

module.exports = { parseSalary, stripHtml, toCadHigh, USD_TO_CAD };
