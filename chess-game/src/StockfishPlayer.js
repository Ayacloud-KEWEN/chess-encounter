export class StockfishPlayer { 
  constructor() {
    this.worker = new Worker('./stockfish.js'); 
    this.worker.postMessage('uci');
  } 

  setDifficulty(level = 0) {
    this.worker.postMessage(`setoption name Skill Level value ${level}`);
  }

  getBestMove(fen, depth = 3) {
    return new Promise((resolve) => {
      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage(`go depth ${depth}`);

      const listener = (event) => {
        const line = event.data;
        if (line.startsWith('bestmove')) {
          this.worker.removeEventListener('message', listener);
          const uciMove = line.split(' ')[1]; 
          if (uciMove === '(none)') {
            resolve(null);
            return;
          }
          const moveObject = {
            from: uciMove.substring(0, 2),
            to: uciMove.substring(2, 4),
            promotion: uciMove.length > 4 ? uciMove.substring(4, 5) : undefined 
          };
          resolve(moveObject);
        }
      };
      this.worker.addEventListener('message', listener);
    });
  }

  terminate() {
    if (this.worker) this.worker.terminate();
  }
}