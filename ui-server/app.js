const LOCAL_BASELINES = {
  hosp_a: 0.68, // PERSON 5: replace with local-only baseline for hosp_a
  hosp_b: 0.66, // PERSON 5: replace with local-only baseline for hosp_b
  hosp_c: 0.64 // PERSON 5: replace with local-only baseline for hosp_c
};

const EPSILON_CEILING = 6.0; // PERSON 5: replace if final privacy-utility result uses a different ceiling

const SVG_NS = "http://www.w3.org/2000/svg";

const HOSPITALS = [
  { id: "hosp_a", name: "Apollo Referral Centre", shortName: "Apollo", location: "Chennai", skew: "severe cases, grades 3 and 4 over-represented" },
  { id: "hosp_b", name: "Rural Screening Camp", shortName: "Rural Camp", location: "Coimbatore", skew: "mild and healthy, grades 0 and 1 over-represented" },
  { id: "hosp_c", name: "District Hospital", shortName: "District Hosp.", location: "Madurai", skew: "mixed grades, degraded image quality" }
];

const POS = {
  server: { x: 450, y: 350, r: 66 },
  hosp_a: { x: 450, y: 112, r: 54 },
  hosp_b: { x: 170, y: 596, r: 54 },
  hosp_c: { x: 730, y: 596, r: 54 }
};

const LINK_PATH_D = {
  hosp_a: "M450,168 C474,236 474,272 450,306",
  hosp_b: "M208,552 C296,506 330,458 396,392",
  hosp_c: "M692,552 C604,506 570,458 504,392"
};

const nodeRefs = {};
const linkPathEls = {};
let packetsLayer = null;
let particlesAnimation = null;

let totalRoundsSeen = 15;
let accuracyPoints = [];
let accuracyCrossed = false;
let totalBytes = 0;
let updatesReceived = 0;

const dom = {
  connStatus: document.getElementById("conn-status"),
  connLabel: document.getElementById("conn-label"),
  strategyIndicator: document.getElementById("strategy-indicator"),
  roundIndicator: document.getElementById("round-indicator"),
  roundValue: document.getElementById("round-value"),
  bytesNumber: document.getElementById("bytes-number"),
  bytesUnit: document.getElementById("bytes-unit"),
  updatesValue: document.getElementById("updates-value"),
  clientRail: document.getElementById("client-rail"),
  accValue: document.getElementById("acc-value"),
  serverOps: document.getElementById("server-ops"),
  gaugeSegments: document.getElementById("gauge-segments"),
  epsilonValue: document.getElementById("epsilon-value"),
  epsilonLabel: document.getElementById("epsilon-label"),
  dpBadge: document.getElementById("dp-badge"),
  deltaValue: document.getElementById("delta-value"),
  noiseValue: document.getElementById("noise-value"),
  clipValue: document.getElementById("clip-value"),
  crossingLabel: document.getElementById("crossing-label"),
  surveillanceIframe: document.getElementById("surveillance-iframe"),
  surveillanceFallback: document.getElementById("surveillance-fallback")
};

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function formatBytes(n) {
  if (n < 1024) return { value: String(n), unit: "B" };
  if (n < 1024 * 1024) return { value: (n / 1024).toFixed(1), unit: "KB" };
  return { value: (n / (1024 * 1024)).toFixed(2), unit: "MB" };
}

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
  return el;
}

