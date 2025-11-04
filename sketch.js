// 每次從題庫隨機抽 5 題、淺藍背景、答題有回饋與煙火動畫、結果顯示對應文字
let questionTable;
let allQuestions = [];
let quizQuestions = []; // 儲存本次測驗的5個題目
let currentQuestionIndex = 0;
let score = 0;
let gameState = 'START'; // START, QUESTION, FEEDBACK, RESULT

// 按鈕物件
let answerButtons = [];
let startButton, restartButton;

// 背景粒子 (裝飾)
let bgParticles = [];

// 煙火系統
let fireworks = [];
let fireworksTimer = 0;

// 回饋
let feedbackMessage = '';
let feedbackColor;
let feedbackTimer = 0;

function preload() {
  // 嘗試載入 csv，使用成功/失敗回呼以便紀錄
  questionTable = loadTable('questions.csv', 'csv', 'header',
    () => console.log('questions.csv 載入成功'),
    (err) => console.error('questions.csv 載入失敗', err)
  );
}

function setup() {
  createCanvas(800, 600);

  // 如果 CSV 未載入或沒有資料，使用備援題庫，避免整個程式錯誤導致白屏
  if (!questionTable || typeof questionTable.getRowCount !== 'function' || questionTable.getRowCount() === 0) {
    console.warn('questions.csv 未載入或無資料，使用備援題庫（偵錯用）。');
    allQuestions = [
      { question: '測試題：1 + 1 = ?', opA: '1', opB: '2', opC: '3', opD: '4', correct: 'B' },
      { question: '測試題：2 + 2 = ?', opA: '2', opB: '3', opC: '4', opD: '5', correct: 'C' },
      { question: '測試題：3 + 3 = ?', opA: '5', opB: '6', opC: '7', opD: '8', correct: 'B' },
      { question: '測試題：4 + 1 = ?', opA: '4', opB: '5', opC: '6', opD: '7', correct: 'B' },
      { question: '測試題：5 + 0 = ?', opA: '5', opB: '4', opC: '3', opD: '2', correct: 'A' }
    ];
  } else {
    // 正常情況：從 CSV 產生題庫
    processData();
  }

  // 共用初始化
  setupBgParticles();
  setupButtons();
  startGame();

  console.log('setup complete');
}

function draw() {
  // 淺藍背景
  background(173, 216, 230);
  drawBgParticles();

  // 顯示左上學號（若需要可移除）
  push();
  fill(0);
  textSize(16);
  textAlign(LEFT, TOP);
  text('414730134', 10, 10);
  pop();

  // 根據不同的遊戲狀態繪製不同畫面
  switch (gameState) {
    case 'START':
      drawStartScreen();
      break;
    case 'QUESTION':
      drawQuestionScreen();
      break;
    case 'FEEDBACK':
      drawFeedbackScreen();
      break;
    case 'RESULT':
      drawResultScreen();
      break;
  }

  // 更新並繪製煙火（若有）
  updateFireworks();
  drawFireworks();
}

// ---------------------------------
// 遊戲流程函數
// ---------------------------------

// 1. 處理CSV資料
function processData() {
  allQuestions = []; // 重設
  for (let row of questionTable.getRows()) {
    allQuestions.push({
      question: row.getString('question'), // 使用 'header' 名稱來讀取
      opA: row.getString('opA'),
      opB: row.getString('opB'),
      opC: row.getString('opC'),
      opD: row.getString('opD'),
      correct: row.getString('correct').trim().toUpperCase() // 'A','B','C','D'
    });
  }
}

