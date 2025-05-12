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
