console.log("JS LOADED");

const API_BASE = "/api";

const TABS = [
  "Home",
  "Molecules",
  "Organic Chemistry",
  "Physical Chemistry",
  "Inorganic Chemistry",
  "Materials Science",
  "Simulations",
  "Practice",
];

const TOPICS = {
  "Organic Chemistry": ["Isomerism", "Chirality", "R/S Configuration", "Organic Reactions", "Polymerization"],
  "Physical Chemistry": ["Thermodynamics", "Free Energy", "Electrochemistry", "Nernst Equation"],
  "Inorganic Chemistry": ["Periodic Properties", "Chemical Bonding", "HSAB Principle", "Crystal Field Theory (CFT)", "Ligands"],
  "Materials Science": ["Mechanical Properties", "Stress-Strain", "Elasticity", "XRD", "Miller Indices", "XPS"],
};

let activeTab = "Home";
let activeTopic = "Electrochemistry";
let moleculeRenderer;
let simulationFrame;

/* ================= UI ================= */

function initHeroMoleculesOnce() {
  if (window.__heroMolInit) return;
  window.__heroMolInit = true;
  setTimeout(initHeroMolecules, 100);
}

function initSectionNavigation() {
  const navTabs = document.querySelectorAll(".nav-tab[data-section]");
  const sections = document.querySelectorAll("#content .section");
  if (!navTabs.length || !sections.length) return false;

  function showSection(sectionId) {
    sections.forEach((section) => {
      section.style.display = section.id === sectionId ? "block" : "none";
    });
    navTabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.section === sectionId);
    });
    if (sectionId === "hero") {
      initHeroMoleculesOnce();
    }
  }

  navTabs.forEach((tab) => {
    tab.addEventListener("click", () => showSection(tab.dataset.section));
  });

  const initial = document.querySelector(".nav-tab.active[data-section]")?.dataset.section
    || navTabs[0].dataset.section;
  showSection(initial);
  window.showSection = showSection;
  return true;
}

function renderTabs() {
  const tabsEl = document.getElementById("tabs");
  if (!tabsEl) return;
  tabsEl.innerHTML = "";
  TABS.forEach((tab) => {
    const btn = document.createElement("button");
    btn.className = `tab-btn ${activeTab === tab ? "active" : ""}`;
    btn.innerHTML = tab.split("").map(l => `<span class="ziggle">${l}</span>`).join("");
    btn.onclick = () => {
      activeTab = tab;
      renderTabs();
      renderTabContent();
    };
    tabsEl.appendChild(btn);
  });
}

function setContent(html) {
  const contentEl = document.getElementById("content");
  if (!contentEl) return;
  contentEl.innerHTML = html;
}

/* ================= HOME (NEW) ================= */

function renderHome() {
  setContent(`
    <section class="hero glass">
      <div>
        <h1>HelixCore H</h1>
        <p>AI Chemistry Intelligence Platform</p>
      </div>
      <canvas id="hero-canvas"></canvas>
    </section>
  `);

  setTimeout(initHeroMolecules, 100);
}

function initHeroMolecules() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = 300;

  const particles = Array.from({ length: 40 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 1.2,
    vy: (Math.random() - 0.5) * 1.2,
    r: 2 + Math.random() * 3,
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "#ca3cff";
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  draw();
}

/* ================= API ================= */

async function api(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "API error");
    return data;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

/* ================= CHATBOT ================= */

async function sendChat() {
  const input = document.getElementById("chat-input");
  const messages = document.getElementById("chat-messages");
  if (!input || !messages) return;

  const userMessage = input.value.trim();
  if (!userMessage) return;

  input.value = "";

  const userBubble = document.createElement("div");
  userBubble.className = "bubble me";
  userBubble.textContent = userMessage;
  messages.appendChild(userBubble);

  const loading = document.createElement("div");
  loading.className = "bubble bot";
  loading.textContent = "Thinking...";
  messages.appendChild(loading);
  messages.scrollTop = messages.scrollHeight;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to get chat response");

    const d = data.data || data.response || data;
    const html = `
      <div class="ai-card">
        <h4>Concept</h4><p>${d.concept || ""}</p>
        <h4>Explanation</h4><p>${d.explanation || ""}</p>
        <h4>Visualization</h4><p>${d.visualization || ""}</p>
        <h4>Example</h4><p>${d.example || ""}</p>
        <h4>Application</h4><p>${d.application || ""}</p>
      </div>
    `;
    typeText(loading, html);
  } catch (e) {
    console.error(e);
    loading.textContent = e.message || "Chat request failed";
  }
}

