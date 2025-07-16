// --- ELEMEN & PENGATURAN ---
const setupArea = document.getElementById("setup-area");
const gridSizeSelection = document.getElementById("grid-size-selection");
const timeSelection = document.getElementById("time-selection");
const gameStatusArea = document.getElementById("game-status-area");
const gameBoardWrapper = document.getElementById("game-board-wrapper");
const recallInstructionArea = document.getElementById(
  "recall-instruction-area"
); // BARU
const revealPhaseContainer = document.getElementById("reveal-phase-container");
const questionArea = document.getElementById("question-area");
const scoreArea = document.getElementById("score-area");
const gameBoard = document.getElementById("game-board");
const answerBoard = document.getElementById("answer-board");
const inputPalette = document.getElementById("input-palette");
const timeOptions = document.getElementById("time-options");
const proceedToRecallButton = document.getElementById(
  "proceed-to-recall-button"
); // Nama diubah untuk kejelasan
const proceedToRevealButton = document.getElementById(
  "proceed-to-reveal-button"
); // BARU
const submitAnswerButton = document.getElementById("submit-answer-button");
const nextQuestionButton = document.getElementById("next-question-button");
const playAgainButton = document.getElementById("play-again-button");
const timerSpan = document.getElementById("timer");
const totalScoreSpan = document.getElementById("total-score");
const modalOverlay = document.getElementById("modal-overlay");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");
const modalCloseButton = document.getElementById("modal-close-button");

// Pengaturan Game
let GRID_SIZE = 10;
let DIAMOND_COUNT = 15;
const TOTAL_QUESTIONS = 5;
const diamondMap = { 5: 5, 7: 10, 10: 15 };

// Variabel State
let board = [];
let timer;
let gameState = "initial";
let currentQuestion = 0;
let totalScore = 0;
let questionCoords = { row: 0, col: 0 };
let selectedValue = null;
let userAnswers = {};

// --- FUNGSI LOGIKA GAME ---

// (Fungsi createBoard(), renderLabels(), renderMainBoard() tidak berubah)
function createBoard() {
  const newBoard = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    newBoard.push([]);
    for (let c = 0; c < GRID_SIZE; c++) {
      newBoard[r].push({ isDiamond: false, adjacentDiamonds: 0 });
    }
  }
  let diamondsPlaced = 0;
  while (diamondsPlaced < DIAMOND_COUNT) {
    const r = Math.floor(Math.random() * GRID_SIZE);
    const c = Math.floor(Math.random() * GRID_SIZE);
    if (!newBoard[r][c].isDiamond) {
      newBoard[r][c].isDiamond = true;
      diamondsPlaced++;
    }
  }
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (newBoard[r][c].isDiamond) continue;
      let count = 0;
      for (let ro = -1; ro <= 1; ro++) {
        for (let co = -1; co <= 1; co++) {
          const nr = r + ro;
          const nc = c + co;
          if (
            nr >= 0 &&
            nr < GRID_SIZE &&
            nc >= 0 &&
            nc < GRID_SIZE &&
            newBoard[nr][nc].isDiamond
          ) {
            count++;
          }
        }
      }
      newBoard[r][c].adjacentDiamonds = count;
    }
  }
  return newBoard;
}

function renderLabels(wrapperElement) {
  const top = wrapperElement.querySelector(".label-top");
  const bottom = wrapperElement.querySelector(".label-bottom");
  const left = wrapperElement.querySelector(".label-left");
  const right = wrapperElement.querySelector(".label-right");
  [top, bottom, left, right].forEach((el) => (el.innerHTML = ""));
  for (let i = 0; i < GRID_SIZE; i++) {
    const letter = String.fromCharCode(65 + i);
    top.innerHTML += `<div class="label-item">${letter}</div>`;
    bottom.innerHTML += `<div class="label-item">${letter}</div>`;
    const number = i + 1;
    left.innerHTML += `<div class="label-item">${number}</div>`;
    right.innerHTML += `<div class="label-item">${number}</div>`;
  }
}

function renderMainBoard() {
  gameBoard.innerHTML = "";
  gameBoard.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cellElement = document.createElement("div");
      cellElement.className = "cell";
      const cell = board[r][c];
      if (cell.isDiamond) {
        cellElement.textContent = "💎";
        cellElement.classList.add("diamond");
      } else {
        cellElement.textContent = cell.adjacentDiamonds;
      }
      gameBoard.appendChild(cellElement);
    }
  }
}

function startGame(memorizeTime) {
  gameState = "memorizing";
  board = createBoard();
  setupArea.style.display = "none";
  gameStatusArea.style.display = "block";
  gameBoardWrapper.style.display = "grid";
  recallInstructionArea.style.display = "none";
  revealPhaseContainer.style.display = "none";
  renderLabels(gameBoardWrapper);
  renderMainBoard();
  if (memorizeTime === 0) {
    timerSpan.textContent = "∞";
    proceedToRecallButton.style.display = "inline-block";
  } else {
    let timeLeft = memorizeTime;
    timerSpan.textContent = `${timeLeft}s`;
    timer = setInterval(() => {
      timeLeft--;
      timerSpan.textContent = `${timeLeft}s`;
      if (timeLeft < 0) {
        clearInterval(timer);
        showRecallInstruction(); // DIUBAH: Panggil instruksi, bukan langsung ujian
      }
    }, 1000);
  }
}

// FUNGSI BARU: Menampilkan layar instruksi untuk mencatat
function showRecallInstruction() {
  gameState = "recalling";
  gameBoardWrapper.style.display = "none";
  gameStatusArea.style.display = "none";
  recallInstructionArea.style.display = "block";
}

