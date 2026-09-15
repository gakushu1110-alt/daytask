// スプレッドシートの公開CSV URL
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTzYoXb4M6qc3sfcufFt1c223xm8N8HO5OtzsK4rwWy9wt7orxWX6XgEVJxMv_rwHASopdqnvBnn_OW/pub?output=csv';

let allTasks = []; // 全データを保持する配列

document.addEventListener('DOMContentLoaded', () => {
  fetchData();
});

// データを取得する関数
async function fetchData() {
  try {
    const response = await fetch(SPREADSHEET_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.text();
    
    // CSVデータを解析
    allTasks = parseCSV(data);
    
    // 教科ボタンの生成と全問題の描画
    renderSubjectButtons(allTasks);
    renderTasks(allTasks);
  } catch (error) {
    console.error('データの取得に失敗しました:', error);
  }
}

// CSVパーサー（1行解析）
function parseCSVRow(text) {
  const result = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cell.trim());
      cell = '';
    } else {
      cell += c;
    }
  }
  result.push(cell.trim());
  return result;
}

// CSV全体を解析
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  
  return lines.slice(1).map(line => {
    const row = parseCSVRow(line);
    const cleanRow = row.map(val => val.replace(/^"|"$/g, '').trim());

    return {
      day: cleanRow[0] || '',         // A列: day
      id: cleanRow[1] || '',          // B列: id
      groupId: cleanRow[2] || '',     // C列: groupId
      groupImage: cleanRow[3] || '',  // D列: groupImage
      subject: cleanRow[4] || '',     // E列: subject
      type: cleanRow[5] || '',        // F列: type
      title: cleanRow[6] || '',       // G列: title
      question: cleanRow[7] || '',    // H列: question
      answer: cleanRow[8] || '',      // I列: answer
      options: cleanRow[9] || ''      // J列: options
    };
  });
}

// 教科切り替えボタンを生成する関数
function renderSubjectButtons(tasks) {
  const buttonContainer = document.getElementById('button-container') || document.getElementById('filter-buttons');
  if (!buttonContainer) return;

  buttonContainer.innerHTML = '';

  // データ内に存在する教科の一覧を取得（重複排除）
  const subjects = ['すべて', ...new Set(tasks.map(t => t.subject).filter(Boolean))];

  subjects.forEach(subject => {
    const btn = document.createElement('button');
    btn.textContent = subject;
    btn.className = 'filter-btn';
    btn.style.marginRight = '8px';
    btn.style.marginBottom = '12px';
    btn.style.padding = '8px 16px';
    btn.style.border = '1px solid #007bff';
    btn.style.borderRadius = '20px';
    btn.style.backgroundColor = '#fff';
    btn.style.color = '#007bff';
    btn.style.cursor = 'pointer';
    btn.style.fontWeight = 'bold';

    btn.addEventListener('click', () => {
      if (subject === 'すべて') {
        renderTasks(allTasks);
      } else {
        const filtered = allTasks.filter(t => t.subject === subject);
        renderTasks(filtered);
      }
    });

    buttonContainer.appendChild(btn);
  });
}

// 画面にタスクを描画する処理（1枚の画像で複数問を表示するグループ化対応）
function renderTasks(tasks) {
  const container = document.getElementById('task-container') || document.body;
  
  let listArea = document.getElementById('task-list');
  if (!listArea) {
    listArea = document.createElement('div');
    listArea.id = 'task-list';
    container.appendChild(listArea);
  }
  listArea.innerHTML = '';

  let currentImage = null;
  let currentCard = null;

  tasks.forEach((task) => {
    const hasImage = task.groupImage && task.groupImage !== '(空欄)' && task.groupImage.trim() !== '';

    // 新しい画像グループが始まった場合、または画像がない単体の問題の場合にカード枠を新規作成
    if (!currentCard || (hasImage && task.groupImage !== currentImage) || (!hasImage && currentImage !== null)) {
      currentCard = document.createElement('div');
      currentCard.className = 'task-card';
      currentCard.style.border = '1px solid #ddd';
      currentCard.style.borderRadius = '12px';
      currentCard.style.padding = '16px';
      currentCard.style.marginBottom = '20px';
      currentCard.style.backgroundColor = '#fff';

      // 教科タグ
      if (task.subject) {
        const subjectTag = document.createElement('span');
        subjectTag.className = `subject-tag ${task.subject}`;
        subjectTag.textContent = task.subject;
        subjectTag.style.display = 'inline-block';
        subjectTag.style.padding = '4px 12px';
        subjectTag.style.borderRadius = '4px';
        subjectTag.style.backgroundColor = task.subject === '算数' ? '#007bff' : (task.subject === '漢字' ? '#28a745' : '#ff8c00');
        subjectTag.style.color = '#fff';
        subjectTag.style.fontWeight = 'bold';
        subjectTag.style.marginBottom = '12px';
        currentCard.appendChild(subjectTag);
      }

      // 20問共通の画像をカードの最上部に1枚だけ表示
      if (hasImage) {
        const imgContainer = document.createElement('div');
        imgContainer.style.marginBottom = '16px';
        imgContainer.style.textAlign = 'center';

        const img = document.createElement('img');
        img.src = task.groupImage;
        img.alt = '問題一覧画像';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.borderRadius = '8px';
        img.style.border = '1px solid #eee';

        imgContainer.appendChild(img);
        currentCard.appendChild(imgContainer);
      }

      listArea.appendChild(currentCard);
      currentImage = hasImage ? task.groupImage : null;
    }

    // 各問題の回答用ブロックを作成
    const itemBox = document.createElement('div');
    itemBox.style.padding = '10px 0';
    itemBox.style.borderTop = '1px dashed #eee';

    // タイトル（例: 問1）や問題文があれば表示
    if (task.title || task.question) {
      const qText = document.createElement('div');
      qText.style.fontWeight = 'bold';
      qText.style.marginBottom = '6px';
      qText.style.fontSize = '15px';
      qText.textContent = [task.title, task.question].filter(Boolean).join(' ');
      itemBox.appendChild(qText);
    }

    // 入力フォームとボタン
    const inputRow = document.createElement('div');
    inputRow.style.display = 'flex';
    inputRow.style.gap = '8px';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '解答';
    input.style.flex = '1';
    input.style.padding = '8px 12px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '4px';

    const button = document.createElement('button');
    button.textContent = '判定';
    button.style.padding = '8px 16px';
    button.style.backgroundColor = '#007bff';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.fontWeight = 'bold';
    button.style.cursor = 'pointer';

    button.addEventListener('click', () => {
      const userAnswer = input.value.trim();
      if (userAnswer === task.answer) {
        alert(`⭕ ${task.title || ''} 正解です！`);
      } else {
        alert(`❌ ${task.title || ''} 不正解です。\n正解は: ${task.answer}`);
      }
    });

    inputRow.appendChild(input);
    inputRow.appendChild(button);
    itemBox.appendChild(inputRow);

    currentCard.appendChild(itemBox);
  });
}