function buildNetworkGraph() {
  const svg = document.getElementById("network-graph");

  const defs = svgEl("defs", {});
  const glow = svgEl("radialGradient", { id: "fh-server-glow", cx: "50%", cy: "50%", r: "50%" });
  glow.appendChild(svgEl("stop", { offset: "0%", "stop-color": "#4D8DFF", "stop-opacity": "0.28" }));
  glow.appendChild(svgEl("stop", { offset: "70%", "stop-color": "#4D8DFF", "stop-opacity": "0.05" }));
  glow.appendChild(svgEl("stop", { offset: "100%", "stop-color": "#4D8DFF", "stop-opacity": "0" }));
  defs.appendChild(glow);
  svg.appendChild(defs);

  const linksLayer = svgEl("g", { id: "links-layer" });
  HOSPITALS.forEach((h) => {
    const path = svgEl("path", { class: "link-line", d: LINK_PATH_D[h.id] });
    const dashedPath = svgEl("path", { class: "link-dash", d: LINK_PATH_D[h.id] });
    linksLayer.appendChild(path);
    linksLayer.appendChild(dashedPath);
    linkPathEls[h.id] = path;
  });
  svg.appendChild(linksLayer);

  const nodesLayer = svgEl("g", { id: "nodes-layer" });

  const serverGroup = svgEl("g", { class: "node-group node-server", "data-id": "server" });
  serverGroup.appendChild(svgEl("circle", { cx: POS.server.x, cy: POS.server.y, r: 140, fill: "url(#fh-server-glow)" }));
  serverGroup.appendChild(svgEl("circle", { class: "server-ring-spin-rev", cx: POS.server.x, cy: POS.server.y, r: 112, "stroke-dasharray": "6 26" }));
  serverGroup.appendChild(svgEl("circle", { class: "server-ring-spin", cx: POS.server.x, cy: POS.server.y, r: 98, "stroke-dasharray": "34 210" }));
  serverGroup.appendChild(svgEl("circle", { class: "node-circle", cx: POS.server.x, cy: POS.server.y, r: POS.server.r }));

  const serverLabel = svgEl("text", { class: "node-label", x: POS.server.x, y: POS.server.y - 4 });
  serverLabel.textContent = "AGGREGATION";
  const serverSub = svgEl("text", { class: "node-sub", x: POS.server.x, y: POS.server.y + 18 });
  serverSub.textContent = "SERVER";
  serverGroup.appendChild(serverLabel);
  serverGroup.appendChild(serverSub);
  nodesLayer.appendChild(serverGroup);

  HOSPITALS.forEach((h) => {
    const pos = POS[h.id];
    const group = svgEl("g", { class: "node-group", "data-id": h.id });

    const title = svgEl("title", {});
    title.textContent = h.name + ", " + h.location + ". " + h.skew;
    group.appendChild(title);

    group.appendChild(svgEl("circle", { class: "node-focus-ring", cx: pos.x, cy: pos.y, r: pos.r + 6 }));
    group.appendChild(svgEl("circle", { class: "node-circle", cx: pos.x, cy: pos.y, r: pos.r }));

    const nameLabel = svgEl("text", { class: "node-label", x: pos.x, y: pos.y - 6 });
    nameLabel.textContent = h.shortName;
    group.appendChild(nameLabel);

    const locLabel = svgEl("text", { class: "node-sub", x: pos.x, y: pos.y + 16 });
    locLabel.textContent = h.location;
    group.appendChild(locLabel);

    const statusLabel = svgEl("text", { class: "node-status hidden", x: pos.x, y: pos.y + pos.r + 22 });
    statusLabel.textContent = "OFFLINE";
    group.appendChild(statusLabel);

    nodesLayer.appendChild(group);
    nodeRefs[h.id] = { group, statusLabel };
  });

  svg.appendChild(nodesLayer);

  packetsLayer = svgEl("g", { id: "packets-layer" });
  svg.appendChild(packetsLayer);
}

function initNetworkParticles() {
  const canvas = document.getElementById("network-particles");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const reduceMotion = prefersReducedMotion();
  const particleCount = reduceMotion ? 28 : 70;
  const particles = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    particles.length = 0;
    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        r: 0.8 + Math.random() * 1.7,
        alpha: 0.08 + Math.random() * 0.22,
        vx: reduceMotion ? 0 : -0.05 + Math.random() * 0.1,
        vy: reduceMotion ? 0 : -0.03 + Math.random() * 0.06
      });
    }
  }

  function draw() {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "rgba(122, 167, 255, 0.08)";
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -4) p.x = rect.width + 4;
      if (p.x > rect.width + 4) p.x = -4;
      if (p.y < -4) p.y = rect.height + 4;
      if (p.y > rect.height + 4) p.y = -4;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    if (!reduceMotion) {
      particlesAnimation = requestAnimationFrame(draw);
    }
  }

  resize();
  seed();
  draw();

  window.addEventListener("resize", () => {
    if (particlesAnimation) cancelAnimationFrame(particlesAnimation);
    resize();
    seed();
    draw();
  });
}