async function analyzeMolecule() {
  const inputEl = document.getElementById("molecule-input") || document.getElementById("molecule-name");
  const resultEl = document.getElementById("molecule-result") || document.getElementById("molecule-output");
  if (!inputEl || !resultEl) return;

  const input = inputEl.value.trim();
  if (!input) return;

  resultEl.innerHTML = "<p>Analyzing molecule...</p>";

  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input,
        smiles: input
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to analyze molecule");

    const d = data.data || data.result || data;
    const formula = d.molecular_formula || d.formula || "N/A";
    const weight = d.molecular_weight ?? d.weight ?? "N/A";
    const smiles = d.smiles || input;
    const props = { ...(d.properties || {}) };
    if (Array.isArray(d.functional_groups) && d.functional_groups.length) {
      props["Functional groups"] = d.functional_groups.join(", ");
    }
    if (Array.isArray(d.chirality_centers) && d.chirality_centers.length) {
      props["Chirality centers"] = String(d.chirality_centers.length);
    }
    if (d.stereochemistry_info) {
      props["Stereochemistry"] = d.stereochemistry_info;
    }
    const propItems = Object.entries(props)
      .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
      .join("");

    resultEl.innerHTML = `
      <div class="card">
        <h3>${d.name || input}</h3>
        <p><strong>Formula:</strong> ${formula}</p>
        <p><strong>Weight:</strong> ${weight}</p>
        <p><strong>SMILES:</strong> ${smiles}</p>
        <ul>${propItems || "<li>No properties available</li>"}</ul>
      </div>
    `;
  } catch (e) {
    console.error(e);
    resultEl.innerHTML = `<p>${e.message || "Molecule analysis failed"}</p>`;
  }
}

window.sendChat = sendChat;
window.analyzeMolecule = analyzeMolecule;

function initChatFAB() {
  const fab = document.getElementById("chat-fab");
  const panel = document.getElementById("chat-panel");
  const close = document.getElementById("chat-close");
  if (!fab || !panel) return;
  fab.addEventListener("click", () => panel.classList.toggle("hidden"));
  if (close) {
    close.addEventListener("click", () => panel.classList.add("hidden"));
  }
}

async function explainTopic() {
  const topicInput = document.getElementById("topic-input");
  const resultEl = document.getElementById("topic-result");
  if (!topicInput || !resultEl) return;

  const topic = topicInput.value.trim();
  if (!topic) return;

  resultEl.innerHTML = "<p>Loading explanation...</p>";

  try {
    const res = await fetch("/api/topic/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "Topic request failed");

    resultEl.innerHTML = `
      <div class="ai-card card">
        <h4>Concept</h4><p>${data.concept || ""}</p>
        <h4>Explanation</h4><p>${data.explanation || ""}</p>
        <h4>Visualization</h4><p>${data.visualization || ""}</p>
        <h4>Example</h4><p>${data.example || ""}</p>
        <h4>Application</h4><p>${data.application || ""}</p>
      </div>
    `;
  } catch (e) {
    console.error(e);
    resultEl.innerHTML = `<p>${e.message || "Topic explain failed"}</p>`;
  }
}

window.explainTopic = explainTopic;

function initTopicExplain() {
  const btn = document.getElementById("topic-explain-btn");
  const input = document.getElementById("topic-input");
  if (!btn || !input) return;
  btn.addEventListener("click", explainTopic);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") explainTopic();
  });
}

function runElectrochem() {
  const el = document.getElementById("electro-output") || document.getElementById("sim-output");
  if (el) el.innerHTML = "<p><em>Simulation UI placeholder — visuals unchanged.</em></p>";
}

function runPolymer() {
  const el = document.getElementById("sim-output");
  if (el) el.innerHTML = "<p><em>Polymer chain placeholder — visuals unchanged.</em></p>";
}

window.runElectrochem = runElectrochem;
window.runPolymer = runPolymer;

function initChatbot() {
  const send = document.getElementById("chat-send");
  const input = document.getElementById("chat-input");
  if (!send || !input) return;

  send.onclick = sendChat;

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendChat();
  });
}

/* ================= TYPE EFFECT ================= */

function typeText(element, html) {
  element.innerHTML = "";
  let i = 0;

  function type() {
    if (i < html.length) {
      element.innerHTML += html.charAt(i);
      i++;
      setTimeout(type, 5);
    }
  }

  type();
}

