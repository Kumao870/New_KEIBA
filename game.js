const ALLOC_POINTS = 24;
const ALLOC_STEP = 0.01;
const BASE_STAT = 1;
const MAX_STAT = 10;
const TRACK_LENGTH = 1650;
const TRACK_RX = 188;
const TRACK_RZ = 88;
const TOTAL_HORSES = 18;
const LANE_WIDTH = 1.18;
const TRACK_MARGIN = 17;
const RACE_SPEED_SCALE = 0.42;
const INTRO_TITLE_MS = 2200;
const LINEUP_WALK_MS = 14000;
const LINEUP_READY_MS = 1500;
const MATCH_NAME_MAX = 12;

const statDefs = [
  { key: "speed", label: "スピード", description: "最高速度と直線の伸びに影響。高すぎるとスタミナやコーナー不足で失速しやすい。" },
  { key: "stamina", label: "スタミナ", description: "中盤以降の粘りと長距離適性に影響。低いと最後の直線で脚が鈍る。" },
  { key: "power", label: "パワー", description: "加速、坂、重い馬場での踏ん張りに影響。道悪や追い比べで効きやすい。" },
  { key: "corner", label: "コーナー", description: "カーブで減速しにくくなる。低いと速い馬ほどコーナーでロスが出る。" },
  { key: "spirit", label: "勝負根性", description: "終盤の競り合い、追い込み、接戦でのもうひと伸びに影響。" },
];

const bibColors = [
  [0.89, 0.77, 0.42],
  [0.4, 0.76, 0.69],
  [0.85, 0.41, 0.33],
  [0.42, 0.56, 0.85],
  [0.78, 0.48, 0.85],
  [0.94, 0.94, 0.9],
];
const bibColorCss = ["#e4c56a", "#65c3b1", "#d96854", "#6c8ed8", "#c77bd8", "#f0f0ec"];
const horseCoatColors = [
  [0.3, 0.15, 0.08],
  [0.22, 0.11, 0.06],
  [0.42, 0.2, 0.1],
  [0.14, 0.1, 0.08],
  [0.5, 0.46, 0.39],
  [0.34, 0.18, 0.09],
];
const bibDigitSegments = {
  0: ["a", "b", "c", "d", "e", "f"],
  1: ["b", "c"],
  2: ["a", "b", "g", "e", "d"],
  3: ["a", "b", "g", "c", "d"],
  4: ["f", "g", "b", "c"],
  5: ["a", "f", "g", "c", "d"],
  6: ["a", "f", "g", "e", "c", "d"],
  7: ["a", "b", "c"],
  8: ["a", "b", "c", "d", "e", "f", "g"],
  9: ["a", "b", "c", "d", "f", "g"],
};
const aiNames = [
  "ミッドライン",
  "アオバスプリント",
  "クロガネロード",
  "セブンベル",
  "ハヤテノヴェール",
  "サクラリズム",
  "ホクトブレイズ",
  "ツキカゲランナー",
  "シラユキテイル",
  "オーシャンビート",
  "カゼノグラン",
  "ノーブルターフ",
  "ライジングベル",
  "トウカイメテオ",
  "グリーンアロー",
  "スターリーフ",
  "ダイチノソラ",
];
const conditionTable = [
  { label: "絶好調", emoji: "🔥", speed: 1.08, stamina: 0.94, finish: 1.1, weight: 12 },
  { label: "好調", emoji: "😊", speed: 1.04, stamina: 0.97, finish: 1.05, weight: 22 },
  { label: "普通", emoji: "➖", speed: 1, stamina: 1, finish: 1, weight: 34 },
  { label: "不調", emoji: "💧", speed: 0.96, stamina: 1.05, finish: 0.94, weight: 22 },
  { label: "絶不調", emoji: "💀", speed: 0.92, stamina: 1.1, finish: 0.88, weight: 10 },
];
const trackConditions = {
  firm: { label: "良", speed: 1.03, power: 0.96, stamina: 1, corner: 1.02, turf: [0.28, 0.58, 0.32] },
  good: { label: "稍重", speed: 1, power: 1, stamina: 1.02, corner: 1, turf: [0.24, 0.52, 0.3] },
  soft: { label: "重", speed: 0.96, power: 1.08, stamina: 1.06, corner: 0.96, turf: [0.2, 0.44, 0.27] },
  heavy: { label: "不良", speed: 0.92, power: 1.16, stamina: 1.1, corner: 0.92, turf: [0.16, 0.36, 0.24] },
};
const distanceTypes = {
  sprint: { label: "短距離", laps: 1, speed: 1.1, stamina: 0.88, finish: 0.86 },
  mile: { label: "マイル", laps: 2, speed: 1.04, stamina: 0.96, finish: 0.98 },
  middle: { label: "中距離", laps: 2, speed: 1, stamina: 1, finish: 1.06 },
  long: { label: "長距離", laps: 3, speed: 0.94, stamina: 1.16, finish: 1.16 },
};
const traitDefs = {
  finish: { label: "末脚" },
  mud: { label: "道悪適性" },
  corner: { label: "コーナー巧者" },
  start: { label: "スタート上手" },
  hill: { label: "坂適性" },
};
const styleLabels = { front: "逃げ", stalker: "先行", closer: "差し", deep: "追込" };
const commentaryBanks = {
  entry: [
    "各馬、本馬場へ向かいます。",
    "ゆっくりとスタート地点へ向かっていきます。",
    "気配を見せながら、各馬がゲート前へ進みます。",
    "落ち着いた歩様で、発走地点へ入っていきます。",
    "スタンドの前を通って、各馬が整列に向かいます。",
  ],
  ready: [
    "全馬がスタートラインにそろいました。",
    "態勢完了、まもなく発走です。",
    "静かな一瞬、スタートの時を待ちます。",
    "各馬ぴたりと止まって、発走を待ちます。",
  ],
  start: [
    "スタートしました！",
    "一斉に飛び出しました！",
    "各馬きれいなスタートです！",
    "いま発走、芝コースの勝負が始まりました！",
  ],
  earlyClose: [
    "{leader}と{second}、序盤からほとんど並んでいます。",
    "先頭争いは{leader}、{second}もぴったり続きます。",
    "まだ隊列は固まりません、{leader}と{second}が接近。",
    "前は横一線、{leader}と{second}が譲りません。",
    "序盤から接戦、先頭はわずかに{leader}。",
  ],
  earlyLeader: [
    "{leader}がスッと前へ出ました。",
    "{leader}が軽快に先頭を取ります。",
    "まずは{leader}がレースを作る形。",
    "{leader}、無理なく先手を奪いました。",
    "先頭は{leader}、後続を少し引き連れます。",
  ],
  middle: [
    "向こう正面、各馬まだ脚をためています。",
    "中盤に入って、隊列は大きく崩れていません。",
    "ここは我慢比べ、スタミナが問われる時間帯です。",
    "先頭から最後方まで大きな差はありません。",
    "ペースは落ち着きましたが、各馬いつでも動ける位置。",
    "馬場の真ん中を使って、リズムよく進んでいます。",
    "{leader}が先頭、{third}も射程圏にいます。",
    "中団勢も差を詰めるタイミングをうかがいます。",
  ],
  corner: [
    "コーナーに入りました、ここで器用さが問われます。",
    "カーブを回って、各馬の位置取りが重要になります。",
    "{leader}がコーナーをうまく回っています。",
    "{second}、外からじわっと進出。",
    "内を通る馬、外へ持ち出す馬、ここから動きが出ます。",
    "コーナー巧者が力を見せる場面です。",
    "前の馬群が少し詰まってきました。",
  ],
  finalTurn: [
    "最終コーナー、ここから勝負どころです！",
    "さあ直線へ向きます、各馬スパート体勢！",
    "最終コーナーを回って、ゴールへ向かいます！",
    "手応えはどうか、最後の直線に入ります！",
    "{leader}先頭で直線へ、後ろから{second}！",
  ],
  straightClose: [
    "ゴール前、まだ分からない！",
    "{leader}と{second}、完全に並んだ！",
    "残りわずか、先頭争いは大接戦！",
    "外から{second}、内で{leader}が粘る！",
    "差はありません、最後のひと伸び勝負！",
    "場内が沸く、横一線の叩き合い！",
    "{third}も迫ってきた、三つ巴です！",
    "これは写真判定級の接戦になるか！",
  ],
  straightLeader: [
    "{leader}、先頭で粘っています！",
    "{leader}が押し切りを狙う！",
    "後続との差を保って、{leader}がゴールへ！",
    "{leader}、脚色はまだ鈍っていません！",
    "先頭{leader}、最後まで集中しています！",
  ],
  chase: [
    "外から{charger}が伸びてきた！",
    "{charger}、ここで一気に加速！",
    "後方から{charger}、すごい脚です！",
    "{charger}が馬群を割って上がってきます！",
    "末脚炸裂、{charger}が差を詰める！",
    "{charger}、残りわずかで猛追！",
    "大外から{charger}、勢いがあります！",
  ],
  condition: [
    "今日の芝は{track}、パワーとリズムが大事です。",
    "芝は{track}発表、この馬場を味方につけるのはどの馬か。",
    "{track}の馬場、最後まで脚を残せるかが鍵です。",
    "馬場状態は{track}、得意不得意が出そうです。",
  ],
  style: [
    "{leader}は{style}の形で運んでいます。",
    "{leader}、作戦通りの{style}でしょうか。",
    "{style}を選んだ{leader}、ここまでは落ち着いたレース。",
    "{leader}は{style}らしく、勝負どころを待っています。",
  ],
  finish: [
    "{winner}が先頭でゴール！",
    "勝ったのは{winner}！",
    "{winner}、見事に押し切りました！",
    "{winner}が激戦を制しました！",
    "最後に抜け出した{winner}、堂々の勝利です！",
  ],
};

