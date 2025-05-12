// CrownFall Chess Game
// Chess game with standard rules, legal moves, checkmate detection, and undo functionality

// Game Constants
const BOARD_SIZE = 8;
const COLORS = { WHITE: 'white', BLACK: 'black' };
const PIECES = {
    PAWN: 'pawn',
    ROOK: 'rook',
    KNIGHT: 'knight',
    BISHOP: 'bishop',
    QUEEN: 'queen',
    KING: 'king'
};

// Game State
let board = [];
let selectedPiece = null;
let currentPlayer = COLORS.WHITE;
let validMoves = [];
let gameOver = false;
let moveHistory = [];
let capturedPieces = {
    white: [],
    black: []
};
let kings = {
    white: { row: 7, col: 4 },
    black: { row: 0, col: 4 }
};
let inCheck = { white: false, black: false };

// DOM Elements
const chessboardEl = document.getElementById('chessboard');
const turnIndicatorEl = document.getElementById('turn-indicator');
const gameStatusEl = document.getElementById('game-status');
const capturedWhiteEl = document.getElementById('captured-white');
const capturedBlackEl = document.getElementById('captured-black');
const undoBtn = document.getElementById('undo-btn');
const resetBtn = document.getElementById('reset-btn');

// Initialize the game
function initGame() {
    createBoard();
    setupPieces();
    renderBoard();
    setupEventListeners();
    updateGameStatus();
}

// Create the chessboard
function createBoard() {
    board = [];
    chessboardEl.innerHTML = '';
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        board[row] = [];
        for (let col = 0; col < BOARD_SIZE; col++) {
            board[row][col] = null;
            
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
            square.dataset.row = row;
            square.dataset.col = col;
            
            chessboardEl.appendChild(square);
        }
    }
}

// Setup the chess pieces in their initial positions
function setupPieces() {
    // Reset kings' positions
    kings = {
        white: { row: 7, col: 4 },
        black: { row: 0, col: 4 }
    };
    
    // Setup pawns
    for (let col = 0; col < BOARD_SIZE; col++) {
        board[1][col] = { type: PIECES.PAWN, color: COLORS.BLACK };
        board[6][col] = { type: PIECES.PAWN, color: COLORS.WHITE };
    }
    
    // Setup rooks
    board[0][0] = { type: PIECES.ROOK, color: COLORS.BLACK, hasMoved: false };
    board[0][7] = { type: PIECES.ROOK, color: COLORS.BLACK, hasMoved: false };
    board[7][0] = { type: PIECES.ROOK, color: COLORS.WHITE, hasMoved: false };
    board[7][7] = { type: PIECES.ROOK, color: COLORS.WHITE, hasMoved: false };
    
    // Setup knights
    board[0][1] = { type: PIECES.KNIGHT, color: COLORS.BLACK };
    board[0][6] = { type: PIECES.KNIGHT, color: COLORS.BLACK };
    board[7][1] = { type: PIECES.KNIGHT, color: COLORS.WHITE };
    board[7][6] = { type: PIECES.KNIGHT, color: COLORS.WHITE };
    
    // Setup bishops
    board[0][2] = { type: PIECES.BISHOP, color: COLORS.BLACK };
    board[0][5] = { type: PIECES.BISHOP, color: COLORS.BLACK };
    board[7][2] = { type: PIECES.BISHOP, color: COLORS.WHITE };
    board[7][5] = { type: PIECES.BISHOP, color: COLORS.WHITE };
    
    // Setup queens
    board[0][3] = { type: PIECES.QUEEN, color: COLORS.BLACK };
    board[7][3] = { type: PIECES.QUEEN, color: COLORS.WHITE };
    
    // Setup kings
    board[0][4] = { type: PIECES.KING, color: COLORS.BLACK, hasMoved: false };
    board[7][4] = { type: PIECES.KING, color: COLORS.WHITE, hasMoved: false };
}

// Render the board based on the current state
function renderBoard() {
    // Clear previous selections
    clearHighlights();
    
    // Update each square with the current piece
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        
        // Clear any existing pieces
        square.innerHTML = '';
        
        // If there's a piece on this square, render it
        if (board[row][col]) {
            const piece = document.createElement('div');
            piece.classList.add('piece');
            piece.classList.add(board[row][col].type);
            piece.classList.add(board[row][col].color);
            square.appendChild(piece);
        }
        
        // Highlight the square if it's in check
        if ((row === kings.white.row && col === kings.white.col && inCheck.white) || 
            (row === kings.black.row && col === kings.black.col && inCheck.black)) {
            square.classList.add('check');
        }
    });
    
    // Render captured pieces
    renderCapturedPieces();
}

