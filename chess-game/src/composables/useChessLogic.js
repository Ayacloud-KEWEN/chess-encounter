import { computed } from 'vue';

export function useChessLogic(boardState) {

  const getSquareId = (r, c) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    return files[c] + ranks[r];
  };


  const formatTime = (seconds) => {
    if (seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };


  const capturedPieces = computed(() => {
    const initialCount = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
    const onBoard = { w: {}, b: {} };
    

    boardState.value.flat().forEach(sq => {
      if (sq) onBoard[sq.color][sq.type] = (onBoard[sq.color][sq.type] || 0) + 1;
    });

    const captured = { w: [], b: [] };
    ['w', 'b'].forEach(color => {
      Object.keys(initialCount).forEach(type => {
        const count = initialCount[type] - (onBoard[color][type] || 0);
        for (let i = 0; i < count; i++) {
          if (type !== 'k') captured[color].push(type);
        }
      });
    });
    return captured; 
  });

  const materialScore = computed(() => {
    const val = { p: 1, n: 3, b: 3, r: 5, q: 9 };
    let whiteVal = 0, blackVal = 0;
    capturedPieces.value.b.forEach(p => whiteVal += val[p]);
    capturedPieces.value.w.forEach(p => blackVal += val[p]);
    const diff = whiteVal - blackVal;
    return {
      white: diff > 0 ? `+${diff}` : '',
      black: diff < 0 ? `+${Math.abs(diff)}` : ''
    };
  });

  return { getSquareId, formatTime, capturedPieces, materialScore };
}