// not used anymore, but keeping it for reference. The actual AI logic is now Stockfish running in WebAssembly, which is much stronger and faster than this simple minimax implementation.
import { Chess } from 'chess.js';

const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

const pawnEvalWhite = [
  [  0,  0,  0,  0,  0,  0,  0,  0],
  [ 50, 50, 50, 50, 50, 50, 50, 50],
  [ 10, 10, 20, 30, 30, 20, 10, 10],
  [  5,  5, 10, 25, 25, 10,  5,  5],
  [  0,  0,  0, 20, 20,  0,  0,  0],
  [  5, -5,-10,  0,  0,-10, -5,  5],
  [  5, 10, 10,-20,-20, 10, 10,  5],
  [  0,  0,  0,  0,  0,  0,  0,  0]
];

const knightEval = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const bishopEvalWhite = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const rookEvalWhite = [
  [  0,  0,  0,  0,  0,  0,  0,  0],
  [  5, 10, 10, 10, 10, 10, 10,  5],
  [ -5,  0,  0,  0,  0,  0,  0, -5],
  [ -5,  0,  0,  0,  0,  0,  0, -5],
  [ -5,  0,  0,  0,  0,  0,  0, -5],
  [ -5,  0,  0,  0,  0,  0,  0, -5],
  [ -5,  0,  0,  0,  0,  0,  0, -5],
  [  0,  0,  0,  5,  5,  0,  0,  0]
];

const queenEval = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [ -5,  0,  5,  5,  5,  5,  0, -5],
  [  0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

const kingEvalWhite = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [ 20, 20,  0,  0,  0,  0, 20, 20],
  [ 20, 30, 10,  0,  0, 10, 30, 20]
];


const getPieceValue = (piece, row, col) => {

  let value = pieceValues[piece.type];
  

  const isWhite = piece.color === 'w';
  const tableRow = isWhite ? row : 7 - row;


  switch (piece.type) {
    case 'p': value += pawnEvalWhite[tableRow][col]; break;
    case 'n': value += knightEval[tableRow][col]; break; 
    case 'b': value += bishopEvalWhite[tableRow][col]; break;
    case 'r': value += rookEvalWhite[tableRow][col]; break;
    case 'q': value += queenEval[tableRow][col]; break;
    case 'k': value += kingEvalWhite[tableRow][col]; break;
  }


  return isWhite ? value : -value;
};


const evaluateBoard = (chessInstance) => {
  let totalEvaluation = 0;
  const board = chessInstance.board();
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = board[row][col];
      if (square) {
        totalEvaluation += getPieceValue(square, row, col);
      }
    }
  }
  return totalEvaluation;
};

const minimax = (chessInstance, depth, alpha, beta, isMaximizingPlayer) => {
  if (depth === 0 || chessInstance.isGameOver()) {
    return evaluateBoard(chessInstance);
  }

  const moves = chessInstance.moves({ verbose: true });

  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    for (let move of moves) {
      chessInstance.move(move.san);
      maxEval = Math.max(maxEval, minimax(chessInstance, depth - 1, alpha, beta, false));
      chessInstance.undo();
      alpha = Math.max(alpha, maxEval);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let move of moves) {
      chessInstance.move(move.san);
      minEval = Math.min(minEval, minimax(chessInstance, depth - 1, alpha, beta, true));
      chessInstance.undo();
      beta = Math.min(beta, minEval);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};


self.onmessage = function(e) {
  const { fen, depth } = e.data;
  const tempGame = new Chess(fen);
  const moves = tempGame.moves({ verbose: true });

  if (moves.length === 0) return;

  let bestMove = null;
  let bestValue = Infinity; 

  for (let move of moves) {
    tempGame.move(move.san);
    const boardValue = minimax(tempGame, depth - 1, -Infinity, Infinity, true);
    tempGame.undo();


    if (boardValue < bestValue || (boardValue === bestValue && Math.random() > 0.5)) {
      bestValue = boardValue;
      bestMove = move;
    }
  }

  const finalMoveSan = bestMove ? bestMove.san : moves[Math.floor(Math.random() * moves.length)].san;
  self.postMessage({ bestMoveSan: finalMoveSan });
};