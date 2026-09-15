// スプレッドシートの公開CSV URL
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS5zB1_bZuI8Vk7FwuyP3OWjgRVGzpP9LZ542955Kqs8adn7ustm6FB_zUNWm9Jo2py9BYGddk1Z_Bz/pub?gid=0&single=true&output=csv';

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
    
    // CSVデータを解析してオブジェクト列に変換
    const tasks = parseCSV(data);
    
    // 画面に描画
    renderTasks(tasks);
  } catch (error) {
    console.error('データの取得に失敗しました:', error);
  }
}

// 1行のCSVを正確に分割するパーサー（カンマや引用符に対応）
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

// CSV全体を解析する処理（列インデックス: A=0, B=1, ... H=7, I=8）
function parseCSV(text) {
  // 改行で分解し、空行を除外
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  
  // 1行目（見出し）をスキップして処理
  return lines.slice(1).map(line => {
    const row = parseCSVRow(line);
    // 前後のダブルクォーテーションを削除
    const cleanRow = row.map(val => val.replace(/^"|"$/g, '').trim());

    return {
      day: cleanRow[0] || '',         // A列: day
      id: cleanRow[1] || '',          // B列: id
      groupId: cleanRow[2] || '',     // C列: groupId
      groupImage: cleanRow[3] || '',  // D列: groupImage
      subject: cleanRow[4] || '',     // E列: subject
      type: cleanRow[5] || '',        // F列: type
      title: cleanRow[6] || '',       // G列: title (問1 など)
      question: cleanRow[7] || '',    // H列: question (問題文)
      answer: cleanRow[8] || '',      // I列: answer (正解)
      options: cleanRow[9] || ''      // J列: options
    };
  });
}

// 画面にタスク（問題）を描画する処理
function renderTasks(tasks) {
  const container = document.getElementById('task-container') || document.body;
  container.innerHTML = '';

  tasks.forEach(task => {
    // 問題カードの枠組み作成
    const card = document.createElement('div');
    card.className = 'task-card';
    card.style.border = '1px solid #ddd';
    card.style.borderRadius = '8px';
    card.style.padding = '16px';
    card.style.marginBottom = '16px';
    card.style.backgroundColor = '#fff';

    // 教科タグ（算数・社会など）
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

    // 画像の表示処理（groupImageにパスが入っている場合）
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

    // 問題文（H列: question）
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

    // 採点判定処理
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

    container.appendChild(card);
  });
}