/* ================= TAB CONTENT ================= */

function renderTabContent() {
  const contentRoot = document.getElementById("content");
  if (contentRoot?.querySelector(".section")) return;

  if (activeTab === "Home") {
    renderHome();
  } else if (activeTab === "Molecules") {
    setContent(`
      <section class="glass">
        <div class="container">
          <div class="section-title">MOLECULE ANALYZER</div>
          <h2>Analyze a compound</h2>
          <div class="card">
            <p class="kv">Enter a common name or SMILES string.</p>
            <input id="molecule-input" type="text" placeholder="Name or SMILES" />
            <button type="button" id="analyze-btn">Analyze</button>
            <div id="molecule-result" style="margin-top: 1rem;"></div>
          </div>
        </div>
      </section>
    `);
    initMoleculeAnalyzer();
  } else if (activeTab === "Simulations") {
    setContent(`
      <section class="glass">
        <div class="container">
          <div class="section-title">SIMULATIONS</div>
          <button type="button" onclick="runElectrochem()">Electrochemistry</button>
          <button type="button" onclick="runPolymer()">Polymer Chain</button>
          <div id="sim-output"></div>
        </div>
      </section>
    `);
  } else if (activeTab === "Practice") {
    setContent(`
      <section class="glass">
        <div class="container">
          <div class="section-title">PRACTICE</div>
          <h2>Topic deep-dive</h2>
          <div class="card">
            <input id="topic-input" type="text" placeholder="Topic" />
            <button type="button" id="topic-explain-btn">Explain topic</button>
            <div id="topic-result" style="margin-top: 1rem;"></div>
          </div>
        </div>
      </section>
    `);
    initTopicExplain();
  } else {
    const topicSeed = TOPICS[activeTab]?.[0];
    let extra = "";
    if (topicSeed) {
      extra = `
        <div class="card">
          <h3>Explain with AI</h3>
          <p><button type="button" id="explain-seed-topic" data-topic="${topicSeed}">Explain: ${topicSeed}</button></p>
          <div id="subject-topic-result"></div>
        </div>
      `;
    }
    setContent(`
      <div class="card"><h3>${activeTab}</h3></div>
      ${extra}
    `);
    const seedBtn = document.getElementById("explain-seed-topic");
    if (seedBtn) {
      seedBtn.addEventListener("click", async () => {
        const t = seedBtn.getAttribute("data-topic");
        const out = document.getElementById("subject-topic-result");
        if (!out || !t) return;
        out.innerHTML = "<p>Loading...</p>";
        try {
          const res = await fetch("/api/topic/explain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic: t })
          });
          const data = await res.json();
          if (!res.ok || !data.ok) throw new Error(data.error || "Failed");
          out.innerHTML = `<div class="ai-card"><p>${data.explanation || ""}</p></div>`;
        } catch (e) {
          console.error(e);
          out.innerHTML = `<p>${e.message}</p>`;
        }
      });
    }
  }
}

function initMoleculeAnalyzer() {
  const analyzeBtn = document.getElementById("analyze-btn") || document.getElementById("molecule-analyze");
  if (!analyzeBtn) return;
  analyzeBtn.addEventListener("click", analyzeMolecule);
}
/* ================= PARALLAX (SMOOTH) ================= */

(function initParallax() {
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  window.addEventListener("mousemove", (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 6;
    targetY = (e.clientY / window.innerHeight - 0.5) * 6;
  });

  function animate() {
    // smooth interpolation (lerp)
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    document.body.style.transform = `
      perspective(1000px)
      rotateX(${-currentY}deg)
      rotateY(${currentX}deg)
    `;

    requestAnimationFrame(animate);
  }

  animate();
})();

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
  console.log("APP STARTED");

  try {
    const contentEl = document.getElementById("content");
    const hasSectionUI = !!(contentEl && contentEl.querySelector(".section"));

    if (hasSectionUI) {
      initSectionNavigation?.();
      initChatFAB?.();
      initMoleculeAnalyzer?.();
      initTopicExplain?.();
      initChatbot?.();
    } else {
      renderTabs?.();
      renderTabContent?.();
      initChatFAB?.();
      initMoleculeAnalyzer?.();
      initTopicExplain?.();
      initChatbot?.();
    }
  } catch (e) {
    console.error("INIT ERROR:", e);
  }
});