// スプレッドシートの公開CSV URL
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTzYoXb4M6qc3sfcufFt1c223xm8N8HO5OtzsK4rwWy9wt7orxWX6XgEVJxMv_rwHASopdqnvBnn_OW/pub?output=csv';

let allTasks = [];

document.addEventListener('DOMContentLoaded', () => {
  fetchData();
});

async function fetchData() {
  try {
    const response = await fetch(SPREADSHEET_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.text();
    allTasks = parseCSV(data);
    
    renderSubjectButtons(allTasks);
    renderTasks(allTasks);
  } catch (error) {
    console.error('データの取得に失敗しました:', error);
  }
}

// CSVパーサー
function parseCSVRow(text) {
  const result = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') { cell += '"'; i++; } 
      else { inQuotes = !inQuotes; }
    } else if (c === ',' && !inQuotes) {
      result.push(cell.trim()); cell = '';
    } else { cell += c; }
  }
  result.push(cell.trim());
  return result;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  return lines.slice(1).map(line => {
    const row = parseCSVRow(line);
    const cleanRow = row.map(val => val.replace(/^"|"$/g, '').trim());
    return {
      day: cleanRow[0] || '',
      id: cleanRow[1] || '',
      groupId: cleanRow[2] || '',
      groupImage: cleanRow[3] || '',
      subject: cleanRow[4] || '',
      type: cleanRow[5] || '',
      title: cleanRow[6] || '',
      question: cleanRow[7] || '',
      answer: cleanRow[8] || '',
      options: cleanRow[9] || ''
    };
  });
}

// 画像パス補完処理
function fixImagePath(path) {
  if (!path || path === '(空欄)') return '';
  let cleanPath = path.trim();
  if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
  if (!cleanPath.startsWith('http') && !cleanPath.startsWith('./')) {
    cleanPath = './' + cleanPath;
  }
  return cleanPath;
}

// 教科切り替えボタン
function renderSubjectButtons(tasks) {
  const buttonContainer = document.getElementById('button-container') || document.getElementById('filter-buttons');
  if (!buttonContainer) return;

  buttonContainer.innerHTML = '';
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
      if (subject === 'すべて') renderTasks(allTasks);
      else renderTasks(allTasks.filter(t => t.subject === subject));
    });
    buttonContainer.appendChild(btn);
  });
}

// 間違えた漢字問題の記憶処理 (LocalStorage)
function getWrongKanji() {
  return JSON.parse(localStorage.getItem('wrong_kanji_list') || '[]');
}

function toggleWrongKanji(kanjiKey) {
  let list = getWrongKanji();
  if (list.includes(kanjiKey)) {
    list = list.filter(k => k !== kanjiKey);
  } else {
    list.push(kanjiKey);
  }
  localStorage.setItem('wrong_kanji_list', JSON.stringify(list));
}

