const ALLOC_POINTS = 24;
const ALLOC_STEP = 0.01;
const BASE_STAT = 1;
const MAX_STAT = 10;
const TRACK_LENGTH = 900;
const TRACK_RX = 90;
const TRACK_RZ = 36;
const LANE_WIDTH = 3.6;
const RACE_SPEED_SCALE = 0.42;

const statDefs = [
  { key: "speed", label: "スピード" },
  { key: "stamina", label: "スタミナ" },
  { key: "power", label: "パワー" },
  { key: "corner", label: "コーナー" },
  { key: "spirit", label: "勝負根性" },
];

const colors = [
  [0.89, 0.77, 0.42],
  [0.4, 0.76, 0.69],
  [0.85, 0.41, 0.33],
  [0.42, 0.56, 0.85],
  [0.78, 0.48, 0.85],
  [0.94, 0.94, 0.9],
];
const colorCss = ["#e4c56a", "#65c3b1", "#d96854", "#6c8ed8", "#c77bd8", "#f0f0ec"];
const aiNames = ["ミッドライン", "アオバスプリント", "クロガネロード", "セブンベル", "ハヤテノヴェール"];
const conditionTable = [
  { label: "絶好調", emoji: "🔥", speed: 1.08, stamina: 0.94, finish: 1.1, weight: 12 },
  { label: "好調", emoji: "😊", speed: 1.04, stamina: 0.97, finish: 1.05, weight: 22 },
  { label: "普通", emoji: "➖", speed: 1, stamina: 1, finish: 1, weight: 34 },
  { label: "不調", emoji: "💧", speed: 0.96, stamina: 1.05, finish: 0.94, weight: 22 },
  { label: "絶不調", emoji: "💀", speed: 0.92, stamina: 1.1, finish: 0.88, weight: 10 },
];

const state = {
  allocations: { speed: 5, stamina: 5, power: 5, corner: 5, spirit: 4 },
  racers: [],
  raceRunning: false,
  laps: 2,
  raceDistance: TRACK_LENGTH * 2,
  startedAt: 0,
  lastFrame: 0,
  cameraX: -135,
};

const statList = document.querySelector("#statList");
const budgetLeft = document.querySelector("#budgetLeft");
const startBtn = document.querySelector("#startBtn");
const randomizeBtn = document.querySelector("#randomizeBtn");
const strategySelect = document.querySelector("#strategy");
const lapCountSelect = document.querySelector("#lapCount");
const horseName = document.querySelector("#horseName");
const racePhase = document.querySelector("#racePhase");
const distanceReadout = document.querySelector("#distanceReadout");
const leaderboard = document.querySelector("#leaderboard");
const resultList = document.querySelector("#resultList");
const canvas = document.querySelector("#raceCanvas");
const horseLabels = document.querySelector("#horseLabels");
const app = document.querySelector(".app");
const controlPanel = document.querySelector(".control-panel");

const gl = canvas.getContext("webgl", { antialias: true });
if (!gl) {
  racePhase.textContent = "WebGL非対応";
  throw new Error("WebGL is not available in this browser.");
}

const vertexShaderSource = `
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  uniform mat4 uMatrix;
  uniform mat4 uModel;
  varying vec3 vNormal;
  void main() {
    gl_Position = uMatrix * vec4(aPosition, 1.0);
    vNormal = mat3(uModel) * aNormal;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform vec3 uColor;
  uniform vec3 uLight;
  varying vec3 vNormal;
  void main() {
    vec3 normal = normalize(vNormal);
    float light = max(dot(normal, normalize(uLight)), 0.0);
    float shade = 0.36 + light * 0.64;
    gl_FragColor = vec4(uColor * shade, 1.0);
  }
`;

const program = createProgram(vertexShaderSource, fragmentShaderSource);
const loc = {
  position: gl.getAttribLocation(program, "aPosition"),
  normal: gl.getAttribLocation(program, "aNormal"),
  matrix: gl.getUniformLocation(program, "uMatrix"),
  model: gl.getUniformLocation(program, "uModel"),
  color: gl.getUniformLocation(program, "uColor"),
  light: gl.getUniformLocation(program, "uLight"),
};

const cube = createCube();
const meshBuffer = {
  position: gl.createBuffer(),
  normal: gl.createBuffer(),
};
gl.bindBuffer(gl.ARRAY_BUFFER, meshBuffer.position);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.positions), gl.STATIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, meshBuffer.normal);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.normals), gl.STATIC_DRAW);
gl.enable(gl.DEPTH_TEST);
gl.disable(gl.CULL_FACE);
gl.clearColor(0.52, 0.72, 0.7, 1);

function totalAllocated() {
  return roundPoint(Object.values(state.allocations).reduce((sum, value) => sum + value, 0));
}

function statValue(key, allocations = state.allocations) {
  return roundPoint(BASE_STAT + allocations[key]);
}

