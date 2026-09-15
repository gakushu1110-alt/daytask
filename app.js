// ==========================================
// 0. Googleスプレッドシート連携設定
// ==========================================
// スプレッドシートのWeb公開CSV URLを直接指定します
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTzYoXb4M6qc3sfcufFt1c223xm8N8HO5OtzsK4rwWy9wt7orxWX6XgEVJxMv_rwHASopdqnvBnn_OW/pub?output=csv";

// ==========================================
// 1. ユニフォーム報酬マスターデータ
// ==========================================
const countryMaster = {
  week1: { country: "🇦🇷 アルゼンチン代表", code: "arg" },
  week2: { country: "🇫🇷 フランス代表", code: "fra" }
};

const uniformRewards = {
  11: { week: "week2", dayNum: 4, type: "Home", name: "フランス代表 Home (No.7)", img: "images/uniforms/fra_home_7.jpg", desc: "4日目達成！フランスの主力ナンバー！" },
  12: { week: "week2", dayNum: 5, type: "Home", name: "フランス代表 Home (No.10)", img: "images/uniforms/fra_home_10.jpg", desc: "5日目達成！エースの象徴10番！" },
  13: { week: "week2", dayNum: 7, type: "Away", name: "⭐ 特別アウェーユニフォーム", img: "images/uniforms/fra_away_special.jpg", desc: "テスト当日クリアボーナス！限定アウェーモデル！" }
};

const kanjiMasterData = Array.from({ length: 40 }, (_, i) => ({ id: `k_${i + 1}`, number: i + 1 }));

let currentDay = 11;
let currentDayTasks = [];
let completedTaskIds = JSON.parse(localStorage.getItem("day_completed_tasks")) || [];
let reviewKanjiIds = JSON.parse(localStorage.getItem("kanji_weak_list")) || [];
let unlockedUniforms = JSON.parse(localStorage.getItem("unlocked_uniforms")) || [];

// ==========================================
// 2. 初期化とスプレッドシートからのデータ取得
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  loadDayData(currentDay);
});

// CSV1行パース関数（改行・カンマ考慮）
function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
}

// スプレッドシートからデータ取得
async function loadDayData(day) {
  currentDay = day;
  const container = document.getElementById("main-container");
  const statusContainer = document.getElementById("status-container");
  
  if (container) container.innerHTML = "<p style='text-align:center;'>データを読み込んでいます...</p>";
  if (statusContainer) statusContainer.innerHTML = "";

  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");

    if (lines.length > 1) {
      const allTasks = [];
      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (!row[0]) continue;

        allTasks.push({
          day: parseInt(row[0]) || 0,
          id: row[1] || "",
          groupId: row[2] || "",
          groupImage: row[3] || "",
          subject: row[4] || "全般",
          badgeClass: getBadgeClass(row[4]),
          type: row[5] || "input",
          title: row[6] || "",
          question: row[7] || "",
          answer: row[8] || "",
          options: row[9] ? row[9].split(",").map(s => s.trim()) : [],
          explanation: ""
        });
      }

      currentDayTasks = allTasks.filter(t => t.day === currentDay);
    } else {
      currentDayTasks = [];
    }
  } catch (error) {
    console.error("スプレッドシートの読み込みに失敗しました:", error);
    if (container) {
      container.innerHTML = `<div class="card" style="text-align:center; color:red;">
        <p>データの読み込みに失敗しました。</p>
        <p style="font-size:12px; color:#666;">（詳細: ${error.message}）<br>ローカルファイル（file://）で直接開いている場合は、Webサーバー経由（Webサーバー機能やGitHub Pages等）で開いているかご確認ください。</p>
      </div>`;
    }
    return;
  }

  renderPage();
}

function getBadgeClass(subject) {
  switch (subject) {
    case "算数": return "bg-math";
    case "理科": return "bg-science";
    case "社会": return "bg-social";
    case "漢字": return "bg-kanji";
    default: return "bg-math";
  }
}

function showTab(tabName) {
  document.getElementById("study-view").style.display = tabName === 'study' ? 'block' : 'none';
  document.getElementById("album-view").style.display = tabName === 'album' ? 'block' : 'none';
  document.getElementById("tab-study").classList.toggle("active", tabName === 'study');
  document.getElementById("tab-album").classList.toggle("active", tabName === 'album');

  if (tabName === 'album') renderAlbum();
}

function switchDay(day) {
  document.querySelectorAll(".day-btn").forEach(btn => btn.classList.remove("active"));
  if (event && event.target) event.target.classList.add("active");
  loadDayData(day);
}

