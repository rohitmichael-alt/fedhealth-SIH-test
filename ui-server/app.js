const LOCAL_BASELINES = {
  hosp_a: 0.68, // PERSON 5: replace with local-only baseline for hosp_a
  hosp_b: 0.66, // PERSON 5: replace with local-only baseline for hosp_b
  hosp_c: 0.64 // PERSON 5: replace with local-only baseline for hosp_c
};

const EPSILON_CEILING = 6.0; // PERSON 5: replace if final privacy-utility result uses a different ceiling

const SVG_NS = "http://www.w3.org/2000/svg";

const HOSPITALS = [
  { id: "hosp_a", name: "Apollo Referral Centre", location: "Chennai", skew: "severe cases, grades 3 and 4 over-represented" },
  { id: "hosp_b", name: "Rural Screening Camp", location: "Coimbatore", skew: "mild and healthy, grades 0 and 1 over-represented" },
  { id: "hosp_c", name: "District Hospital", location: "Madurai", skew: "mixed grades, degraded image quality" }
];

const POS = {
  server: { x: 450, y: 400 },
  hosp_a: { x: 450, y: 140 },
  hosp_b: { x: 190, y: 620 },
  hosp_c: { x: 710, y: 620 }
};

const nodeRefs = {};
let packetsLayer = null;

let totalRoundsSeen = 15;
let accuracyPoints = [];
let accuracyCrossed = false;
let totalBytes = 0;

const dom = {
  connStatus: document.getElementById("conn-status"),
  connLabel: document.getElementById("conn-label"),
  strategyIndicator: document.getElementById("strategy-indicator"),
  roundIndicator: document.getElementById("round-indicator"),
  roundValue: document.getElementById("round-value"),
  bytesValue: document.getElementById("bytes-value"),
  gaugeFill: document.getElementById("gauge-fill"),
  epsilonLabel: document.getElementById("epsilon-label"),
  dpOffBanner: document.getElementById("dp-off-banner"),
  crossingLabel: document.getElementById("crossing-label"),
  surveillanceIframe: document.getElementById("surveillance-iframe"),
  surveillanceFallback: document.getElementById("surveillance-fallback")
};

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function formatBytes(n) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
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

  const linksLayer = svgEl("g", { id: "links-layer" });
  HOSPITALS.forEach((h) => {
    linksLayer.appendChild(svgEl("line", {
      class: "link-line",
      x1: POS.server.x, y1: POS.server.y,
      x2: POS[h.id].x, y2: POS[h.id].y
    }));
  });
  svg.appendChild(linksLayer);

  const nodesLayer = svgEl("g", { id: "nodes-layer" });

  const serverGroup = svgEl("g", { class: "node-group node-server", "data-id": "server" });
  serverGroup.appendChild(svgEl("circle", { class: "node-circle", cx: POS.server.x, cy: POS.server.y, r: 70 }));
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

    group.appendChild(svgEl("circle", { class: "node-circle", cx: pos.x, cy: pos.y, r: 62 }));

    const nameLabel = svgEl("text", { class: "node-label", x: pos.x, y: pos.y - 6 });
    nameLabel.textContent = h.name;
    group.appendChild(nameLabel);

    const locLabel = svgEl("text", { class: "node-sub", x: pos.x, y: pos.y + 16 });
    locLabel.textContent = h.location;
    group.appendChild(locLabel);

    const statusLabel = svgEl("text", { class: "node-status hidden", x: pos.x, y: pos.y + 38 });
    statusLabel.textContent = "OFFLINE";
    group.appendChild(statusLabel);

    nodesLayer.appendChild(group);
    nodeRefs[h.id] = { group, statusLabel };
  });

  svg.appendChild(nodesLayer);

  packetsLayer = svgEl("g", { id: "packets-layer" });
  svg.appendChild(packetsLayer);
}

function setNodeTraining(id, on) {
  const ref = nodeRefs[id];
  if (!ref) return;
  ref.group.classList.toggle("training", on);
}

function setNodeOffline(id, on) {
  const ref = nodeRefs[id];
  if (!ref) return;
  ref.group.classList.toggle("offline", on);
  ref.statusLabel.classList.toggle("hidden", !on);
  if (on) setNodeTraining(id, false);
}

function recoverActiveNodes(clients) {
  clients.forEach((id) => {
    if (nodeRefs[id]) setNodeOffline(id, false);
  });
}

function spawnPacket(fromId, toId, label, inbound) {
  const from = POS[fromId];
  const to = POS[toId];
  if (!from || !to || !packetsLayer) return;

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
  setTimeout(() => group.remove(), 2000);

  function place(x, y) {
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    if (labelEl) {
      labelEl.setAttribute("x", x);
      labelEl.setAttribute("y", y - 16);
    }
  }

  if (prefersReducedMotion()) {
    place(to.x, to.y);
    setTimeout(() => group.remove(), 400);
    return;
  }

  const duration = 800;
  const start = performance.now();

  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const e = ease(t);
    place(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      setTimeout(() => group.remove(), 150);
    }
  }

  requestAnimationFrame(step);
}

