<template>
  <div class="board-container glass-card" :class="'theme-' + theme">
    <div class="board" :class="{ 'board-disabled': disabled }">
      <div v-for="(row, rowIndex) in displayBoard" :key="'row-' + rowIndex" class="board-row">
        <div v-for="(square, colIndex) in row" :key="'col-' + colIndex" class="square" :class="[
          (rowIndex + colIndex) % 2 === 0 ? 'light-square' : 'dark-square',
          { 'highlight-last-move': isLastMove(rowIndex, colIndex) },
          { 'highlight-selected': isSelected(rowIndex, colIndex) },
          { 'is-legal-move': isLegalMove(rowIndex, colIndex) },
          { 'in-check-glow': isKingInCheck(square) },
          { 'hint-glow': isHintSquare(rowIndex, colIndex) }
        ]" @click="$emit('square-click', getSquareId(rowIndex, colIndex))">
          
          <span v-if="colIndex === 0" class="inner-coord rank-coord">{{ displayRanks[rowIndex] }}</span>
          <span v-if="rowIndex === 7" class="inner-coord file-coord">{{ displayFiles[colIndex] }}</span>

          <span v-if="square" class="piece" :class="square.color === 'w' ? 'white-piece' : 'black-piece'">
            {{ getPieceSymbol(square) }}
          </span>

          <div v-if="isLegalMove(rowIndex, colIndex)" class="legal-move-hint" :class="{ 'is-capture-hint': square }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  board: Array,
  legalMoves: Array,
  lastMove: Object,
  selectedSquare: String,
  currentTurn: String,
  isCheck: Boolean,
  isFlipped: Boolean,
  disabled: Boolean,
  theme: { type: String, default: 'expert' },
  hintSquare: Object 
});

defineEmits(['square-click']);

const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const displayRanks = computed(() => props.isFlipped ? [...ranks].reverse() : ranks);
const displayFiles = computed(() => props.isFlipped ? [...files].reverse() : files);

const displayBoard = computed(() => {
  if (!props.isFlipped) return props.board;
  return [...props.board].reverse().map(row => [...row].reverse());
});

const getSquareId = (r, c) => displayFiles.value[c] + displayRanks.value[r];
const getPieceSymbol = (s) => s ? { w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' }, b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' } }[s.color][s.type] : '';

const isSelected = (r, c) => props.selectedSquare === getSquareId(r, c);
const isLegalMove = (r, c) => props.legalMoves.some(m => m.to === getSquareId(r, c));
const isLastMove = (r, c) => props.lastMove && (props.lastMove.from === getSquareId(r, c) || props.lastMove.to === getSquareId(r, c));
const isKingInCheck = (s) => props.isCheck && s && s.type === 'k' && s.color === props.currentTurn;
const isHintSquare = (r, c) => props.hintSquare && (props.hintSquare.from === getSquareId(r, c) || props.hintSquare.to === getSquareId(r, c));


</script>

<style scoped>
.board-container { width: 100%; margin: 10px 0; overflow: hidden; touch-action: none; }
.board { display: flex; flex-direction: column; border: 2px solid rgba(255, 255, 255, 0.15); transition: filter 0.3s ease;}
.board-disabled { pointer-events: none; filter: brightness(0.6) grayscale(30%); }
.board:not(.board-disabled) { animation: yourTurnGlow 2s infinite alternate; }
@keyframes yourTurnGlow { from { box-shadow: 0 0 5px rgba(46, 204, 113, 0.2); } to { box-shadow: 0 0 20px rgba(46, 204, 113, 0.6); } }

.board-row { display: flex; width: 100%; }
.square { width: 12.5%; aspect-ratio: 1/1; display: flex; justify-content: center; align-items: center; position: relative; cursor: pointer; }
.inner-coord { position: absolute; font-size: 12px; font-weight: 600; pointer-events: none; z-index: 3; }
.rank-coord { top: 2px; left: 4px; }
.file-coord { bottom: 0px; right: 4px; }

.light-square { background-color: #d8e2e8; }
.dark-square { background-color: #5c768d; }
.light-square .inner-coord { color: #5c768d; opacity: 0.8; }
.dark-square .inner-coord { color: #d8e2e8; opacity: 0.8; }

.theme-beginner .light-square { background-color: #ebecd0; }
.theme-beginner .dark-square { background-color: #739552; }
.theme-master .light-square { background-color: #dcb38a; }
.theme-master .dark-square { background-color: #8c3b24; }

.highlight-last-move { box-shadow: inset 0 0 0 100px rgba(241, 196, 15, 0.5) !important; }
.highlight-selected { box-shadow: inset 0 0 0 100px rgba(46, 204, 113, 0.6) !important; }
.in-check-glow { background-color: rgba(231, 76, 60, 0.8) !important; animation: checkPulse 0.5s infinite alternate; }
.hint-glow { box-shadow: inset 0 0 0 100px rgba(52, 152, 219, 0.4), inset 0 0 20px #3498db !important; }

.piece { 
  font-size: clamp(30px, 9vw, 55px); 
  filter: drop-shadow(0px 4px 3px rgba(0, 0, 0, 0.5)); 
  z-index: 2; 
  transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.15s;
  will-change: transform; 
}
.highlight-selected .piece {
  transform: scale(1.15) translateY(-6px); /* 放大并上浮 */
  filter: drop-shadow(0px 12px 8px rgba(0, 0, 0, 0.7)); /* 阴影加深，立体感爆棚 */
}
.white-piece { color: #f8f8f8; }
.black-piece { color: #111; }

.legal-move-hint { 
  position: absolute; 
  width: 25%; 
  height: 25%; 
  border-radius: 50%; 
  background-color: rgba(0, 0, 0, 0.4); 
  pointer-events: none; 
  z-index: 1; 
  animation: pulse-hint 1.5s infinite;
}

@keyframes pulse-hint {
  0% { transform: scale(0.8); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.8); opacity: 0.6; }
}

.is-capture-hint { 
  width: 80%; 
  height: 80%; 
  background-color: transparent; 
  border: 5px solid rgba(231, 76, 60, 0.8); 
  animation: none; 
}

</style>