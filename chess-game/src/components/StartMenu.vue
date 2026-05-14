<template>
  <div class="start-menu-overlay" @click="startMusicOnFirstTouch">
    
    <video 
      ref="bgVideo"
      autoplay 
      loop 
      muted 
      playsinline 
      webkit-playsinline 
      x5-video-player-type="h5" 
      poster="/img/background.png" 
      class="back-video"
    >
      <source src="/video/background_animated.mp4" type="video/mp4">
    </video>

    <button class="lang-switch-btn positioned-content" @click="cycleLanguage" title="Switch Language">
      🌐 {{ currentLangLabel }}
    </button>
    <button class="music-icon-btn positioned-content" @click.stop="toggleMusic" title="Toggle Music">
      <span class="icon">{{ isMusicPlaying ? '🎵' : '🔇' }}</span>
    </button>

    <button class="rules-icon-btn positioned-content" @click="showRules = true" :title="$t('menu.rules')">
      <span class="icon">ⓘ</span> {{ $t('menu.rules') }}
    </button>

    <div class="content-wrapper positioned-content">
      <div class="header-section">
        <h1 class="game-title">{{ $t('menu.title') }}</h1>
        <p class="subtitle">{{ $t('menu.subtitle') }}</p>
      </div>

      <div class="menu-section">
        <h3 class="section-title">{{ $t('menu.choose_diff') }}</h3>
        
        <div class="difficulty-cards">
          <div 
            v-for="(desc, level) in difficulties" 
            :key="level"
            class="diff-card glass-card" 
            :class="{ 'active': selectedDifficulty === level }"
            @click="selectedDifficulty = level"
          >
            <div class="card-left">
              <span class="card-icon">{{ desc.icon }}</span>
            </div>
            <div class="card-right">
              <h4>{{ $t(`diff.${level}`) }}</h4>
              <p>{{ $t(`diff.${level}_desc`) }}</p>
            </div>
          </div>
        </div>

        <div class="action-section" style="margin-top: 15px;">
          <button class="play-btn local-btn" @click.stop="handlePlay">
            {{ $t('menu.play_local') }}
          </button>
        </div>
      </div>

      <div class="section-divider">
        <span class="line"></span>
        <span class="text">OR</span>
        <span class="line"></span>
      </div>

      <div class="action-section">
        <button class="play-btn online-btn" @click="handleOnlinePlay">
          {{ $t('menu.play_online') }}
        </button>
      </div>

    </div>
    
    <Transition name="fade">
      <div v-if="showRules" class="modal-overlay" @click.self="showRules = false">
        <div class="modal-content heavy-glass-card">
          <button class="close-modal-btn" @click="showRules = false">✕</button>
          
          <h2 class="modal-title"> </h2>
          
          <div class="video-btn-wrapper">
            <button @click="openVideoRules" class="video-rules-btn">
              <span class="play-icon">▶</span> {{$t('menu.watch_video')}}
            </button>
          </div>
          
          <div class="rules-images-container">
            <img src="/img/Piece.png" alt="Rules" class="rules-img" />
            <img src="/img/Rules.png" alt="Rules" class="rules-img" />
            <img src="/img/movement.png" alt="Rules" class="rules-img" />
          </div>
          <p class="modal-tip">{{ $t('menu.tip') }}</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'; 
import { useI18n } from 'vue-i18n'; 

const emit = defineEmits(['start-game', 'start-online']);
const selectedDifficulty = ref('beginner');
const showRules = ref(false);

const bgm = new Audio('/audio/bgm.mp3');
bgm.loop = true; 
bgm.volume = 0.4; 

const isMusicPlaying = ref(false);
const hasInteracted = ref(false); 
let isUnmounted = false; 

let wasPlayingBeforeHide = false;

const toggleMusic = () => {
  if (isMusicPlaying.value) {
    bgm.pause();
    isMusicPlaying.value = false;
  } else {
    const playPromise = bgm.play();
    if (playPromise !== undefined) {
      playPromise.catch(e => console.log("Playback blocked:", e));
    }
    isMusicPlaying.value = true;
    hasInteracted.value = true; 
  }
};

const startMusicOnFirstTouch = () => {
  if (isUnmounted) return; 
  
  if (!hasInteracted.value) {
    hasInteracted.value = true;
    const playPromise = bgm.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        isMusicPlaying.value = true;
      }).catch(e => {
        console.log("Automatic music wake-up failed:", e);
      });
    }
  }
};