function startRevealPhase() {
  gameState = "playing";
  currentQuestion = 0;
  totalScore = 0;
  totalScoreSpan.textContent = totalScore;
  recallInstructionArea.style.display = "none"; // Sembunyikan instruksi
  revealPhaseContainer.style.display = "flex";
  askQuestion();
}

function askQuestion() {
  currentQuestion++;
  userAnswers = {};
  selectedValue = null;
  questionArea.style.display = "block";
  scoreArea.style.display = "none";
  submitAnswerButton.disabled = false;
  document
    .querySelectorAll(".palette-btn")
    .forEach((btn) => btn.classList.remove("active"));

  questionCoords.row = Math.floor(Math.random() * (GRID_SIZE - 2));
  questionCoords.col = Math.floor(Math.random() * (GRID_SIZE - 2));

  answerBoard.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    const r_offset = Math.floor(i / 3);
    const c_offset = i % 3;
    const actualRow = questionCoords.row + r_offset;
    const actualCol = questionCoords.col + c_offset;

    cell.className = "answer-cell";
    cell.dataset.index = i;

    // DIUBAH: Menggunakan data-attribute untuk placeholder
    const placeholderText = `${String.fromCharCode(65 + actualCol)}${
      actualRow + 1
    }`;
    cell.dataset.placeholder = placeholderText;

    answerBoard.appendChild(cell);
  }

  const colLetter = String.fromCharCode(65 + questionCoords.col);
  const title = `Pertanyaan ${currentQuestion} / ${TOTAL_QUESTIONS}`;
  const text = `Isi blok 3x3 yang dimulai dari koordinat <strong>${colLetter}${
    questionCoords.row + 1
  }</strong>.`;
  showModal(title, text);
}

// (Fungsi checkAnswer() dan showModal() tidak berubah)
function checkAnswer() {
  gameState = "scoring";
  submitAnswerButton.disabled = true;
  scoreArea.style.display = "block";
  const answerCells = answerBoard.querySelectorAll(".answer-cell");
  let roundScore = 0;
  for (let i = 0; i < 9; i++) {
    const cellElement = answerCells[i];
    const r_offset = Math.floor(i / 3);
    const c_offset = i % 3;
    const actualCell =
      board[questionCoords.row + r_offset][questionCoords.col + c_offset];
    const userAnswer = userAnswers[i] || null;
    const correctAnswer = actualCell.isDiamond
      ? "diamond"
      : actualCell.adjacentDiamonds.toString();
    cellElement.textContent = actualCell.isDiamond
      ? "💎"
      : actualCell.adjacentDiamonds;
    if (userAnswer === correctAnswer) {
      roundScore++;
      cellElement.classList.add("correct");
    } else {
      cellElement.classList.add("incorrect");
    }
  }
  totalScore += roundScore;
  totalScoreSpan.textContent = totalScore;
  if (currentQuestion >= TOTAL_QUESTIONS) {
    nextQuestionButton.style.display = "none";
    playAgainButton.style.display = "inline-block";
    setTimeout(
      () =>
        showModal(
          "Permainan Selesai!",
          `Skor akhir Anda adalah <strong>${totalScore}</strong>.`
        ),
      500
    );
  } else {
    nextQuestionButton.style.display = "inline-block";
    playAgainButton.style.display = "none";
  }
}

function showModal(title, text) {
  modalTitle.innerHTML = title;
  modalText.innerHTML = text;
  modalOverlay.style.display = "flex";
}

// --- EVENT LISTENERS ---
gridSizeSelection.addEventListener("click", (event) => {
  if (event.target.classList.contains("size-btn")) {
    GRID_SIZE = parseInt(event.target.dataset.size, 10);
    DIAMOND_COUNT = diamondMap[GRID_SIZE];
    document
      .querySelectorAll(".size-btn")
      .forEach((btn) => btn.classList.remove("active"));
    event.target.classList.add("active");
    gridSizeSelection.querySelector(
      "h2"
    ).textContent = `Ukuran Papan: ${GRID_SIZE}x${GRID_SIZE}`;
    timeSelection.style.display = "block";
  }
});

timeOptions.addEventListener("click", (event) => {
  if (event.target.classList.contains("time-btn")) {
    const time = parseInt(event.target.dataset.time, 10);
    startGame(time);
  }
});

proceedToRecallButton.addEventListener("click", showRecallInstruction); // DIUBAH
proceedToRevealButton.addEventListener("click", startRevealPhase); // BARU
modalCloseButton.addEventListener(
  "click",
  () => (modalOverlay.style.display = "none")
);
submitAnswerButton.addEventListener("click", checkAnswer);
nextQuestionButton.addEventListener("click", askQuestion);
playAgainButton.addEventListener("click", () => location.reload());

inputPalette.addEventListener("click", (event) => {
  if (event.target.classList.contains("palette-btn")) {
    selectedValue = event.target.dataset.value;
    document
      .querySelectorAll(".palette-btn")
      .forEach((btn) => btn.classList.remove("active"));
    event.target.classList.add("active");
  }
});

answerBoard.addEventListener("click", (event) => {
  if (
    gameState === "playing" &&
    selectedValue &&
    event.target.classList.contains("answer-cell")
  ) {
    const cell = event.target;
    const cellIndex = cell.dataset.index;
    userAnswers[cellIndex] = selectedValue;
    cell.textContent = selectedValue === "diamond" ? "💎" : selectedValue;
    cell.classList.add("filled");
  }
});