// 2. 設定按鈕位置
function setupButtons() {
  // 開始按鈕
  startButton = { x: width / 2 - 100, y: height / 2 + 50, w: 200, h: 60, text: '開始測驗' };
  // 重新開始按鈕
  restartButton = { x: width / 2 - 100, y: height / 2 + 150, w: 200, h: 60, text: '重新開始' };

  // 四個答案按鈕 (固定位置)
  answerButtons = [];
  let btnW = 350;
  let btnH = 80;
  let gap = 20;
  answerButtons.push({ x: 40, y: 250, w: btnW, h: btnH, option: 'A', text: '' });
  answerButtons.push({ x: 40 + btnW + gap, y: 250, w: btnW, h: btnH, option: 'B', text: '' });
  answerButtons.push({ x: 40, y: 250 + btnH + gap, w: btnW, h: btnH, option: 'C', text: '' });
  answerButtons.push({ x: 40 + btnW + gap, y: 250 + btnH + gap, w: btnW, h: btnH, option: 'D', text: '' });
}

// 3. 開始或重新開始遊戲
function startGame() {
  score = 0;
  currentQuestionIndex = 0;
  fireworks = [];
  fireworksTimer = 0;
  
  // 確保有題目資料
  if (allQuestions && allQuestions.length > 0) {
    let take = min(5, allQuestions.length);
    quizQuestions = shuffle(allQuestions).slice(0, take);
    gameState = 'START';
  } else {
    console.error('沒有題目資料');
  }
}

// 4. 檢查答案
function checkAnswer(selectedOption) {
  let correctOption = quizQuestions[currentQuestionIndex].correct;

  if (selectedOption === correctOption) {
    score++;
    feedbackMessage = '答對了！';
    feedbackColor = color(0, 255, 0); // 更明顯的綠色
    // 產生煙火
    for (let i = 0; i < 3; i++) {
      spawnFirework(random(100, width - 100), random(150, height - 150));
    }
  } else {
    feedbackMessage = `答錯了... 正確答案是 ${correctOption}`;
    feedbackColor = color(255, 0, 0); // 紅色
  }
  
  gameState = 'FEEDBACK';
  feedbackTimer = 90; // 顯示回饋 1.5 秒 (60fps * 1.5)
}

// 5. 進入下一題
function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex >= quizQuestions.length) {
    gameState = 'RESULT';
    // 在進入結果畫面時產生對應數量的煙火
    spawnResultFireworks();
  } else {
    gameState = 'QUESTION';
  }
}

// =========================================================
// == 這裡是修改過的函數 (1/2) ==
// =========================================================
// 新增：根據分數在結果頁面生成煙火（數量與強度依分數決定）
function spawnResultFireworks() {
  let total = quizQuestions.length;
  
  // ----------------------------------------------------
  // 新規則：只有在滿分 (5/5) 時，才在進入頁面時產生一次性煙火
  // ----------------------------------------------------
  if (score === total && total > 0) { // 加上 total > 0 避免 0/0 也放煙火
    let cnt = 12; // 滿分，放 12 個
    for (let i = 0; i < cnt; i++) {
      // 在上半部隨機位置產生
      spawnFirework(random(100, width - 100), random(80, height / 2));
    }
  }
  // 其他分數 (0-4) 則不產生任何煙火
}


// 6. 結果字串 (註：此函式未被使用，結果文字直接在 drawResultScreen 中處理)
function getResultText() {
  let total = quizQuestions.length;
  if (score === total) return `${score}/${total} 全對`;
  if (score === total - 1) return `${score}/${total} 請加油`;
  if (score === 3 && total === 5) return `${score}/${total} 請加油`;
  if (score === 2 && total === 5) return `${score}/${total} 待加油`;
  if (score === 1 && total === 5) return `${score}/${total} 再加油`;
  return `${score}/${total}`;
}

// ---------------------------------
// 畫面繪製函數
// ---------------------------------

function drawStartScreen() {
  textAlign(CENTER, CENTER);
  fill(30, 60, 90);
  textSize(48);
  text('p5.js 題庫測驗', width / 2, height / 2 - 100);
  textSize(24);
  text(`從 ${allQuestions.length} 題中隨機抽取 ${min(5, allQuestions.length)} 題`, width / 2, height / 2 - 30);
  
  // 繪製開始按鈕
  drawButton(startButton);
}

