<template>
  <div class="game-header">
    <div class="header-main-title">
      <h2 class="game-title">
        <span class="title-icon">{{ icon }}</span> {{ title }}
      </h2>
      <div class="header-status-sub">
        <slot name="status"></slot>
      </div>
    </div>
    
    <div class="header-right-zone">
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  icon: { type: String, default: '♔' }
});
</script>

<style scoped>
.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 15px;
  padding: 0 10px;
  box-sizing: border-box;
}

.header-main-title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
}

.game-title {
  color: #d5c09a;
  margin: 0;
  font-size: clamp(18px, 5vw, 24px);
  font-weight: 600;
  font-family: "Georgia", serif;
  letter-spacing: 2px;
  text-shadow: 1px 2px 4px rgba(0, 0, 0, 0.6);
}

.title-icon { margin-right: 5px; }

.header-status-sub {
  margin-top: 4px;
  height: 18px;
  display: flex;
  align-items: center;
  font-size: 13px;
}

.header-right-zone {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>