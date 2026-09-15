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

// 教科切り替えボタンを動的に生成する関数
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
    btn.style.marginBottom = '8px';
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

// 画面にタスクを描画する処理
function renderTasks(tasks) {
  const container = document.getElementById('task-container') || document.body;
  
  // ボタンエリアを消さないように、カード表示用の要素を用意
  let listArea = document.getElementById('task-list');
  if (!listArea) {
    listArea = document.createElement('div');
    listArea.id = 'task-list';
    container.appendChild(listArea);
  }
  listArea.innerHTML = '';

  tasks.forEach(task => {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.style.border = '1px solid #ddd';
    card.style.borderRadius = '8px';
    card.style.padding = '16px';
    card.style.marginBottom = '16px';
    card.style.backgroundColor = '#fff';

    // 教科タグ
    if (task.subject) {
      const subjectTag = document.createElement('span');
      subjectTag.className = `subject-tag ${task.subject}`;
      subjectTag.textContent = task.subject;
      subjectTag.style.display = 'inline-block';
      subjectTag.style.padding = '4px 10px';
      subjectTag.style.borderRadius = '4px';
      subjectTag.style.backgroundColor = task.subject === '算数' ? '#007bff' : '#ff8c00';
      subjectTag.style.color = '#fff';
      subjectTag.style.fontWeight = 'bold';
      subjectTag.style.marginBottom = '12px';
      card.appendChild(subjectTag);
    }

    // 画像表示
    if (task.groupImage && task.groupImage !== '(空欄)' && task.groupImage.trim() !== '') {
      const imgContainer = document.createElement('div');
      imgContainer.style.marginBottom = '12px';
      
      const img = document.createElement('img');
      img.src = task.groupImage;
      img.alt = '問題画像';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.borderRadius = '4px';
      
      imgContainer.appendChild(img);
      card.appendChild(imgContainer);
    }

    // タイトル（問1 など）
    if (task.title) {
      const titleEl = document.createElement('h3');
      titleEl.textContent = task.title;
      titleEl.style.margin = '4px 0 8px 0';
      card.appendChild(titleEl);
    }

    // 問題文
    if (task.question) {
      const questionEl = document.createElement('p');
      questionEl.textContent = task.question;
      questionEl.style.fontSize = '16px';
      questionEl.style.lineHeight = '1.6';
      questionEl.style.margin = '0 0 12px 0';
      card.appendChild(questionEl);
    }

    // 解答入力フォーム
    const inputContainer = document.createElement('div');
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '解答を入力';
    input.style.width = '100%';
    input.style.padding = '8px 12px';
    input.style.boxSizing = 'border-box';
    input.style.marginBottom = '8px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '4px';

    const button = document.createElement('button');
    button.textContent = '回答する';
    button.style.width = '100%';
    button.style.padding = '10px';
    button.style.backgroundColor = '#007bff';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.fontWeight = 'bold';
    button.style.cursor = 'pointer';

    button.addEventListener('click', () => {
      const userAnswer = input.value.trim();
      if (userAnswer === task.answer) {
        alert('⭕ 正解です！');
      } else {
        alert(`❌ 不正解です。\n正解は: ${task.answer}`);
      }
    });

    inputContainer.appendChild(input);
    inputContainer.appendChild(button);
    card.appendChild(inputContainer);

    listArea.appendChild(card);
  });
}
