const board = Chessboard('board', {
  draggable: true,
  position: 'start',
  onDrop: onDrop,
});

const game = new Chess();

function onDrop(source, target) {
  const move = game.move({
    from: source,
    to: target,
    promotion: 'q' // auto-promote to queen
  });

  if (move === null) return 'snapback';

  updateStatus();
}

function updateStatus() {
  let status = '';
  
  if (game.in_checkmate()) {
    status = 'Game over, ' + (game.turn() === 'w' ? 'Black' : 'White') + ' wins by checkmate.';
  } else if (game.in_draw()) {
    status = 'Game over, drawn position.';
  } else {
    status = (game.turn() === 'w' ? 'White' : 'Black') + ' to move';
    if (game.in_check()) {
      status += ', in check';
    }
  }

  document.getElementById('status').textContent = status;
  document.getElementById('fen').textContent = 'FEN: ' + game.fen();
  document.getElementById('pgn').textContent = 'PGN: ' + game.pgn();
}

updateStatus();

let gamesPlayed = parseInt(localStorage.getItem('gamesPlayed') || '0');

function saveGameData() {
  gamesPlayed++;
  localStorage.setItem('gamesPlayed', gamesPlayed);
  alert(`Games Played: ${gamesPlayed}`);
}

if (game.in_checkmate() || game.in_draw()) {
  saveGameData();
}
