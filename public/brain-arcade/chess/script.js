const initialBoard = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  [".", ".", ".", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", ".", ".", "."],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"]
];

const pieceMap = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟"
};

const boardElement = document.getElementById("board");
const turnIndicator = document.getElementById("turn-indicator");
const resetButton = document.getElementById("reset-board");

let boardState = [];
let selectedSquare = null;
let currentTurn = "white";

const cloneBoard = (board) => board.map((row) => [...row]);

const isWhitePiece = (piece) => piece !== "." && piece === piece.toUpperCase();
const isBlackPiece = (piece) => piece !== "." && piece === piece.toLowerCase();

const setTurnIndicator = () => {
  turnIndicator.textContent = `${currentTurn === "white" ? "White" : "Black"} to move`;
};

const clearSelection = () => {
  if (!selectedSquare) {
    return;
  }

  const { row, col } = selectedSquare;
  const square = boardElement.querySelector(
    `[data-row="${row}"][data-col="${col}"]`
  );
  if (square) {
    square.classList.remove("selected");
  }
  selectedSquare = null;
};

const renderBoard = () => {
  boardElement.innerHTML = "";
  boardState.forEach((row, rowIndex) => {
    row.forEach((piece, colIndex) => {
      const square = document.createElement("button");
      square.type = "button";
      square.className = `square ${(rowIndex + colIndex) % 2 === 0 ? "light" : "dark"}`;
      square.dataset.row = rowIndex.toString();
      square.dataset.col = colIndex.toString();
      square.setAttribute("role", "gridcell");
      square.textContent = pieceMap[piece] || "";
      square.addEventListener("click", handleSquareClick);
      boardElement.appendChild(square);
    });
  });
};

const handleSquareClick = (event) => {
  const target = event.currentTarget;
  const row = Number(target.dataset.row);
  const col = Number(target.dataset.col);
  const piece = boardState[row][col];

  if (!selectedSquare) {
    if (
      piece === "." ||
      (currentTurn === "white" && !isWhitePiece(piece)) ||
      (currentTurn === "black" && !isBlackPiece(piece))
    ) {
      return;
    }

    selectedSquare = { row, col };
    target.classList.add("selected");
    return;
  }

  if (selectedSquare.row === row && selectedSquare.col === col) {
    clearSelection();
    return;
  }

  const { row: fromRow, col: fromCol } = selectedSquare;
  const movingPiece = boardState[fromRow][fromCol];
  boardState[fromRow][fromCol] = ".";
  boardState[row][col] = movingPiece;

  clearSelection();
  currentTurn = currentTurn === "white" ? "black" : "white";
  setTurnIndicator();
  renderBoard();
};

const resetBoard = () => {
  boardState = cloneBoard(initialBoard);
  currentTurn = "white";
  clearSelection();
  setTurnIndicator();
  renderBoard();
};

resetButton.addEventListener("click", resetBoard);

resetBoard();
