<template>
  <div class="lobby-wrapper">
    <div class="lobby-header">
      <h2 class="title">{{ $t('lobby.title') }}</h2>
      <p class="subtitle">{{ $t('lobby.subtitle') }}</p>
      <div class="network-status">
        <span v-if="!isConnected" class="status-badge offline">{{ $t('lobby.connecting') }}</span>
        <span v-else class="status-badge online">
          {{ $t('lobby.online', { users: serverStats.users, rooms: serverStats.rooms }) }}
        </span>
      </div>
    </div>

    <div class="radar-container glass-card">
      
      <div v-if="matchSuccessData" class="success-state">
        <div class="swords-icon">⚔️</div>
        <h3 class="success-title">{{ $t('lobby.match_success') }}</h3>
        <p class="color-reveal">
          {{ $t('lobby.assigned') }} 
          <strong :class="matchSuccessData.color === 'w' ? 'text-white' : 'text-black'">
            {{ matchSuccessData.color === 'w' ? $t('lobby.white') : $t('lobby.black') }}
          </strong>
        </p>
        <p class="timer">{{ $t('lobby.generating', { time: countdown }) }}</p>
      </div>

      <div v-else-if="lobbyState === 'searching'" class="searching-state">
        <div class="radar"><div class="radar-sweep"></div></div>
        <p class="searching-text">{{ $t('lobby.scanning') }}</p>
        <p class="timer">{{ $t('lobby.waited', { time: searchTime }) }}</p>
        <button @click="cancelSearch" class="modern-btn danger-btn cancel-btn">{{ $t('lobby.cancel') }}</button>
      </div>

      <div v-else-if="lobbyState === 'hosting'" class="hosting-state">
        <div class="static-globe">🏠</div>
        <p class="searching-text">{{ $t('lobby.room_code') }}</p>
        <div class="room-code-display">{{ privateRoomCode }}</div>
        <p class="timer">{{ $t('lobby.waiting_friend') }}</p>
        <button @click="cancelPrivate" class="modern-btn danger-btn cancel-btn">{{ $t('lobby.cancel') }}</button>
      </div>

      <div v-else-if="lobbyState === 'joining'" class="joining-state">
        <div class="static-globe">🔑</div>
        <input 
          v-model="joinCode" 
          type="text" 
          maxlength="5" 
          class="code-input" 
          :placeholder="$t('lobby.enter_code')" 
          @keyup.enter="submitJoin"
        />
        <p v-if="joinError" class="error-msg">{{ joinError }}</p>
        <div class="action-row">
          <button @click="cancelPrivate" class="modern-btn secondary-btn">{{ $t('lobby.cancel') }}</button>
          <button @click="submitJoin" class="modern-btn primary-btn" :disabled="joinCode.length !== 5">{{ $t('lobby.join_btn') }}</button>
        </div>
      </div>

      <div v-else class="idle-state">
        <div class="static-globe">🌍</div>
        <p>{{ $t('lobby.ready') }}</p>
        <div class="action-column">
          <button @click="startSearch" class="modern-btn primary-btn pulse-btn" :disabled="!isConnected">
            {{ isConnected ? $t('lobby.start') : $t('lobby.disconnected') }}
          </button>
          <div class="private-buttons" v-if="isConnected">
            <button @click="createPrivate" class="modern-btn outline-btn">{{ $t('lobby.create_private') }}</button>
            <button @click="lobbyState = 'joining'" class="modern-btn outline-btn">{{ $t('lobby.join_private') }}</button>
          </div>
        </div>
      </div>

    </div>

    <button v-if="lobbyState === 'idle' && !matchSuccessData" @click="emit('back-to-menu')" class="modern-btn secondary-btn back-btn">
      {{ $t('lobby.back') }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n'; 

const props = defineProps({ socket: { type: Object, required: true } });
const emit = defineEmits(['match-found', 'back-to-menu']);
const { t } = useI18n(); 

const lobbyState = ref('idle');

const searchTime = ref(0);
let timerInterval = null;
const isConnected = ref(props.socket.connected);
const serverStats = ref({ users: 1, rooms: 0 });
const matchSuccessData = ref(null);
const countdown = ref(3);
let countdownInterval = null;

const privateRoomCode = ref('');
const joinCode = ref('');
const joinError = ref('');

onMounted(() => {
  props.socket.on('connect', () => { isConnected.value = true; });
  props.socket.on('disconnect', () => { 
    isConnected.value = false; 
    lobbyState.value = 'idle';
  });

  props.socket.on('server_stats', (stats) => { 
    serverStats.value = stats; 
  });

  props.socket.on('private_room_created', (code) => {
    privateRoomCode.value = code;
    lobbyState.value = 'hosting';
  });

  props.socket.on('private_error', (errType) => {
    joinError.value = errType === 'room_not_found' ? t('lobby.err_not_found') : t('lobby.err_self');
  });


  props.socket.on('match_found', (roomData) => {
    clearInterval(timerInterval);
    lobbyState.value = 'success';
    matchSuccessData.value = roomData;
    
    countdownInterval = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(countdownInterval);
        emit('match-found', roomData);
      }
    }, 1000);
  });
});

