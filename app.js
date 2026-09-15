// スプレッドシート（または公開CSV/API）からデータを取得して描画するメイン処理

// スプレッドシートのWeb公開URL（CSV出力またはJSON APIエンドポイントを指定）
const SPREADSHEET_URL = 'ここにスプレッドシートのURLまたはAPIエンドポイントを入力';

document.addEventListener('DOMContentLoaded', () => {
  fetchData();
});

// データを取得する関数
async function fetchData() {
  try {
    const response = await fetch(SPREADSHEET_URL);
    const data = await response.text();
    
    // CSVデータを解析してオブジェクト列に変換
    const tasks = parseCSV(data);
    
    // 画面に描画
    renderTasks(tasks);
  } catch (error) {
    console.error('データの取得に失敗しました:', error);
  }
}

// CSVを解析する処理（列インデックスのズレを防止）
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const rows = lines.map(line => line.split(','));
  
  // 1行目（見出し）をスキップしてデータ行のみを処理
  return rows.slice(1).map(row => {
    // 各列の値をクリーンアップ（ダブルクォーテーションや余計な空白を削除）
    const cleanRow = row.map(val => val ? val.replace(/^"|"$/g, '').trim() : '');

    return {
      day: cleanRow[0],         // A列: day
      id: cleanRow[1],          // B列: id
      groupId: cleanRow[2],     // C列: groupId
      groupImage: cleanRow[3],  // D列: groupImage
      subject: cleanRow[4],     // E列: subject
      type: cleanRow[5],        // F列: type
      title: cleanRow[6],       // G列: title (問1 など)
      question: cleanRow[7],    // H列: question (問題文)
      answer: cleanRow[8],      // I列: answer (正解)
      options: cleanRow[9]      // J列: options
    };
  });
}

// 画面にタスク（問題）を描画する処理
function renderTasks(tasks) {
  const container = document.getElementById('task-container') || document.body;
  container.innerHTML = '';

  tasks.forEach(task => {
    // 問題カードの要素を作成
    const card = document.createElement('div');
    card.className = 'task-card';
    card.style.border = '1px solid #ccc';
    card.style.borderRadius = '8px';
    card.style.padding = '16px';
    card.style.marginBottom = '16px';
    card.style.backgroundColor = '#fff';

    // 教科タグ
    const subjectTag = document.createElement('span');
    subjectTag.className = `subject-tag ${task.subject}`;
    subjectTag.textContent = task.subject;
    subjectTag.style.display = 'inline-block';
    subjectTag.style.padding = '2px 8px';
    subjectTag.style.borderRadius = '4px';
    subjectTag.style.backgroundColor = task.subject === '算数' ? '#007bff' : '#ff8c00';
    subjectTag.style.color = '#fff';
    subjectTag.style.fontWeight = 'bold';
    subjectTag.style.marginBottom = '8px';
    card.appendChild(subjectTag);

    // 画像の表示処理（groupImageにパスがある場合）
    if (task.groupImage && task.groupImage !== '(空欄)') {
      const imgContainer = document.createElement('div');
      imgContainer.style.marginBottom = '12px';
      
      const img = document.createElement('img');
      img.src = task.groupImage;
      img.alt = '問題画像';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      
      imgContainer.appendChild(img);
      card.appendChild(imgContainer);
    }

    // タイトル（問1 など）を表示
    if (task.title) {
      const titleEl = document.createElement('h3');
      titleEl.textContent = task.title;
      titleEl.style.margin = '4px 0';
      card.appendChild(titleEl);
    }

    // 問題文（H列: question）を表示
    const questionEl = document.createElement('p');
    questionEl.textContent = task.question;
    questionEl.style.fontSize = '16px';
    questionEl.style.lineHeight = '1.5';
    card.appendChild(questionEl);

    // 解答入力フォーム
    const inputContainer = document.createElement('div');
    inputContainer.style.marginTop = '12px';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '解答を入力';
    input.style.width = '100%';
    input.style.padding = '8px';
    input.style.boxSizing = 'border-box';
    input.style.marginBottom = '8px';

    const button = document.createElement('button');
    button.textContent = '回答する';
    button.style.width = '100%';
    button.style.padding = '10px';
    button.style.backgroundColor = '#007bff';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';

    // 採点判定ロジック
    button.addEventListener('click', () => {
      const userAnswer = input.value.trim();
      if (userAnswer === task.answer) {
        alert('正解です！');
      } else {
        alert(`不正解です。正解は: ${task.answer}`);
      }
    });

    inputContainer.appendChild(input);
    inputContainer.appendChild(button);
    card.appendChild(inputContainer);

    container.appendChild(card);
  });
}