const state = {
  allocations: { speed: 5, stamina: 5, power: 5, corner: 5, spirit: 4 },
  racers: [],
  raceRunning: false,
  laps: 2,
  raceDistance: TRACK_LENGTH * 2,
  startedAt: 0,
  introStartedAt: 0,
  raceStartAt: 0,
  lineupReadyAt: 0,
  raceStarted: false,
  matchName: "エキチューンダービー",
  trackCondition: trackConditions.firm,
  distanceType: distanceTypes.middle,
  commentary: "",
  lastCommentAt: 0,
  lastCommentaryText: "",
  labelsVisible: true,
  sectionReports: [],
  showStartErrors: false,
  lastFrame: 0,
  cameraX: -135,
  cameraZ: 0,
  horseRenderScale: 1,
};

const statList = document.querySelector("#statList");
const budgetLeft = document.querySelector("#budgetLeft");
const startBtn = document.querySelector("#startBtn");
const randomizeBtn = document.querySelector("#randomizeBtn");
const lapCountSelect = document.querySelector("#lapCount");
const distanceTypeSelect = document.querySelector("#distanceType");
const trackConditionPreview = document.querySelector("#trackConditionPreview");
const runningStyleSelect = document.querySelector("#runningStyle");
const traitSelect = document.querySelector("#traitSelect");
const voiceToggle = document.querySelector("#voiceToggle");
const labelToggle = document.querySelector("#labelToggle");
const matchName = document.querySelector("#matchName");
const matchSuffix = document.querySelector("#matchSuffix");
const matchNameCount = document.querySelector("#matchNameCount");
const horseName = document.querySelector("#horseName");
const matchNameMessage = document.querySelector("#matchNameMessage");
const horseNameMessage = document.querySelector("#horseNameMessage");
const budgetMessage = document.querySelector("#budgetMessage");
const racePhase = document.querySelector("#racePhase");
const distanceReadout = document.querySelector("#distanceReadout");
const leaderboard = document.querySelector("#leaderboard");
const raceMeta = document.querySelector("#raceMeta");
const commentary = document.querySelector("#commentary");
const resultDetail = document.querySelector("#resultDetail");
const canvas = document.querySelector("#raceCanvas");
const horseLabels = document.querySelector("#horseLabels");
const raceIntro = document.querySelector("#raceIntro");
const raceIntroTitle = document.querySelector("#raceIntroTitle");
const raceIntroCountdown = document.querySelector("#raceIntroCountdown");
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
      <p class="stat-description">${def.description}</p>
      <div class="stat-actions">
        <button type="button" class="stat-step" data-step="${def.key}" data-delta="-${ALLOC_STEP}" aria-label="${def.label}を下げる">-</button>
        <input type="range" min="0" max="${MAX_STAT - BASE_STAT}" step="${ALLOC_STEP}" data-range="${def.key}" aria-label="${def.label}の割り振り" />
        <input type="number" min="0" max="${MAX_STAT - BASE_STAT}" step="${ALLOC_STEP}" data-input="${def.key}" aria-label="${def.label}に割り振るポイント" />
        <button type="button" class="stat-step" data-step="${def.key}" data-delta="${ALLOC_STEP}" aria-label="${def.label}を上げる">+</button>
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

  statList.addEventListener("click", (event) => {
    const target = event.target;
    const key = target.dataset.step;
    if (!key || state.raceRunning) return;
    setAllocation(key, state.allocations[key] + Number(target.dataset.delta));
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
  matchNameCount.textContent = `${matchName.value.trim().length}/${MATCH_NAME_MAX}`;
  budgetLeft.style.color = Math.abs(remaining) < 0.001 ? "var(--accent)" : "var(--danger)";

  for (const def of statDefs) {
    const value = statValue(def.key);
    const range = document.querySelector(`[data-range="${def.key}"]`);
    const input = document.querySelector(`[data-input="${def.key}"]`);
    const steps = document.querySelectorAll(`[data-step="${def.key}"]`);
    document.querySelector(`[data-value="${def.key}"]`).textContent = value.toFixed(2);
    range.max = (MAX_STAT - BASE_STAT).toFixed(2);
    range.value = state.allocations[def.key].toFixed(2);
    range.disabled = state.raceRunning;
    input.max = (MAX_STAT - BASE_STAT).toFixed(2);
    input.value = state.allocations[def.key].toFixed(2);
    input.disabled = state.raceRunning;
    steps.forEach((step) => {
      step.disabled = state.raceRunning;
    });
  }

  const startIssues = getStartIssues(remaining);
  startBtn.disabled = state.raceRunning;
  randomizeBtn.disabled = state.raceRunning;
  lapCountSelect.disabled = state.raceRunning;
  distanceTypeSelect.disabled = state.raceRunning;
  runningStyleSelect.disabled = state.raceRunning;
  traitSelect.disabled = state.raceRunning;
  matchName.disabled = state.raceRunning;
  matchSuffix.disabled = state.raceRunning;
  trackConditionPreview.textContent = `芝:${state.trackCondition.label}`;
  renderStartIssues(startIssues);
}

function buildMatchName() {
  const base = matchName.value.trim();
  const suffix = matchSuffix.value;
  return `${base}${suffix}`;
}

function getStartIssues(remaining = roundPoint(ALLOC_POINTS - totalAllocated())) {
  const baseNameLength = matchName.value.trim().length;
  return {
    match:
      baseNameLength === 0
        ? "試合名を入力してください。"
        : baseNameLength > MATCH_NAME_MAX
          ? `試合名は${MATCH_NAME_MAX}文字以内にしてください。`
          : "",
    horse: horseName.value.trim().length === 0 ? "馬名を入力してください。" : "",
    budget: Math.abs(remaining) >= 0.001 ? "残りポイントを0.00にしてください。" : "",
  };
}

function hasStartIssues(issues) {
  return Boolean(issues.match || issues.horse || issues.budget);
}

function setFieldIssue(element, messageElement, message) {
  const show = state.showStartErrors && Boolean(message);
  element.toggleAttribute("aria-invalid", show);
  messageElement.textContent = show ? message : "";
  messageElement.hidden = !show;
}

function renderStartIssues(issues) {
  setFieldIssue(matchName, matchNameMessage, issues.match);
  setFieldIssue(horseName, horseNameMessage, issues.horse);
  const showBudget = state.showStartErrors && Boolean(issues.budget);
  budgetMessage.textContent = showBudget ? issues.budget : "";
  budgetMessage.hidden = !showBudget;
  budgetLeft.toggleAttribute("aria-invalid", showBudget);
  statList.toggleAttribute("aria-invalid", showBudget);
}

function focusFirstStartIssue(issues) {
  let target = null;
  if (issues.match) target = matchName;
  else if (issues.horse) target = horseName;
  else if (issues.budget) target = document.querySelector("[data-range]") || statList;

  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  if (typeof target.focus === "function") {
    window.setTimeout(() => target.focus({ preventScroll: true }), 240);
  }
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

function randomTrackCondition() {
  const keys = ["firm", "good", "soft", "heavy"];
  return trackConditions[keys[Math.floor(Math.random() * keys.length)]];
}

function bibColorForNumber(number) {
  return bibColors[(number - 1) % bibColors.length];
}

function bibCssForNumber(number) {
  return bibColorCss[(number - 1) % bibColorCss.length];
}

function startReactionDelay(trait) {
  const base = Math.random() * 0.95;
  return Math.max(0, base - (trait === "start" ? 0.35 : 0));
}

function updateRaceMeta() {
  raceMeta.innerHTML = state.raceRunning
    ? `<span>${escapeHtml(state.matchName)}</span><span>${state.distanceType.label}</span><span>芝:${state.trackCondition.label}</span><span>自動カメラ</span>`
    : "";
}

function updateCommentary(text) {
  const liveText = compactCommentary(text);
  state.commentary = liveText;
  commentary.textContent = liveText;
  speakCommentary(liveText);
}

function horseCall(racer) {
  return `${racer.number}番${racer.name}`;
}

function fillCommentaryTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
}

function pickCommentary(lines, values = {}) {
  const candidates = lines.map((line) => fillCommentaryTemplate(line, values));
  const fresh = candidates.filter((line) => line !== state.lastCommentaryText);
  const pool = fresh.length ? fresh : candidates;
  const text = pool[Math.floor(Math.random() * pool.length)];
  state.lastCommentaryText = text;
  return text;
}

function compactCommentary(text) {
  return text
    .replace(/ほとんど/g, "")
    .replace(/じわっと/g, "")
    .replace(/まもなく/g, "")
    .replace(/です。/g, "。")
    .replace(/ます。/g, "る。")
    .replace(/、/g, "、")
    .slice(0, 42);
}

function speakCommentary(text) {
  if (!voiceToggle.checked || !("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 1.42;
  utterance.pitch = 1.05;
  utterance.volume = 0.95;
  window.speechSynthesis.speak(utterance);
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
  const playerName = horseName.value.trim();
  state.showStartErrors = true;
  const startIssues = getStartIssues();
  if (state.raceRunning || hasStartIssues(startIssues)) {
    renderControls();
    focusFirstStartIssue(startIssues);
    return;
  }
  state.showStartErrors = false;
  state.distanceType = distanceTypes[distanceTypeSelect.value] || distanceTypes.middle;
  state.commentary = "";
  state.lastCommentAt = 0;
  state.lastCommentaryText = "";
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  state.labelsVisible = labelToggle.checked;
  state.sectionReports = [];
  state.laps = Number(lapCountSelect.value) || 2;
  state.raceDistance = TRACK_LENGTH * state.laps;
  state.matchName = buildMatchName();

  const player = {
    id: "player",
    number: 1,
    name: playerName,
    stats: makeStats(state.allocations),
    strategy: runningStyleSelect.value,
    trait: traitSelect.value,
    coatColor: horseCoatColors[0],
    bibColor: bibColorForNumber(1),
    bibColorCss: bibCssForNumber(1),
    progress: 0,
    lane: 0,
    finishTime: null,
    wobble: Math.random() * 20,
    lineupOffset: 0,
    lineupDuration: LINEUP_WALK_MS * 0.95,
    startDelay: startReactionDelay(traitSelect.value),
    segmentProgress: [],
    condition: randomCondition(),
    isPlayer: true,
  };

  const ai = aiNames.slice(0, TOTAL_HORSES - 1).map((name, index) => {
    const allocations = generateAiAllocations(index);
    const number = index + 2;
    const trait = ["start", "corner", "finish", "mud", "hill"][index % 5];
    return {
      id: `ai-${index}`,
      number,
      name,
      stats: makeStats(allocations),
      strategy: ["front", "stalker", "closer", "deep", "stalker"][index % 5],
      trait,
      coatColor: horseCoatColors[(index + 1) % horseCoatColors.length],
      bibColor: bibColorForNumber(number),
      bibColorCss: bibCssForNumber(number),
      progress: 0,
      lane: index + 1,
      finishTime: null,
      wobble: Math.random() * 20,
      lineupOffset: (Math.random() - 0.5) * 10,
      lineupDuration: LINEUP_WALK_MS * (0.82 + Math.random() * 0.32),
      startDelay: startReactionDelay(trait),
      segmentProgress: [],
      condition: randomCondition(),
      isPlayer: false,
    };
  });

  state.racers = [player, ...ai];
  state.raceRunning = true;
  state.raceStarted = false;
  app.classList.add("racing");
  controlPanel.classList.add("racing");
  state.introStartedAt = performance.now();
  state.raceStartAt = 0;
  state.lineupReadyAt = 0;
  state.startedAt = 0;
  state.lastFrame = state.introStartedAt;
  state.cameraX = -270;
  state.cameraZ = 0;
  racePhase.textContent = "開幕演出";
  distanceReadout.textContent = "発走前";
  raceIntroTitle.textContent = state.matchName;
  raceIntroCountdown.textContent = "";
  raceIntro.classList.add("active");
  raceIntro.classList.remove("countdown");
  renderControls();
  leaderboard.innerHTML = "";
  resultDetail.hidden = true;
  resultDetail.innerHTML = "";
  updateRaceMeta();
  updateCommentary(pickCommentary(commentaryBanks.entry));
  renderHorseLabels();
}

function paceFor(racer, ratio, now) {
  const { speed, stamina, power, corner, spirit } = racer.stats;
  const condition = racer.condition || conditionTable[2];
  const track = state.trackCondition || trackConditions.firm;
  const distance = state.distanceType || distanceTypes.middle;
  const lapRatio = (racer.progress % TRACK_LENGTH) / TRACK_LENGTH;
  const bendLoad = 0.62 + Math.sin(lapRatio * Math.PI * 2) ** 2 * 0.38;
  const mudBonus = racer.trait === "mud" && (track === trackConditions.soft || track === trackConditions.heavy) ? 1.08 : 1;
  const cornerBonus = racer.trait === "corner" ? 1.09 : 1;
  const hillBonus = racer.trait === "hill" && ratio > 0.58 && ratio < 0.82 ? 1.06 : 1;
  let pace =
    32 +
    speed * 3.05 * distance.speed * track.speed +
    stamina * 0.45 * distance.stamina +
    power * 0.9 * track.power * mudBonus * hillBonus +
    corner * 0.82 * track.corner * cornerBonus +
    spirit * 0.48;
  const staminaNeed = 4.7 + speed * 0.56 + power * 0.24;
  const staminaGap = Math.max(0, staminaNeed - stamina);
  const fatigue = Math.max(0, ratio - 0.45) ** 1.42 * staminaGap * 21 * condition.stamina * track.stamina * distance.stamina;
  const lowStaminaWall = stamina <= 3.5 && ratio > 0.68 ? (ratio - 0.68) * speed * 18 : 0;
  const cornerNeed = speed * 0.74 + power * 0.34 + (racer.strategy === "front" ? 0.36 : 0);
  const cornerGap = Math.max(0, cornerNeed - corner - 1.15);
  const cornerPenalty = cornerGap * (2.5 + speed * 0.18) * bendLoad;
  const composureGap = Math.max(0, 5.2 - spirit);
  const composurePenalty = composureGap * (1.0 + Math.max(0, ratio - 0.62) * 4.8);
  const finalRatio = ratio > 0.68 ? (ratio - 0.68) / 0.32 : 0;
  const finalKick =
    finalRatio > 0
      ? (speed * 0.55 + power * 0.34 + spirit * 0.92 + Math.max(0, stamina - 4) * 0.46) *
        4.8 *
        finalRatio ** 1.28 *
        condition.finish *
        distance.finish *
        (racer.trait === "finish" ? 1.22 : 1)
      : 0;
  const badBalancePenalty =
    Math.max(0, speed - stamina - 2.2) * Math.max(0, ratio - 0.45) * 10 +
    Math.max(0, speed - corner - 2.0) * bendLoad * 2.2 +
    Math.max(0, power - spirit - 2.4) * Math.max(0, ratio - 0.62) * 5;
  const rhythm = Math.sin(now * 0.0022 + racer.wobble) * (0.45 + (10 - spirit) * 0.1);
  const earlyControl = ratio < 0.28 ? -3.4 * (1 - ratio / 0.28) : 0;
  const cruiseControl = ratio > 0.28 && ratio < 0.62 ? -1.25 : 0;

  pace += earlyControl + cruiseControl;
  if (racer.strategy === "front") pace += ratio < 0.34 ? 3.2 : ratio > 0.72 ? -2.7 : -0.8;
  if (racer.strategy === "stalker") pace += ratio < 0.55 ? 0.8 : finalRatio * 2.4;
  if (racer.strategy === "closer") pace += ratio < 0.62 ? -2.2 : spirit * 1.05 + speed * 0.36;
  if (racer.strategy === "deep") pace += ratio < 0.72 ? -3.4 : spirit * 1.55 + speed * 0.5;

  return Math.max(18, (pace - fatigue - lowStaminaWall - cornerPenalty - composurePenalty - badBalancePenalty + finalKick + rhythm) * condition.speed);
}

function update(now) {
  const dt = Math.min(0.05, (now - state.lastFrame) / 1000 || 0);
  state.lastFrame = now;

  if (state.raceRunning) {
    const introElapsed = now - state.introStartedAt;
    if (!state.raceStarted) {
      const lineupRatio = clamp(introElapsed / LINEUP_WALK_MS, 0, 1);

      for (const racer of state.racers) {
        const startOffset = -48 - racer.lane * 0.8 + racer.lineupOffset;
        const personalRatio = clamp(introElapsed / racer.lineupDuration, 0, 1);
        racer.displayProgress = lerp(startOffset, 0, personalRatio);
        racer.walking = personalRatio < 1;
      }
      const allLinedUp = state.racers.every((racer) => !racer.walking);
      if (allLinedUp && !state.lineupReadyAt) {
        state.lineupReadyAt = now;
        state.raceStartAt = now + LINEUP_READY_MS;
        updateCommentary(pickCommentary(commentaryBanks.ready));
      }

      if (introElapsed < INTRO_TITLE_MS) {
        raceIntro.classList.add("active");
        raceIntro.classList.remove("countdown");
        racePhase.textContent = "開幕演出";
        raceIntroTitle.textContent = state.matchName;
        raceIntroCountdown.textContent = "";
        distanceReadout.textContent = "発走前";
      } else {
        raceIntro.classList.remove("active");
        raceIntro.classList.remove("countdown");
        if (!allLinedUp) {
          racePhase.textContent = "本馬場入場";
          distanceReadout.textContent = "整列中";
        } else {
          racePhase.textContent = "発走待機";
          distanceReadout.textContent = "まもなく発走";
        }
      }

      if (state.raceStartAt && now >= state.raceStartAt) {
        state.raceStarted = true;
        state.startedAt = now;
        state.lastCommentAt = now;
        for (const racer of state.racers) {
          racer.progress = 0;
          delete racer.displayProgress;
          racer.walking = false;
        }
        raceIntro.classList.remove("active");
        raceIntro.classList.remove("countdown");
        racePhase.textContent = "レース中";
        distanceReadout.textContent = `1/${state.laps}周 0m`;
        updateCommentary(pickCommentary(commentaryBanks.start));
        renderLeaderboard();
      }
    } else {
      const leaderBeforeUpdate = Math.max(...state.racers.map((racer) => racer.progress));
      for (const racer of state.racers) {
        if (racer.finishTime !== null) continue;
        const elapsedRace = (now - state.startedAt) / 1000;
        if (elapsedRace < racer.startDelay) continue;
        const ratio = racer.progress / state.raceDistance;
        const gap = leaderBeforeUpdate - racer.progress;
        const finalChase = ratio > 0.72 ? (ratio - 0.72) / 0.28 : 0;
        const packPull = Math.min(3.8 + finalChase * 3.2, Math.max(0, gap - 2) * (0.055 + finalChase * 0.055));
        const leaderDrag = gap < 0.2 && leaderBeforeUpdate > 80 ? 0.8 + finalChase * 1.1 : 0;
        const pace = paceFor(racer, ratio, now) + packPull - leaderDrag;
        racer.progress += pace * RACE_SPEED_SCALE * dt;
        recordSegments(racer);
        if (racer.progress >= state.raceDistance) {
          racer.progress = state.raceDistance;
          racer.finishTime = (now - state.startedAt) / 1000;
        }
      }
      recordSectionReports();

      const leader = Math.max(...state.racers.map((racer) => racer.progress));
      updateRaceCommentary(now);
      const lap = Math.min(state.laps, Math.floor(leader / TRACK_LENGTH) + 1);
      const lapMeters = Math.round(leader % TRACK_LENGTH);
      distanceReadout.textContent = `${lap}/${state.laps}周 ${lapMeters}m`;
      renderLeaderboard();

      if (state.racers.every((racer) => racer.finishTime !== null)) finishRace();
    }
  }

  render3d(now);
  requestAnimationFrame(update);
}

function finishRace() {
  state.raceRunning = false;
  state.raceStarted = false;
  state.lineupReadyAt = 0;
  state.raceStartAt = 0;
  app.classList.remove("racing");
  controlPanel.classList.remove("racing");
  raceIntro.classList.remove("active");
  raceIntro.classList.remove("countdown");
  racePhase.textContent = "確定";
  distanceReadout.textContent = "FINISH";
  renderControls();
  const results = [...state.racers].sort((a, b) => a.finishTime - b.finishTime);
  updateCommentary(pickCommentary(commentaryBanks.finish, { winner: horseCall(results[0]) }));
  renderResultDetail(results);

  state.racers = [];
  horseLabels.innerHTML = "";
  leaderboard.innerHTML = "";
  state.trackCondition = randomTrackCondition();
  renderControls();
}

function recordSegments(racer) {
  const checkpoints = [0.25, 0.5, 0.75, 0.9];
  const ratio = racer.progress / state.raceDistance;
  for (const point of checkpoints) {
    if (ratio >= point && !racer.segmentProgress.includes(point)) {
      racer.segmentProgress.push(point);
    }
  }
}

function recordSectionReports() {
  const checkpoints = [0.25, 0.5, 0.75, 0.9];
  const leaderRatio = Math.max(...state.racers.map((racer) => racer.progress)) / state.raceDistance;
  for (const point of checkpoints) {
    if (leaderRatio < point || state.sectionReports.some((report) => report.point === point)) continue;
    const top = [...state.racers]
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3)
      .map((racer) => `${racer.number}番`);
    state.sectionReports.push({ point, top });
  }
}

function updateRaceCommentary(now) {
  if (now - state.lastCommentAt < 1700) return;
  const sorted = [...state.racers].sort((a, b) => b.progress - a.progress);
  const leader = sorted[0];
  const second = sorted[1];
  if (!leader || !second) return;
  const third = sorted[2] || second;
  const ratio = leader.progress / state.raceDistance;
  const gap = leader.progress - second.progress;
  const lapRatio = (leader.progress % TRACK_LENGTH) / TRACK_LENGTH;
  const onCorner = (lapRatio > 0.18 && lapRatio < 0.42) || (lapRatio > 0.68 && lapRatio < 0.92);
  const values = {
    leader: horseCall(leader),
    second: horseCall(second),
    third: horseCall(third),
    track: state.trackCondition.label,
    style: styleLabels[leader.strategy] || "先行",
  };
  let bank = commentaryBanks.middle;

  if (ratio < 0.12) {
    bank = gap < 5 ? commentaryBanks.earlyClose : commentaryBanks.earlyLeader;
  } else if (ratio < 0.25 && Math.random() < 0.35) {
    bank = commentaryBanks.condition;
  } else if (ratio < 0.62 && Math.random() < 0.28) {
    bank = commentaryBanks.style;
  } else if (onCorner && ratio < 0.76) {
    bank = commentaryBanks.corner;
  } else if (ratio > 0.62 && ratio < 0.78) {
    bank = commentaryBanks.finalTurn;
  }

  if (ratio > 0.68 && gap < 13) {
    const charger = sorted
      .slice(1)
      .find((racer) => racer.strategy === "closer" || racer.strategy === "deep" || racer.trait === "finish") || second;
    values.charger = horseCall(charger);
    bank = commentaryBanks.chase;
  }
  if (ratio > 0.84) {
    bank = gap < 8 ? commentaryBanks.straightClose : commentaryBanks.straightLeader;
  }

  const text = pickCommentary(bank, values);
  state.lastCommentAt = now;
  updateCommentary(text);
}

function renderResultDetail(results) {
  const sections = state.sectionReports
    .map((report) => `${Math.round(report.point * 100)}%:${report.top.join("-")}`)
    .join(" / ");
  resultDetail.hidden = false;
  resultDetail.innerHTML = `
    <h2>結果詳細</h2>
    <p>馬場:${state.trackCondition.label} / 距離:${state.distanceType.label}${sections ? `<br>通過:${sections}` : ""}</p>
    <ol>
      ${results
        .map((racer, index) => {
          const style = styleLabels[racer.strategy] || "先行";
          const trait = traitDefs[racer.trait]?.label || "末脚";
          return `<li><strong>${index + 1}着 ${racer.number}番 ${escapeHtml(racer.name)}</strong><br>${racer.finishTime.toFixed(2)}秒 / ${style} / ${trait}<br>調子:${racer.condition.label} / 発走反応:${racer.startDelay.toFixed(2)}秒</li>`;
        })
        .join("")}
    </ol>
  `;
}

function renderLeaderboard() {
  const sorted = [...state.racers].sort((a, b) => b.progress - a.progress).slice(0, 3);
  leaderboard.innerHTML = sorted
    .map(
      (racer, index) => `
        <div class="leader-row ${racer.isPlayer ? "player" : ""}">
          <span class="silk" style="background:${racer.bibColorCss}"></span>
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

function isCompactRaceView() {
  return window.innerWidth <= 760 || window.innerHeight <= 520;
}

function render3d(now) {
  resize();
  if (state.raceRunning) {
    gl.clearColor(0.52, 0.72, 0.7, 1);
  } else {
    gl.clearColor(0.07, 0.1, 0.09, 1);
  }
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(program);
  gl.uniform3f(loc.light, -0.35, 0.85, 0.45);

  if (!state.raceRunning) {
    renderPreview(now);
    return;
  }

  const leader = state.racers.reduce((best, racer) => (racer.progress > best.progress ? racer : best), state.racers[0]);
  if (leader) {
    const leaderPos = trackPosition(leader.displayProgress ?? leader.progress, leader.lane);
    const leaderX = leaderPos.x;
    const leaderZ = leaderPos.z;
    state.cameraX += (leaderX - 54 - state.cameraX) * 0.03;
    state.cameraZ += (leaderZ - state.cameraZ) * 0.045;
  }

  const aspect = canvas.width / canvas.height;
  const compactView = isCompactRaceView();
  const projection = m4Perspective(compactView ? Math.PI / 5.1 : Math.PI / 4.55, aspect, 0.1, 1200);
  const camera = cameraView(compactView);
  const eye = camera.eye;
  const target = camera.target;
  const view = m4LookAt(
    eye,
    target,
    [0, 1, 0],
  );
  const viewProjection = m4Multiply(projection, view);

  drawTrack(viewProjection);

  const sorted = [...state.racers].sort((a, b) => laneZ(a.lane) - laneZ(b.lane));
  for (const racer of sorted) drawHorse3d(viewProjection, racer, now);
  updateHorseLabelPositions(viewProjection);
}

function cameraView(compactView) {
  const leader = state.racers.reduce((best, racer) => (racer.progress > best.progress ? racer : best), state.racers[0]);
  const ratio = leader ? leader.progress / state.raceDistance : 0;
  const lapRatio = leader ? (leader.progress % TRACK_LENGTH) / TRACK_LENGTH : 0;
  const leaderPos = leader ? trackPosition(leader.displayProgress ?? leader.progress, leader.lane) : { x: state.cameraX, z: state.cameraZ };
  const focusZ = state.cameraZ;
  const onCorner = (lapRatio > 0.16 && lapRatio < 0.42) || (lapRatio > 0.66 && lapRatio < 0.92);
  if (!state.raceStarted) {
    return compactView
      ? { eye: [state.cameraX - 4, 9, focusZ + 28], target: [state.cameraX + 8, 2.0, focusZ] }
      : { eye: [state.cameraX - 6, 13, focusZ + 38], target: [state.cameraX + 12, 2.0, focusZ] };
  }
  if (ratio > 0.88) {
    return compactView
      ? { eye: [leaderPos.x - 6, 8, leaderPos.z + 28], target: [leaderPos.x + 8, 2.1, leaderPos.z] }
      : { eye: [leaderPos.x - 9, 12, leaderPos.z + 38], target: [leaderPos.x + 12, 2.1, leaderPos.z] };
  }
  if (ratio < 0.15 || onCorner) {
    return compactView
      ? { eye: [state.cameraX - 6, 26, focusZ + 58], target: [state.cameraX + 10, 1.5, focusZ] }
      : { eye: [state.cameraX - 8, 38, focusZ + 78], target: [state.cameraX + 14, 1.5, focusZ] };
  }
  if (ratio > 0.62) {
    return compactView
      ? { eye: [state.cameraX - 3, 10, focusZ + 36], target: [state.cameraX + 10, 2.0, focusZ] }
      : { eye: [state.cameraX - 2, 15, focusZ + 50], target: [state.cameraX + 13, 2.0, focusZ] };
  }
  return compactView
    ? { eye: [state.cameraX - 8, 16, focusZ + 38], target: [state.cameraX + 11, 2.0, focusZ - 1] }
    : { eye: [state.cameraX - 12, 23, focusZ + 52], target: [state.cameraX + 16, 2.1, focusZ] };
}

function renderPreview(now) {
  horseLabels.innerHTML = "";
  leaderboard.innerHTML = "";
  const aspect = canvas.width / canvas.height;
  const projection = m4Perspective(Math.PI / 5, aspect, 0.1, 120);
  const view = m4LookAt([0, 5.8, 15], [0, 1.8, 0], [0, 1, 0]);
  const viewProjection = m4Multiply(projection, view);
  const yaw = now * 0.0007;

  drawBox(viewProjection, [0, -0.2, 0], [8.8, 0.25, 5.4], [0.12, 0.18, 0.16]);
  drawBox(viewProjection, [0, 0.05, 0], [7.2, 0.18, 4.2], [0.22, 0.34, 0.29]);
  drawBox(viewProjection, [0, 0.18, 0], [5.4, 0.08, 3.0], [0.62, 0.5, 0.28]);
  for (let x = -4; x <= 4; x += 2) {
    drawBox(viewProjection, [x, 0.72, -2.35], [0.08, 1.2, 0.08], [0.8, 0.78, 0.7]);
    drawBox(viewProjection, [x, 0.72, 2.35], [0.08, 1.2, 0.08], [0.8, 0.78, 0.7]);
  }

  drawHorse3d(
    viewProjection,
    {
      id: "preview-player",
      number: 1,
      name: horseName.value.trim() || "Your Horse",
      progress: now * 0.055,
      lane: 2,
      coatColor: horseCoatColors[0],
      bibColor: bibColors[0],
      bibColorCss: bibColorCss[0],
      wobble: 0,
      isPlayer: true,
      previewPos: { x: 0, z: 0, yaw },
      previewScale: 1.45,
    },
    now,
  );
}

function drawHorse3d(viewProjection, racer, now) {
  const visibleProgress = racer.displayProgress ?? racer.progress;
  const pos = racer.previewPos || trackPosition(visibleProgress, racer.lane);
  const yaw = pos.yaw;
  const compactView = isCompactRaceView();
  state.horseRenderScale = racer.previewScale || (compactView ? 1.2 : 1);
  const walking = Boolean(racer.walking && !state.raceStarted);
  const idle = Boolean(state.raceRunning && !state.raceStarted && !walking && !racer.previewPos);
  const moving = Boolean(racer.previewPos || walking || idle || state.raceStarted);
  const effort = moving ? (state.raceRunning ? 1.38 : 1.08) : 0.35;
  const gait = walking
    ? now * 0.00155 + racer.wobble
    : idle
      ? now * 0.0009 + racer.wobble
    : moving
      ? visibleProgress * 0.17 + now * 0.0062 + racer.wobble
      : racer.wobble;
  const cycle = normalizedCycle(gait / (Math.PI * 2));
  const stride = Math.sin(gait);
  const drive = Math.max(0, Math.sin(cycle * Math.PI * 2 + 0.65));
  const landing = Math.max(0, Math.sin(cycle * Math.PI * 2 - 1.15));
  const suspension = Math.max(0, Math.sin(cycle * Math.PI * 2 - 2.55)) ** 2;
  const gather = Math.max(0, Math.sin(cycle * Math.PI * 2 + 2.2));
  const walkSway = Math.sin(cycle * Math.PI * 4);
  const idleBreath = Math.sin(gait * 1.7);
  const bob = idle
    ? 0.08 + idleBreath * 0.035
    : walking
    ? 0.08 + Math.abs(walkSway) * 0.055
    : 0.08 + suspension * (0.34 + effort * 0.2) - landing * 0.08 + drive * 0.05;
  const bodyPitch = idle
    ? idleBreath * 0.018
    : walking
    ? stride * 0.035
    : drive * (0.11 + effort * 0.07) - landing * (0.08 + effort * 0.05) + stride * 0.025;
  const stretch = walking ? 1 : 1 + suspension * 0.09 - gather * 0.045;
  const chestDrop = walking ? Math.max(0, -walkSway) * 0.035 : landing * 0.08 - suspension * 0.04;
  const neckPitch = idle ? -0.55 + idleBreath * 0.04 : walking ? -0.58 + stride * 0.06 : -0.72 - drive * 0.16 + landing * 0.2 + suspension * 0.08;
  const headReach = idle ? idleBreath * 0.04 : walking ? stride * 0.08 : suspension * 0.28 + drive * 0.12 - gather * 0.14;
  const color = racer.coatColor || horseCoatColors[0];
  const bibColor = racer.bibColor || bibColors[0];
  const highlight = color.map((value) => Math.min(1, value * 1.18 + 0.06));
  const dark = [0.08, 0.06, 0.05];
  const leather = [0.16, 0.1, 0.07];
  const riderSkin = [0.96, 0.86, 0.72];
  const riderSilk = bibColor;

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
  drawHorsePart(viewProjection, pos, [-0.34, 1.39 + bob, -0.4], [1.14, 0.52, 0.04], bibColor, [0, yaw, bodyPitch]);
  drawHorsePart(viewProjection, pos, [-0.34, 1.39 + bob, 0.4], [1.14, 0.52, 0.04], bibColor, [0, yaw, bodyPitch]);
  drawHorsePart(viewProjection, pos, [-0.34, 1.4 + bob, -0.43], [0.42, 0.24, 0.025], [0.96, 0.94, 0.86], [0, yaw, bodyPitch]);
  drawHorsePart(viewProjection, pos, [-0.34, 1.4 + bob, 0.43], [0.42, 0.24, 0.025], [0.96, 0.94, 0.86], [0, yaw, bodyPitch]);
  drawBibNumber(viewProjection, pos, bob, bodyPitch, racer.number, -0.455);
  drawBibNumber(viewProjection, pos, bob, bodyPitch, racer.number, 0.455);
  drawHorsePart(viewProjection, pos, [-0.24, 2.0 + bob - suspension * 0.08, 0], [0.5, 0.64, 0.42], riderSilk, [0, yaw, 0.5 + bodyPitch + drive * 0.08]);
  drawHorsePart(viewProjection, pos, [-0.14, 2.47 + bob - suspension * 0.08, 0], [0.38, 0.38, 0.36], riderSkin);
  drawHorsePart(viewProjection, pos, [-0.13, 2.72 + bob - suspension * 0.08, 0], [0.5, 0.16, 0.42], riderSilk);
  drawHorsePart(viewProjection, pos, [-0.64, 1.7 + bob, -0.28], [0.16, 0.9, 0.14], leather, [0, yaw, 0.5 + drive * 0.16 - landing * 0.08]);
  drawHorsePart(viewProjection, pos, [-0.64, 1.7 + bob, 0.28], [0.16, 0.9, 0.14], leather, [0, yaw, -0.5 - drive * 0.16 + landing * 0.08]);

  const legs = [
    { x: -1.0, z: -0.28, phase: walking ? 0.0 : 0.0, rear: true },
    { x: -0.9, z: 0.28, phase: walking ? 0.5 : 0.12, rear: true },
    { x: 0.86, z: -0.28, phase: walking ? 0.26 : 0.46, rear: false },
    { x: 1.0, z: 0.28, phase: walking ? 0.76 : 0.58, rear: false },
  ];
  for (const leg of legs) {
    const pose = idle ? idleLegPose(leg.rear, leg.z, cycle) : walking ? walkLegPose(cycle, leg.phase, leg.rear) : gallopLegPose(cycle, leg.phase, leg.rear, effort);
    const hip = [leg.x, 1.02 + bob * 0.14, leg.z];
    const knee = [leg.x + pose.kneeX, pose.kneeY + bob * 0.05, leg.z];
    const hoof = [leg.x + pose.hoofX, pose.hoofY, leg.z];
    drawHorsePart(viewProjection, pos, midpoint(hip, knee), [0.2, distance3(hip, knee), 0.16], dark, [0, yaw, legSegmentAngle(hip, knee)]);
    drawHorsePart(viewProjection, pos, knee, [0.26, 0.2, 0.2], [0.11, 0.08, 0.06]);
    drawHorsePart(viewProjection, pos, midpoint(knee, hoof), [0.15, distance3(knee, hoof), 0.13], dark, [0, yaw, legSegmentAngle(knee, hoof)]);
    drawHorsePart(viewProjection, pos, [hoof[0] + 0.1, hoof[1] - 0.02, hoof[2]], [0.46, 0.11, 0.22], [0.04, 0.035, 0.03], [0, yaw, legSegmentAngle(knee, hoof) * 0.25]);
  }
}

function drawHorsePart(viewProjection, pos, offset, scale, color, rotation) {
  const visualScale = state.horseRenderScale || 1;
  const scaledOffset = [offset[0] * visualScale, offset[1] * visualScale, offset[2] * visualScale];
  const scaledSize = [scale[0] * visualScale, scale[1] * visualScale, scale[2] * visualScale];
  const translated = localToWorld(pos, scaledOffset);
  drawBox(viewProjection, translated, scaledSize, color, rotation || [0, pos.yaw, 0]);
}

function drawBibNumber(viewProjection, pos, bob, bodyPitch, number, z) {
  const digits = String(number).split("");
  const digitGap = digits.length === 1 ? 0 : 0.13;
  const startX = -0.34 - ((digits.length - 1) * digitGap) / 2;
  digits.forEach((digit, index) => {
    drawBibDigit(viewProjection, pos, bob, bodyPitch, Number(digit), startX + index * digitGap, z, digits.length === 1 ? 1 : 0.72);
  });
}

function drawBibDigit(viewProjection, pos, bob, bodyPitch, digit, x, z, scale = 1) {
  const segments = bibDigitSegments[digit] || bibDigitSegments[0];
  const color = [0.05, 0.045, 0.04];
  const y = 1.405 + bob;
  const segmentMap = {
    a: [0, 0.075, 0.16, 0.026],
    b: [0.09, 0.035, 0.028, 0.092],
    c: [0.09, -0.055, 0.028, 0.092],
    d: [0, -0.105, 0.16, 0.026],
    e: [-0.09, -0.055, 0.028, 0.092],
    f: [-0.09, 0.035, 0.028, 0.092],
    g: [0, -0.015, 0.15, 0.024],
  };

  for (const segment of segments) {
    const [dx, dy, sx, sy] = segmentMap[segment];
    drawHorsePart(viewProjection, pos, [x + dx * scale, y + dy * scale, z], [sx * scale, sy * scale, 0.018], color, [0, pos.yaw, bodyPitch]);
  }
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
  drawBox(viewProjection, [0, -0.16, 0], [470, 0.14, 270], [0.14, 0.34, 0.24]);
  drawGrandstands(viewProjection);

  const segments = 192;
  drawOvalRing(
    viewProjection,
    TRACK_RX + TRACK_MARGIN + 7,
    TRACK_RZ + TRACK_MARGIN + 7,
    TRACK_RX - TRACK_MARGIN - 7,
    TRACK_RZ - TRACK_MARGIN - 7,
    state.trackCondition?.turf || [0.26, 0.54, 0.3],
    0.02,
  );

  const centerLane = (TOTAL_HORSES - 1) / 2;
  for (const railLane of [-5.2, TOTAL_HORSES + 4.2]) {
    drawRailBand(viewProjection, railLane, 1.45, 0.52, [0.92, 0.88, 0.78], segments);
    drawRailBand(viewProjection, railLane, 0.95, 0.36, [0.82, 0.78, 0.68], segments);
    for (let i = 0; i < segments; i += 1) {
      const distance = (i / segments) * TRACK_LENGTH;
      const p = trackPosition(distance, railLane);
      if (i % 5 === 0) {
        drawBox(viewProjection, [p.x, 0.72, p.z], [0.22, 1.45, 0.22], [0.92, 0.88, 0.78]);
      }
    }
  }

  const finish = trackPosition(0, centerLane);
  drawBox(viewProjection, [finish.x, 5.2, finish.z - 31], [0.55, 10, 0.55], [0.95, 0.92, 0.82]);
  drawBox(viewProjection, [finish.x, 5.2, finish.z + 31], [0.55, 10, 0.55], [0.95, 0.92, 0.82]);
}

function drawEnvironment(viewProjection) {
  drawBox(viewProjection, [0, -0.34, 0], [900, 0.08, 620], [0.18, 0.45, 0.3]);
  drawBox(viewProjection, [0, 0.06, 226], [760, 0.08, 98], [0.2, 0.5, 0.34]);
  drawBox(viewProjection, [0, 0.08, -256], [760, 0.08, 106], [0.17, 0.42, 0.3]);
  drawBox(viewProjection, [0, 18, -330], [900, 36, 1.2], [0.55, 0.72, 0.78]);
  drawBox(viewProjection, [0, 28, -332], [900, 10, 1.4], [0.68, 0.8, 0.83]);

  for (let x = -410; x <= 410; x += 24) {
    const h = 3.2 + ((x * x) % 9) * 0.18;
    drawBox(viewProjection, [x, h / 2, -232], [2.6, h, 2.6], [0.22, 0.15, 0.08]);
    drawBox(viewProjection, [x, h + 1.2, -232], [7.5, 4.2, 5.2], [0.08, 0.32, 0.16]);
  }

  for (let x = -340; x <= 340; x += 58) {
    drawBox(viewProjection, [x, 1.0, 256], [30, 2, 11], [0.48, 0.5, 0.5]);
    drawBox(viewProjection, [x, 2.4, 256], [32, 0.6, 12], [0.76, 0.78, 0.74]);
  }
}

function drawGrandstands(viewProjection) {
  drawBox(viewProjection, [0, 1.15, -164], [320, 2.3, 8], [0.2, 0.22, 0.25]);
  drawBox(viewProjection, [0, 2.35, -172], [338, 0.85, 14], [0.3, 0.32, 0.34], [0.12, 0, 0]);
  drawBox(viewProjection, [0, 3.45, -182], [354, 0.85, 15], [0.36, 0.38, 0.4], [0.12, 0, 0]);
  drawBox(viewProjection, [0, 4.45, -190], [372, 0.55, 20], [0.78, 0.8, 0.76], [0.08, 0, 0]);

  for (let x = -154; x <= 154; x += 11) {
    drawBox(viewProjection, [x, 2.9, -158], [0.32, 4.0, 0.32], [0.82, 0.82, 0.78]);
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
    for (let x = -152; x <= 152; x += 5.2) {
      const color = crowdColors[(row + Math.floor((x + 152) / 5.2)) % crowdColors.length];
      drawBox(viewProjection, [x, 1.65 + row * 0.42, -163 - row * 3.0], [0.9, 0.4, 0.62], color);
    }
  }

  for (let x = -168; x <= 168; x += 36) {
    drawBox(viewProjection, [x, 5.4, -182], [0.7, 7.8, 0.7], [0.62, 0.64, 0.62]);
    drawBox(viewProjection, [x, 9.4, -182], [7.2, 0.45, 2.1], [0.95, 0.9, 0.72]);
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

function drawRailBand(viewProjection, lane, y, thickness, color, segments = 192) {
  const positions = [];
  const normals = [];
  const half = thickness / 2;
  for (let i = 0; i < segments; i += 1) {
    const d0 = (i / segments) * TRACK_LENGTH;
    const d1 = ((i + 1) / segments) * TRACK_LENGTH;
    const p0a = trackPosition(d0, lane - half);
    const p1a = trackPosition(d1, lane - half);
    const p1b = trackPosition(d1, lane + half);
    const p0b = trackPosition(d0, lane + half);
    const quad = [
      [p0a.x, y, p0a.z],
      [p1a.x, y, p1a.z],
      [p1b.x, y, p1b.z],
      [p0a.x, y, p0a.z],
      [p1b.x, y, p1b.z],
      [p0b.x, y, p0b.z],
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
  const laneOffset = (lane - (TOTAL_HORSES - 1) / 2) * LANE_WIDTH;
  const rx = TRACK_RX + laneOffset;
  const rz = TRACK_RZ + laneOffset;
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
  const reach = rear ? 0.96 : 1.12;
  const fold = rear ? 0.74 : 0.86;
  const jointBias = rear ? -0.18 : 0.16;
  let hoofX = 0;
  let hoofY = 0.08;
  let kneeX = jointBias;
  let kneeY = 0.6;

  if (phase < 0.18) {
    const t = phase / 0.18;
    hoofX = lerp(reach * 0.92, -reach * 0.86, t);
    hoofY = 0.07;
    kneeX = hoofX * 0.38 + jointBias;
    kneeY = 0.54 - Math.sin(t * Math.PI) * (0.07 + effort * 0.03);
  } else if (phase < 0.34) {
    const t = (phase - 0.18) / 0.16;
    hoofX = lerp(-reach * 0.86, -reach * 0.28, t);
    hoofY = 0.08 + t * (0.22 + effort * 0.11);
    kneeX = lerp(-0.56, -0.06, t) + jointBias;
    kneeY = 0.55 + t * (0.4 + effort * 0.12);
  } else if (phase < 0.68) {
    const t = (phase - 0.34) / 0.34;
    const lift = Math.sin(t * Math.PI);
    hoofX = lerp(-reach * 0.28, reach * 0.48, t);
    hoofY = 0.16 + lift * fold * (1 + effort * 0.32);
    kneeX = lerp(-0.04, 0.46, t) + jointBias;
    kneeY = 0.76 + lift * (0.52 + effort * 0.16);
  } else {
    const t = (phase - 0.68) / 0.32;
    hoofX = lerp(reach * 0.48, reach * 0.92, t);
    hoofY = 0.1 + Math.sin((1 - t) * Math.PI) * (0.32 + effort * 0.1);
    kneeX = lerp(0.5, reach * 0.36, t) + jointBias;
    kneeY = lerp(0.96, 0.6, t);
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

function walkLegPose(cycle, offset, rear) {
  const phase = normalizedCycle(cycle + offset);
  const swing = phase < 0.38;
  const t = swing ? phase / 0.38 : (phase - 0.38) / 0.62;
  const step = rear ? 0.62 : 0.7;
  const jointBias = rear ? -0.12 : 0.14;
  let hoofX;
  let hoofY;
  let kneeX;
  let kneeY;

  if (swing) {
    const lift = Math.sin(t * Math.PI);
    hoofX = lerp(-step, step * 0.88, t);
    hoofY = 0.08 + lift * 0.36;
    kneeX = lerp(-0.24, 0.34, t) + jointBias;
    kneeY = 0.6 + lift * 0.34;
  } else {
    hoofX = lerp(step * 0.88, -step, t);
    hoofY = 0.07;
    kneeX = hoofX * 0.38 + jointBias;
    kneeY = 0.56 - Math.sin(t * Math.PI) * 0.04;
  }

  return { hoofX, hoofY, kneeX, kneeY };
}

function idleLegPose(rear, side, cycle) {
  const sideShift = side < 0 ? -0.04 : 0.04;
  const breath = Math.sin(cycle * Math.PI * 2) * 0.025;
  const hoofX = rear ? -0.18 + sideShift : 0.16 - sideShift;
  const hoofY = 0.07;
  const kneeX = rear ? -0.18 : 0.16;
  const kneeY = 0.58 + breath;
  return { hoofX, hoofY, kneeX, kneeY };
}

function midpoint(a, b) {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
}

function distance3(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function legSegmentAngle(from, to) {
  return -Math.atan2(to[0] - from[0], to[1] - from[1]);
}

function normalizedCycle(value) {
  return ((value % 1) + 1) % 1;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function renderHorseLabels() {
  if (!state.labelsVisible) {
    horseLabels.innerHTML = "";
    return;
  }
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
  if (!state.labelsVisible) {
    horseLabels.innerHTML = "";
    return;
  }
  const rect = canvas.getBoundingClientRect();
  for (const racer of state.racers) {
    const label = horseLabels.querySelector(`[data-racer-id="${racer.id}"]`);
    if (!label) continue;
    const pos = trackPosition(racer.displayProgress ?? racer.progress, racer.lane);
    const labelHeight = isCompactRaceView() ? 6.1 : 5.05;
    const point = projectWorld(viewProjection, [pos.x, labelHeight, pos.z]);
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
  return (lane - (TOTAL_HORSES - 1) / 2) * 2.4;
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
horseName.addEventListener("input", renderControls);
matchName.addEventListener("input", () => {
  if (matchName.value.length > MATCH_NAME_MAX) {
    matchName.value = matchName.value.slice(0, MATCH_NAME_MAX);
  }
  state.matchName = buildMatchName();
  renderControls();
});
matchSuffix.addEventListener("change", () => {
  state.matchName = buildMatchName();
  renderControls();
});
voiceToggle.addEventListener("change", () => {
  if (!voiceToggle.checked && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
});
labelToggle.addEventListener("change", () => {
  state.labelsVisible = labelToggle.checked;
  if (!state.labelsVisible) horseLabels.innerHTML = "";
  else if (state.raceRunning) renderHorseLabels();
});
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
state.trackCondition = randomTrackCondition();
renderControls();
resize();
requestAnimationFrame(update);

function preventZoom(event) {
  event.preventDefault();
}