function buildClientRail() {
  dom.clientRail.innerHTML = "";
  HOSPITALS.forEach((h) => {
    const card = document.createElement("div");
    card.className = "client-card";
    card.id = "card-" + h.id;
    card.innerHTML = [
      "<div class=\"client-card-top\">",
      "<span class=\"client-name\">" + h.name + "</span>",
      "<span class=\"client-state mono\" id=\"state-" + h.id + "\">IDLE</span>",
      "</div>",
      "<div class=\"client-metrics\">",
      "<span><b id=\"samples-" + h.id + "\">--</b><small>samples</small></span>",
      "<span><b id=\"loss-" + h.id + "\">--</b><small>loss</small></span>",
      "<span><b id=\"payload-" + h.id + "\">--</b><small>last update</small></span>",
      "</div>",
      "<div class=\"client-progress\"><span id=\"progress-" + h.id + "\"></span></div>"
    ].join("");
    dom.clientRail.appendChild(card);
  });
}

function setNodeTraining(id, on) {
  const ref = nodeRefs[id];
  if (!ref) return;
  ref.group.classList.toggle("training", on);
  setClientState(id, on ? "TRAINING" : "IDLE");
}

function setNodeOffline(id, on) {
  const ref = nodeRefs[id];
  if (!ref) return;
  ref.group.classList.toggle("offline", on);
  ref.statusLabel.classList.toggle("hidden", !on);
  if (on) setNodeTraining(id, false);
  setClientState(id, on ? "OFFLINE" : "IDLE");
}

function recoverActiveNodes(clients) {
  clients.forEach((id) => {
    if (nodeRefs[id]) setNodeOffline(id, false);
  });
}

function updateServerOps(text) {
  if (dom.serverOps) dom.serverOps.textContent = text;
}

function hospitalName(id) {
  const hospital = HOSPITALS.find((h) => h.id === id);
  return hospital ? hospital.shortName.toUpperCase() : id.toUpperCase();
}

function setClientState(id, state) {
  const stateEl = document.getElementById("state-" + id);
  const card = document.getElementById("card-" + id);
  if (!stateEl || !card) return;
  stateEl.textContent = state;
  card.classList.remove("training", "sent", "offline");
  if (state === "TRAINING") card.classList.add("training");
  if (state === "SENT") card.classList.add("sent");
  if (state === "OFFLINE") card.classList.add("offline");
}

function updateClientMetrics(data) {
  const samples = document.getElementById("samples-" + data.client);
  const loss = document.getElementById("loss-" + data.client);
  const progress = document.getElementById("progress-" + data.client);
  if (samples && typeof data.samples !== "undefined") samples.textContent = data.samples;
  if (loss && typeof data.local_loss !== "undefined") loss.textContent = Number(data.local_loss).toFixed(3);
  if (progress && typeof data.progress !== "undefined") progress.style.transform = "scaleX(" + Math.max(0, Math.min(1, data.progress)) + ")";
}

function updateClientPayload(client, bytes) {
  const payload = document.getElementById("payload-" + client);
  if (payload) payload.textContent = (bytes / 1024).toFixed(1) + " KB";
}

function spawnPacket(fromId, toId, label, inbound) {
  if (!packetsLayer) return;
  const hospitalId = inbound ? fromId : toId;
  const pathEl = linkPathEls[hospitalId];
  if (!pathEl) return;

  const group = svgEl("g", { class: "packet-group" });
  const circle = svgEl("circle", { r: 9, class: "packet" + (inbound ? " inbound" : "") });
  group.appendChild(circle);

  let labelEl = null;
  if (label) {
    labelEl = svgEl("text", { class: "packet-label" });
    labelEl.textContent = label;
    group.appendChild(labelEl);
  }

  packetsLayer.appendChild(group);
  setTimeout(() => group.remove(), 3000);

  const totalLength = pathEl.getTotalLength();

  function place(t) {
    const clamped = Math.min(1, Math.max(0, t));
    const point = pathEl.getPointAtLength(totalLength * clamped);
    circle.setAttribute("cx", point.x);
    circle.setAttribute("cy", point.y);
    if (labelEl) {
      labelEl.setAttribute("x", point.x);
      labelEl.setAttribute("y", point.y - 16);
    }
  }

  if (prefersReducedMotion()) {
    place(inbound ? 1 : 0);
    setTimeout(() => group.remove(), 400);
    return;
  }

  const duration = 1150;
  const start = performance.now();

  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const e = ease(t);
    place(inbound ? e : 1 - e);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      setTimeout(() => group.remove(), 150);
    }
  }

  requestAnimationFrame(step);
}

const chart = { width: 640, height: 130, padLeft: 58, padRight: 22, padTop: 10, padBottom: 24 };
let chartLine = null;
let chartArea = null;
let latestPointEl = null;
let crossingMarkerEl = null;

