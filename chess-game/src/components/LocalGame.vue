<template>
  <div class="game-screen-wrapper" :class="'theme-' + props.difficulty">
    <GameHeader :title="$t('diff.' + props.difficulty) + ' ' + $t('game.vs')" icon="♔">
      <template #status>
        <div v-if="!isGameOver && !isAnalyzing" class="status-wrapper">
          <span v-if="currentTurn === 'w'" class="status-text-small player-color">{{ $t('game.your_turn_white') }}</span>
          <span v-else class="status-text-small ai-color">{{ $t('game.ai_thinking') }}</span>
          <span v-if="isCheck" class="status-text-small check-color">{{ $t('game.check') }}</span>
        </div>
      </template>
      <template #right>
        <button v-if="currentTurn === 'w' && !isGameOver" class="modern-btn hint-btn header-hint-btn"
          @click="requestHint" :disabled="isThinkingHint">
          💡 {{ isThinkingHint ? $t('game.hint_thinking') : $t('game.hint') }}
        </button>
      </template>
    </GameHeader>

    <MaterialTray :captured="capturedPieces.w" :advantage="materialScore.black" color="w" />

    <ChessBoard 
      :board="boardState" :legal-moves="legalMoves" :last-move="lastMove"
      :selected-square="selectedSquare" :current-turn="currentTurn" :is-check="isCheck"
      :theme="props.difficulty" :disabled="isGameOver || currentTurn === 'b' || isAnalyzing"
      :hint-square="engineHint" @square-click="handleSquareClick"
    />

    <MaterialTray :captured="capturedPieces.b" :advantage="materialScore.white" color="b" />

    <div class="status-panel glass-card">
      <div v-if="isAnalyzing" class="analysis-loading">
        <div class="spinner"></div>
        <p>{{ $t('game.analyzing_progress', { current: currentAnalysisStep, total: totalAnalysisSteps }) }}</p>
      </div>

      <div v-else-if="analysisReport" class="report-dashboard">
        <h3 class="dashboard-title">{{ $t('game.report') }}</h3>
        <div class="stats-grid">
          <div class="stat-box"><span class="stat-label">{{ $t('game.acpl') }}</span><span class="stat-value acpl-val">{{ analysisReport.acpl }}</span></div>
          <div class="stat-box"><span class="stat-label">{{ $t('game.rating') }}</span><span class="stat-value rank-val">{{ analysisReport.level }}</span></div>
        </div>
      </div>

      <div v-else class="normal-status">
        <div v-if="isGameOver" class="game-over-alert">
          <h3 class="over-title">🏁 {{ gameOverReason }}</h3>
          <button @click="startAnalysis" class="modern-btn primary-btn pulse-anim">{{ $t('game.btn_analysis') }}</button>
        </div>
      </div>

      <div class="bottom-controls">
        <button @click="resetGame" class="modern-btn danger-btn" :disabled="isAnalyzing">{{ $t('game.btn_reset') }}</button>
        <button @click="emit('back-to-menu')" class="modern-btn secondary-btn" :disabled="isAnalyzing">{{ $t('game.btn_menu') }}</button>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="showPromotionModal" class="modal-overlay" @click.self="cancelPromotion">
        <div class="modal-content heavy-glass-card promotion-visual-card">
          
          <div class="promo-source-pawn">
            <span :class="promoColorClass">{{ promoSymbols.p }}</span>
          </div>

          <div class="promo-connector">
            <div class="connector-line"></div>
          </div>

          <div class="promotion-options-grid">
            <div class="promo-option" @click="confirmPromotion('q')">
              <span :class="promoColorClass">{{ promoSymbols.q }}</span>
            </div>
            <div class="promo-option" @click="confirmPromotion('r')">
              <span :class="promoColorClass">{{ promoSymbols.r }}</span>
            </div>
            <div class="promo-option" @click="confirmPromotion('b')">
              <span :class="promoColorClass">{{ promoSymbols.b }}</span>
            </div>
            <div class="promo-option" @click="confirmPromotion('n')">
              <span :class="promoColorClass">{{ promoSymbols.n }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Chess } from 'chess.js';
import { ChessAnalyzer } from '../ChessAnalyzer';
import { StockfishPlayer } from '../StockfishPlayer';
import GameHeader from './GameHeader.vue';
import ChessBoard from './ChessBoard.vue';
import MaterialTray from './MaterialTray.vue';
import { useChessLogic } from '../composables/useChessLogic';
import { useI18n } from 'vue-i18n'; 

