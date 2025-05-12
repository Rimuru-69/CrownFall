const game = new Chess();

const board = Chessboard('board', {
  draggable: true,
  position: 'start',
  onDrop: handleMove
});

function handleMove(source, target) {
  const move = game.move({
    from: source,
    to: target,
    promotion: 'q' // always promote to queen
  });

  if (move === null) return 'snapback';

  updateGameStatus();

  // Check for game end
  if (game.game_over()) {
    saveGameData();
  }
}

function updateGameStatus() {
  let status = '';

  if (game.in_checkmate()) {
    status = 'Checkmate! ' + (game.turn() === 'w' ? 'Black' : 'White') + ' wins.';
  } else if (game.in_draw()) {
    status = 'Draw!';
  } else {
    status = (game.turn() === 'w' ? 'White' : 'Black') + ' to move';
    if (game.in_check()) {
      status += ' (in check)';
    }
  }

  document.getElementById('status').textContent = status;
  document.getElementById('fen').textContent = 'FEN: ' + game.fen();
  document.getElementById('pgn').textContent = 'PGN: ' + game.pgn();
}

function saveGameData() {
  let games = parseInt(localStorage.getItem('gamesPlayed') || '0');
  games++;
  localStorage.setItem('gamesPlayed', games);
  alert(`Game Over! Total games played: ${games}`);
}

updateGameStatus();
