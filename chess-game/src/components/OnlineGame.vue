<template>
  <div class="game-screen-wrapper theme-expert">
    <GameHeader :title="$t('game.online') + ' (' + roomData.roomId.slice(-4) + ')'" icon="⚔️">
      <template #status>
        <div class="status-wrapper">
          <template v-if="!isAnalyzing">
            <span v-if="isGameOver" class="status-text-small check-color">{{ gameOverReason }}</span>
            <template v-else>
              <span v-if="currentTurn === myColor" class="status-text-small player-color">{{ $t('game.your_turn') }}</span>
              <span v-else class="status-text-small ai-color">{{ $t('game.waiting') }}</span>
              <span v-if="isCheck" class="status-text-small check-color">{{ $t('game.check') }}</span>
            </template>
          </template>
          <template v-else>
            <span class="status-text-small ai-color">{{ $t('game.analyzing') }}</span>
          </template>
        </div>
      </template>
      <template #right>
        <div class="chess-clock" :class="{ 'clock-active': currentTurn !== myColor, 'clock-low': timers[opponentColor] < 30 }">
          ⏳ {{ formatTime(timers[opponentColor]) }}
        </div>
      </template>
    </GameHeader>

    <MaterialTray :captured="capturedPieces[myColor]" :advantage="materialScore[myColor === 'w' ? 'black' : 'white']" :color="myColor" />

    <ChessBoard 
      :board="boardState" :legal-moves="legalMoves" :last-move="lastMove" :selected-square="selectedSquare"
      :current-turn="currentTurn" :is-check="isCheck" :is-flipped="myColor === 'b'"
      :disabled="isGameOver || currentTurn !== myColor || isAnalyzing" @square-click="handleSquareClick" 
    />

    <MaterialTray :captured="capturedPieces[opponentColor]" :advantage="materialScore[myColor === 'w' ? 'white' : 'black']" :color="opponentColor" />

    <div class="status-panel glass-card">
      <div class="panel-top-row">
        <div class="chess-clock player-clock" :class="{ 'clock-active': currentTurn === myColor, 'clock-low': timers[myColor] < 30 }">
          ⏲️ {{ formatTime(timers[myColor]) }}
        </div>
      </div>

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
        <div style="margin-top: 15px;">
           <button @click="emit('back-to-menu')" class="modern-btn secondary-btn">{{ $t('game.btn_menu') }}</button>
        </div>
      </div>

      <div v-else class="normal-status">
        <button v-if="!isGameOver" @click="handleSurrender" class="modern-btn danger-btn">{{ $t('game.surrender_back') }}</button>
        
        <div v-else class="game-over-alert">
          <h3 class="over-title">🏁 {{ gameOverReason }}</h3>
          <button @click="startAnalysis" class="modern-btn primary-btn pulse-anim" style="margin-right: 10px;">{{ $t('game.btn_analysis') }}</button>
          <button @click="emit('back-to-menu')" class="modern-btn secondary-btn">{{ $t('game.btn_menu') }}</button>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="showSurrenderModal" class="modal-overlay" @click.self="showSurrenderModal = false">
        <div class="modal-content heavy-glass-card">
          <h3 class="modal-title">{{ $t('game.surrender_title') }}</h3>
          <p class="modal-text">{{ $t('game.surrender_text') }}</p>
          <div class="modal-actions">
            <button @click="showSurrenderModal = false" class="modern-btn secondary-btn">{{ $t('game.think_again') }}</button>
            <button @click="confirmSurrender" class="modern-btn danger-btn">{{ $t('game.confirm_surrender') }}</button>
          </div>
        </div>
      </div>
    </Transition>

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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Chess } from 'chess.js';
import GameHeader from './GameHeader.vue';
import ChessBoard from './ChessBoard.vue';
import MaterialTray from './MaterialTray.vue';
import { ChessAnalyzer } from '../ChessAnalyzer';
import { useChessLogic } from '../composables/useChessLogic';
import { useI18n } from 'vue-i18n'; 

const props = defineProps({ socket: Object, roomData: Object });
const emit = defineEmits(['back-to-menu']);

const { t } = useI18n(); 

const game = new Chess();
let analyzer = null;
let clockInterval = null;

const boardState = ref(game.board());
const { formatTime, capturedPieces, materialScore } = useChessLogic(boardState);
const currentTurn = ref(game.turn());
const myColor = ref(props.roomData.color);
const isGameOver = ref(false);
const gameOverReason = ref(t('game.game_over')); 
const isCheck = ref(false);