// 画面描画メイン
function renderTasks(tasks) {
  const container = document.getElementById('task-container') || document.body;
  let listArea = document.getElementById('task-list');
  if (!listArea) {
    listArea = document.createElement('div');
    listArea.id = 'task-list';
    container.appendChild(listArea);
  }
  listArea.innerHTML = '';

  let currentSubject = null;
  let currentImage = null;
  let currentCard = null;

  tasks.forEach((task) => {
    const isKanji = task.subject === '漢字' || task.type === 'note';
    const isReviewDay = String(task.day) === '13';
    const imgPath = fixImagePath(task.groupImage);
    const hasImage = imgPath !== '';

    // --- 【13日目：漢字復習モード】 ---
    if (isKanji && isReviewDay) {
      const reviewCard = document.createElement('div');
      reviewCard.style.border = '2px solid #dc3545';
      reviewCard.style.borderRadius = '12px';
      reviewCard.style.padding = '16px';
      reviewCard.style.marginBottom = '20px';
      reviewCard.style.backgroundColor = '#fff';
      
      const title = document.createElement('h3');
      title.style.color = '#dc3545';
      title.style.marginTop = '0';
      title.textContent = ' 漢字の復習（11日目・12日目のチェック問題）';
      reviewCard.appendChild(title);

      if (hasImage) {
        const img = document.createElement('img');
        img.src = imgPath;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '8px';
        img.style.marginBottom = '12px';
        reviewCard.appendChild(img);
      }

      const wrongList = getWrongKanji();
      if (wrongList.length === 0) {
        const msg = document.createElement('p');
        msg.textContent = '🎉 復習する問題（間違えたチェック）はありません！完璧です！';
        reviewCard.appendChild(msg);
      } else {
        const listText = document.createElement('p');
        listText.style.fontSize = '16px';
        listText.style.fontWeight = 'bold';
        listText.style.color = '#dc3545';
        listText.textContent = `復習が必要な問題番号: ${wrongList.join(', ')}`;
        reviewCard.appendChild(listText);
      }
      listArea.appendChild(reviewCard);
      return;
    }

    // --- カード枠の新規作成 ---
    const isSubjectChanged = task.subject !== currentSubject;
    const isImageChanged = hasImage && imgPath !== currentImage;

    if (!currentCard || isSubjectChanged || isImageChanged || isKanji) {
      currentCard = document.createElement('div');
      currentCard.style.border = '1px solid #ddd';
      currentCard.style.borderRadius = '12px';
      currentCard.style.padding = '16px';
      currentCard.style.marginBottom = '20px';
      currentCard.style.backgroundColor = '#fff';

      if (task.subject) {
        const subjectTag = document.createElement('span');
        subjectTag.textContent = `${task.subject} (Day ${task.day})`;
        subjectTag.style.display = 'inline-block';
        subjectTag.style.padding = '4px 12px';
        subjectTag.style.borderRadius = '4px';
        subjectTag.style.backgroundColor = isKanji ? '#28a745' : (task.subject === '算数' ? '#007bff' : '#ff8c00');
        subjectTag.style.color = '#fff';
        subjectTag.style.fontWeight = 'bold';
        subjectTag.style.marginBottom = '12px';
        currentCard.appendChild(subjectTag);
      }

      if (hasImage) {
        const imgContainer = document.createElement('div');
        imgContainer.style.marginBottom = '16px';
        imgContainer.style.textAlign = 'center';
        const img = document.createElement('img');
        img.src = imgPath;
        img.alt = '問題画像';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.borderRadius = '8px';
        img.style.border = '1px solid #eee';
        imgContainer.appendChild(img);
        currentCard.appendChild(imgContainer);
      }

      listArea.appendChild(currentCard);
      currentSubject = task.subject;
      currentImage = hasImage ? imgPath : null;
    }

    // --- 【11・12日目：漢字 5×4 20ボタン設定】 ---
    if (isKanji) {
      const gridContainer = document.createElement('div');
      gridContainer.style.display = 'grid';
      gridContainer.style.gridTemplateColumns = 'repeat(5, 1fr)';
      gridContainer.style.gap = '8px';
      gridContainer.style.marginTop = '12px';

      const wrongList = getWrongKanji();

      for (let i = 1; i <= 20; i++) {
        const itemKey = `Day${task.day}-${i}`;
        const btn = document.createElement('button');
        btn.textContent = `${i}`;
        
        const isWrong = wrongList.includes(itemKey);
        btn.style.padding = '10px 0';
        btn.style.fontWeight = 'bold';
        btn.style.borderRadius = '6px';
        btn.style.border = '1px solid #ccc';
        btn.style.cursor = 'pointer';
        btn.style.backgroundColor = isWrong ? '#dc3545' : '#f8f9fa';
        btn.style.color = isWrong ? '#ffffff' : '#333333';

        btn.addEventListener('click', () => {
          toggleWrongKanji(itemKey);
          const updatedList = getWrongKanji();
          const nowWrong = updatedList.includes(itemKey);
          btn.style.backgroundColor = nowWrong ? '#dc3545' : '#f8f9fa';
          btn.style.color = nowWrong ? '#ffffff' : '#333333';
        });

        gridContainer.appendChild(btn);
      }
      currentCard.appendChild(gridContainer);
      return;
    }

    // --- 通常問題（算数・社会） ---
    if (task.title || task.question) {
      const itemBox = document.createElement('div');
      itemBox.style.padding = '10px 0';
      itemBox.style.borderTop = '1px dashed #eee';

      const qText = document.createElement('div');
      qText.style.fontWeight = 'bold';
      qText.style.marginBottom = '6px';
      qText.style.fontSize = '15px';
      qText.textContent = [task.title, task.question].filter(Boolean).join(' ');
      itemBox.appendChild(qText);

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
        if (input.value.trim() === task.answer) alert(`⭕ ${task.title || ''} 正解です！`);
        else alert(`❌ ${task.title || ''} 不正解です。\n正解は: ${task.answer}`);
      });

      inputRow.appendChild(input);
      inputRow.appendChild(button);
      itemBox.appendChild(inputRow);
      currentCard.appendChild(itemBox);
    }
  });
}