const openVideoRules = () => {
  const bilibiliUrl = 'https://www.bilibili.com/video/BV1mU5M6kEbf/'; 
  const youtubeUrl = 'https://www.youtube.com/watch?v=70hSEIU9U_s';  

  try {

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    

    if (timeZone === 'Asia/Shanghai' || timeZone === 'Asia/Chongqing' || timeZone === 'Asia/Urumqi') {

      window.open(bilibiliUrl, '_blank');
    } else {

      window.open(youtubeUrl, '_blank');
    }
  } catch (error) {

    window.open(youtubeUrl, '_blank');
  }
};


const handleVisibilityChange = () => {
  if (isUnmounted) return; 

  if (document.hidden) {
    if (isMusicPlaying.value) {
      wasPlayingBeforeHide = true; 
      bgm.pause();                 
      isMusicPlaying.value = false;
    } else {
      wasPlayingBeforeHide = false;
    }
  } else {
    if (wasPlayingBeforeHide) {
      const playPromise = bgm.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          isMusicPlaying.value = true;
        }).catch(e => console.log("Playback failed to resume:", e));
      }
    }
  }
};



const bgVideo = ref(null); 

const { t, locale } = useI18n();


const cycleLanguage = () => {
  const order = ['zh', 'en', 'fr'];
  const currentIndex = order.indexOf(locale.value);
  locale.value = order[(currentIndex + 1) % order.length];
};

const currentLangLabel = computed(() => {
  return { zh: '中文', en: 'English', fr: 'Français' }[locale.value];
});

const difficulties = {
  beginner: { icon: '♙' }, 
  expert: { icon: '♘' }, 
  master: { icon: '♔' }  
};

const handlePlay = () => {
  emit('start-game', selectedDifficulty.value);
};

const handleOnlinePlay = () => {
  emit('start-online');
};

onMounted(() => {
  const tryPlayVideo = () => {
    if (bgVideo.value) {
      bgVideo.value.play().catch(() => {
        console.log("Video autoplay was blocked by the browser");
      });
    }
  };

  tryPlayVideo();

  document.addEventListener("WeixinJSBridgeReady", () => {
    tryPlayVideo();
  }, false);

  document.addEventListener('touchstart', () => {
    tryPlayVideo();
  }, { once: true }); 

  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onUnmounted(() => {
  isUnmounted = true; 
  bgm.pause();
  bgm.currentTime = 0;

  document.removeEventListener("visibilitychange", handleVisibilityChange);  
});
</script>

<style scoped>
.positioned-content {
  position: relative; 
  z-index: 10;
}

.start-menu-overlay { 
  width: 100%; 
  min-height: 100vh; 
  min-height: 100dvh; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  padding: 20px; 
  position: relative; 
  background-color: #000; 
  overflow: hidden; 
}

.back-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1; 
  object-fit: cover; 
}

.start-menu-overlay::before { 
  content: ''; 
  position: absolute; 
  top: 0; 
  left: 0; 
  width: 100%; 
  height: 100%; 
  background: rgba(0, 0, 0, 0.5); 
  z-index: 2; 
}

.lang-switch-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  padding: 6px 14px;
  border-radius: 20px;
  cursor: pointer;
  backdrop-filter: blur(5px);
  font-size: 13px;
  transition: all 0.3s ease;
}

.lang-switch-btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; border-color: rgba(255, 255, 255, 0.5); }

.rules-icon-btn { position: absolute; top: 20px; right: 20px; background: transparent; border: 1px solid rgba(255, 255, 255, 0.2); color: rgba(255, 255, 255, 0.7); padding: 6px 14px; border-radius: 20px; cursor: pointer; backdrop-filter: blur(5px); font-size: 13px; transition: all 0.3s ease; }
.rules-icon-btn .icon { margin-right: 4px; font-style: normal; font-weight: bold; }
.rules-icon-btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; border-color: rgba(255, 255, 255, 0.5); }

.music-icon-btn {
  position: absolute;
  top: 20px;
  right: 120px; 
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  backdrop-filter: blur(5px);
  font-size: 15px;
  transition: all 0.3s ease;
  z-index: 10;
}

.music-icon-btn:hover { 
  background: rgba(255, 255, 255, 0.1); 
  color: #fff; 
  border-color: rgba(255, 255, 255, 0.5); 
}

.content-wrapper { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  justify-content: space-evenly; 
  width: 100%; 
  max-width: 480px; 
  padding: 40px 0 80px 0; 
  position: relative; 
  z-index: 2; 
}

@media (max-height: 700px) {
  .section-divider {
    margin: 10px auto 5px auto;
  }
  .content-wrapper {
    padding: 20px 0 70px 0;
  }
}.glass-card { background: rgba(44, 62, 80, 0.5); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); }

