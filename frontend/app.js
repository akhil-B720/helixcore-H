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

const tabsEl = document.getElementById("tabs");
const contentEl = document.getElementById("content");
const bgCanvas = document.getElementById("bg-canvas");

/* ================= UI ================= */

function renderTabs() {
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
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) throw new Error(data.error || "API error");
  return data;
}

/* ================= CHATBOT ================= */

function initChatbot() {
  const send = document.getElementById("chat-send");
  const input = document.getElementById("chat-input");
  const messages = document.getElementById("chat-messages");

  const addMessage = (text, cls) => {
    const div = document.createElement("div");
    div.className = `bubble ${cls}`;
    div.innerHTML = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  };

  send.onclick = async () => {
    const message = input.value.trim();
    if (!message) return;

    input.value = "";
    addMessage(message, "me");

    const loading = document.createElement("div");
    loading.className = "bubble bot";
    loading.innerHTML = "💭 Thinking...";
    messages.appendChild(loading);

    try {
      const res = await api("/chat", {
        method: "POST",
        body: JSON.stringify({ message })
      });

      const d = res.data || res.response || res;

      const html = `
      <div class="ai-card">
        <h4>🧠 Concept</h4><p>${d.concept || ""}</p>
        <h4>📘 Explanation</h4><p>${d.explanation || ""}</p>
        <h4>🔬 Visualization</h4><p>${d.visualization || ""}</p>
        <h4>🧪 Example</h4><p>${d.example || ""}</p>
        <h4>🌍 Application</h4><p>${d.application || ""}</p>
      </div>
      `;

      typeText(loading, html);

    } catch (err) {
      loading.textContent = err.message;
    }
  };

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") send.onclick();
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
  if (activeTab === "Home") {
    renderHome();
  } else {
    setContent(`<div class="card"><h3>${activeTab}</h3></div>`);
  }
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

renderTabs();
renderTabContent();
initChatbot();