// Add event listeners to all squares and buttons
function setupEventListeners() {
    // Squares
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        square.addEventListener('click', handleSquareClick);
    });
    
    // Buttons
    undoBtn.addEventListener('click', undoLastMove);
    resetBtn.addEventListener('click', resetGame);
}

// Handle click on a square
function handleSquareClick(event) {
    if (gameOver) return;
    
    const square = event.currentTarget;
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    
    // If no piece is selected and the square has a piece of the current player's color
    if (!selectedPiece && board[row][col] && board[row][col].color === currentPlayer) {
        selectedPiece = { row, col };
        square.classList.add('selected');
        
        // Show valid moves
        validMoves = getValidMoves(row, col);
        highlightValidMoves(validMoves);
    } 
    // If a piece is already selected
    else if (selectedPiece) {
        // Check if the clicked square is a valid move
        const isValidMove = validMoves.some(move => move.row === row && move.col === col);
        
        if (isValidMove) {
            // Make the move
            makeMove(selectedPiece.row, selectedPiece.col, row, col);
            
            // Clear selection
            selectedPiece = null;
            validMoves = [];
            
            // Check for checkmate or stalemate
            checkGameStatus();
        } else {
            // If clicking on another piece of the same color, select that piece instead
            if (board[row][col] && board[row][col].color === currentPlayer) {
                clearHighlights();
                selectedPiece = { row, col };
                square.classList.add('selected');
                
                // Show valid moves for the new selected piece
                validMoves = getValidMoves(row, col);
                highlightValidMoves(validMoves);
            } else {
                // If clicking on an invalid square, clear selection
                clearHighlights();
                selectedPiece = null;
                validMoves = [];
            }
        }
    }
}

// Clear all highlights from the board
function clearHighlights() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        square.classList.remove('selected', 'valid-move', 'check');
    });
}

// Highlight valid moves on the board
function highlightValidMoves(moves) {
    moves.forEach(move => {
        const square = document.querySelector(`.square[data-row="${move.row}"][data-col="${move.col}"]`);
        if (square) {
            square.classList.add('valid-move');
        }
    });
}

// Get all valid moves for a piece at the given position
function getValidMoves(row, col) {
    const piece = board[row][col];
    if (!piece) return [];
    
    let moves = [];
    
    switch (piece.type) {
        case PIECES.PAWN:
            moves = getPawnMoves(row, col, piece.color);
            break;
        case PIECES.ROOK:
            moves = getRookMoves(row, col, piece.color);
            break;
        case PIECES.KNIGHT:
            moves = getKnightMoves(row, col, piece.color);
            break;
        case PIECES.BISHOP:
            moves = getBishopMoves(row, col, piece.color);
            break;
        case PIECES.QUEEN:
            moves = getQueenMoves(row, col, piece.color);
            break;
        case PIECES.KING:
            moves = getKingMoves(row, col, piece.color);
            break;
    }
    
    // Filter out moves that would put/leave the king in check
    return moves.filter(move => !wouldBeInCheck(row, col, move.row, move.col, piece.color));
}

// Check if a move would put or leave the king in check
function wouldBeInCheck(fromRow, fromCol, toRow, toCol, color) {
    // Make a copy of the board to simulate the move
    const boardCopy = JSON.parse(JSON.stringify(board));
    const kingsCopy = JSON.parse(JSON.stringify(kings));
    
    // Update king's position if moving the king
    if (boardCopy[fromRow][fromCol].type === PIECES.KING) {
        kingsCopy[color] = { row: toRow, col: toCol };
    }
    
    // Make the move on the copy
    boardCopy[toRow][toCol] = boardCopy[fromRow][fromCol];
    boardCopy[fromRow][fromCol] = null;
    
    // Check if the king would be in check after this move
    const kingPos = kingsCopy[color];
    
    // Check if any opponent's piece can attack the king
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = boardCopy[r][c];
            if (piece && piece.color !== color) {
                // Get all possible moves for this opponent's piece
                const opponentMoves = getRawMoves(r, c, boardCopy);
                
                // Check if any of those moves can capture the king
                if (opponentMoves.some(move => move.row === kingPos.row && move.col === kingPos.col)) {
                    return true; // King would be in check
                }
            }
        }
    }
    
    return false; // King would not be in check
}