// ==========================================
// 3. ページ描画処理
// ==========================================
function renderPage() {
  const container = document.getElementById("main-container");
  const statusContainer = document.getElementById("status-container");
  container.innerHTML = "";
  statusContainer.innerHTML = "";

  if (currentDay === 11) {
    document.getElementById("page-title").innerText = "11日目の学習課題";
    renderDay11(container);
  } else if (currentDay === 12) {
    document.getElementById("page-title").innerText = "12日目：2回目 全問総点検";
    renderCheckDay(container);
  } else if (currentDay === 13) {
    document.getElementById("page-title").innerText = "13日目：テスト直前 総復習";
    renderReviewDay13(container, statusContainer);
  }
}

function renderDay11(container) {
  let renderedGroups = [];

  const kanjiCard = document.createElement("div");
  kanjiCard.className = "card";
  kanjiCard.innerHTML = `
    <span class="badge bg-kanji">漢字 1回目 (No.1〜20)</span>
    <h3 style="margin:5px 0;">復習したい番号をタップ！</h3>
    <p style="font-size:12px; color:#666; margin-bottom:10px;">タップで黄色になり、13日目の復習対象に登録されます。</p>
  `;
  
  let kanjiGridHtml = `<div class="kanji-grid">`;
  kanjiMasterData.slice(0, 20).forEach(item => {
    const isWeak = reviewKanjiIds.includes(item.id);
    kanjiGridHtml += `
      <button class="kanji-num-btn ${isWeak ? 'selected' : ''}" onclick="toggleWeakBtn('${item.id}', this)">
        No.${item.number}
      </button>
    `;
  });
  kanjiGridHtml += `</div>`;
  kanjiCard.innerHTML += kanjiGridHtml;
  container.appendChild(kanjiCard);

  if (currentDayTasks.length === 0) {
    container.innerHTML += `<div class="card"><p style="text-align:center; color:#666;">本日の問題データ（Day ${currentDay}）がありません。</p></div>`;
    return;
  }

  currentDayTasks.forEach((item, index) => {
    if (item.groupImage && item.groupImage.trim() !== "" && !renderedGroups.includes(item.groupId)) {
      const imgContainer = document.createElement("div");
      imgContainer.className = "group-image-container";
      imgContainer.innerHTML = `
        <img src="${item.groupImage}" alt="資料" class="group-img" 
             onerror="this.parentElement.innerHTML='<p style=\\'color:#888; font-size:12px;\\'>[画像が見つかりません: ${item.groupImage}]</p>';">
      `;
      container.appendChild(imgContainer);
      if (item.groupId) renderedGroups.push(item.groupId);
    }

    const isCompleted = completedTaskIds.includes(item.id);
    const card = document.createElement("div");
    card.className = "card";

    let html = `
      <span class="badge ${item.badgeClass}">${item.subject}</span>
      <h3>${item.title || '問 ' + (index + 1)}</h3>
      <p style="white-space: pre-wrap;">${item.question}</p>
    `;

    if (isCompleted) {
      html += `<div class="feedback correct">STATUS: クリア済み！</div>`;
    } else {
      if (item.type === "choice") {
        html += `<div class="options-grid">`;
        item.options.forEach(opt => {
          html += `<button class="option-btn" onclick="checkAnswer('${item.id}', '${opt}')">${opt}</button>`;
        });
        html += `</div>`;
      } else if (item.type === "input") {
        html += `
          <div>
            <input type="text" id="input-${item.id}" class="input-box" placeholder="解答を入力">
            <button class="submit-btn" onclick="checkInputAnswer('${item.id}')">回答する</button>
          </div>
        `;
      }
      html += `<div id="feedback-${item.id}" class="feedback"></div>`;
    }

    card.innerHTML = html;
    container.appendChild(card);
  });
}

function renderCheckDay(container) {
  const card = document.createElement("div");
  card.className = "card";
  let html = `
    <span class="badge bg-kanji">漢字 2回目 (No.21〜40)</span>
    <h3 style="margin:5px 0;">復習したい番号をタップ！</h3>
    <div class="kanji-grid">
  `;
  
  kanjiMasterData.slice(20, 40).forEach(item => {
    const isWeak = reviewKanjiIds.includes(item.id);
    html += `<button class="kanji-num-btn ${isWeak ? 'selected' : ''}" onclick="toggleWeakBtn('${item.id}', this)">No.${item.number}</button>`;
  });
  html += `</div>`;
  card.innerHTML = html;
  container.appendChild(card);
}

