document.addEventListener("DOMContentLoaded", () => {
  console.log("UI READY");

  let currentMol = null;
  let mol3DScene = null;
  let mol3DRenderer = null;
  let mol3DCamera = null;
  let mol3DAnimId = null;
  let mol3DGroup = null;
  let molStyle = "stick";
  let currentQ = null;
  let quizPool = [];

  const QUESTIONS = [
    { q: "What is the molecular formula of water?", opts: ["H2O", "HO2", "H2O2", "H3O"], ans: 0, exp: "Water is H2O." },
    { q: "Hybridization of methane carbon is?", opts: ["sp", "sp2", "sp3", "sp3d"], ans: 2, exp: "Methane carbon is sp3." },
    { q: "Which has highest electronegativity?", opts: ["O", "N", "F", "Cl"], ans: 2, exp: "Fluorine is highest." },
  ];

  function showSection(id) {
    document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
    const section = document.getElementById(id);
    if (section) section.classList.add("active");
    document.querySelectorAll(".nav-tab").forEach((t) => t.classList.remove("active"));
    const tabMap = { hero: 0, molecule: 1, chat: 2, quiz: 3 };
    document.querySelectorAll(".nav-tab")[tabMap[id]]?.classList.add("active");
    if (id === "quiz" && !currentQ) newQuestion();
  }
  window.showSection = showSection;

  function triggerBurst(e) {
    for (let i = 0; i < 12; i++) {
      const p = document.createElement("div");
      p.style.cssText = "position:fixed;width:6px;height:6px;border-radius:50%;pointer-events:none;z-index:999;background:#c084fc";
      p.style.left = `${e.clientX}px`;
      p.style.top = `${e.clientY}px`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 450);
    }
  }
  window.triggerBurst = triggerBurst;

  function buildTitle() {
    const words = ["Chem", "Explorer", "H"];
    const ids = ["word1", "word2", "word3"];
    words.forEach((word, wi) => {
      const host = document.getElementById(ids[wi]);
      if (!host) return;
      [...word].forEach((ch) => {
        const span = document.createElement("span");
        span.className = "letter";
        span.textContent = ch;
        span.addEventListener("mouseenter", () => {
          span.classList.add("jiggle");
          setTimeout(() => span.classList.remove("jiggle"), 400);
        });
        host.appendChild(span);
      });
    });
  }
  buildTitle();

  (function initBgCanvas() {
    const canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    const particles = Array.from({ length: 24 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
    }));
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.fillStyle = "rgba(192,132,252,0.35)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    };
    draw();
  })();

  async function analyzeMolecule() {
    const inputEl = document.getElementById("mol-input");
    const out = document.getElementById("mol-result");
    if (!inputEl || !out) return;
    const input = inputEl.value.trim();
    if (!input) return;
    out.innerHTML = "Analyzing...";

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: input, smiles: input }),
      });
      const data = await res.json();
      const d = data.data || data;

      out.innerHTML = `
        Name: ${d.name || input}<br>
        Formula: ${d.formula || d.molecular_formula || "N/A"}<br>
        Weight: ${d.weight || d.molecular_weight || "N/A"}<br>
        SMILES: ${d.smiles || input}
      `;
      currentMol = { smiles: d.smiles || input };
      render3DMol(currentMol);
    } catch (e) {
      console.error(e);
      out.innerHTML = `Error: ${e.message}`;
    }
  }
  window.analyzeMolecule = analyzeMolecule;

  async function sendChat() {
    const inputEl = document.getElementById("chat-input");
    const box = document.getElementById("chat-messages");
    if (!inputEl || !box) return;
    const userMessage = inputEl.value.trim();
    if (!userMessage) return;
    inputEl.value = "";

    box.innerHTML += `<div class="msg user"><div class="msg-avatar">👤</div><div class="msg-bubble">${userMessage}</div></div>`;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();
      const d = data.data || data;
      box.innerHTML += `
        <div class="msg ai">
          <div class="msg-avatar">⚗</div>
          <div class="msg-bubble">
            <strong>Concept:</strong> ${d.concept || ""}<br>
            <strong>Explanation:</strong> ${d.explanation || ""}<br>
            <strong>Visualization:</strong> ${d.visualization || ""}<br>
            <strong>Example:</strong> ${d.example || ""}<br>
            <strong>Application:</strong> ${d.application || ""}
          </div>
        </div>
      `;
      box.scrollTop = box.scrollHeight;
    } catch (e) {
      console.error(e);
    }
  }
  window.sendChat = sendChat;

  async function explainTopic() {
    const inputEl = document.getElementById("topic-input");
    const out = document.getElementById("topic-result");
    if (!inputEl || !out) return;
    const topic = inputEl.value.trim();
    if (!topic) return;
    out.innerHTML = "Loading...";
    try {
      const res = await fetch("/api/topic/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      out.innerHTML = `
        <strong>Concept:</strong> ${data.concept || ""}<br>
        <strong>Explanation:</strong> ${data.explanation || ""}<br>
        <strong>Visualization:</strong> ${data.visualization || ""}<br>
        <strong>Example:</strong> ${data.example || ""}<br>
        <strong>Application:</strong> ${data.application || ""}
      `;
    } catch (e) {
      console.error(e);
      out.innerHTML = `Error: ${e.message}`;
    }
  }
  window.explainTopic = explainTopic;

  function handleChatKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  }
  window.handleChatKey = handleChatKey;

  function autoResize(el) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }
  window.autoResize = autoResize;

  function parseSmiles(smiles) {
    const elems = [];
    const rx = /([A-Z][a-z]?)/g;
    let m;
    while ((m = rx.exec(smiles)) !== null) elems.push(m[1]);
    const atoms = [];
    for (let i = 0; i < Math.min(elems.length, 30); i++) {
      atoms.push({
        element: elems[i],
        x: Math.cos(i) * (2 + i * 0.07),
        y: Math.sin(i) * (2 + i * 0.07),
        z: (i % 6) * 0.2,
      });
    }
    return atoms;
  }

  function render3DMol(mol) {
    const canvas = document.getElementById("mol-3d-canvas");
    const container = document.getElementById("mol-3d-viewer");
    const placeholder = document.getElementById("viewer-placeholder");
    const styleBtns = document.getElementById("style-btns");
    if (!canvas || !container || !window.THREE) return;
    if (placeholder) placeholder.style.display = "none";
    if (styleBtns) styleBtns.style.display = "flex";
    if (mol3DAnimId) cancelAnimationFrame(mol3DAnimId);

    mol3DScene = new THREE.Scene();
    mol3DCamera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    mol3DCamera.position.z = 8;
    mol3DRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    mol3DRenderer.setSize(container.clientWidth, container.clientHeight);
    mol3DScene.add(new THREE.AmbientLight(0xffffff, 0.8));

    mol3DGroup = new THREE.Group();
    const atoms = parseSmiles(mol.smiles || "CCO");
    atoms.forEach((a) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(molStyle === "sphere" ? 0.35 : 0.2, 10, 10), new THREE.MeshPhongMaterial({ color: 0xc084fc }));
      mesh.position.set(a.x, a.y, a.z);
      mol3DGroup.add(mesh);
    });
    mol3DScene.add(mol3DGroup);
    const animate = () => {
      mol3DAnimId = requestAnimationFrame(animate);
      if (mol3DGroup) mol3DGroup.rotation.y += 0.005;
      mol3DRenderer.render(mol3DScene, mol3DCamera);
    };
    animate();
  }

  function setStyle(style) {
    molStyle = style;
    if (currentMol) render3DMol(currentMol);
  }
  window.setStyle = setStyle;

  function resetCamera() {
    if (mol3DCamera) mol3DCamera.position.set(0, 0, 8);
    if (mol3DGroup) mol3DGroup.rotation.set(0, 0, 0);
  }
  window.resetCamera = resetCamera;

  function renderQuestion(q) {
    const area = document.getElementById("quiz-area");
    if (!area) return;
    const opts = q.opts.map((o, i) => `<button class="option" onclick="answerQuestion(${i})">${String.fromCharCode(65 + i)}. ${o}</button>`).join("");
    area.innerHTML = `<div class="card"><div style="margin-bottom:12px;">${q.q}</div>${opts}<div id="q-exp" style="margin-top:12px;color:var(--text-dim);"></div></div>`;
  }

  function newQuestion() {
    if (!quizPool.length) quizPool = [...QUESTIONS];
    currentQ = quizPool.pop();
    renderQuestion(currentQ);
  }

  function answerQuestion(idx) {
    if (!currentQ) return;
    const exp = document.getElementById("q-exp");
    if (!exp) return;
    exp.textContent = `${idx === currentQ.ans ? "Correct." : "Incorrect."} ${currentQ.exp}`;
    setTimeout(newQuestion, 1500);
  }
  window.answerQuestion = answerQuestion;

  document.getElementById("mol-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") analyzeMolecule();
  });
  document.getElementById("chat-input")?.addEventListener("keydown", handleChatKey);
  document.getElementById("topic-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") explainTopic();
  });

  quizPool = [...QUESTIONS];
  newQuestion();
});
