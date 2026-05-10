# ♔ Chess Encounter: Master

<p align="center">
  <b>English</b> | 
  <a href="README_zh.md">🇨🇳 简体中文</a> | 
  <a href="README_fr.md">🇫🇷 Français</a>
</p>

<p align="center">
  <img src="https://chess.ayacloud.fr/img/preview-en.jpg?text=Chess+Encounter+Preview" alt="Chess Game Preview" width="800">
</p>

<p align="center">
  <b>
 【 <a href="https://chess.ayacloud.fr/">DEMO</a></b> 】
</p>

Key Features
Pro-Level AI: Powered by Stockfish 16 (Wasm), offering difficulty levels from Beginner to Grandmaster.

Real-time Online Play: Matchmaking system built on Socket.io; supports random matchmaking and private rooms via invite codes.

Post-Game Analysis: Automated ACPL (Average Centipawn Loss) calculation using NNUE to evaluate your performance level.

Sleek UI/UX: HTML5 dynamic video backgrounds combined with a Glassmorphism interface. Fully responsive for mobile browsers.

Multilingual: Seamless switching between Chinese, English, and French.

Tech Stack
Frontend: Vue 3 (Vite), Vue-i18n, Canvas

Backend: Node.js, Express, Socket.io

Engine: Stockfish.wasm (NNUE enabled), chess.js

🚀 Quick Start
1. Clone
```bash
git clone https://github.com/your-username/chess-encounter.git
cd chess-encounter
```

2. Backend
```bash
cd chess-server
npm install
node server.js
```

3. Frontend
```bash
cd chess-frontend
npm install
npm run dev
```

📄 License
MIT License. © 2026 AYA CLOUD SAS.