// Get raw moves for a piece (ignoring check)
function getRawMoves(row, col, boardState) {
    const piece = boardState[row][col];
    if (!piece) return [];
    
    let moves = [];
    
    switch (piece.type) {
        case PIECES.PAWN:
            moves = getPawnMovesRaw(row, col, piece.color, boardState);
            break;
        case PIECES.ROOK:
            moves = getRookMovesRaw(row, col, piece.color, boardState);
            break;
        case PIECES.KNIGHT:
            moves = getKnightMovesRaw(row, col, piece.color, boardState);
            break;
        case PIECES.BISHOP:
            moves = getBishopMovesRaw(row, col, piece.color, boardState);
            break;
        case PIECES.QUEEN:
            moves = getQueenMovesRaw(row, col, piece.color, boardState);
            break;
        case PIECES.KING:
            moves = getKingMovesRaw(row, col, piece.color, boardState);
            break;
    }
    
    return moves;
}

// Get all valid moves for a pawn
function getPawnMoves(row, col, color) {
    return getPawnMovesRaw(row, col, color, board);
}

function getPawnMovesRaw(row, col, color, boardState) {
    const moves = [];
    const direction = color === COLORS.WHITE ? -1 : 1;
    const startRow = color === COLORS.WHITE ? 6 : 1;
    
    // Forward move
    if (row + direction >= 0 && row + direction < BOARD_SIZE && !boardState[row + direction][col]) {
        moves.push({ row: row + direction, col: col });
        
        // Double move from starting position
        if (row === startRow && !boardState[row + 2 * direction][col]) {
            moves.push({ row: row + 2 * direction, col: col });
        }
    }
    
    // Captures
    for (let colOffset of [-1, 1]) {
        const newCol = col + colOffset;
        if (newCol >= 0 && newCol < BOARD_SIZE) {
            const newRow = row + direction;
            if (newRow >= 0 && newRow < BOARD_SIZE) {
                if (boardState[newRow][newCol] && boardState[newRow][newCol].color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    }
    
    return moves;
}

// Get all valid moves for a rook
function getRookMoves(row, col, color) {
    return getRookMovesRaw(row, col, color, board);
}

function getRookMovesRaw(row, col, color, boardState) {
    const moves = [];
    const directions = [
        { row: -1, col: 0 }, // Up
        { row: 1, col: 0 },  // Down
        { row: 0, col: -1 }, // Left
        { row: 0, col: 1 }   // Right
    ];
    
    for (const dir of directions) {
        for (let i = 1; i < BOARD_SIZE; i++) {
            const newRow = row + dir.row * i;
            const newCol = col + dir.col * i;
            
            if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
                break;
            }
            
            if (!boardState[newRow][newCol]) {
                moves.push({ row: newRow, col: newCol });
            } else {
                if (boardState[newRow][newCol].color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
                break;
            }
        }
    }
    
    return moves;
}

// Get all valid moves for a knight
function getKnightMoves(row, col, color) {
    return getKnightMovesRaw(row, col, color, board);
}

function getKnightMovesRaw(row, col, color, boardState) {
    const moves = [];
    const knightOffsets = [
        { row: -2, col: -1 },
        { row: -2, col: 1 },
        { row: -1, col: -2 },
        { row: -1, col: 2 },
        { row: 1, col: -2 },
        { row: 1, col: 2 },
        { row: 2, col: -1 },
        { row: 2, col: 1 }
    ];
    
    for (const offset of knightOffsets) {
        const newRow = row + offset.row;
        const newCol = col + offset.col;
        
        if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
            if (!boardState[newRow][newCol] || boardState[newRow][newCol].color !== color) {
                moves.push({ row: newRow, col: newCol });
            }
        }
    }
    
    return moves;
}

// Get all valid moves for a bishop
function getBishopMoves(row, col, color) {
    return getBishopMovesRaw(row, col, color, board);
}

function getBishopMovesRaw(row, col, color, boardState) {
    const moves = [];
    const directions = [
        { row: -1, col: -1 }, // Up-Left
        { row: -1, col: 1 },  // Up-Right
        { row: 1, col: -1 },  // Down-Left
        { row: 1, col: 1 }    // Down-Right
    ];
    
    for (const dir of directions) {
        for (let i = 1; i < BOARD_SIZE; i++) {
            const newRow = row + dir.row * i;
            const newCol = col + dir.col * i;
            
            if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
                break;
            }
            
            if (!boardState[newRow][newCol]) {
                moves.push({ row: newRow, col: newCol });
            } else {
                if (boardState[newRow][newCol].color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
                break;
            }
        }
    }
    
    return moves;
}

// Get all valid moves for a queen
function getQueenMoves(row, col, color) {
    return getQueenMovesRaw(row, col, color, board);
}

function getQueenMovesRaw(row, col, color, boardState) {
    // Queen combines the moves of a rook and a bishop
    return [
        ...getRookMovesRaw(row, col, color, boardState),
        ...getBishopMovesRaw(row, col, color, boardState)
    ];
}

// Get all valid moves for a king
function getKingMoves(row, col, color) {
    return getKingMovesRaw(row, col, color, board);
}

function getKingMovesRaw(row, col, color, boardState) {
    const moves = [];
    const kingOffsets = [
        { row: -1, col: -1 },
        { row: -1, col: 0 },
        { row: -1, col: 1 },
        { row: 0, col: -1 },
        { row: 0, col: 1 },
        { row: 1, col: -1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 }
    ];
    
    for (const offset of kingOffsets) {
        const newRow = row + offset.row;
        const newCol = col + offset.col;
        
        if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
            if (!boardState[newRow][newCol] || boardState[newRow][newCol].color !== color) {
                moves.push({ row: newRow, col: newCol });
            }
        }
    }
    
    // Castling
    if (!boardState[row][col].hasMoved && !inCheck[color]) {
        // Kingside castling
        if (boardState[row][7] && 
            boardState[row][7].type === PIECES.ROOK && 
            !boardState[row][7].hasMoved && 
            !boardState[row][6] && 
            !boardState[row][5]) {
            
            // Check if king doesn't pass through check
            if (!wouldBeInCheck(row, col, row, col + 1, color) && 
                !wouldBeInCheck(row, col, row, col + 2, color)) {
                moves.push({ row: row, col: col + 2, castling: 'kingside' });
            }
        }
        
        // Queenside castling
        if (boardState[row][0] && 
            boardState[row][0].type === PIECES.ROOK && 
            !boardState[row][0].hasMoved && 
            !boardState[row][1] && 
            !boardState[row][2] && 
            !boardState[row][3]) {
            
            // Check if king doesn't pass through check
            if (!wouldBeInCheck(row, col, row, col - 1, color) && 
                !wouldBeInCheck(row, col, row, col - 2, color)) {
                moves.push({ row: row, col: col - 2, castling: 'queenside' });
            }
        }
    }
    
    return moves;
}

// Make a move on the board
function makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const capturedPiece = board[toRow][toCol];
    const isKing = piece.type === PIECES.KING;
    
    // Save the move to history
    moveHistory.push({
        fromRow,
        fromCol,
        toRow,
        toCol,
        piece: JSON.parse(JSON.stringify(piece)),
        capturedPiece: capturedPiece ? JSON.parse(JSON.stringify(capturedPiece)) : null,
        kings: JSON.parse(JSON.stringify(kings)),
        inCheck: JSON.parse(JSON.stringify(inCheck))
    });
    
    // Add captured piece to the captured pieces array
    if (capturedPiece) {
        capturedPieces[currentPlayer].push(capturedPiece);
    }
    
    // Update king's position if moving a king
    if (isKing) {
        kings[piece.color] = { row: toRow, col: toCol };
        
        // Handle castling
        if (Math.abs(toCol - fromCol) === 2) {
            // Kingside castling
            if (toCol > fromCol) {
                const rookFromCol = 7;
                const rookToCol = toCol - 1;
                board[toRow][rookToCol] = board[toRow][rookFromCol];
                board[toRow][rookFromCol] = null;
                board[toRow][rookToCol].hasMoved = true;
            } 
            // Queenside castling
            else {
                const rookFromCol = 0;
                const rookToCol = toCol + 1;
                board[toRow][rookToCol] = board[toRow][rookFromCol];
                board[toRow][rookFromCol] = null;
                board[toRow][rookToCol].hasMoved = true;
            }
        }
    }
    
    // Move the piece
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = null;
    
    // Mark the piece as moved (for kings and rooks, used in castling)
    if (piece.type === PIECES.KING || piece.type === PIECES.ROOK) {
        piece.hasMoved = true;
    }
    
    // Check for pawn promotion (reaching the end of the board)
    if (piece.type === PIECES.PAWN && (toRow === 0 || toRow === 7)) {
        // Automatically promote to queen for simplicity
        piece.type = PIECES.QUEEN;
    }
    
    // Switch to the other player
    currentPlayer = currentPlayer === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    
    // Update the turn indicator
    turnIndicatorEl.textContent = `${currentPlayer === COLORS.WHITE ? 'White' : 'Black'}'s Turn`;
    
    // Update the board display
    renderBoard();
    
    // Check if the opponent is in check
    updateCheckStatus();
}