const props = defineProps({ difficulty: { type: String, default: 'beginner' } });
const emit = defineEmits(['back-to-menu']);

const { t } = useI18n();

const moveWhiteSound = new Audio('/audio/move_white.wav');
const moveBlackSound = new Audio('/audio/move_black.wav');
const captureSound = new Audio('/audio/capture.wav');
const checkSound = new Audio('/audio/check.wav');
const gameOverSound = new Audio('/audio/gameover.mp3');
const hintSound = new Audio('/audio/hint.wav');

const vibrate = (pattern) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

const game = new Chess();
let aiPlayer = null;
let coachPlayer = null;
let analyzer = null;

const boardState = ref(game.board());
const { capturedPieces, materialScore } = useChessLogic(boardState);
const currentTurn = ref(game.turn());
const selectedSquare = ref(null);
const legalMoves = ref([]);
const lastMove = ref(null);
const isGameOver = ref(false);
const gameOverReason = ref('');
const isCheck = ref(false);
const showPromotionModal = ref(false);
const pendingPromotionMove = ref(null);
const promoSymbols = { p: '♙', q: '♕', r: '♖', b: '♗', n: '♘' };
const promoColorClass = 'promo-white';
const gameHistory = ref([game.fen()]);
const isAnalyzing = ref(false);
const currentAnalysisStep = ref(0);
const totalAnalysisSteps = ref(0);
const analysisReport = ref(null);
const engineHint = ref(null);
const isThinkingHint = ref(false);

const difficultySettings = {
  beginner: { level: 0, depth: 1 },
  expert: { level: 10, depth: 5 },
  master: { level: 20, depth: 10 }
};

const playSound = (res, check) => {
  let s;
  if (check) {
    s = checkSound;
    vibrate([50, 30, 50]); 
  } else if (res.captured) {
    s = captureSound;
    vibrate(40);           
  } else {
    s = res.color === 'w' ? moveWhiteSound : moveBlackSound;
    vibrate(15);          
  }
  s.currentTime = 0;
  s.play().catch(() => { });
};

const updateGameState = () => {
  boardState.value = game.board();
  currentTurn.value = game.turn();
  isCheck.value = game.inCheck();

  if (game.isGameOver()) {
    isGameOver.value = true;
    vibrate([100, 50, 100, 50, 200]);
    setTimeout(() => {
      gameOverSound.currentTime = 0;
      gameOverSound.play().catch(() => { });
    }, 500);

    if (game.isCheckmate()) {
      gameOverReason.value = currentTurn.value === 'w' ? t('game.lose') : t('game.win');
    } else {
      gameOverReason.value = t('game.draw'); 
    }
  } else if (currentTurn.value === 'b') {
    triggerAI();
  }
};

const triggerAI = async () => {
  if (isGameOver.value) return;
  const bestMove = await aiPlayer.getBestMove(game.fen(), difficultySettings[props.difficulty].depth);
  await new Promise(r => setTimeout(r, 1200));
  if (bestMove && currentTurn.value === 'b') executeMove(bestMove);
};

const executeMove = (move) => {
  const res = game.move(move);
  if (res) {
    playSound(res, game.inCheck());
    lastMove.value = { from: res.from, to: res.to };
    selectedSquare.value = null; legalMoves.value = []; engineHint.value = null;
    gameHistory.value.push(game.fen());
    updateGameState();
  }
};

const handleSquareClick = (squareId) => {
  if (currentTurn.value === 'b' || isGameOver.value || isAnalyzing.value) return;
  const sq = game.get(squareId);
  
  if (selectedSquare.value) {
    const moveCandidates = legalMoves.value.filter(move => move.to === squareId);
    
    if (moveCandidates.length > 0) {
      if (moveCandidates[0].promotion) {
        pendingPromotionMove.value = squareId;
        showPromotionModal.value = true;
        return;
      } else {
        return executeMove(moveCandidates[0]);
      }
    }
  }
  
  if (sq && sq.color === 'w') {
    selectedSquare.value = squareId;
    legalMoves.value = game.moves({ square: squareId, verbose: true });
  } else {
    selectedSquare.value = null; legalMoves.value = [];
  }
};

const cancelPromotion = () => {
  showPromotionModal.value = false;
  pendingPromotionMove.value = null;
  selectedSquare.value = null;
  legalMoves.value = [];
};

