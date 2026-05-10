# ♔ 棋遇 · 大师进阶 (Chess Encounter)

<p align="center">
  <a href="README.md">🇺🇸 English</a> | 
  <b>简体中文</b> | 
  <a href="README_fr.md">🇫🇷 Français</a>
</p>

<p align="center">
  <img src="https://chess.ayacloud.fr/img/preview-zh.jpg?text=Chess+Encounter+Preview" alt="Chess Game Preview" width="800">
</p>

<p align="center">
  <b>
 【 <a href="https://chess.ayacloud.fr/">DEMO</a></b> 】
</p>

核心功能
专业 AI 对弈：集成 Stockfish 16 (Wasm 版)，支持从初学者到大师级的多种难度。

实时多人联机：基于 Socket.io 的匹配系统，支持全球随机匹配和私人房间（验证码）对战。

深度赛后复盘：利用 NNUE 技术自动计算每一步的 ACPL（平均厘兵损失），并评定玩家表现等级。

现代视觉设计：HTML5 动态视频背景 + 玻璃拟态 (Glassmorphism) 交互界面，适配所有移动端浏览器。

多语言支持：内置中、英、法三语无缝切换。

技术栈
前端：Vue 3 (Vite), Vue-i18n, Canvas

后端：Node.js, Express, Socket.io

引擎：Stockfish.wasm (NNUE enabled), chess.js

🚀 快速启动
1. 克隆仓库
git clone https://github.com/your-username/chess-encounter.git
cd chess-encounter

2. 后端配置2
cd chess-server
npm install
node server.js

1. 前端开发
cd chess-frontend
npm install
npm run dev

📄 开源协议
MIT License. © 2026 AYA CLOUD SAS.