const showPromotionModal = ref(false);
const pendingPromotionMove = ref(null);
const promoSymbols = computed(() => myColor.value === 'w' 
  ? { p: '♙', q: '♕', r: '♖', b: '♗', n: '♘' } 
  : { p: '♟', q: '♛', r: '♜', b: '♝', n: '♞' });
const promoColorClass = computed(() => myColor.value === 'w' ? 'promo-white' : 'promo-black');

const selectedSquare = ref(null);
const legalMoves = ref([]);
const lastMove = ref(null);

const gameHistory = ref([game.fen()]);
const isAnalyzing = ref(false);
const currentAnalysisStep = ref(0);
const totalAnalysisSteps = ref(0);
const analysisReport = ref(null);

const timers = ref({ w: 600, b: 600 });

const moveWhiteSound = new Audio('/audio/move_white.wav');
const moveBlackSound = new Audio('/audio/move_black.wav');
const captureSound = new Audio('/audio/capture.wav');
const checkSound = new Audio('/audio/check.wav');
const gameOverSound = new Audio('/audio/gameover.mp3'); 

const vibrate = (pattern) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

const startClock = () => {
  clearInterval(clockInterval);
  clockInterval = setInterval(() => {
    if (!isGameOver.value) {
      timers.value[currentTurn.value]--;
      if (timers.value[currentTurn.value] <= 0) {
        timers.value[currentTurn.value] = 0;
        clearInterval(clockInterval);
      }
    }
  }, 1000);
};

const opponentColor = computed(() => myColor.value === 'w' ? 'b' : 'w');

onMounted(() => {
  startClock();

  props.socket.on('move_made', (data) => {
    game.load(data.fen);
    boardState.value = game.board();
    currentTurn.value = game.turn();
    isCheck.value = game.inCheck();
    lastMove.value = { from: data.move.from, to: data.move.to };
    gameHistory.value.push(data.fen);

    if (data.timers) timers.value = data.timers;

    if (data.isGameOver) {
      isGameOver.value = true;
      vibrate([100, 50, 100, 50, 200]);
      if (game.isCheckmate()) {
        gameOverReason.value = game.turn() === myColor.value ? t('game.lose') : t('game.win');
      } else {
        gameOverReason.value = t('game.draw'); 
      }
      gameOverSound.play().catch(() => { });
      clearInterval(clockInterval);
    } else if (isCheck.value) {
      vibrate([50, 30, 50]);
      checkSound.currentTime = 0;
      checkSound.play().catch(() => { });
    } else if (data.move.captured) {
      vibrate(40);
      captureSound.currentTime = 0;
      captureSound.play().catch(() => { });
    } else {
      vibrate(15);
      let s = data.move.color === 'w' ? moveWhiteSound : moveBlackSound;
      s.currentTime = 0;
      s.play().catch(() => { });
    }
  });

  props.socket.on('sync_board', (fen) => {
    game.load(fen);
    boardState.value = game.board();
    currentTurn.value = game.turn();
    isCheck.value = game.inCheck();
  });

  props.socket.on('opponent_surrendered', () => {
    isGameOver.value = true;
    vibrate([100, 50, 100, 50, 200]);
    gameOverReason.value = t('game.opp_surrender'); 
    gameOverSound.play().catch(() => { });
    clearInterval(clockInterval);
  });

  props.socket.on('game_over', (data) => {
    isGameOver.value = true;
    vibrate([100, 50, 100, 50, 200]);
    gameOverReason.value = t('game.timeout'); 
    gameOverSound.play().catch(() => { });
    clearInterval(clockInterval);
  });
});

onUnmounted(() => {
  props.socket.off('move_made');
  props.socket.off('sync_board');
  props.socket.off('opponent_surrendered');
  props.socket.off('game_over');
  clearInterval(clockInterval);
  analyzer?.terminate();

  gameOverSound.pause();
  gameOverSound.currentTime = 0;
});