const confirmPromotion = (pieceType) => {
  const m = legalMoves.value.find(
    move => move.to === pendingPromotionMove.value && move.promotion === pieceType
  );
  showPromotionModal.value = false;
  pendingPromotionMove.value = null;
  if (m) executeMove(m);
};

const requestHint = async () => {
  isThinkingHint.value = true;
  const move = await coachPlayer.getBestMove(game.fen(), 10);
  if (move) {
    if (typeof move === 'string') {
      engineHint.value = { from: move.substring(0, 2), to: move.substring(2, 4) };
    } else if (typeof move === 'object' && move.from && move.to) {
      engineHint.value = { from: move.from, to: move.to };
    }
    hintSound.currentTime = 0;
    hintSound.play().catch(() => { console.log("Hint sound blocked."); });
  }
  isThinkingHint.value = false;
};

const resetGame = () => {
  game.reset(); isGameOver.value = false; lastMove.value = null;
  gameHistory.value = [game.fen()]; analysisReport.value = null; engineHint.value = null;
  updateGameState();
};

const startAnalysis = async () => {
  if (gameHistory.value.length < 2) return;
  isAnalyzing.value = true;
  totalAnalysisSteps.value = gameHistory.value.length - 1;
  currentAnalysisStep.value = 0;
  if (!analyzer) analyzer = new ChessAnalyzer();

  let totalLossWhite = 0;
  let whiteMoveCount = 0;

  const getScore = async (fen) => {
    const tempGame = new Chess(fen);
    if (tempGame.isGameOver()) {
      if (tempGame.isCheckmate()) return fen.includes(' b ') ? 1000 : -1000;
      return 0;
    }
    const rawScore = await analyzer.evaluatePosition(fen, 10);
    return Math.max(-1000, Math.min(1000, rawScore));
  };

  for (let i = 0; i < gameHistory.value.length - 1; i++) {
    currentAnalysisStep.value = i + 1;
    const fenBefore = gameHistory.value[i];
    const fenAfter = gameHistory.value[i + 1];

    if (fenBefore.includes(' w ')) {
      const scoreBefore = await getScore(fenBefore);
      const scoreAfter = await getScore(fenAfter);
      let loss = scoreBefore - scoreAfter;
      if (loss < 0) loss = 0;
      if (loss > 1000) loss = 1000;
      totalLossWhite += loss;
      whiteMoveCount++;
    }
  }

  const acpl = whiteMoveCount > 0 ? Math.round(totalLossWhite / whiteMoveCount) : 0;

  let levelKey = '';
  if (props.difficulty === 'beginner') {
    levelKey = acpl < 40 ? 'advanced' : 'beginner';
  } else if (props.difficulty === 'expert') {
    levelKey = acpl < 30 ? 'expert' : acpl < 60 ? 'advanced' : 'beginner';
  } else {
    levelKey = acpl < 25 ? 'grandmaster' : acpl < 50 ? 'expert' : acpl < 90 ? 'advanced' : 'beginner';
  }

  analysisReport.value = { acpl, level: t(`level.${levelKey}`) };
  isAnalyzing.value = false;
};

onMounted(() => {
  aiPlayer = new StockfishPlayer();
  coachPlayer = new StockfishPlayer();
  coachPlayer.setDifficulty(20);
  aiPlayer.setDifficulty(difficultySettings[props.difficulty].level);
  resetGame();
});

onUnmounted(() => {
  aiPlayer?.terminate();
  coachPlayer?.terminate();
  analyzer?.terminate();

  gameOverSound.pause();
  gameOverSound.currentTime = 0;
  hintSound.pause();
});
</script>

