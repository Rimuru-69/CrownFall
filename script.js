const boardElement = document.getElementById('chessboard');
const turnText = document.getElementById('turn');
const statusText = document.getElementById('status');

let board = [];
let selected = null;
let turn = 'white';

// Unicode chess pieces
const pieces = {
  white: {
    king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙'
  },
  black: {
    king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟'
  }
};

// Initial board setup (simplified, you can improve it)
const initialSetup = [
  ['black', 'rook'], ['black', 'knight'], ['black', 'bishop'], ['black', 'queen'],
  ['black', 'king'], ['black', 'bishop'], ['black', 'knight'], ['black', 'rook'],
  ...Array(8).fill(['black', 'pawn']),
  ...Array(32).fill(null),
  ...Array(8).fill(['white', 'pawn']),
  ['white', 'rook'], ['white', 'knight'], ['white', 'bishop'], ['white', 'queen'],
  ['white', 'king'], ['white', 'bishop'], ['white', 'knight'], ['white', 'rook']
];

function createBoard() {
  boardElement.innerHTML = '';
  board = [];

  for (let i = 0; i < 64; i++) {
    const square = document.createElement('div');
    square.classList.add('square');
    square.classList.add((Math.floor(i / 8) + i) % 2 === 0 ? 'white' : 'black');
    square.dataset.index = i;
    square.addEventListener('click', handleClick);
    boardElement.appendChild(square);
    board.push(null);
  }

  for (let i = 0; i < 64; i++) {
    const data = initialSetup[i];
    if (data) {
      board[i] = { color: data[0], type: data[1] };
      boardElement.children[i].textContent = pieces[data[0]][data[1]];
    }
  }
}

function handleClick(e) {
  const index = parseInt(e.currentTarget.dataset.index);
  const piece = board[index];

  if (selected === null) {
    if (piece && piece.color === turn) {
      selected = index;
      highlight(index);
    }
  } else {
    if (index === selected) {
      clearHighlights();
      selected = null;
    } else {
      movePiece(selected, index);
      selected = null;
      clearHighlights();
    }
  }
}

function highlight(index) {
  clearHighlights();
  boardElement.children[index].classList.add('highlight');
}

function clearHighlights() {
  for (let square of boardElement.children) {
    square.classList.remove('highlight');
  }
}

function movePiece(from, to) {
  const piece = board[from];
  const target = board[to];

  if (!piece) return;

  if (target && target.color === piece.color) return;

  // Very basic movement validation (expand as needed)
  const valid = isValidMove(piece, from, to);
  if (!valid) return;

  board[to] = piece;
  board[from] = null;
  boardElement.children[to].textContent = pieces[piece.color][piece.type];
  boardElement.children[from].textContent = '';

  turn = turn === 'white' ? 'black' : 'white';
  turnText.textContent = `Turn: ${capitalize(turn)}`;
}

function isValidMove(piece, from, to) {
  const rowFrom = Math.floor(from / 8), colFrom = from % 8;
  const rowTo = Math.floor(to / 8), colTo = to % 8;
  const dr = rowTo - rowFrom, dc = colTo - colFrom;

  switch (piece.type) {
    case 'pawn':
      const direction = piece.color === 'white' ? -1 : 1;
      const startRow = piece.color === 'white' ? 6 : 1;
      if (dc === 0 && !board[to]) {
        if (dr === direction || (dr === 2 * direction && rowFrom === startRow && !board[from + direction * 8]))
          return true;
      } else if (Math.abs(dc) === 1 && dr === direction && board[to] && board[to].color !== piece.color) {
        return true;
      }
      break;

    case 'rook':
      if (rowFrom === rowTo || colFrom === colTo)
        return isPathClear(from, to);
      break;

    case 'bishop':
      if (Math.abs(dr) === Math.abs(dc))
        return isPathClear(from, to);
      break;

    case 'queen':
      if (rowFrom === rowTo || colFrom === colTo || Math.abs(dr) === Math.abs(dc))
        return isPathClear(from, to);
      break;

    case 'king':
      return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;

    case 'knight':
      return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
  }

  return false;
}

function isPathClear(from, to) {
  const dirRow = Math.sign(Math.floor(to / 8) - Math.floor(from / 8));
  const dirCol = Math.sign(to % 8 - from % 8);
  let i = from + dirRow * 8 + dirCol;

  while (i !== to) {
    if (board[i]) return false;
    const row = Math.floor(i / 8), col = i % 8;
    i += dirRow * 8 + dirCol;
    if (row < 0 || row > 7 || col < 0 || col > 7) break;
  }

  return true;
}

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}

createBoard();