function buildStatControls() {
  statList.innerHTML = "";
  for (const def of statDefs) {
    const item = document.createElement("div");
    item.className = "stat-control";
    item.innerHTML = `
      <div class="stat-head">
        <span class="stat-name">${def.label}</span>
        <span class="stat-value" data-value="${def.key}"></span>
      </div>
      <div class="stat-actions">
        <input type="range" min="0" max="${MAX_STAT - BASE_STAT}" step="${ALLOC_STEP}" data-range="${def.key}" aria-label="${def.label}の割り振り" />
        <input type="number" min="0" max="${MAX_STAT - BASE_STAT}" step="${ALLOC_STEP}" data-input="${def.key}" aria-label="${def.label}に割り振るポイント" />
      </div>
    `;
    statList.append(item);
  }

  statList.addEventListener("input", (event) => {
    const target = event.target;
    const key = target.dataset.range;
    if (!key || state.raceRunning) return;
    setAllocation(key, Number(target.value));
  });

  statList.addEventListener("change", (event) => {
    const target = event.target;
    const key = target.dataset.input;
    if (!key || state.raceRunning) return;
    setAllocation(key, Number(target.value));
  });
}

function setAllocation(key, requested) {
  const current = state.allocations[key];
  const spentWithoutKey = roundPoint(totalAllocated() - current);
  const maxForKey = Math.min(MAX_STAT - BASE_STAT, ALLOC_POINTS - spentWithoutKey);
  const next = roundPoint(Math.max(0, Math.min(maxForKey, requested || 0)));
  state.allocations[key] = next;
  renderControls();
}

function renderControls() {
  const spent = totalAllocated();
  const remaining = roundPoint(ALLOC_POINTS - spent);
  budgetLeft.textContent = remaining.toFixed(2);
  budgetLeft.style.color = Math.abs(remaining) < 0.001 ? "var(--accent)" : "var(--danger)";

  for (const def of statDefs) {
    const value = statValue(def.key);
    const range = document.querySelector(`[data-range="${def.key}"]`);
    const input = document.querySelector(`[data-input="${def.key}"]`);
    document.querySelector(`[data-value="${def.key}"]`).textContent = value.toFixed(2);
    range.max = (MAX_STAT - BASE_STAT).toFixed(2);
    range.value = state.allocations[def.key].toFixed(2);
    range.disabled = state.raceRunning;
    input.max = (MAX_STAT - BASE_STAT).toFixed(2);
    input.value = state.allocations[def.key].toFixed(2);
    input.disabled = state.raceRunning;
  }

  startBtn.disabled = Math.abs(remaining) >= 0.001 || state.raceRunning;
  randomizeBtn.disabled = state.raceRunning;
  lapCountSelect.disabled = state.raceRunning;
}

function randomizePlayer() {
  const allocations = Object.fromEntries(statDefs.map((def) => [def.key, 0]));
  let cents = Math.round(ALLOC_POINTS / ALLOC_STEP);
  while (cents > 0) {
    const candidates = statDefs.filter((def) => BASE_STAT + allocations[def.key] < MAX_STAT);
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    allocations[pick.key] = roundPoint(allocations[pick.key] + ALLOC_STEP);
    cents -= 1;
  }
  state.allocations = allocations;
  renderControls();
}

function makeStats(allocations) {
  return Object.fromEntries(statDefs.map((def) => [def.key, roundPoint(BASE_STAT + allocations[def.key])]));
}

function generateAiAllocations(index) {
  const archetypes = [
    { speed: 5.8, stamina: 4.6, power: 5.0, corner: 4.1, spirit: 4.5 },
    { speed: 4.2, stamina: 6.1, power: 4.2, corner: 4.8, spirit: 4.7 },
    { speed: 4.9, stamina: 4.7, power: 5.8, corner: 4.2, spirit: 4.4 },
    { speed: 4.5, stamina: 4.8, power: 4.1, corner: 6.1, spirit: 4.5 },
    { speed: 4.6, stamina: 4.5, power: 4.5, corner: 4.4, spirit: 6.0 },
  ];
  const base = archetypes[index % archetypes.length];
  const allocations = {};
  let total = 0;

  for (const def of statDefs) {
    const jitter = (Math.random() - 0.5) * 0.7;
    const value = clamp(roundPoint(base[def.key] + jitter), 2.7, 6.7);
    allocations[def.key] = value;
    total = roundPoint(total + value);
  }

  let delta = roundPoint(ALLOC_POINTS - total);
  while (Math.abs(delta) >= ALLOC_STEP) {
    const candidates = statDefs.filter((def) => {
      const value = allocations[def.key];
      return delta > 0 ? value < MAX_STAT - BASE_STAT : value > 2.4;
    });
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    allocations[pick.key] = roundPoint(allocations[pick.key] + Math.sign(delta) * ALLOC_STEP);
    delta = roundPoint(delta - Math.sign(delta) * ALLOC_STEP);
  }

  return allocations;
}