function drawQuestionScreen() {
  if (quizQuestions.length === 0) return; // 防止資料還沒載入
  
  let q = quizQuestions[currentQuestionIndex];
  
  // 繪製問題
  textAlign(LEFT, TOP);
  fill(20);
  textSize(20);
  text(`第 ${currentQuestionIndex + 1} 題 / ${quizQuestions.length} 題`, 40, 40);
  textSize(28);
  text(q.question, 40, 80, width - 80, 150); // 自動換行
  
  // 更新並繪製答案按鈕
  answerButtons[0].text = 'A. ' + q.opA;
  answerButtons[1].text = 'B. ' + q.opB;
  answerButtons[2].text = 'C. ' + q.opC;
  answerButtons[3].text = 'D. ' + q.opD;
  
  for (let btn of answerButtons) {
    drawButton(btn);
  }
}

function drawFeedbackScreen() {
  // 半透明覆蓋
  push();
  noStroke();
  fill(red(feedbackColor), green(feedbackColor), blue(feedbackColor), 140);
  rect(0, 0, width, height);
  pop();

  // 顯示回饋文字
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(48);
  text(feedbackMessage, width / 2, height / 2);

  // 計時
  feedbackTimer--;
  if (feedbackTimer <= 0) {
    nextQuestion();
  }
}

// =========================================================
// == 這裡是修改過的函數 (2/2) ==
// =========================================================
function drawResultScreen() {
  // 黃色背景
  background(255, 255, 150);
  
  let total = quizQuestions.length;

  // ----------------------------------------------------
  // 新規則：根據分數決定背景效果 (煙火 或 重複文字)
  // ----------------------------------------------------
  if (score === total && total > 0) { // 確保有題目且全對
    // 滿分 (5/5)：持續產生煙火
    if (frameCount % 20 === 0) { // 每20幀產生新煙火
      for (let i = 0; i < 3; i++) {
        spawnFirework(random(width), random(height / 2));
      }
    }
  } else {
    // 非滿分 (0-4)：背景充滿「請繼續加油」
    push();
    fill(0, 40); // 設定一個半透明的深色 (才不會太搶戲)
    noStroke();
    textSize(12); // 你指定的字體大小
    textAlign(LEFT, TOP);
    
    let txt = "請繼續加油 "; // 要重複的文字
    let spacing = 5; // 你指定的間隔
    let txtW = textWidth(txt); // 測量一次文字寬度
    let txtH = 12; // 文字高度 (即字體大小)
    
    // 使用巢狀迴圈鋪滿畫面
    for (let y = 0; y < height; y += (txtH + spacing)) {
      for (let x = 0; x < width; x += (txtW + spacing)) {
        text(txt, x, y);
      }
    }
    pop();
  }
  // ----------------------------------------------------

  // 繪製標題和分數 (這部分不變)
  textAlign(CENTER, CENTER);
  fill(20);
  
  textSize(50);
  text('測驗結束！', width / 2, 120);
  
  textSize(36);
  text(`你的成績: ${score} / ${total}`, width / 2, 200);
  
  // ----------------------------------------------------
  // 新規則：根據分數顯示對應的鼓勵/吐槽文字
  // ----------------------------------------------------
  textSize(28);
  fill(80, 30, 200); // 結果文字使用紫色
  
  let resultMsg = '';
  // 判斷總題數是否為 5 (你的邏輯是基於 5 題)
  if (total === 5) {
    if (score === 0) {
      resultMsg = "你太爛了請讀書";
    } else if (score === 1) {
      resultMsg = "你其實蠻爛的需要檢討";
    } else if (score === 2) {
      resultMsg = "有讀書但讀的不多 快去複習";
    } else if (score === 3) {
      resultMsg = "已經答對一半的題目了 繼續加油";
    } else if (score === 4) {
      resultMsg = "加油 差一題就全對了";
    } else if (score === 5) {
      resultMsg = "你超強";
    }
  } else {
    // 如果題庫不到 5 題 (例如CSV載入失敗用了備援題庫，或CSV題目少於5)，使用備用邏輯
    if (score === total && total > 0) {
      resultMsg = "你超強 (全對)";
    } else if (score === 0) {
      resultMsg = "你太爛了請讀書";
    } else {
      resultMsg = "繼續加油";
    }
  }
  
  text(resultMsg, width / 2, 260);
  // ----------------------------------------------------

  // 繪製重新開始按鈕 (不變)
  drawButton(restartButton);
}