const baselineValues = Object.values(LOCAL_BASELINES);
const yDomainMin = Math.max(0, Math.floor((Math.min(...baselineValues) - 0.25) * 20) / 20);
const yDomainMax = 1.0;

function chartX(round) {
  const span = chart.width - chart.padLeft - chart.padRight;
  const denom = Math.max(totalRoundsSeen - 1, 1);
  return chart.padLeft + ((round - 1) / denom) * span;
}

function chartY(acc) {
  const span = chart.height - chart.padTop - chart.padBottom;
  const clamped = Math.min(yDomainMax, Math.max(yDomainMin, acc));
  return chart.padTop + (1 - (clamped - yDomainMin) / (yDomainMax - yDomainMin)) * span;
}

function smoothPath(points) {
  if (points.length === 0) return "";
  if (points.length < 2) return "M" + points[0][0] + "," + points[0][1];
  let d = "M" + points[0][0] + "," + points[0][1];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += " C" + c1x + "," + c1y + " " + c2x + "," + c2y + " " + p2[0] + "," + p2[1];
  }
  return d;
}

function buildAccuracyChart() {
  const svg = document.getElementById("accuracy-chart");

  const defs = svgEl("defs", {});
  const gradient = svgEl("linearGradient", { id: "accuracy-area-gradient", x1: 0, y1: 0, x2: 0, y2: 1 });
  gradient.appendChild(svgEl("stop", { offset: "0%", "stop-color": "#4D8DFF", "stop-opacity": 0.4 }));
  gradient.appendChild(svgEl("stop", { offset: "100%", "stop-color": "#4D8DFF", "stop-opacity": 0 }));
  defs.appendChild(gradient);
  svg.appendChild(defs);

  svg.appendChild(svgEl("line", {
    class: "chart-axis",
    x1: chart.padLeft, y1: chart.height - chart.padBottom,
    x2: chart.width - chart.padRight, y2: chart.height - chart.padBottom
  }));

  const gridGroup = svgEl("g", { class: "chart-grid" });
  const tickCount = 4;
  for (let i = 0; i <= tickCount; i++) {
    const value = yDomainMin + ((yDomainMax - yDomainMin) * i) / tickCount;
    const y = chartY(value);
    gridGroup.appendChild(svgEl("line", {
      class: "chart-grid-line",
      x1: chart.padLeft, y1: y,
      x2: chart.width - chart.padRight, y2: y
    }));
    const label = svgEl("text", { class: "chart-tick-label", x: chart.padLeft - 10, y: y + 4, "text-anchor": "end" });
    label.textContent = value.toFixed(2);
    svg.appendChild(label);
  }
  svg.appendChild(gridGroup);

  [1, 5, 10, totalRoundsSeen].forEach((round, index, all) => {
    if (round > totalRoundsSeen || all.indexOf(round) !== index) return;
    const x = chartX(round);
    svg.appendChild(svgEl("line", {
      class: "chart-x-tick",
      x1: x, y1: chart.height - chart.padBottom,
      x2: x, y2: chart.height - chart.padBottom + 6
    }));
    const label = svgEl("text", {
      class: "chart-x-label",
      x,
      y: chart.height - 12,
      "text-anchor": "middle"
    });
    label.textContent = "R" + round;
    svg.appendChild(label);
  });

  const bestLocalBaseline = Math.max(...Object.values(LOCAL_BASELINES));
  const baselineY = chartY(bestLocalBaseline);
  svg.appendChild(svgEl("line", {
    class: "chart-baseline",
    x1: chart.padLeft, y1: baselineY,
    x2: chart.width - chart.padRight, y2: baselineY
  }));

  const legend = document.getElementById("baseline-legend");
  if (legend) {
    legend.innerHTML = "";
    const item = document.createElement("span");
    item.className = "legend-item mono";
    const swatch = document.createElementNS(SVG_NS, "svg");
    swatch.setAttribute("viewBox", "0 0 24 4");
    swatch.setAttribute("class", "legend-swatch");
    const swatchLine = svgEl("line", { x1: 0, y1: 2, x2: 24, y2: 2, class: "chart-baseline" });
    swatch.appendChild(swatchLine);
    item.appendChild(swatch);
    const text = document.createElement("span");
    text.textContent = "best local baseline " + bestLocalBaseline.toFixed(2);
    item.appendChild(text);
    legend.appendChild(item);
  }

  chartArea = svgEl("path", { class: "chart-area", d: "" });
  svg.appendChild(chartArea);

  chartLine = svgEl("path", { class: "chart-line", d: "" });
  svg.appendChild(chartLine);

  latestPointEl = svgEl("circle", { class: "current-point", r: 4, cx: -100, cy: -100 });
  svg.appendChild(latestPointEl);
}