function startRace() {
  if (state.raceRunning || Math.abs(ALLOC_POINTS - totalAllocated()) >= 0.001) return;
  state.laps = Number(lapCountSelect.value) || 2;
  state.raceDistance = TRACK_LENGTH * state.laps;

  const player = {
    id: "player",
    number: 1,
    name: horseName.value.trim() || "カスタムスター",
    stats: makeStats(state.allocations),
    strategy: strategySelect.value,
    color: colors[0],
    colorCss: colorCss[0],
    progress: 0,
    lane: 0,
    finishTime: null,
    wobble: Math.random() * 20,
    condition: randomCondition(),
    isPlayer: true,
  };

  const ai = aiNames.map((name, index) => {
    const allocations = generateAiAllocations(index);
    return {
      id: `ai-${index}`,
      number: index + 2,
      name,
      stats: makeStats(allocations),
      strategy: ["balanced", "front", "late", "inside", "balanced"][index],
      color: colors[index + 1],
      colorCss: colorCss[index + 1],
      progress: 0,
      lane: index + 1,
      finishTime: null,
      wobble: Math.random() * 20,
      condition: randomCondition(),
      isPlayer: false,
    };
  });

  state.racers = [player, ...ai];
  state.raceRunning = true;
  app.classList.add("racing");
  controlPanel.classList.add("racing");
  state.startedAt = performance.now();
  state.lastFrame = state.startedAt;
  state.cameraX = -135;
  racePhase.textContent = "レース中";
  distanceReadout.textContent = `1/${state.laps}周`;
  resultList.innerHTML = "";
  renderControls();
  renderLeaderboard();
  renderHorseLabels();
}

function paceFor(racer, ratio, now) {
  const { speed, stamina, power, corner, spirit } = racer.stats;
  const condition = racer.condition || conditionTable[2];
  const lapRatio = (racer.progress % TRACK_LENGTH) / TRACK_LENGTH;
  const bendLoad = 0.62 + Math.sin(lapRatio * Math.PI * 2) ** 2 * 0.38;
  let pace = 35 + speed * 3.65 + power * 1.1 + corner * 0.95 + spirit * 0.35;
  const staminaNeed = 4.7 + speed * 0.56 + power * 0.24;
  const staminaGap = Math.max(0, staminaNeed - stamina);
  const fatigue = Math.max(0, ratio - 0.3) ** 1.28 * staminaGap * 32 * condition.stamina;
  const lowStaminaWall = stamina <= 3.5 && ratio > 0.58 ? (ratio - 0.58) * speed * 24 : 0;
  const cornerNeed = speed * 0.74 + power * 0.34 + (racer.strategy === "inside" ? 0.5 : 0);
  const cornerGap = Math.max(0, cornerNeed - corner - 1.15);
  const cornerPenalty = cornerGap * (2.5 + speed * 0.18) * bendLoad;
  const composureGap = Math.max(0, 5.2 - spirit);
  const composurePenalty = composureGap * (1.3 + Math.max(0, ratio - 0.55) * 6.5);
  const finalKick = ratio > 0.76 ? (spirit - 4.2) * 4.2 * ((ratio - 0.76) / 0.24) * condition.finish : 0;
  const badBalancePenalty =
    Math.max(0, speed - stamina - 2.2) * Math.max(0, ratio - 0.45) * 10 +
    Math.max(0, speed - corner - 2.0) * bendLoad * 2.2 +
    Math.max(0, power - spirit - 2.4) * Math.max(0, ratio - 0.62) * 5;
  const rhythm = Math.sin(now * 0.0022 + racer.wobble) * (0.7 + (10 - spirit) * 0.16);

  if (racer.strategy === "front") pace += ratio < 0.38 ? 6 : -5.5;
  if (racer.strategy === "late") pace += ratio < 0.62 ? -4.5 : spirit * 0.95;
  if (racer.strategy === "inside") pace += corner * 0.7 - cornerGap * 3.2 - Math.max(0, ratio - 0.72) * 3;

  return Math.max(18, (pace - fatigue - lowStaminaWall - cornerPenalty - composurePenalty - badBalancePenalty + finalKick + rhythm) * condition.speed);
}

function update(now) {
  const dt = Math.min(0.05, (now - state.lastFrame) / 1000 || 0);
  state.lastFrame = now;

  if (state.raceRunning) {
    for (const racer of state.racers) {
      if (racer.finishTime !== null) continue;
      const ratio = racer.progress / state.raceDistance;
      racer.progress += paceFor(racer, ratio, now) * RACE_SPEED_SCALE * dt;
      if (racer.progress >= state.raceDistance) {
        racer.progress = state.raceDistance;
        racer.finishTime = (now - state.startedAt) / 1000;
      }
    }

    const leader = Math.max(...state.racers.map((racer) => racer.progress));
    const lap = Math.min(state.laps, Math.floor(leader / TRACK_LENGTH) + 1);
    const lapMeters = Math.round(leader % TRACK_LENGTH);
    distanceReadout.textContent = `${lap}/${state.laps}周 ${lapMeters}m`;
    renderLeaderboard();

    if (state.racers.every((racer) => racer.finishTime !== null)) finishRace();
  }

  render3d(now);
  requestAnimationFrame(update);
}

function finishRace() {
  state.raceRunning = false;
  app.classList.remove("racing");
  controlPanel.classList.remove("racing");
  racePhase.textContent = "確定";
  distanceReadout.textContent = "FINISH";
  renderControls();

  const results = [...state.racers].sort((a, b) => a.finishTime - b.finishTime);
  resultList.innerHTML = results
    .map((racer, index) => {
      const stats = statDefs.map((def) => `${def.label}${racer.stats[def.key].toFixed(2)}`).join(" / ");
      return `<li><strong>${index + 1}着 ${racer.number}番${racer.condition.emoji} ${escapeHtml(racer.name)}</strong><br>${racer.finishTime.toFixed(2)}秒　調子:${racer.condition.label}<br>${stats}</li>`;
    })
    .join("");
}

