# ♔ Chess Encounter : Maître

<p align="center">
  <a href="README.md">🇺🇸 English</a> | 
  <a href="README_zh.md">🇨🇳 简体中文</a> | 
  <b>Français</b>
</p>

<p align="center">
  <img src="https://chess.ayacloud.fr/img/preview-fr.jpg?text=Chess+Encounter+Preview" alt="Chess Game Preview" width="800">
</p>

<p align="center">
  <b>
 【 <a href="https://chess.ayacloud.fr/">DEMO</a></b> 】
</p>

Caractéristiques
IA de haut niveau : Intégration de Stockfish 16 (Wasm), proposant des niveaux de difficulté allant de débutant à grand maître.

Multijoueur en temps réel : Système de matchmaking basé sur Socket.io ; supporte les parties rapides et les salons privés avec codes d'invitation.

Analyse d'après-match : Calcul automatique de l'ACPL (perte moyenne en centipions) via NNUE pour évaluer votre niveau de performance.

Design Moderne : Fonds vidéo dynamiques HTML5 et interface au style "Glassmorphism". Entièrement responsive.

Trilingue : Basculez instantanément entre le chinois, l'anglais et le français.

Stack Technique
Frontend : Vue 3 (Vite), Vue-i18n, Canvas

Backend : Node.js, Express, Socket.io

Moteur : Stockfish.wasm (NNUE activé), chess.js

🚀 Quick Start
1. Clone
git clone https://github.com/your-username/chess-encounter.git
cd chess-encounter

2. Backend
cd chess-server
npm install
node server.js

3. Frontend
cd chess-frontend
npm install
npm run dev

📄 License
MIT License. © 2026 AYA CLOUD SAS.