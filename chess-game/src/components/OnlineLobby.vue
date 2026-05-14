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
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="custom-svg success-svg">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
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
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="custom-svg host-svg">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
        <p class="searching-text">{{ $t('lobby.room_code') }}</p>
        <div class="room-code-display">{{ privateRoomCode }}</div>
        <p class="timer">{{ $t('lobby.waiting_friend') }}</p>
        <button @click="cancelPrivate" class="modern-btn danger-btn cancel-btn">{{ $t('lobby.cancel') }}</button>
      </div>

      <div v-else-if="lobbyState === 'joining'" class="joining-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="custom-svg join-svg">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
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
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="custom-svg idle-svg">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
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

.custom-svg {
  width: 64px;
  height: 64px;
  margin-bottom: 20px;
  stroke-width: 1.5;
  transition: all 0.3s ease;
}

.idle-svg {
  color: #3498db;
  filter: drop-shadow(0 0 15px rgba(52, 152, 219, 0.6));
}

.host-svg {
  color: #f1c40f;
  filter: drop-shadow(0 0 15px rgba(241, 196, 15, 0.6));
}

.join-svg {
  color: #9b59b6;
  filter: drop-shadow(0 0 15px rgba(155, 89, 182, 0.6));
}

.success-svg {
  color: #e74c3c;
  filter: drop-shadow(0 0 20px rgba(231, 76, 60, 0.8));
  animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
</style>