function renderLeaderboard() {
  const sorted = [...state.racers].sort((a, b) => b.progress - a.progress);
  leaderboard.innerHTML = sorted
    .map(
      (racer, index) => `
        <div class="leader-row">
          <span class="silk" style="background:${racer.colorCss}"></span>
          <span class="leader-name">${index + 1}位　${racer.number}番${racer.condition?.emoji || ""} ${escapeHtml(racer.name)}</span>
          <span class="leader-distance">${Math.min(state.laps, Math.floor(racer.progress / TRACK_LENGTH) + 1)}周</span>
        </div>
      `,
    )
    .join("");
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  gl.viewport(0, 0, canvas.width, canvas.height);
}

function render3d(now) {
  resize();
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);
  gl.uniform3f(loc.light, -0.35, 0.85, 0.45);

  const leader = state.racers.reduce((best, racer) => (racer.progress > best.progress ? racer : best), state.racers[0]);
  if (leader) {
    const leaderPos = trackPosition(leader.progress, leader.lane);
    const leaderX = leaderPos.x;
    state.cameraX += (leaderX - 26 - state.cameraX) * 0.035;
  }

  const aspect = canvas.width / canvas.height;
  const projection = m4Perspective(Math.PI / 4.2, aspect, 0.1, 600);
  const view = m4LookAt(
    [state.cameraX - 24, 42, 92],
    [state.cameraX + 20, 1.8, 0],
    [0, 1, 0],
  );
  const viewProjection = m4Multiply(projection, view);

  drawTrack(viewProjection);

  const sorted = [...state.racers].sort((a, b) => laneZ(a.lane) - laneZ(b.lane));
  for (const racer of sorted) drawHorse3d(viewProjection, racer, now);
  updateHorseLabelPositions(viewProjection);
}

function drawHorse3d(viewProjection, racer, now) {
  const pos = trackPosition(racer.progress, racer.lane);
  const yaw = pos.yaw;
  const effort = state.raceRunning ? 1 : 0.55;
  const gait = racer.progress * 0.115 + now * 0.0032 + racer.wobble;
  const cycle = normalizedCycle(gait / (Math.PI * 2));
  const stride = Math.sin(gait);
  const drive = Math.max(0, Math.sin(cycle * Math.PI * 2 + 0.65));
  const landing = Math.max(0, Math.sin(cycle * Math.PI * 2 - 1.15));
  const suspension = Math.max(0, Math.sin(cycle * Math.PI * 2 - 2.55)) ** 2;
  const gather = Math.max(0, Math.sin(cycle * Math.PI * 2 + 2.2));
  const bob = 0.08 + suspension * (0.34 + effort * 0.2) - landing * 0.08 + drive * 0.05;
  const bodyPitch = drive * (0.11 + effort * 0.07) - landing * (0.08 + effort * 0.05) + stride * 0.025;
  const stretch = 1 + suspension * 0.09 - gather * 0.045;
  const chestDrop = landing * 0.08 - suspension * 0.04;
  const neckPitch = -0.72 - drive * 0.16 + landing * 0.2 + suspension * 0.08;
  const headReach = suspension * 0.28 + drive * 0.12 - gather * 0.14;
  const color = racer.color;
  const highlight = color.map((value) => Math.min(1, value * 1.15 + 0.05));
  const dark = [0.08, 0.06, 0.05];
  const leather = [0.16, 0.1, 0.07];
  const riderSkin = [0.96, 0.86, 0.72];
  const riderSilk = highlight;

  drawHorsePart(viewProjection, pos, [-0.1, 1.22 + bob, 0], [2.9 * stretch, 0.86, 0.72], color, [0, yaw, bodyPitch]);
  drawHorsePart(viewProjection, pos, [-1.08 - gather * 0.06, 1.28 + bob + drive * 0.04, 0], [1.05, 0.78, 0.76], color, [0, yaw, bodyPitch - 0.1]);
  drawHorsePart(viewProjection, pos, [1.04 + suspension * 0.08, 1.34 + bob - chestDrop, 0], [0.98, 0.82, 0.68], highlight, [0, yaw, bodyPitch + 0.08]);
  drawHorsePart(viewProjection, pos, [1.5 + headReach * 0.18, 1.82 + bob - landing * 0.13, 0], [0.52, 1.22, 0.42], color, [0, yaw, neckPitch]);
  drawHorsePart(viewProjection, pos, [2.14 + headReach, 2.02 + bob - landing * 0.22, 0], [0.9, 0.42, 0.45], color, [0, yaw, -0.16 - drive * 0.1 + landing * 0.18]);
  drawHorsePart(viewProjection, pos, [2.6 + headReach, 1.88 + bob - landing * 0.24, 0], [0.36, 0.28, 0.32], color, [0, yaw, -0.28 - drive * 0.1 + landing * 0.12]);
  drawHorsePart(viewProjection, pos, [1.2 + headReach * 0.1, 2.02 + bob - landing * 0.12, 0], [0.14, 0.92, 0.14], dark, [0, yaw, neckPitch + 0.06]);
  drawHorsePart(viewProjection, pos, [2.22 + headReach, 2.34 + bob - landing * 0.16, -0.16], [0.14, 0.32, 0.1], dark, [0, yaw, 0.18]);
  drawHorsePart(viewProjection, pos, [2.22 + headReach, 2.34 + bob - landing * 0.16, 0.16], [0.14, 0.32, 0.1], dark, [0, yaw, 0.18]);
  drawHorsePart(viewProjection, pos, [-1.78 - suspension * 0.08, 1.42 + bob + drive * 0.18, 0], [0.22, 1.24, 0.22], dark, [0, yaw, 0.9 + drive * 0.38 - landing * 0.14]);

  drawHorsePart(viewProjection, pos, [-0.35, 1.76 + bob, 0], [1.0, 0.14, 0.8], leather, [0, yaw, bodyPitch]);
  drawHorsePart(viewProjection, pos, [-0.24, 2.0 + bob - suspension * 0.08, 0], [0.5, 0.64, 0.42], riderSilk, [0, yaw, 0.5 + bodyPitch + drive * 0.08]);
  drawHorsePart(viewProjection, pos, [-0.14, 2.47 + bob - suspension * 0.08, 0], [0.38, 0.38, 0.36], riderSkin);
  drawHorsePart(viewProjection, pos, [-0.13, 2.72 + bob - suspension * 0.08, 0], [0.5, 0.16, 0.42], riderSilk);
  drawHorsePart(viewProjection, pos, [-0.64, 1.7 + bob, -0.28], [0.16, 0.9, 0.14], leather, [0, yaw, 0.5 + drive * 0.16 - landing * 0.08]);
  drawHorsePart(viewProjection, pos, [-0.64, 1.7 + bob, 0.28], [0.16, 0.9, 0.14], leather, [0, yaw, -0.5 - drive * 0.16 + landing * 0.08]);

  const legs = [
    { x: -1.0, z: -0.28, phase: 0.0, rear: true },
    { x: -0.9, z: 0.28, phase: 0.12, rear: true },
    { x: 0.86, z: -0.28, phase: 0.46, rear: false },
    { x: 1.0, z: 0.28, phase: 0.58, rear: false },
  ];
  for (const leg of legs) {
    const pose = gallopLegPose(cycle, leg.phase, leg.rear, effort);
    const hip = [leg.x, 1.02 + bob * 0.14, leg.z];
    const knee = [leg.x + pose.kneeX, pose.kneeY + bob * 0.05, leg.z];
    const hoof = [leg.x + pose.hoofX, pose.hoofY, leg.z];
    drawHorsePart(viewProjection, pos, midpoint(hip, knee), [0.2, distance3(hip, knee), 0.16], dark, [0, yaw, pose.upperAngle]);
    drawHorsePart(viewProjection, pos, knee, [0.26, 0.2, 0.2], [0.11, 0.08, 0.06]);
    drawHorsePart(viewProjection, pos, midpoint(knee, hoof), [0.15, distance3(knee, hoof), 0.13], dark, [0, yaw, pose.lowerAngle]);
    drawHorsePart(viewProjection, pos, [hoof[0] + 0.08, hoof[1] - 0.02, hoof[2]], [0.38, 0.12, 0.22], [0.04, 0.035, 0.03]);
  }
}