<style scoped>
.game-screen-wrapper { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 650px; }
.glass-card { background: rgba(44, 62, 80, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); }
.status-panel { width: 100%; padding: 20px; margin-top: 10px; text-align: center; box-sizing: border-box; }
.bottom-controls { display: flex; flex-direction: row; justify-content: center; gap: 15px; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); }
.modern-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; border-radius: 8px; border: none; font-weight: bold; font-size: 15px; cursor: pointer; color: #fff; transition: all 0.2s; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); }
.modern-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3); }
.modern-btn:active:not(:disabled) { transform: translateY(1px); }
.modern-btn:disabled { opacity: 0.5; cursor: not-allowed; filter: grayscale(1); }
.primary-btn { background: linear-gradient(135deg, #3498db, #2980b9); }
.danger-btn { background: linear-gradient(135deg, #e74c3c, #c0392b); }
.secondary-btn { background: linear-gradient(135deg, #7f8c8d, #34495e); }
.header-hint-btn { background: transparent; border: 1px solid rgba(255, 255, 255, 0.2); padding: 6px 12px; font-size: 12px; color: #ecf0f1; box-shadow: none; margin: 0; }
.header-hint-btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.4); }
.game-over-alert .modern-btn { margin-top: 15px; }
.analysis-loading { color: #3498db; font-size: 14px; font-weight: bold; }
.spinner { border: 4px solid rgba(255, 255, 255, 0.1); border-left-color: #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 15px auto; }
.stats-grid { display: flex; gap: 15px; justify-content: center; margin-top: 15px; }
.stat-box { background: rgba(0, 0, 0, 0.2); padding: 15px 20px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; min-width: 100px; }
.stat-label { font-size: 12px; color: #95a5a6; margin-bottom: 5px; }
.acpl-val { font-size: 24px; color: #e74c3c; font-weight: bold; }
.rank-val { font-size: 18px; color: #f1c40f; font-weight: bold; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.player-color { color: #2ecc71; font-weight: bold; }
.ai-color { color: #f39c12; }
.check-color { color: #e74c3c; font-weight: bold; animation: blink 1s infinite; }
@keyframes blink { from { opacity: 1; } to { opacity: 0.5; } }
.status-wrapper {
  display: flex;
  align-items: center;
  white-space: nowrap; 
}

/* ==========================================================================
   🌟 霓虹闪光升变弹窗 (纯视觉升级版)
   ========================================================================== */

/* 弹窗卡片本身不再有限定宽度，而是适应内容 */
.promotion-visual-card {
  max-width: none;
  width: auto;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 20px;
}

/* 1. 源头：即将升变的兵 */
.promo-source-pawn {
  font-size: 60px;
  margin-bottom: 5px;
  /* 初始时兵是静止不发光的 */
  filter: drop-shadow(0 4px 4px rgba(0,0,0,0.6));
}

/* 2. 连接线条 */
.promo-connector {
  width: 2px;
  height: 40px;
  margin-bottom: 15px;
  /* 🌟 线条带有静谧的蓝色虹吸光晕，暗示能量流动 */
  background: linear-gradient(to bottom, transparent, #3498db, transparent);
  box-shadow: 0 0 10px #3498db, 0 0 20px #3498db;
}

/* 3. 进化形态选项 */
.promotion-options-grid {
  display: flex;
  justify-content: space-between;
  gap: 15px;
}

.promo-option {
  width: 75px;
  height: 75px;
  /* 更加清澈的毛玻璃底座 */
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 45px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  box-shadow: inset 0 0 15px rgba(0,0,0,0.3);
  
  /* 🌟 核心：霓虹闪光呼吸动画！ */
  animation: neon-pulse 2s infinite;
  will-change: box-shadow, border-color;
}

/* 霓虹闪光 Keyframes：在天蓝色和紫红色之间平滑呼吸 */
@keyframes neon-pulse {
  0% { 
    border-color: rgba(52, 152, 219, 0.5); /* 天蓝 */
    box-shadow: 0 0 10px rgba(52, 152, 219, 0.4), inset 0 0 10px rgba(0,0,0,0.2);
  }
  50% { 
    border-color: rgba(155, 89, 182, 1); /* 紫罗兰 */
    box-shadow: 0 0 25px rgba(155, 89, 182, 0.8), inset 0 0 15px rgba(255,255,255,0.1);
  }
  100% { 
    border-color: rgba(52, 152, 219, 0.5); /* 天蓝 */
    box-shadow: 0 0 10px rgba(52, 152, 219, 0.4), inset 0 0 10px rgba(0,0,0,0.2);
  }
}

/* 鼠标悬浮时暂停呼吸，变成强力发光的白色选中效果 */
.promo-option:hover {
  animation-play-state: paused;
  background: rgba(255, 255, 255, 0.15);
  border-color: #fff;
  transform: translateY(-8px) scale(1.08);
  box-shadow: 0 15px 40px rgba(255, 255, 255, 0.7), inset 0 0 20px rgba(255,255,255,0.2);
}

/* 匹配原本的棋子颜色发光配置 */
.promo-white { color: #f8f8f8; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.6)); }
.promo-black { color: #111; filter: drop-shadow(0 2px 2px rgba(255,255,255,0.3)); }
</style>