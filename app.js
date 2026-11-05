// CarePath: client-side, nonmedical navigation information only.
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];

const guideContent = {
  "Finding a clinic or service": {
    questions: [
      "What services does your organization provide, and which services are currently available?",
      "Which communities or geographic areas do you serve?",
      "Are there requirements I should know about before contacting you?",
      "What is the best way to ask about becoming a new patient or client?"
    ],
    steps: [
      "Identify the general type of service or support you are looking for.",
      "Check the organization's official website for its current service area and contact process.",
      "Contact the organization directly to confirm availability and any requirements."
    ],
    tags: ["clinic", "community-health", "primary-care", "service-navigation"]
  },
  "Understanding costs": {
    questions: [
      "Can you explain the expected costs before an appointment or service?",
      "Do you offer a sliding-scale fee, reduced-cost option, or financial assistance?",
      "Are there separate fees I should ask about?",
      "Who can I contact with questions about billing or payment options?"
    ],
    steps: [
      "Ask for a clear explanation of possible costs before scheduling.",
      "Ask whether financial assistance or reduced-cost options are available and how to learn about them.",
      "Confirm details directly with the organization; do not assume that a program applies to you."
    ],
    tags: ["affordability", "financial-assistance", "billing"]
  },
  "Language support": {
    questions: [
      "Can I request a qualified interpreter for a conversation or appointment?",
      "Which languages can your team support, and in what situations?",
      "Can important information or forms be provided in another language?",
      "How should I request language assistance when scheduling?"
    ],
    steps: [
      "Ask the organization what language assistance it can provide.",
      "Ask how and when to request an interpreter or translated materials.",
      "Confirm whether the support is available for the specific service and appointment."
    ],
    tags: ["language-assistance", "interpreter", "translation"]
  },
  "Referrals and scheduling": {
    questions: [
      "Is a referral required for this service?",
      "If a referral is needed, who sends it and how can I confirm it was received?",
      "What information should I have ready when scheduling?",
      "Who should I contact if I need to change an appointment?"
    ],
    steps: [
      "Ask the organization whether a referral is needed before scheduling.",
      "If one is needed, ask who is responsible for sending it and how to check its status.",
      "Confirm scheduling steps, expected wait times, and the best contact method directly."
    ],
    tags: ["referrals", "scheduling", "appointments"]
  }
};

function verifiedResources() {
  return Array.isArray(window.CAREPATH_RESOURCES)
    ? window.CAREPATH_RESOURCES.filter(item => item && item.verificationStatus === "verified" && item.name && item.officialUrl)
    : [];
}

function renderGuideResources(topic) {
  const target = $("#guide-resources");
  if (!target) return;
  const tags = guideContent[topic]?.tags || [];
  const matches = verifiedResources().filter(item => (item.tags || []).some(tag => tags.includes(tag)));
  target.replaceChildren();
  const heading = document.createElement("h4");
  heading.textContent = "Relevant verified resources";
  target.append(heading);
  if (!matches.length) {
    const p = document.createElement("p");
    p.textContent = "No matching verified resources are listed yet. You can use the questions above when contacting an organization you already know.";
    target.append(p);
    return;
  }
  matches.forEach(item => {
    const card = document.createElement("article");
    card.className = "guide-resource-card";
    const name = document.createElement("h5");
    name.textContent = item.name;
    const description = document.createElement("p");
    description.textContent = item.description || "See the organization's official information for details.";
    const link = document.createElement("a");
    link.href = item.officialUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Visit official website ↗";
    card.append(name, description, link);
    target.append(card);
  });
}

const menu = $(".menu"), nav = $("#navlinks");
if (menu && nav) {
  const closeMenu = () => {
    nav.classList.remove("open");
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", "Open menu");
    menu.textContent = "☰";
  };
  menu.addEventListener("click", () => {
    const opening = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(opening));
    menu.setAttribute("aria-label", opening ? "Close menu" : "Open menu");
    menu.textContent = opening ? "×" : "☰";
    nav.classList.toggle("open", opening);
  });
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeMenu(); });
}

const step1 = $("#step1"), step2 = $("#step2");
const stepCount = $("#stepcount"), progress = $("#progress");
const topicTitle = $("#topic-title"), questions = $("#questions");
$$("[data-topic]").forEach(button => button.addEventListener("click", () => {
  const topic = button.dataset.topic;
  const content = guideContent[topic];
  if (!content) return;
  topicTitle.textContent = topic;
  questions.replaceChildren(...content.questions.map(question => {
    const li = document.createElement("li"); li.textContent = question; return li;
  }));
  const steps = $("#next-steps");
  steps.replaceChildren();
  const heading = document.createElement("h4"); heading.textContent = "Suggested next steps";
  const list = document.createElement("ol");
  content.steps.forEach(step => { const li = document.createElement("li"); li.textContent = step; list.append(li); });
  steps.append(heading, list);
  renderGuideResources(topic);
  step1.hidden = true; step2.hidden = false;
  stepCount.textContent = "STEP 2 OF 2"; progress.style.width = "100%";
  $("#back").focus();
}));
$("#back")?.addEventListener("click", () => {
  step2.hidden = true; step1.hidden = false;
  stepCount.textContent = "STEP 1 OF 2"; progress.style.width = "50%";
  $("[data-topic]")?.focus();
});