function redrawAccuracyLine() {
  const points = accuracyPoints.map((p) => [chartX(p.round), chartY(p.acc)]);
  const linePath = smoothPath(points);
  chartLine.setAttribute("d", linePath);

  if (points.length > 1) {
    const baseline = chart.height - chart.padBottom;
    const last = points[points.length - 1];
    const first = points[0];
    chartArea.setAttribute("d", linePath + " L" + last[0] + "," + baseline + " L" + first[0] + "," + baseline + " Z");
  } else {
    chartArea.setAttribute("d", "");
  }

  if (accuracyPoints.length > 0) {
    const last = accuracyPoints[accuracyPoints.length - 1];
    latestPointEl.setAttribute("cx", chartX(last.round));
    latestPointEl.setAttribute("cy", chartY(last.acc));
    dom.accValue.textContent = last.acc.toFixed(3);
  } else {
    latestPointEl.setAttribute("cx", -100);
    latestPointEl.setAttribute("cy", -100);
    dom.accValue.textContent = "--";
  }
}

function resetAccuracyChart() {
  accuracyPoints = [];
  accuracyCrossed = false;
  if (crossingMarkerEl) {
    crossingMarkerEl.remove();
    crossingMarkerEl = null;
  }
  dom.crossingLabel.classList.remove("active");
  redrawAccuracyLine();
}

function maybeFlagCrossing() {
  if (accuracyCrossed || accuracyPoints.length === 0) return;
  const baselineMax = Math.max(LOCAL_BASELINES.hosp_a, LOCAL_BASELINES.hosp_b, LOCAL_BASELINES.hosp_c);
  const last = accuracyPoints[accuracyPoints.length - 1];
  if (last.acc <= baselineMax) return;

  accuracyCrossed = true;
  const svg = document.getElementById("accuracy-chart");
  crossingMarkerEl = svgEl("circle", {
    class: "crossing-point flash",
    r: 5,
    cx: chartX(last.round),
    cy: chartY(last.acc)
  });
  svg.appendChild(crossingMarkerEl);
  dom.crossingLabel.classList.add("active");
}

function addAccuracyPoint(round, acc) {
  accuracyPoints.push({ round, acc });
  redrawAccuracyLine();
  maybeFlagCrossing();
}

function buildEpsilonGauge() {
  dom.gaugeSegments.innerHTML = "";
  for (let i = 0; i < 20; i++) {
    dom.gaugeSegments.appendChild(document.createElement("span")).className = "gauge-segment";
  }
}

function updateEpsilonGauge(epsilon, dpEnabled) {
  const pct = Math.min(1, epsilon / EPSILON_CEILING);
  const filled = Math.round(pct * 20);
  const segments = dom.gaugeSegments.children;

  let litClass = "lit-accent";
  if (!dpEnabled) {
    litClass = "lit-danger";
  } else if (pct > 0.7) {
    litClass = "lit-warn";
  }

  for (let i = 0; i < segments.length; i++) {
    segments[i].className = "gauge-segment" + (i < filled ? " " + litClass : "");
  }

  dom.epsilonValue.textContent = epsilon.toFixed(2);
  dom.epsilonLabel.textContent = "privacy budget consumed, epsilon = " + epsilon.toFixed(2) + " of " + EPSILON_CEILING.toFixed(1);

  if (dpEnabled) {
    dom.dpBadge.textContent = "DP ON";
    dom.dpBadge.classList.add("dp-on");
    dom.dpBadge.classList.remove("dp-off");
  } else {
    dom.dpBadge.textContent = "DP OFF";
    dom.dpBadge.classList.add("dp-off");
    dom.dpBadge.classList.remove("dp-on");
  }
}

function updateRoundDisplays(round, total) {
  totalRoundsSeen = total;
  const text = round + " / " + total;
  dom.roundIndicator.textContent = text;
  dom.roundValue.textContent = text;
}