.header-section { text-align: center; margin-bottom: 10px; }
.game-title { font-size: clamp(28px, 7vw, 42px); line-height: 1.2; margin: 0; color: #ecf0f1; font-weight: 700; letter-spacing: 2px; text-shadow: 0 0 20px rgba(255, 255, 255, 0.2), 0 2px 4px rgba(0, 0, 0, 0.5); }
.subtitle { color: #dee2e6; font-size: 13px; margin-top: 15px; letter-spacing: 2px; }

.menu-section { width: 100%; }
.section-title { font-size: 14px; color: #a0aec0; margin-bottom: 15px; text-align: center; letter-spacing: 1px;}
.difficulty-cards { display: flex; flex-direction: column; gap: 12px; }
.diff-card { display: flex; align-items: center; padding: 12px 15px; cursor: pointer; transition: all 0.3s; }
.card-left { font-size: 32px; margin-right: 15px; flex-shrink: 0; color: #ecf0f1; text-shadow: 0 2px 5px rgba(0,0,0,0.5); }
.card-right h4 { margin: 0; font-size: 18px; color: #f8f8f8; }
.card-right p { margin: 3px 0 0 0; font-size: 12px; color: #cbd5e0; line-height: 1.3; }
.diff-card.active { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.5); box-shadow: 0 0 20px rgba(255, 255, 255, 0.15); transform: translateX(5px); }

.action-section { display: flex; flex-direction: column; align-items: center; width: 100%; }
.play-btn { width: 100%; max-width: 320px; border-radius: 25px; padding: 15px; font-size: 18px; font-weight: bold; cursor: pointer; transition: all 0.2s; box-sizing: border-box; display: flex; justify-content: center; align-items: center; gap: 8px; }

.local-btn { background: linear-gradient(135deg, #3498db, #2c3e50); color: white; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4); }
.local-btn:hover { background: linear-gradient(135deg, #4aa3df, #34495e); box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3); transform: translateY(-2px); }

.online-btn { background: rgba(0, 0, 0, 0.5); border: 2px solid #2ecc71; color: #2ecc71; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
.online-btn:hover { background: rgba(46, 204, 113, 0.2); border-color: #2ecc71; color: #fff; box-shadow: 0 0 20px rgba(46, 204, 113, 0.4); transform: translateY(-2px); }

.section-divider { display: flex; align-items: center; width: 100%; max-width: 320px; margin: 20px auto 10px auto; color: rgba(255, 255, 255, 0.3); }
.section-divider .line { flex: 1; height: 1px; background: rgba(255, 255, 255, 0.2); }
.section-divider .text { padding: 0 15px; font-size: 14px; font-weight: bold; letter-spacing: 2px; color: rgba(255, 255, 255, 0.5); }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 100; padding: 10px; }
.heavy-glass-card { background: rgba(30, 39, 46, 0.7); backdrop-filter: blur(25px); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 15px; }
.modal-content { width: 100%; max-width: 900px; max-height: 95vh; padding: 40px 15px 20px 15px; position: relative; overflow-y: auto; box-sizing: border-box; }
.close-modal-btn { position: absolute; top: 10px; right: 10px; background: rgba(255, 255, 255, 0.1); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer; z-index: 10; }
.modal-title { text-align: center; margin: 0 0 20px 0; color: #f1c40f; font-size: 20px;}
.rules-images-container { display: flex; flex-direction: column; gap: 15px; align-items: center; }
.rules-img { width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.4); border: 1px solid rgba(255, 255, 255, 0.05); }
.modal-tip { text-align: center; color: #a0aec0; font-size: 12px; margin-top: 20px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }


.video-btn-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  width: 100%;
}


.video-rules-btn {

  background: linear-gradient(135deg, rgba(233, 30, 99, 0.8), rgba(156, 39, 176, 0.8));
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  padding: 12px 28px;
  border-radius: 30px; 
  font-size: 15px;
  font-weight: bold;
  letter-spacing: 1px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  backdrop-filter: blur(5px);
}

.video-rules-btn .play-icon {
  font-size: 12px;
  transition: transform 0.3s ease;
}


.video-rules-btn:hover {
  transform: translateY(-3px) scale(1.02); 
  box-shadow: 0 8px 25px rgba(233, 30, 99, 0.6); 
  background: linear-gradient(135deg, rgba(233, 30, 99, 1), rgba(156, 39, 176, 1));
}

.video-rules-btn:hover .play-icon {
  transform: scale(1.2); 
}

.video-rules-btn:active {
  transform: translateY(1px); 
}
</style>