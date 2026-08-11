// Seed registry of companies whose career pages we pull from directly.
// Only companies confirmed (via a live API check) to run a public,
// no-auth Greenhouse or Lever job board are included here.
//
// NOT included: LinkedIn / Indeed / Glassdoor listings (scraping these
// violates their Terms of Service) and companies on Workday / Taleo /
// SuccessFactors (most large banks, telecoms, and traditional Fortune 500
// employers) — those ATS platforms need a different integration and are
// planned as a later phase, alongside major Canadian recruiting firms.
//
// platform: "greenhouse" | "lever"
// slug: the company's board identifier on that platform

module.exports = [
  { name: "Stripe", platform: "greenhouse", slug: "stripe" },
  { name: "Airbnb", platform: "greenhouse", slug: "airbnb" },
  { name: "Robinhood", platform: "greenhouse", slug: "robinhood" },
  { name: "Instacart", platform: "greenhouse", slug: "instacart" },
  { name: "Pinterest", platform: "greenhouse", slug: "pinterest" },
  { name: "Reddit", platform: "greenhouse", slug: "reddit" },
  { name: "Affirm", platform: "greenhouse", slug: "affirm" },
  { name: "DoorDash", platform: "greenhouse", slug: "doordashusa" },
  { name: "Coinbase", platform: "greenhouse", slug: "coinbase" },
  { name: "Databricks", platform: "greenhouse", slug: "databricks" },
  { name: "Figma", platform: "greenhouse", slug: "figma" },
  { name: "Discord", platform: "greenhouse", slug: "discord" },
  { name: "PagerDuty", platform: "greenhouse", slug: "pagerduty" },
  { name: "Elastic", platform: "greenhouse", slug: "elastic" },
  { name: "MongoDB", platform: "greenhouse", slug: "mongodb" },
  { name: "Twilio", platform: "greenhouse", slug: "twilio" },
  { name: "Okta", platform: "greenhouse", slug: "okta" },
  { name: "Datadog", platform: "greenhouse", slug: "datadog" },
  { name: "Zscaler", platform: "greenhouse", slug: "zscaler" },
  { name: "JFrog", platform: "greenhouse", slug: "jfrog" },
  { name: "New Relic", platform: "greenhouse", slug: "newrelic" },
  { name: "Sumo Logic", platform: "greenhouse", slug: "sumologic" },
  { name: "Amplitude", platform: "greenhouse", slug: "amplitude" },
  { name: "Mixpanel", platform: "greenhouse", slug: "mixpanel" },
  { name: "Braze", platform: "greenhouse", slug: "braze" },
  { name: "Klaviyo", platform: "greenhouse", slug: "klaviyo" },
  { name: "Asana", platform: "greenhouse", slug: "asana" },
  { name: "GitLab", platform: "greenhouse", slug: "gitlab" },
  { name: "Cloudflare", platform: "greenhouse", slug: "cloudflare" },
  { name: "Roblox", platform: "greenhouse", slug: "roblox" },
  { name: "Duolingo", platform: "greenhouse", slug: "duolingo" },
  { name: "Anthropic", platform: "greenhouse", slug: "anthropic" },
  { name: "Waabi", platform: "lever", slug: "waabi" },
  { name: "Tenstorrent", platform: "greenhouse", slug: "tenstorrent" },
  { name: "Samsara", platform: "greenhouse", slug: "samsara" },
  { name: "Verkada", platform: "greenhouse", slug: "verkada" },
  { name: "Scale AI", platform: "greenhouse", slug: "scaleai" },
  { name: "Flexport", platform: "greenhouse", slug: "flexport" },
  { name: "Fireblocks", platform: "greenhouse", slug: "fireblocks" },
  { name: "Motive", platform: "greenhouse", slug: "gomotive" },
  { name: "Dropbox", platform: "greenhouse", slug: "dropbox" },
  { name: "Smartsheet", platform: "greenhouse", slug: "smartsheet" },
  { name: "Intercom", platform: "greenhouse", slug: "intercom" },
  { name: "Netskope", platform: "greenhouse", slug: "netskope" },
  { name: "Airtable", platform: "greenhouse", slug: "airtable" },
  { name: "Webflow", platform: "greenhouse", slug: "webflow" },
  { name: "Carta", platform: "greenhouse", slug: "carta" },
  { name: "Toast", platform: "greenhouse", slug: "toast" },
  { name: "Block", platform: "greenhouse", slug: "block" },
  { name: "Brex", platform: "greenhouse", slug: "brex" },
  { name: "Chime", platform: "greenhouse", slug: "chime" },
  { name: "SoFi", platform: "greenhouse", slug: "sofi" },
  { name: "Gusto", platform: "greenhouse", slug: "gusto" },
  { name: "Addepar", platform: "greenhouse", slug: "addepar1" },
  { name: "Vercel", platform: "greenhouse", slug: "vercel" },
  { name: "Nubank", platform: "greenhouse", slug: "nubank" },
  { name: "Hootsuite", platform: "greenhouse", slug: "hootsuite" },
  { name: "Wave", platform: "lever", slug: "waveapps" },
  { name: "D2L", platform: "greenhouse", slug: "d2l" },
  { name: "Later", platform: "greenhouse", slug: "later" }
];