function updateThroughputDisplay() {
  const formatted = formatBytes(totalBytes);
  dom.bytesNumber.textContent = formatted.value;
  dom.bytesUnit.textContent = formatted.unit;
  dom.updatesValue.textContent = updatesReceived + " rcvd";
}

function updateStrategyDisplay(strategy) {
  dom.strategyIndicator.textContent = strategy;
}

function setConnStatus(state) {
  dom.connStatus.classList.remove("conn-connected", "conn-reconnecting", "conn-offline");
  dom.connStatus.classList.add("conn-" + state);
  dom.connLabel.textContent = state.toUpperCase();
}

function initSurveillance() {
  const params = new URLSearchParams(window.location.search);
  const override = params.get("surveillance");

  function showFallback() {
    dom.surveillanceIframe.classList.add("hidden");
    dom.surveillanceFallback.classList.remove("hidden");
  }

  function showIframe(src) {
    dom.surveillanceIframe.src = src;
    dom.surveillanceIframe.classList.remove("hidden");
    dom.surveillanceFallback.classList.add("hidden");
  }

  if (override) {
    dom.surveillanceIframe.onerror = showFallback;
    showIframe(override);
    return;
  }

  const defaultSrc = "../ui-surveillance/index.html";
  fetch(defaultSrc, { method: "GET" })
    .then((res) => {
      if (res.ok) {
        showIframe(defaultSrc);
      } else {
        showFallback();
      }
    })
    .catch(() => showFallback());
}

let serverOpsResetTimer = null;

function handleEvent(data) {
  switch (data.type) {
    case "round_start":
      if (data.round === 1) resetAccuracyChart();
      updateRoundDisplays(data.round, data.total_rounds);
      recoverActiveNodes(data.clients);
      updateServerOps("BROADCASTING GLOBAL WEIGHTS");
      data.clients.forEach((id) => spawnPacket("server", id, "weights", false));
      break;

    case "client_training":
      setNodeTraining(data.client, true);
      updateClientMetrics(data);
      updateServerOps(hospitalName(data.client) + " TRAINING");
      break;

    case "client_update": {
      setNodeTraining(data.client, false);
      const kb = (data.bytes / 1024).toFixed(1) + " KB";
      spawnPacket(data.client, "server", kb, true);
      updateServerOps(hospitalName(data.client) + " UPLOADING");
      totalBytes += data.bytes;
      updatesReceived += 1;
      updateClientPayload(data.client, data.bytes);
      setClientState(data.client, "SENT");
      updateThroughputDisplay();
      break;
    }

    case "aggregate":
      updateStrategyDisplay(data.strategy);
      addAccuracyPoint(data.round, data.global_acc);
      updateServerOps("AGGREGATING");
      if (serverOpsResetTimer) clearTimeout(serverOpsResetTimer);
      serverOpsResetTimer = setTimeout(() => updateServerOps("IDLE"), 1200);
      break;

    case "privacy":
      updateEpsilonGauge(data.epsilon, data.dp_enabled);
      dom.deltaValue.textContent = data.delta;
      dom.noiseValue.textContent = data.noise_multiplier.toFixed(2);
      dom.clipValue.textContent = data.clip_norm.toFixed(2);
      break;

    case "surveillance":
      break;

    case "client_dropout":
      setNodeOffline(data.client, true);
      break;

    default:
      break;
  }
}

function resolveWsUrl() {
  const params = new URLSearchParams(window.location.search);
  const wsParam = params.get("ws");
  if (wsParam) return wsParam;
  const host = window.location.hostname;
  if (host) return "ws://" + host + ":8765";
  return "ws://localhost:8765";
}

let socket = null;
let reconnectTimer = null;

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectWebSocket();
  }, 2000);
}

function connectWebSocket() {
  setConnStatus("reconnecting");
  let ws;
  try {
    ws = new WebSocket(resolveWsUrl());
  } catch (err) {
    setConnStatus("offline");
    scheduleReconnect();
    return;
  }
  socket = ws;

  ws.onopen = () => setConnStatus("connected");

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleEvent(data);
    } catch (err) {}
  };

  ws.onclose = () => {
    setConnStatus("offline");
    scheduleReconnect();
  };

  ws.onerror = () => {
    try { ws.close(); } catch (err) {}
  };
}

buildNetworkGraph();
initNetworkParticles();
buildAccuracyChart();
buildEpsilonGauge();
buildClientRail();
initSurveillance();
connectWebSocket();