function renderReviewDay13(container, statusContainer) {
  let reviewItems = reviewKanjiIds.length > 0 
    ? kanjiMasterData.filter(k => reviewKanjiIds.includes(k.id))
    : [...kanjiMasterData].sort(() => 0.5 - Math.random()).slice(0, 10);

  statusContainer.innerHTML = `<div class="status-box" style="background:#fff0f6; color:#c2255c;">🔥 13日目の復習（${reviewKanjiIds.length > 0 ? "苦手番号" : "ランダム10問"}）をノートで行おう！</div>`;

  const card = document.createElement("div");
  card.className = "card";
  let html = `<span class="badge bg-kanji">総復習</span><div class="kanji-grid">`;
  reviewItems.forEach(item => {
    html += `<button class="kanji-num-btn selected" onclick="clearWeakBtn('${item.id}', this)">No.${item.number}</button>`;
  });
  html += `</div>`;
  card.innerHTML = html;
  container.appendChild(card);
}

// ==========================================
// 4. 正解判定・ユニフォーム解放処理
// ==========================================
function checkAnswer(taskId, selectedOption) {
  const task = currentDayTasks.find(t => t.id === taskId);
  const feedbackEl = document.getElementById(`feedback-${taskId}`);
  if (selectedOption === task.answer) {
    feedbackEl.className = "feedback correct";
    feedbackEl.innerText = "正解！ " + (task.explanation || "");
    setTimeout(() => markTaskComplete(taskId), 800);
  } else {
    feedbackEl.className = "feedback incorrect";
    feedbackEl.innerText = "不正解！もう一度考えよう。";
  }
}

function checkInputAnswer(taskId) {
  const task = currentDayTasks.find(t => t.id === taskId);
  const inputEl = document.getElementById(`input-${taskId}`);
  const feedbackEl = document.getElementById(`feedback-${taskId}`);
  
  if (inputEl.value.trim() === task.answer.trim()) {
    feedbackEl.className = "feedback correct";
    feedbackEl.innerText = "正解！ " + (task.explanation || "");
    setTimeout(() => markTaskComplete(taskId), 800);
  } else {
    feedbackEl.className = "feedback incorrect";
    feedbackEl.innerText = "不正解！ノートで見直そう。";
  }
}

function markTaskComplete(taskId) {
  if (!completedTaskIds.includes(taskId)) {
    completedTaskIds.push(taskId);
    localStorage.setItem("day_completed_tasks", JSON.stringify(completedTaskIds));
    
    const allCurrentTasks = currentDayTasks.map(t => t.id);
    const isAllClear = allCurrentTasks.length > 0 && allCurrentTasks.every(id => completedTaskIds.includes(id));

    if (isAllClear) {
      unlockReward(currentDay);
    } else {
      renderPage();
    }
  }
}

function unlockReward(day) {
  const reward = uniformRewards[day];
  if (reward && !unlockedUniforms.some(u => u.day === day)) {
    unlockedUniforms.push({ day, ...reward });
    localStorage.setItem("unlocked_uniforms", JSON.stringify(unlockedUniforms));

    document.getElementById("reward-title").innerText = reward.name;
    document.getElementById("reward-img-src").src = reward.img;
    document.getElementById("reward-desc").innerText = reward.desc;
    document.getElementById("reward-modal").style.display = "flex";
  } else {
    renderPage();
  }
}

function closeRewardModal() {
  document.getElementById("reward-modal").style.display = "none";
  renderPage();
}

function renderAlbum() {
  const albumContainer = document.getElementById("album-container");
  albumContainer.innerHTML = "";

  Object.keys(uniformRewards).forEach(day => {
    const reward = uniformRewards[day];
    const isUnlocked = unlockedUniforms.some(u => u.day == day);
    
    const card = document.createElement("div");
    card.className = `album-card ${isUnlocked ? '' : 'locked'}`;
    card.innerHTML = `
      <img src="${isUnlocked ? reward.img : 'images/uniforms/locked.png'}" class="album-img" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\'><text x=\\'20\\' y=\\'50\\'>🔒未獲得</text></svg>';">
      <div style="font-size:12px; font-weight:bold;">${isUnlocked ? reward.name : '🔒 Day ' + day + ' 達成で解放'}</div>
    `;
    albumContainer.appendChild(card);
  });
}

function toggleWeakBtn(kanjiId, btnEl) {
  if (reviewKanjiIds.includes(kanjiId)) {
    reviewKanjiIds = reviewKanjiIds.filter(id => id !== kanjiId);
    btnEl.classList.remove("selected");
  } else {
    reviewKanjiIds.push(kanjiId);
    btnEl.classList.add("selected");
  }
  localStorage.setItem("kanji_weak_list", JSON.stringify(reviewKanjiIds));
}

function clearWeakBtn(kanjiId, btnEl) {
  reviewKanjiIds = reviewKanjiIds.filter(id => id !== kanjiId);
  localStorage.setItem("kanji_weak_list", JSON.stringify(reviewKanjiIds));
  btnEl.style.opacity = "0.3";
  btnEl.disabled = true;
}