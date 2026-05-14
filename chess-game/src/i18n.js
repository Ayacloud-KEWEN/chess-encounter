import { createI18n } from 'vue-i18n';

const messages = {
  en: {
    menu: {
      rules: "Rules", title: "♔ Chess · Master Ascent", subtitle: "Step by step to become a grandmaster",
      choose_diff: "Select Difficulty", play_local: "Play Local", play_online: "Play Online",
      tip: "Tip: Click background or top-right button to close",
      watch_video: "Watch Video Tutorial",
    },
    diff: {
      beginner: "Beginner", beginner_desc: "Opponent makes mistakes, perfect for learning.",
      expert: "Expert", expert_desc: "Solid tactical vision, for advanced players.",
      master: "Master", master_desc: "Flawless calculation, professional pressure."
    },
    lobby: {
      title: "Online Network", subtitle: "Compete with players worldwide",
      connecting: "🔴 Connecting to server...", online: "🟢 Online: {users} | Active Matches: {rooms}",
      match_success: "Match Found!", assigned: "You are playing as:",
      white: "♔ White (First)", black: "♚ Black (Second)", generating: "Generating board... {time}s",
      scanning: "Scanning for opponents...", waited: "Time waited: {time}s",
      cancel: "✕ Cancel", ready: "System ready. Network connection is stable.",
      start: " Random Match", disconnected: "Disconnected, please wait...", back: "Back to Menu",
      create_private: " Create Private Room", join_private: " Join Private Room",
      room_code: "Room Code", waiting_friend: "Waiting for friend to enter code...",
      enter_code: "Enter 5-digit code", join_btn: "Join Game",
      err_not_found: "❌ Room not found or expired", err_self: "❌ You cannot join your own room"
    },
    game: {
      vs: "Versus", online: "Online Match", room: "Room:",
      your_turn_white: "Your turn (White)", your_turn: "🎯 Your turn",
      ai_thinking: "Opponent is thinking...", waiting: "🌐 Waiting for opponent...",
      check: "  ⚠️ Check!", analyzing: "📊 Performing deep analysis...",
      analyzing_progress: "AI deep analysis in progress ({current}/{total})...",
      report: "📊 Performance Report", acpl: "ACPL", rating: "Rating",
      surrender: "🏳️ Surrender", surrender_back: "🏳️ Surrender & Leave",
      surrender_title: "🏳️ Confirm Surrender", surrender_text: "Are you sure you want to abandon this match?",
      think_again: "Think Again", confirm_surrender: "Confirm",
      game_over: "Game Over", btn_analysis: "🔍 Analysis", btn_menu: "Main Menu", btn_reset: "Reset Game",
      hint_thinking: "Thinking...", hint: "Hint",
      win: "🎉 Victory! Checkmate", lose: "😭 Defeat! You were checkmated", draw: "🤝 Draw!",
      opp_surrender: "🎉 Opponent surrendered. You win!", timeout: "Lost on time"
    },
    level: {
      grandmaster: "🏆 Grandmaster", expert: "🥇 Expert", advanced: "🥈 Advanced", beginner: "🥉 Beginner"
    }
  },
  zh: {
    menu: {
      rules: "规则说明", title: "♔ 棋遇 · 大师进阶", subtitle: "一步一步成为国际象棋大师",
      choose_diff: "选择对弈等级", play_local: "开始对弈", play_online: "联机对战",
      tip: "提示：点击背景或右上角按钮返回",
      watch_video: "观看视频教程",
    },
    diff: {
      beginner: "初学者", beginner_desc: "对手会经常犯错，适合新手练手。",
      expert: "专家级", expert_desc: "具备战术视野，适合进阶玩家。",
      master: "大师级", master_desc: "算无遗策，带给你职业级的压力。"
    },
      lobby: {
      title: "联机网络", subtitle: "与世界各地的棋手切磋技艺",
      connecting: "🔴 服务器连接中...", online: "🟢 在线玩家: {users} 人 | 正在激战: {rooms} 局",
      match_success: "匹配成功！", assigned: "你被分配为:",
      white: "♔ 白方 (先手)", black: "♚ 黑方 (后手)", generating: "正在生成棋盘... {time}s",
      scanning: "正在扫描全网玩家...", waited: "已等待: {time} 秒",
      cancel: "✕ 取消匹配", ready: "系统准备就绪，当前网络状态良好。",
      start: " 随机匹配", disconnected: "断开连接，请稍候...", back: "返回主菜单",
      create_private: " 创建私人房间", join_private: " 加入私人房间",
      room_code: "房间邀请码", waiting_friend: "等待好友输入邀请码...",
      enter_code: "请输入5位邀请码", join_btn: "加入对局",
      err_not_found: "❌ 房间不存在或已过期", err_self: "❌ 你不能加入自己的房间"
    },
    game: {
      vs: "对决", online: "联机对战", room: "房间",
      your_turn_white: "轮到你了 (执白)", your_turn: "🎯 轮到你了",
      ai_thinking: "对手推演中...", waiting: "🌐 等待对手...",
      check: "  ⚠️ 被将军！", analyzing: "📊 正在进行深度复盘...",
      analyzing_progress: "AI 正在深度复盘 ({current}/{total})...",
      report: "📊 战力评估", acpl: "ACPL", rating: "评级",
      surrender: "🏳️ 认输", surrender_back: "🏳️ 认输并返回大厅",
      surrender_title: "🏳️ 确认认输", surrender_text: "要放弃这场对局吗？",
      think_again: "再想想", confirm_surrender: "确认认输",
      game_over: "对局结束", btn_analysis: "🔍 复盘分析", btn_menu: "返回大厅", btn_reset: "重置棋局",
      hint_thinking: "思考中...", hint: "提示",
      win: "🎉 恭喜！将死对手", lose: "😭 战败！被对手将死", draw: "🤝 平局！",
      opp_surrender: "🎉 对手已投降，你赢了！", timeout: "超时判负"
    },
    level: {
      grandmaster: "🏆 特级大师", expert: "🥇 业余高手", advanced: "🥈 进阶棋手", beginner: "🥉 初学者"
    }
  },
  fr: {
    menu: {
      rules: "Règles", title: "♔ Échecs · Ascension", subtitle: "Devenez un grand maître pas à pas",
      choose_diff: "Choisir la difficulté", play_local: "Jouer en Local", play_online: "Jouer en Ligne",
      tip: "Astuce : Cliquez sur le fond pour fermer",
      watch_video: "Regarder le tutoriel vidéo",
    },
    diff: {
      beginner: "Débutant", beginner_desc: "L'adversaire fait des erreurs, idéal pour apprendre.",
      expert: "Expert", expert_desc: "Bonne vision tactique, pour joueurs avancés.",
      master: "Maître", master_desc: "Calculs parfaits, pression professionnelle."
    },
    lobby: {
      title: "Réseau en Ligne", subtitle: "Affrontez des joueurs du monde entier",
      connecting: "🔴 Connexion au serveur...", online: "🟢 En ligne : {users} | Matchs en cours : {rooms}",
      match_success: "Match Trouvé !", assigned: "Vous jouez en tant que :",
      white: "♔ Blanc (Premier)", black: "♚ Noir (Second)", generating: "Création de l'échiquier... {time}s",
      scanning: "Recherche d'un adversaire...", waited: "Temps d'attente : {time}s",
      cancel: "✕ Annuler", ready: "Système prêt. Connexion stable.",
      start: " Match Aléatoire", disconnected: "Déconnecté, veuillez patienter...", back: "Retour au Menu",
      create_private: " Créer un salon privé", join_private: " Rejoindre un salon privé",
      room_code: "Code du salon", waiting_friend: "En attente du code de l'ami...",
      enter_code: "Entrez le code à 5 chiffres", join_btn: "Rejoindre la partie",
      err_not_found: "❌ Salon introuvable ou expiré", err_self: "❌ Impossible de rejoindre son propre salon"
    },
    game: {
      vs: "Contre", online: "Match en ligne", room: "Salle :",
      your_turn_white: "À vous (Blanc)", your_turn: "🎯 À vous de jouer",
      ai_thinking: "L'adversaire réfléchit...", waiting: "🌐 En attente de l'adversaire...",
      check: "  ⚠️ Échec !", analyzing: "📊 Analyse approfondie en cours...",
      analyzing_progress: "Analyse de l'IA en cours ({current}/{total})...",
      report: "📊 Bilan de Performance", acpl: "ACPL", rating: "Niveau",
      surrender: "🏳️ Abandonner", surrender_back: "🏳️ Abandonner et Quitter",
      surrender_title: "🏳️ Confirmer l'abandon", surrender_text: "Voulez-vous vraiment abandonner cette partie ?",
      think_again: "Annuler", confirm_surrender: "Confirmer",
      game_over: "Partie Terminée", btn_analysis: "🔍 Analyser", btn_menu: "Menu Principal", btn_reset: "Rejouer",
      hint_thinking: "Calcul...", hint: "Indice",
      win: "🎉 Victoire ! Échec et mat", lose: "😭 Défaite ! Vous êtes mat", draw: "🤝 Match Nul !",
      opp_surrender: "🎉 L'adversaire a abandonné. Vous gagnez !", timeout: "Perdu au temps"
    },
    level: {
      grandmaster: "🏆 Grand Maître", expert: "🥇 Expert", advanced: "🥈 Avancé", beginner: "🥉 Débutant"
    }
  }
};

const getBrowserLanguage = () => {
  const lang = navigator.language || navigator.userLanguage;
  const shortLang = lang.toLowerCase().split('-')[0];
  if (['zh', 'en', 'fr'].includes(shortLang)) return shortLang;
  return 'zh'; 
};

const i18n = createI18n({
  legacy: false, 
  locale: getBrowserLanguage(), 
  fallbackLocale: 'en',
  messages,
});

export default i18n;