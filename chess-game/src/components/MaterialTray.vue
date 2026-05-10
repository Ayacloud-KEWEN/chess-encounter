<template>
  <div class="material-tray parchment-tray">
    <div class="captured-pieces">
      <span v-for="(type, idx) in captured" :key="idx" class="mini-piece" :class="pieceColorClass">
        {{ getPieceSymbol(type) }}
      </span>
    </div>
    <span class="advantage-score" v-if="advantage">{{ advantage }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  captured: Array, 
  advantage: String, 
  color: String 
});

const pieceColorClass = props.color === 'w' ? 'white-piece-icon' : 'black-piece-icon';
const getPieceSymbol = (type) => ({ p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }[type]);
</script>

<style scoped>
.material-tray { width: 100%; padding: 10px 15px; margin: 10px 0; display: flex; justify-content: space-between; align-items: center; min-height: 46px; box-sizing: border-box; }
.parchment-tray { background: linear-gradient(135deg, #eaddba 0%, #f1e3c3 50%, #d5c09a 100%); border: 2px solid #5d4037; border-radius: 4px; box-shadow: inset 0 0 15px rgba(93, 64, 55, 0.4), 0 6px 12px rgba(0, 0, 0, 0.4); position: relative; overflow: hidden; }
.captured-pieces { display: flex; flex-wrap: wrap; gap: 4px; z-index: 1; }
.mini-piece { font-size: 22px; }
.white-piece-icon { color: #ffffff; filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.7)); }
.black-piece-icon { color: #1a1a1a; filter: drop-shadow(0 1px 1px rgba(255, 255, 255, 0.6)); }
.advantage-score { font-family: "Georgia", serif; font-weight: 900; color: #8b0000; font-size: 18px; text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.6); z-index: 1; }
</style>