function drawHorsePart(viewProjection, pos, offset, scale, color, rotation) {
  const translated = localToWorld(pos, offset);
  drawBox(viewProjection, translated, scale, color, rotation || [0, pos.yaw, 0]);
}

function drawBox(viewProjection, translation, scale, color, rotation = [0, 0, 0]) {
  let model = m4Identity();
  model = m4Translate(model, translation[0], translation[1], translation[2]);
  if (rotation[0]) model = m4RotateX(model, rotation[0]);
  if (rotation[1]) model = m4RotateY(model, rotation[1]);
  if (rotation[2]) model = m4RotateZ(model, rotation[2]);
  model = m4Scale(model, scale[0], scale[1], scale[2]);
  const matrix = m4Multiply(viewProjection, model);

  gl.bindBuffer(gl.ARRAY_BUFFER, meshBuffer.position);
  gl.enableVertexAttribArray(loc.position);
  gl.vertexAttribPointer(loc.position, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, meshBuffer.normal);
  gl.enableVertexAttribArray(loc.normal);
  gl.vertexAttribPointer(loc.normal, 3, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix4fv(loc.matrix, false, matrix);
  gl.uniformMatrix4fv(loc.model, false, model);
  gl.uniform3f(loc.color, color[0], color[1], color[2]);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function drawTrack(viewProjection) {
  drawEnvironment(viewProjection);
  drawBox(viewProjection, [0, -0.16, 0], [230, 0.14, 122], [0.14, 0.34, 0.24]);
  drawGrandstands(viewProjection);

  const segments = 192;
  drawOvalRing(viewProjection, TRACK_RX + 19, TRACK_RZ + 8, TRACK_RX - 20, TRACK_RZ - 8, [0.62, 0.34, 0.25], 0.02);
  for (let lane = 1; lane < 6; lane += 1) {
    const laneOffset = (lane - 2.5) * LANE_WIDTH;
    drawOvalRing(
      viewProjection,
      TRACK_RX + laneOffset + 0.13,
      TRACK_RZ + laneOffset * 0.42 + 0.13,
      TRACK_RX + laneOffset - 0.13,
      TRACK_RZ + laneOffset * 0.42 - 0.13,
      [0.82, 0.72, 0.56],
      0.08,
      segments,
    );
  }

  for (const railLane of [-1.2, 6.2]) {
    for (let i = 0; i < segments; i += 1) {
      const distance = (i / segments) * TRACK_LENGTH;
      const p = trackPosition(distance, railLane);
      drawBox(viewProjection, [p.x, 1.1, p.z], [3.9, 0.16, 0.16], [0.92, 0.88, 0.78], [0, p.yaw, 0]);
      if (i % 4 === 0) {
        drawBox(viewProjection, [p.x, 0.55, p.z], [0.13, 1.1, 0.13], [0.92, 0.88, 0.78]);
      }
    }
  }

  const finish = trackPosition(0, 2.4);
  drawBox(viewProjection, [finish.x, 0.18, finish.z], [0.5, 0.18, 34], [0.95, 0.92, 0.82], [0, finish.yaw, 0]);
  drawBox(viewProjection, [finish.x, 5.2, finish.z - 17], [0.55, 10, 0.55], [0.95, 0.92, 0.82]);
  drawBox(viewProjection, [finish.x, 5.2, finish.z + 17], [0.55, 10, 0.55], [0.95, 0.92, 0.82]);
}

function drawEnvironment(viewProjection) {
  drawBox(viewProjection, [0, -0.34, 0], [520, 0.08, 330], [0.18, 0.45, 0.3]);
  drawBox(viewProjection, [0, 0.06, 98], [440, 0.08, 54], [0.2, 0.5, 0.34]);
  drawBox(viewProjection, [0, 0.08, -122], [440, 0.08, 60], [0.17, 0.42, 0.3]);
  drawBox(viewProjection, [0, 18, -164], [520, 36, 1.2], [0.55, 0.72, 0.78]);
  drawBox(viewProjection, [0, 28, -165], [520, 10, 1.4], [0.68, 0.8, 0.83]);

  for (let x = -230; x <= 230; x += 18) {
    const h = 3.2 + ((x * x) % 9) * 0.18;
    drawBox(viewProjection, [x, h / 2, -108], [2.6, h, 2.6], [0.22, 0.15, 0.08]);
    drawBox(viewProjection, [x, h + 1.2, -108], [7.5, 4.2, 5.2], [0.08, 0.32, 0.16]);
  }

  for (let x = -180; x <= 180; x += 45) {
    drawBox(viewProjection, [x, 1.0, 116], [22, 2, 8], [0.48, 0.5, 0.5]);
    drawBox(viewProjection, [x, 2.4, 116], [24, 0.6, 9], [0.76, 0.78, 0.74]);
  }
}

function drawGrandstands(viewProjection) {
  drawBox(viewProjection, [0, 1.15, -82], [150, 2.3, 5.5], [0.2, 0.22, 0.25]);
  drawBox(viewProjection, [0, 2.35, -87], [158, 0.75, 8.5], [0.3, 0.32, 0.34], [0.12, 0, 0]);
  drawBox(viewProjection, [0, 3.35, -92], [166, 0.75, 9], [0.36, 0.38, 0.4], [0.12, 0, 0]);
  drawBox(viewProjection, [0, 4.25, -96], [174, 0.45, 12], [0.78, 0.8, 0.76], [0.08, 0, 0]);

  for (let x = -74; x <= 74; x += 8) {
    drawBox(viewProjection, [x, 2.8, -78], [0.28, 3.7, 0.28], [0.82, 0.82, 0.78]);
  }

  const crowdColors = [
    [0.9, 0.22, 0.18],
    [0.2, 0.52, 0.92],
    [0.95, 0.78, 0.25],
    [0.24, 0.72, 0.48],
    [0.86, 0.36, 0.82],
    [0.92, 0.92, 0.88],
  ];

  for (let row = 0; row < 5; row += 1) {
    for (let x = -72; x <= 72; x += 4) {
      const color = crowdColors[(row + Math.floor((x + 72) / 4)) % crowdColors.length];
      drawBox(viewProjection, [x, 1.65 + row * 0.42, -81 - row * 2], [0.8, 0.38, 0.55], color);
    }
  }

  for (let x = -82; x <= 82; x += 28) {
    drawBox(viewProjection, [x, 5.2, -92], [0.65, 7.2, 0.65], [0.62, 0.64, 0.62]);
    drawBox(viewProjection, [x, 9.05, -91.5], [5.4, 0.42, 1.8], [0.95, 0.9, 0.72]);
  }
}

function drawOvalRing(viewProjection, outerRx, outerRz, innerRx, innerRz, color, y, segments = 192) {
  const positions = [];
  const normals = [];
  for (let i = 0; i < segments; i += 1) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    const quad = [
      [Math.cos(a0) * outerRx, y, Math.sin(a0) * outerRz],
      [Math.cos(a1) * outerRx, y, Math.sin(a1) * outerRz],
      [Math.cos(a1) * innerRx, y, Math.sin(a1) * innerRz],
      [Math.cos(a0) * outerRx, y, Math.sin(a0) * outerRz],
      [Math.cos(a1) * innerRx, y, Math.sin(a1) * innerRz],
      [Math.cos(a0) * innerRx, y, Math.sin(a0) * innerRz],
    ];
    for (const point of quad) {
      positions.push(point[0], point[1], point[2]);
      normals.push(0, 1, 0);
    }
  }
  drawRawMesh(viewProjection, positions, normals, color);
}

function drawRawMesh(viewProjection, positions, normals, color) {
  const model = m4Identity();
  gl.bindBuffer(gl.ARRAY_BUFFER, meshBuffer.position);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(loc.position);
  gl.vertexAttribPointer(loc.position, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, meshBuffer.normal);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(loc.normal);
  gl.vertexAttribPointer(loc.normal, 3, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix4fv(loc.matrix, false, m4Multiply(viewProjection, model));
  gl.uniformMatrix4fv(loc.model, false, model);
  gl.uniform3f(loc.color, color[0], color[1], color[2]);
  gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);

  gl.bindBuffer(gl.ARRAY_BUFFER, meshBuffer.position);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.positions), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, meshBuffer.normal);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube.normals), gl.STATIC_DRAW);
}