const handleSquareClick = (squareId) => {
  if (currentTurn.value !== myColor.value || isGameOver.value || isAnalyzing.value) return;
  const sq = game.get(squareId);
  
  if (selectedSquare.value) {
    const moveCandidates = legalMoves.value.filter(move => move.to === squareId);
    if (moveCandidates.length > 0) {
      if (moveCandidates[0].promotion) {
        pendingPromotionMove.value = squareId;
        showPromotionModal.value = true;
        return;
      } else {
        props.socket.emit('make_move', { roomId: props.roomData.roomId, move: moveCandidates[0] });
        selectedSquare.value = null; legalMoves.value = [];
        return;
      }
    }
  }
  
  if (sq && sq.color === myColor.value) {
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
  if (m) {
    props.socket.emit('make_move', { roomId: props.roomData.roomId, move: m });
    selectedSquare.value = null; legalMoves.value = [];
  }
};

const showSurrenderModal = ref(false); 
const handleSurrender = () => { showSurrenderModal.value = true; };
const confirmSurrender = () => { props.socket.emit('surrender', props.roomData.roomId); emit('back-to-menu'); };

const startAnalysis = async () => {
  if (gameHistory.value.length < 2) return;
  isAnalyzing.value = true;
  totalAnalysisSteps.value = gameHistory.value.length - 1;
  currentAnalysisStep.value = 0;

  if (!analyzer) analyzer = new ChessAnalyzer();
  let totalLoss = 0, myMoveCount = 0;

  const getScore = async (fen) => {
    const tempGame = new Chess(fen);
    if (tempGame.isGameOver()) return tempGame.isCheckmate() ? (fen.includes(' b ') ? 1000 : -1000) : 0;
    return Math.max(-1000, Math.min(1000, await analyzer.evaluatePosition(fen, 10)));
  };

  for (let i = 0; i < gameHistory.value.length - 1; i++) {
    currentAnalysisStep.value = i + 1;
    const fenBefore = gameHistory.value[i];
    if (myColor.value === 'w' ? fenBefore.includes(' w ') : fenBefore.includes(' b ')) {
      const scoreBefore = await getScore(fenBefore);
      const scoreAfter = await getScore(gameHistory.value[i + 1]);
      let loss = myColor.value === 'w' ? (scoreBefore - scoreAfter) : (scoreAfter - scoreBefore);
      if (loss < 0) loss = 0;
      if (loss > 1000) loss = 1000;
      totalLoss += loss; myMoveCount++;
    }
  }

  const acpl = myMoveCount > 0 ? Math.round(totalLoss / myMoveCount) : 0;
  
  let levelKey = acpl < 20 ? 'grandmaster' : acpl < 40 ? 'expert' : acpl < 80 ? 'advanced' : 'beginner';

  analysisReport.value = { acpl, level: t(`level.${levelKey}`) };
  isAnalyzing.value = false;
};
</script>

<style scoped>
.game-screen-wrapper { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 650px; }
.glass-card { background: rgba(44, 62, 80, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); }
.chess-clock { background: #2c3e50; color: #fff; padding: 6px 15px; border-radius: 6px; font-family: 'Courier New', Courier, monospace; font-size: 20px; font-weight: bold; border: 2px solid #34495e; transition: all 0.3s ease; min-width: 80px; text-align: center; }
.clock-active { border-color: #27ce71; box-shadow: 0 0 10px rgba(46, 204, 113, 0.4); background: #1e272e; }
.clock-low { color: #e74c3c; animation: clockWarning 1s infinite alternate; }
@keyframes clockWarning { from { opacity: 1; } to { opacity: 0.6; } }
.status-panel { width: 100%; padding: 20px; margin-top: 10px; text-align: center; box-sizing: border-box; }
.panel-top-row { display: flex; justify-content: center; margin-bottom: 10px; }
.modern-btn { display: inline-flex; align-items: center; justify-content: center; padding: 12px 24px; border-radius: 8px; border: none; font-weight: bold; font-size: 15px; cursor: pointer; color: #fff; transition: all 0.2s; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); }
.modern-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3); }
.primary-btn { background: linear-gradient(135deg, #3498db, #2980b9); }
.danger-btn { background: linear-gradient(135deg, #e74c3c, #c0392b); }
.secondary-btn { background: linear-gradient(135deg, #7f8c8d, #34495e); }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 100; padding: 20px; box-sizing: border-box; }
.heavy-glass-card { background: rgba(30, 39, 46, 0.9); backdrop-filter: blur(25px); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 15px; padding: 30px; text-align: center; width: 100%; max-width: 400px; }
.modal-text { color: #bdc3c7; margin-bottom: 25px; }
.modal-actions { display: flex; justify-content: center; gap: 15px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.game-over-alert { text-align: center; }
.over-title { color: #e74c3c; margin: 0 0 15px 0; }
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