const chart = { width: 640, height: 280, padLeft: 46, padRight: 14, padTop: 14, padBottom: 26 };
let chartLine = null;
let latestPointEl = null;
let crossingMarkerEl = null;

function chartX(round) {
  const span = chart.width - chart.padLeft - chart.padRight;
  const denom = Math.max(totalRoundsSeen - 1, 1);
  return chart.padLeft + ((round - 1) / denom) * span;
}

function chartY(acc) {
  const span = chart.height - chart.padTop - chart.padBottom;
  return chart.padTop + (1 - acc) * span;
}

function buildAccuracyChart() {
  const svg = document.getElementById("accuracy-chart");

  const axisY = svg.appendChild(svgEl("line", {
    class: "chart-axis",
    x1: chart.padLeft, y1: chart.padTop,
    x2: chart.padLeft, y2: chart.height - chart.padBottom
  }));
  const axisX = svg.appendChild(svgEl("line", {
    class: "chart-axis",
    x1: chart.padLeft, y1: chart.height - chart.padBottom,
    x2: chart.width - chart.padRight, y2: chart.height - chart.padBottom
  }));

  [0, 0.25, 0.5, 0.75, 1].forEach((tick) => {
    const y = chartY(tick);
    const label = svgEl("text", { class: "chart-tick-label", x: chart.padLeft - 8, y: y + 4, "text-anchor": "end" });
    label.textContent = tick.toFixed(2);
    svg.appendChild(label);
  });

  Object.keys(LOCAL_BASELINES).forEach((id) => {
    const value = LOCAL_BASELINES[id];
    const y = chartY(value);
    svg.appendChild(svgEl("line", {
      class: "chart-baseline",
      x1: chart.padLeft, y1: y,
      x2: chart.width - chart.padRight, y2: y
    }));
    const label = svgEl("text", { class: "chart-baseline-label", x: chart.width - chart.padRight, y: y - 4, "text-anchor": "end" });
    label.textContent = id + " " + value.toFixed(2);
    svg.appendChild(label);
  });

  chartLine = svgEl("polyline", { class: "chart-line", points: "" });
  svg.appendChild(chartLine);

  latestPointEl = svgEl("circle", { class: "current-point", r: 4, cx: -100, cy: -100 });
  svg.appendChild(latestPointEl);
}

function redrawAccuracyLine() {
  const points = accuracyPoints.map((p) => chartX(p.round) + "," + chartY(p.acc)).join(" ");
  chartLine.setAttribute("points", points);
  if (accuracyPoints.length > 0) {
    const last = accuracyPoints[accuracyPoints.length - 1];
    latestPointEl.setAttribute("cx", chartX(last.round));
    latestPointEl.setAttribute("cy", chartY(last.acc));
  }
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
  dom.crossingLabel.classList.remove("hidden");
}

function addAccuracyPoint(round, acc) {
  accuracyPoints.push({ round, acc });
  redrawAccuracyLine();
  maybeFlagCrossing();
}

function updateEpsilonGauge(epsilon, dpEnabled) {
  const pct = Math.min(100, (epsilon / EPSILON_CEILING) * 100);
  dom.gaugeFill.style.width = pct + "%";
  dom.epsilonLabel.textContent = "privacy budget consumed, epsilon = " + epsilon.toFixed(2) + " of " + EPSILON_CEILING.toFixed(1);

  dom.gaugeFill.classList.remove("warn", "dp-off");
  dom.dpOffBanner.classList.add("hidden");

  if (!dpEnabled) {
    dom.gaugeFill.classList.add("dp-off");
    dom.dpOffBanner.classList.remove("hidden");
  } else if (pct > 70) {
    dom.gaugeFill.classList.add("warn");
  }
}

function updateRoundDisplays(round, total) {
  totalRoundsSeen = total;
  const text = round + " / " + total;
  dom.roundIndicator.textContent = text;
  dom.roundValue.textContent = text;
}

function updateThroughputDisplay() {
  dom.bytesValue.textContent = formatBytes(totalBytes);
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

function handleEvent(data) {
  switch (data.type) {
    case "round_start":
      updateRoundDisplays(data.round, data.total_rounds);
      recoverActiveNodes(data.clients);
      data.clients.forEach((id) => spawnPacket("server", id, null, false));
      break;

    case "client_training":
      setNodeTraining(data.client, true);
      break;

    case "client_update": {
      setNodeTraining(data.client, false);
      const kb = (data.bytes / 1024).toFixed(1) + " KB";
      spawnPacket(data.client, "server", kb, true);
      totalBytes += data.bytes;
      updateThroughputDisplay();
      break;
    }

    case "aggregate":
      updateStrategyDisplay(data.strategy);
      addAccuracyPoint(data.round, data.global_acc);
      break;

    case "privacy":
      updateEpsilonGauge(data.epsilon, data.dp_enabled);
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
buildAccuracyChart();
initSurveillance();
connectWebSocket();