function trackPosition(progress, lane) {
  const lapProgress = ((progress % TRACK_LENGTH) + TRACK_LENGTH) % TRACK_LENGTH;
  const angle = (lapProgress / TRACK_LENGTH) * Math.PI * 2 - Math.PI / 2;
  const laneOffset = (lane - 2.5) * LANE_WIDTH;
  const rx = TRACK_RX + laneOffset;
  const rz = TRACK_RZ + laneOffset * 0.42;
  const x = Math.cos(angle) * rx;
  const z = Math.sin(angle) * rz;
  const dx = -Math.sin(angle) * rx;
  const dz = Math.cos(angle) * rz;
  return { x, z, yaw: Math.atan2(-dz, dx), angle };
}

function localToWorld(pos, offset) {
  const c = Math.cos(pos.yaw);
  const s = Math.sin(pos.yaw);
  return [
    pos.x + offset[0] * c + offset[2] * s,
    offset[1],
    pos.z - offset[0] * s + offset[2] * c,
  ];
}

function gallopLegPose(cycle, offset, rear, effort) {
  const phase = normalizedCycle(cycle + offset);
  const reach = rear ? 0.72 : 0.86;
  const fold = rear ? 0.58 : 0.68;
  const jointBias = rear ? -0.18 : 0.16;
  let hoofX = 0;
  let hoofY = 0.08;
  let kneeX = jointBias;
  let kneeY = 0.6;

  if (phase < 0.24) {
    const t = phase / 0.24;
    hoofX = lerp(reach, -reach * 0.78, t);
    hoofY = 0.07;
    kneeX = hoofX * 0.38 + jointBias;
    kneeY = 0.54 - Math.sin(t * Math.PI) * (0.07 + effort * 0.03);
  } else if (phase < 0.38) {
    const t = (phase - 0.24) / 0.14;
    hoofX = lerp(-reach * 0.78, -reach * 0.36, t);
    hoofY = 0.08 + t * (0.14 + effort * 0.08);
    kneeX = lerp(-0.42, -0.12, t) + jointBias;
    kneeY = 0.55 + t * (0.28 + effort * 0.08);
  } else if (phase < 0.7) {
    const t = (phase - 0.38) / 0.32;
    const lift = Math.sin(t * Math.PI);
    hoofX = lerp(-reach * 0.36, reach * 0.34, t);
    hoofY = 0.16 + lift * fold * (1 + effort * 0.32);
    kneeX = lerp(-0.16, 0.32, t) + jointBias;
    kneeY = 0.72 + lift * (0.42 + effort * 0.12);
  } else {
    const t = (phase - 0.7) / 0.3;
    hoofX = lerp(reach * 0.34, reach, t);
    hoofY = 0.1 + Math.sin((1 - t) * Math.PI) * (0.24 + effort * 0.08);
    kneeX = lerp(0.36, reach * 0.34, t) + jointBias;
    kneeY = lerp(0.86, 0.6, t);
  }

  return {
    hoofX,
    hoofY,
    kneeX,
    kneeY,
    upperAngle: (rear ? -0.26 : 0.2) + (kneeX - hoofX) * 0.48,
    lowerAngle: (rear ? 0.42 : -0.38) + (hoofX - kneeX) * 0.66,
  };
}

