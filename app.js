// スプレッドシートからデータ取得
async function loadDayData(day) {
  currentDay = day;
  const container = document.getElementById("main-container");
  const statusContainer = document.getElementById("status-container");
  
  if (container) container.innerHTML = "<p style='text-align:center;'>データを読み込んでいます...</p>";
  if (statusContainer) statusContainer.innerHTML = "";

  try {
    const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");

    if (lines.length > 1) {
      const allTasks = [];
      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (!row[0]) continue;

        allTasks.push({
          day: parseInt(row[0]) || 0,                            // A列: day
          id: row[1] || "",                                      // B列: id
          groupId: row[2] || "",                                 // C列: groupId
          groupImage: row[3] || "",                              // D列: groupImage
          subject: row[4] || "全般",                              // E列: subject
          badgeClass: getBadgeClass(row[4]),
          type: row[5] || "input",                               // F列: type
          question: row[6] || "",                                // G列: question (問題文)
          answer: row[7] || "",                                  // H列: answer (正解)
          options: row[8] ? row[8].split(",").map(s => s.trim()) : [], // I列: options (選択肢)
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
        <p style="font-size:12px; color:#666;">（詳細: ${error.message}）</p>
      </div>`;
    }
    return;
  }

  renderPage();
}