// ---------------------------------
// 互動與輔助函數
// ---------------------------------

// 繪製按鈕 (含 hover 效果)
function drawButton(btn) {
  let isHover = isMouseOver(btn);
  
  push(); // 保存繪圖狀態
  if (isHover) {
    fill(100, 180, 255); // hover 亮藍色
    stroke(255);
    strokeWeight(2);
    cursor(HAND); // 改變滑鼠游標
  } else {
    fill(50, 100, 200, 200); // 預設藍色
    noStroke();
  }
  rect(btn.x, btn.y, btn.w, btn.h, 10); // 圓角矩形
  
  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER);
  text(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2); // 按鈕文字置中
  pop(); // 恢復繪圖狀態
}

// 檢查滑鼠是否在按鈕上
function isMouseOver(btn) {
  return (mouseX > btn.x && mouseX < btn.x + btn.w &&
          mouseY > btn.y && mouseY < btn.y + btn.h);
}

// 滑鼠點擊事件
function mousePressed() {
  // 重設游標
  cursor(ARROW);

  if (gameState === 'START') {
    if (isMouseOver(startButton)) {
      gameState = 'QUESTION';
    }
  } else if (gameState === 'QUESTION') {
    for (let btn of answerButtons) {
      if (isMouseOver(btn)) {
        checkAnswer(btn.option);
        break; // 點擊後就停止檢查
      }
    }
  } else if (gameState === 'RESULT') {
    if (isMouseOver(restartButton)) {
      startGame();
    }
  }
}

// ---------------------------------
// 背景粒子 (裝飾)
// ---------------------------------

function setupBgParticles() {
  bgParticles = [];
  for (let i = 0; i < 60; i++) {
    bgParticles.push({
      x: random(width),
      y: random(height),
      vx: random(-0.3, 0.3),
      vy: random(-0.2, 0.2),
      r: random(2, 6),
      alpha: random(50, 120)
    });
  }
}

function drawBgParticles() {
  for (let p of bgParticles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;
    noStroke();
    fill(255, p.alpha);
    ellipse(p.x, p.y, p.r);
  }
}

// ---------------------------------
// 煙火系統
// ---------------------------------

function spawnFirework(x, y) {
  let colors = [
    [255, 200, 0],    // 金黃色
    [255, 100, 0],    // 橙色
    [255, 50, 50],    // 紅色
    [255, 255, 100],  // 亮黃色
    [255, 150, 0]     // 深橙色
  ];
  let col = random(colors);
  // 增加碎片數量
  for (let i = 0; i < 100; i++) {
    let angle = random(TWO_PI);
    let speed = random(2, 8);
    fireworks.push({
      x: x,
      y: y,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      life: random(60, 120),
      age: 0,
      r: random(2, 5),
      col: col.slice()
    });
  }
  fireworksTimer = 120; // 最多顯示時間
}

function updateFireworks() {
  for (let i = fireworks.length - 1; i >= 0; i--) {
    let f = fireworks[i];
    f.x += f.vx;
    f.y += f.vy;
    // 模擬重力與空氣阻力
    f.vy += 0.06;
    f.vx *= 0.995;
    f.vy *= 0.995;
    f.age++;
    if (f.age > f.life) {
      fireworks.splice(i, 1);
    }
  }
  if (fireworksTimer > 0) fireworksTimer--;
}

function drawFireworks() {
  noStroke();
  for (let f of fireworks) {
    let alpha = map(f.age, 0, f.life, 255, 0);
    fill(f.col[0], f.col[1], f.col[2], alpha);
    ellipse(f.x, f.y, f.r * 2);
  }
}