onUnmounted(() => {
  clearInterval(timerInterval);
  clearInterval(countdownInterval);
  props.socket.off('connect'); props.socket.off('disconnect');
  props.socket.off('server_stats');props.socket.off('match_found');
  props.socket.off('private_room_created'); props.socket.off('private_error');
});


const startSearch = () => {
  if (!isConnected.value) return;
  lobbyState.value = 'searching';
  searchTime.value = 0;
  timerInterval = setInterval(() => { searchTime.value++; }, 1000);
  props.socket.emit('find_match');
};

const cancelSearch = () => {
  lobbyState.value = 'idle';
  clearInterval(timerInterval);
  props.socket.emit('cancel_match');
};


const createPrivate = () => {
  props.socket.emit('create_private_room');
};

const submitJoin = () => {
  joinError.value = '';
  if (joinCode.value.length === 5) {
    props.socket.emit('join_private_room', joinCode.value);
  }
};

const cancelPrivate = () => {
  if (lobbyState.value === 'hosting') {
    props.socket.emit('cancel_private_room', privateRoomCode.value);
  }
  lobbyState.value = 'idle';
  joinCode.value = '';
  joinError.value = '';
};
</script>

<style scoped>
.lobby-wrapper { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; max-width: 500px; height: 80vh; gap: 30px; animation: fadeIn 0.5s ease-out; }
.lobby-header { text-align: center; }
.title { color: #ecf0f1; font-size: 28px; letter-spacing: 2px; margin: 0 0 10px 0; text-shadow: 0 0 15px rgba(52, 152, 219, 0.5); }
.subtitle { color: #95a5a6; font-size: 14px; margin: 0 0 15px 0; }
.network-status { margin-top: 10px; }
.status-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; background: rgba(0,0,0,0.3); }
.status-badge.online { color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.3); box-shadow: 0 0 10px rgba(46, 204, 113, 0.2); }
.status-badge.offline { color: #e74c3c; border: 1px solid rgba(231, 76, 60, 0.3); }

.glass-card { background: rgba(30, 39, 46, 0.6); backdrop-filter: blur(15px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 40px; width: 100%; box-sizing: border-box; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
.idle-state, .searching-state, .success-state, .hosting-state, .joining-state { display: flex; flex-direction: column; align-items: center; text-align: center; }

.action-column { display: flex; flex-direction: column; gap: 15px; width: 100%; align-items: center; }
.action-column > .primary-btn { width: 100%; max-width: 280px; }

.private-buttons { display: flex; flex-direction: column; gap: 12px; width: 100%; align-items: center;}

.outline-btn { 
  width: 100%; 
  max-width: 280px; 
  background: rgba(0, 0, 0, 0.3); 
  border: 2px solid #3498db; 
  color: #ffffff; 
  font-size: 15px; 
  padding: 12px 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); 
  box-sizing: border-box;
}

.outline-btn:hover { 
  background: rgba(52, 152, 219, 0.2); 
  border-color: #5dade2; 
  color: #fff;
  box-shadow: 0 0 15px rgba(52, 152, 219, 0.5);
}

.room-code-display { font-family: 'Courier New', Courier, monospace; font-size: 40px; font-weight: 900; color: #f1c40f; letter-spacing: 5px; margin: 15px 0; text-shadow: 0 0 15px rgba(241, 196, 15, 0.4); background: rgba(0,0,0,0.3); padding: 10px 30px; border-radius: 10px; border: 1px solid rgba(241, 196, 15, 0.3); }
.code-input { background: rgba(0,0,0,0.3); border: 2px solid rgba(52, 152, 219, 0.5); color: #fff; padding: 12px; border-radius: 8px; text-align: center; font-size: 24px; letter-spacing: 5px; text-transform: uppercase; outline: none; width: 200px; margin-bottom: 20px; transition: all 0.3s; }
.code-input:focus { border-color: #3498db; box-shadow: 0 0 15px rgba(52, 152, 219, 0.5); }
.action-row { display: flex; gap: 10px; }
.error-msg { color: #e74c3c; font-size: 12px; margin-top: -10px; margin-bottom: 15px; }

.static-globe { font-size: 60px; margin-bottom: 20px; filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.2)); }
p { color: #bdc3c7; font-size: 14px; margin-bottom: 25px; }
.swords-icon { font-size: 60px; margin-bottom: 10px; animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.success-title { color: #f1c40f; font-size: 24px; margin: 0 0 15px 0; text-shadow: 0 0 15px rgba(241, 196, 15, 0.4); }
.color-reveal { font-size: 16px; background: rgba(0,0,0,0.3); padding: 10px 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
.text-white { color: #ecf0f1; font-weight: 900; font-size: 20px; }
.text-black { color: #7f8c8d; font-weight: 900; font-size: 20px; text-shadow: 0 0 5px #000; }
.radar { width: 120px; height: 120px; border-radius: 50%; border: 2px solid rgba(46, 204, 113, 0.5); background: radial-gradient(circle, rgba(46,204,113,0.1) 0%, rgba(0,0,0,0) 70%); position: relative; overflow: hidden; margin-bottom: 20px; box-shadow: 0 0 30px rgba(46, 204, 113, 0.3); }
.radar-sweep { width: 50%; height: 50%; background: linear-gradient(45deg, rgba(46, 204, 113, 1) 0%, rgba(0, 0, 0, 0) 100%); position: absolute; top: 0; left: 50%; transform-origin: bottom left; animation: sweep 2s linear infinite; }
@keyframes sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.searching-text { color: #2ecc71; font-weight: bold; font-size: 16px; margin-bottom: 5px; }
.timer { color: #7f8c8d; font-size: 12px; margin-bottom: 25px; }
.modern-btn { padding: 12px 30px; border-radius: 25px; border: none; font-weight: bold; font-size: 16px; cursor: pointer; color: #fff; transition: all 0.3s; }
.modern-btn:disabled { opacity: 0.5; cursor: not-allowed; filter: grayscale(1); }
.primary-btn { background: linear-gradient(135deg, #3498db, #2980b9); box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3); }
.primary-btn:hover:not(:disabled) { box-shadow: 0 5px 25px rgba(52, 152, 219, 0.6); transform: translateY(-2px); }
.danger-btn { background: rgba(231, 76, 60, 0.1); border: 1px solid #e74c3c; color: #e74c3c; }
.danger-btn:hover { background: rgba(231, 76, 60, 0.2); }
.secondary-btn { background: transparent; border: 1px solid rgba(255, 255, 255, 0.3); }
.secondary-btn:hover { background: rgba(255, 255, 255, 0.1); }
.pulse-btn { animation: pulseBtn 2s infinite alternate; }
@keyframes pulseBtn { 0% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.7); } 100% { box-shadow: 0 0 0 10px rgba(52, 152, 219, 0); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes popIn { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
</style>