// Update the check status for both players
function updateCheckStatus() {
    // Reset check status
    inCheck.white = false;
    inCheck.black = false;
    
    // Check if the white king is in check
    const whiteKingPos = kings.white;
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = board[row][col];
            if (piece && piece.color === COLORS.BLACK) {
                const moves = getRawMoves(row, col, board);
                if (moves.some(move => move.row === whiteKingPos.row && move.col === whiteKingPos.col)) {
                    inCheck.white = true;
                    break;
                }
            }
        }
        if (inCheck.white) break;
    }
    
    // Check if the black king is in check
    const blackKingPos = kings.black;
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = board[row][col];
            if (piece && piece.color === COLORS.WHITE) {
                const moves = getRawMoves(row, col, board);
                if (moves.some(move => move.row === blackKingPos.row && move.col === blackKingPos.col)) {
                    inCheck.black = true;
                    break;
                }
            }
        }
        if (inCheck.black) break;
    }
    
    renderBoard(); // Update king highlight if in check
}

// Check if the current player has any valid moves
function hasValidMoves(color) {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = board[row][col];
            if (piece && piece.color === color) {
                const validMoves = getValidMoves(row, col);
                if (validMoves.length > 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Check for checkmate or stalemate
function checkGameStatus() {
    const currentColor = currentPlayer;
    const isInCheck = inCheck[currentColor];
    const hasValidMove = hasValidMoves(currentColor);
    
    if (!hasValidMove) {
        if (isInCheck) {
            // Checkmate
            gameOver = true;
            const winner = currentColor === COLORS.WHITE ? 'Black' : 'White';
            gameStatusEl.textContent = `Checkmate! ${winner} wins!`;
        } else {
            // Stalemate
            gameOver = true;
            gameStatusEl.textContent = 'Stalemate! Game ends in a draw.';
        }
    } else if (isInCheck) {
        // Check
        gameStatusEl.textContent = `${currentColor === COLORS.WHITE ? 'White' : 'Black'} is in check!`;
    } else {
        // Regular move
        gameStatusEl.textContent = '';
    }
    
    updateGameStatus();
}

// Update game status text and UI
function updateGameStatus() {
    if (!gameOver) {
        turnIndicatorEl.textContent = `${currentPlayer === COLORS.WHITE ? 'White' : 'Black'}'s Turn`;
        if (inCheck[currentPlayer]) {
            gameStatusEl.textContent = `${currentPlayer === COLORS.WHITE ? 'White' : 'Black'} is in check!`;
        }
    }
}

// Render captured pieces on the side of the board
function renderCapturedPieces() {
    // Clear current captured pieces display
    capturedWhiteEl.innerHTML = '';
    capturedBlackEl.innerHTML = '';
    
    // Render white's captured pieces (black pieces)
    capturedPieces.white.forEach(piece => {
        const capturedPiece = document.createElement('div');
        capturedPiece.classList.add('captured-piece', piece.type, piece.color);
        capturedWhiteEl.appendChild(capturedPiece);
    });
    
    // Render black's captured pieces (white pieces)
    capturedPieces.black.forEach(piece => {
        const capturedPiece = document.createElement('div');
        capturedPiece.classList.add('captured-piece', piece.type, piece.color);
        capturedBlackEl.appendChild(capturedPiece);
    });
}

// Undo the last move
function undoLastMove() {
    if (moveHistory.length === 0 || gameOver) return;
    
    // Get the last move
    const lastMove = moveHistory.pop();
    
    // Restore board state
    board[lastMove.fromRow][lastMove.fromCol] = lastMove.piece;
    board[lastMove.toRow][lastMove.toCol] = lastMove.capturedPiece;
    
    // Restore king positions and check status
    kings = JSON.parse(JSON.stringify(lastMove.kings));
    inCheck = JSON.parse(JSON.stringify(lastMove.inCheck));
    
    // Remove the captured piece from the array if there was one
    if (lastMove.capturedPiece) {
        const pieceColor = lastMove.capturedPiece.color === COLORS.WHITE ? 'black' : 'white';
        capturedPieces[pieceColor].pop();
    }
    
    // Switch back to the previous player
    currentPlayer = currentPlayer === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    
    // Reset game over state
    gameOver = false;
    gameStatusEl.textContent = '';
    
    // Update the board display
    renderBoard();
    updateGameStatus();
}

// Reset the game
function resetGame() {
    // Reset game state
    selectedPiece = null;
    currentPlayer = COLORS.WHITE;
    validMoves = [];
    gameOver = false;
    moveHistory = [];
    capturedPieces = { white: [], black: [] };
    inCheck = { white: false, black: false };
    
    // Clear game status
    gameStatusEl.textContent = '';
    
    // Initialize the game
    initGame();
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', initGame);