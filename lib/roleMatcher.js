// Matches a job title against the target executive/leadership role categories.
// Returns a category label, or null if the title doesn't match any of them
// (jobs that don't match are dropped before they're ever saved).

const CATEGORIES = [
  { key: "CISO", label: "CISO", re: /chief information security officer|\bciso\b/i },
  { key: "CIO", label: "CIO", re: /chief information officer|\bcio\b/i },
  { key: "CTO", label: "CTO", re: /chief technology officer|\bcto\b/i },
  {
    key: "AI Director",
    label: "AI Director",
    re: /director[^.]{0,30}\b(ai|artificial intelligence|machine learning|\bml\b)\b|head of ai\b|\bvp[^.]{0,20}\bai\b/i
  },
  {
    key: "IT Director",
    label: "IT Director",
    re: /\bit director\b|director[^.]{0,20}\bit\b|director of information technology/i
  },
  { key: "Enterprise Architect", label: "Enterprise Architect", re: /enterprise architect/i },
  {
    key: "Infrastructure Architect",
    label: "Infrastructure Architect",
    re: /infrastructure architect/i
  },
  {
    key: "Cloud Architect",
    label: "Cloud Architect",
    re: /cloud (solutions |infrastructure |platform |security |enterprise )?architect/i
  },
  {
    key: "Other Leadership",
    label: "Other IT/Infra/Security Leadership",
    re: /\b(vp|vice president|head of|director)[^.]{0,25}\b(infrastructure|information security|security|information technology)\b/i
  }
];

function matchRoleCategory(title) {
  if (!title) return null;
  for (const cat of CATEGORIES) {
    if (cat.re.test(title)) return cat.key;
  }
  return null;
}

function allCategories() {
  return CATEGORIES.map((c) => c.key);
}

module.exports = { matchRoleCategory, allCategories };
