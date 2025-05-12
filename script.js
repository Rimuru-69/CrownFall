const game = new Chess();

const board = Chessboard('board', {
  draggable: true,
  position: 'start',
  onDrop: onDrop
});

function onDrop(source, target) {
  const move = game.move({
    from: source,
    to: target,
    promotion: 'q'
  });

  if (move === null) return 'snapback';

  updateStatus();

  if (game.game_over()) {
    setTimeout(() => {
      alert("Game Over!\n" + getResultText());
    }, 100);
  }
}

function getResultText() {
  if (game.in_checkmate()) {
    return `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins.`;
  }
  if (game.in_draw()) return "Draw!";
  return "Game Over!";
}

function updateStatus() {
  const status = document.getElementById('status');
  const fen = document.getElementById('fen');
  const pgn = document.getElementById('pgn');

  let statusText = '';
  const moveColor = game.turn() === 'w' ? 'White' : 'Black';

  if (game.in_checkmate()) {
    statusText = `Checkmate! ${moveColor} is in checkmate.`;
  } else if (game.in_draw()) {
    statusText = 'Draw!';
  } else {
    statusText = `${moveColor} to move`;
    if (game.in_check()) statusText += ' (in check)';
  }

  status.innerText = statusText;
  fen.innerText = 'FEN: ' + game.fen();
  pgn.innerText = 'PGN: ' + game.pgn();
}

function resetGame() {
  game.reset();
  board.position('start');
  updateStatus();
}

updateStatus();