function midpoint(a, b) {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
}

function distance3(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function normalizedCycle(value) {
  return ((value % 1) + 1) % 1;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function renderHorseLabels() {
  horseLabels.innerHTML = state.racers
    .map(
      (racer) => `
        <div class="horse-label ${racer.isPlayer ? "player" : ""}" data-racer-id="${racer.id}">
          <span class="horse-label-number">${racer.number}${racer.condition?.emoji || ""}</span>
          <span>${escapeHtml(racer.name)}</span>
        </div>
      `,
    )
    .join("");
}

function updateHorseLabelPositions(viewProjection) {
  const rect = canvas.getBoundingClientRect();
  for (const racer of state.racers) {
    const label = horseLabels.querySelector(`[data-racer-id="${racer.id}"]`);
    if (!label) continue;
    const pos = trackPosition(racer.progress, racer.lane);
    const point = projectWorld(viewProjection, [pos.x, 5.05, pos.z]);
    if (!point.visible) {
      label.style.display = "none";
      continue;
    }
    label.style.display = "flex";
    label.style.left = `${point.x * rect.width}px`;
    label.style.top = `${point.y * rect.height}px`;
  }
}

function projectWorld(matrix, point) {
  const x = point[0];
  const y = point[1];
  const z = point[2];
  const clipX = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
  const clipY = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
  const clipW = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
  if (clipW <= 0.01) return { visible: false, x: 0, y: 0 };
  const ndcX = clipX / clipW;
  const ndcY = clipY / clipW;
  return {
    visible: ndcX > -1.25 && ndcX < 1.25 && ndcY > -1.25 && ndcY < 1.25,
    x: ndcX * 0.5 + 0.5,
    y: -ndcY * 0.5 + 0.5,
  };
}

function laneZ(lane) {
  return -17.5 + lane * 7;
}

function roundPoint(value) {
  return Math.round(value * 100) / 100;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomCondition() {
  const totalWeight = conditionTable.reduce((sum, condition) => sum + condition.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const condition of conditionTable) {
    roll -= condition.weight;
    if (roll <= 0) return condition;
  }
  return conditionTable[2];
}

function seedIdleRace() {
  state.racers = [
    { id: "idle-0", number: 1, name: "カスタムスター", progress: 80, lane: 1, color: colors[0], colorCss: colorCss[0], wobble: 1.5, condition: conditionTable[2], isPlayer: true },
    { id: "idle-1", number: 2, name: "ミッドライン", progress: 45, lane: 3, color: colors[1], colorCss: colorCss[1], wobble: 5.2, condition: conditionTable[2], isPlayer: false },
    { id: "idle-2", number: 3, name: "クロガネロード", progress: 18, lane: 4, color: colors[2], colorCss: colorCss[2], wobble: 8.1, condition: conditionTable[2], isPlayer: false },
  ];
  renderLeaderboard();
  renderHorseLabels();
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[char];
  });
}

function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "Shader compile failed");
  }
  return shader;
}

