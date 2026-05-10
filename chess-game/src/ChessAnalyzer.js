// src/ChessAnalyzer.js
export class ChessAnalyzer { 
  constructor() {
    this.worker = new Worker('./stockfish.js'); 
    this.worker.postMessage('uci');
  }

  evaluatePosition(fen, depth = 10) {
    return new Promise((resolve) => {
      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage(`go depth ${depth}`);

      let currentScore = 0;

      const listener = (event) => {
        const line = event.data;
        if (line.includes('info') && line.includes('score cp')) {
          const match = line.match(/score cp (-?\d+)/);
          if (match && match[1]) currentScore = parseInt(match[1], 10);
        } 
        else if (line.includes('info') && line.includes('score mate')) {
          const match = line.match(/score mate (-?\d+)/);
          if (match && match[1]) {
            const mateIn = parseInt(match[1], 10);
            currentScore = mateIn > 0 ? 10000 : -10000;
          }
        }

        if (line.startsWith('bestmove')) {
          this.worker.removeEventListener('message', listener);
          if (fen.includes(' b ')) currentScore = -currentScore;
          resolve(currentScore);
        }
      };
      this.worker.addEventListener('message', listener);
    });
  }

  terminate() {
    if (this.worker) this.worker.terminate();
  }
}