// Directory: data is supplied by resources.js. Only verified entries are displayed.
const filters = {
  search: $("#resource-search"), location: $("#filter-location"),
  affordability: $("#filter-affordability"), language: $("#filter-language"),
  referrals: $("#filter-referrals"), transportation: $("#filter-transportation"),
  financial: $("#filter-financial")
};
function resourceMatches(item) {
  const text = [item.name, item.description, ...(item.tags || []), ...(item.serviceAreas || [])].join(" ").toLowerCase();
  const query = filters.search?.value.trim().toLowerCase() || "";
  const location = filters.location?.value.trim().toLowerCase() || "";
  if (query && !text.includes(query)) return false;
  if (location && !(item.serviceAreas || []).join(" ").toLowerCase().includes(location)) return false;
  if (filters.affordability?.value && !(item.affordability || []).includes(filters.affordability.value)) return false;
  if (filters.language?.value === "interpreter" && !item.interpreterAvailable) return false;
  if (filters.language?.value === "translated" && !item.translatedInformation) return false;
  if (filters.referrals?.value && (item.referralStatus || "unknown") !== filters.referrals.value) return false;
  if (filters.transportation?.checked && !item.transportationAssistance) return false;
  if (filters.financial?.checked && !item.financialAssistance) return false;
  return true;
}
function makeResourceCard(item) {
  const card = document.createElement("article"); card.className = "resource-card";
  const title = document.createElement("h3"); title.textContent = item.name;
  const desc = document.createElement("p"); desc.textContent = item.description || "Description not provided.";
  const meta = document.createElement("p"); meta.className = "resource-meta";
  meta.textContent = "Service area: " + ((item.serviceAreas || []).join(", ") || "Not specified");
  const verified = document.createElement("p"); verified.className = "verified-date";
  verified.textContent = "Verified: " + (item.lastVerified || "Date not provided");
  const link = document.createElement("a"); link.href = item.officialUrl;
  link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "Official website ↗";
  card.append(title, desc, meta, verified, link);
  return card;
}
function renderDirectory() {
  const target = $("#resource-results"), status = $("#directory-status"), count = $("#result-count");
  if (!target) return;
  const all = verifiedResources();
  const matches = all.filter(resourceMatches);
  status.textContent = all.length ? "● VERIFIED LISTINGS" : "● NO VERIFIED LISTINGS YET";
  count.textContent = all.length ? matches.length + " matching verified resource" + (matches.length === 1 ? "" : "s") : "No verified resources have been published yet.";
  target.replaceChildren();
  if (!all.length) {
    const empty = document.createElement("div"); empty.className = "empty";
    const icon = document.createElement("div"); icon.className = "empty-icon"; icon.textContent = "⌕";
    const heading = document.createElement("h3"); heading.textContent = "We’re verifying resources before listing them.";
    const p = document.createElement("p"); p.textContent = "No organizations have been verified and published yet. Filters are ready for use when verified listings are added.";
    const link = document.createElement("a"); link.href = "#contact"; link.textContent = "Help us identify useful resources ↗";
    empty.append(icon, heading, p, link); target.append(empty); return;
  }
  if (!matches.length) {
    const p = document.createElement("p"); p.className = "no-matches"; p.textContent = "No resources match these filters. Try changing or clearing your filters.";
    target.append(p); return;
  }
  const grid = document.createElement("div"); grid.className = "resource-grid";
  matches.forEach(item => grid.append(makeResourceCard(item)));
  target.append(grid);
}
Object.values(filters).forEach(control => {
  control?.addEventListener("input", renderDirectory);
  control?.addEventListener("change", renderDirectory);
});
$("#clear-filters")?.addEventListener("click", () => {
  Object.values(filters).forEach(control => {
    if (!control) return;
    if (control.type === "checkbox") control.checked = false; else control.value = "";
  });
  renderDirectory(); filters.search?.focus();
});

$("#demo-form")?.addEventListener("submit", event => {
  event.preventDefault();
  const status = $("#formstatus");
  status.textContent = $("#kind").value
    ? "Demo preview only: your message has not been sent or saved. No contact service is connected."
    : "Please choose a topic to preview.";
});
const year = $("#year"); if (year) year.textContent = new Date().getFullYear();
renderDirectory();