function createProgram(vertexSource, fragmentSource) {
  const createdProgram = gl.createProgram();
  gl.attachShader(createdProgram, createShader(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(createdProgram, createShader(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(createdProgram);
  if (!gl.getProgramParameter(createdProgram, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(createdProgram) || "Program link failed");
  }
  return createdProgram;
}

function createCube() {
  const positions = [
    -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    0.5, -0.5, -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5,
    -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,
    0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5,
    -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5,
  ];
  const normals = [];
  const faceNormals = [
    [0, 0, 1],
    [0, 0, -1],
    [0, 1, 0],
    [0, -1, 0],
    [1, 0, 0],
    [-1, 0, 0],
  ];
  for (const normal of faceNormals) {
    for (let i = 0; i < 6; i += 1) normals.push(...normal);
  }
  return { positions, normals };
}

function m4Identity() {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function m4Multiply(a, b) {
  const out = new Float32Array(16);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      out[col * 4 + row] =
        a[0 * 4 + row] * b[col * 4 + 0] +
        a[1 * 4 + row] * b[col * 4 + 1] +
        a[2 * 4 + row] * b[col * 4 + 2] +
        a[3 * 4 + row] * b[col * 4 + 3];
    }
  }
  return out;
}

function m4Translate(m, x, y, z) {
  return m4Multiply(m, new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]));
}

function m4Scale(m, x, y, z) {
  return m4Multiply(m, new Float32Array([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]));
}

function m4RotateX(m, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return m4Multiply(m, new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]));
}

function m4RotateY(m, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return m4Multiply(m, new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]));
}

function m4RotateZ(m, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return m4Multiply(m, new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));
}

function m4Perspective(fov, aspect, near, far) {
  const f = 1 / Math.tan(fov / 2);
  const rangeInv = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0,
  ]);
}

function m4LookAt(eye, target, up) {
  const zAxis = normalize([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
  const xAxis = normalize(cross(up, zAxis));
  const yAxis = cross(zAxis, xAxis);
  return new Float32Array([
    xAxis[0], yAxis[0], zAxis[0], 0,
    xAxis[1], yAxis[1], zAxis[1], 0,
    xAxis[2], yAxis[2], zAxis[2], 0,
    -dot(xAxis, eye), -dot(yAxis, eye), -dot(zAxis, eye), 1,
  ]);
}

function normalize(v) {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}

function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

randomizeBtn.addEventListener("click", randomizePlayer);
startBtn.addEventListener("click", startRace);
window.addEventListener("resize", resize);
window.addEventListener("gesturestart", preventZoom, { passive: false });
window.addEventListener("gesturechange", preventZoom, { passive: false });
window.addEventListener("gestureend", preventZoom, { passive: false });
window.addEventListener("dblclick", preventZoom, { passive: false });
window.addEventListener(
  "wheel",
  (event) => {
    if (event.ctrlKey) event.preventDefault();
  },
  { passive: false },
);
window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && ["+", "-", "=", "0"].includes(event.key)) {
    event.preventDefault();
  }
});
document.addEventListener(
  "touchmove",
  (event) => {
    if (event.touches.length > 1) event.preventDefault();
  },
  { passive: false },
);

buildStatControls();
renderControls();
seedIdleRace();
resize();
requestAnimationFrame(update);

function preventZoom(event) {
  event.preventDefault();
}
