<template>
  <div class="app-container">
    <StartMenu v-if="currentScreen === 'start'" @start-game="startLocalGame" @start-online="goToLobby" />

    <LocalGame v-else-if="currentScreen === 'local-game'" :difficulty="selectedDifficulty"
      @back-to-menu="currentScreen = 'start'" />

    <OnlineLobby v-else-if="currentScreen === 'online-lobby'" :socket="socket" @match-found="enterOnlineGame"
      @back-to-menu="currentScreen = 'start'" />

    <OnlineGame v-else-if="currentScreen === 'online-game'" :socket="socket" :roomData="roomData"
      @back-to-menu="currentScreen = 'start'" />

    <footer class="app-footer" :class="{ 'start-footer': currentScreen === 'start' }">
      v2.09 | © 2026 AYA CLOUD SAS. All rights reserved.
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { io } from 'socket.io-client';

import StartMenu from './components/StartMenu.vue';
import LocalGame from './components/LocalGame.vue';
import OnlineLobby from './components/OnlineLobby.vue';
import OnlineGame from './components/OnlineGame.vue';

const currentScreen = ref('start');
const selectedDifficulty = ref('beginner');
const roomData = ref(null);

const socket = io(import.meta.env.VITE_API_BASE_URL, { autoConnect: false });

const startLocalGame = (diff) => {
  selectedDifficulty.value = diff;
  currentScreen.value = 'local-game';
};

const goToLobby = () => {
  socket.connect(); 
  currentScreen.value = 'online-lobby';
};

const enterOnlineGame = (data) => {
  roomData.value = data; 
  currentScreen.value = 'online-game';
};
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  min-height: 100dvh; 
  background-image: url('/img/background.png');
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #010708;
}

.app-footer {
  width: 100%;
  text-align: center;
  margin-top: auto;
  padding: 15px 10px;
  font-size: 11px;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.4);
  z-index: 50; 
  pointer-events: none; 
}

.start-footer {
  position: absolute;
  bottom: 0;
  left: 0;
}
</style>