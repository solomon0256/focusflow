
import { LanguageCode } from '../types';

// Map of language codes to display names
export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  zh: '简体中文',
  'zh-TW': '繁體中文',
  fr: 'Français',
  ja: '日本語',
  ko: '한국어',
  es: 'Español',
  ru: 'Русский',
  ar: 'العربية',
  de: 'Deutsch',
  hi: 'हिन्दी',
};

// Define English translations as the base
const en = {
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    back: 'Back',
    save: 'Save',
    delete: 'Delete',
    loading: 'Loading...',
  },
  nav: {
    timer: 'Timer',
    tasks: 'Tasks',
    stats: 'Stats',
    settings: 'Settings',
  },
  timer: {
    ready: 'Ready to Flow',
    estCycle: 'Est. Cycle',
    focusTime: 'Focus',
    break: 'Break',
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    stopwatchActive: 'Stopwatch active',
    noTasks: 'No tasks active',
    addOne: 'Add one in tasks',
    selectTask: 'Select Task',
    startLabel: 'Start',
    duration: 'Duration',
    pomos: 'Pomos',
    mode_pomodoro: 'Pomodoro',
    mode_stopwatch: 'Stopwatch',
    mode_custom: 'Custom',
  },
  tasks: {
    title: 'Tasks',
    today: 'Today',
    tomorrow: 'Tomorrow',
    empty: 'No tasks for this day',
    createFirst: 'Create your first task',
    editTask: 'Edit Task',
    newTask: 'New Task',
    whatToDo: 'What do you want to focus on?',
    date: 'Date',
    time: 'Time',
    priority: 'Priority',
    delete: 'Delete Task',
    save: 'Save Changes',
    create: 'Create Task',
  },
  stats: {
    title: 'Statistics',
    mood_sleeping: 'Sleeping',
    mood_flow: 'Deep Flow',
    mood_focused: 'Focused',
    mood_low: 'Low Energy',
    mood_distracted: 'Distracted',
    academicRanks: ['Novice', 'Apprentice', 'Scholar', 'Master', 'Grandmaster'],
    streakDetail: 'Day {n}, +{e} EXP',
    companion: 'Companion',
    petName: 'Focus Fox',
    streakTitle: 'Streak',
    todaysVibe: "Today's Vibe",
    avgScore: 'Avg Score',
    weeklyActivity: 'Weekly Activity',
    last7Days: 'Last 7 Days',
  },
  settings: {
    title: 'Settings',
    cloudSync: 'Cloud Sync',
    proDesc: 'Sync across devices & backup data',
    enableCloud: 'Enable Cloud Sync',
    signOut: 'Sign Out',
    timerConfig: 'Timer Configuration',
    reset: 'Reset',
    focusDuration: 'Focus Duration',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
    intervals: 'Intervals',
    appearance: 'Appearance',
    theme: 'Theme',
    theme_system: 'System',
    theme_light: 'Light',
    theme_dark: 'Dark',
    performance: 'Performance',
    powerSaver: 'Power Saver',
    powerSaverDesc: 'Reduces AI detection rate to save battery.',
    language: 'Language',
    support: 'Support',
    privacy: 'Privacy',
    notifications: 'Notifications',
    addNotification: 'Add Notification',
    notifyAt: 'Notify At',
    proTitle: 'Upgrade to Pro',
    viewOffer: 'View Offer',
    proMember: 'Pro Member',
    thanks: 'Thanks for your support!',
  },
  premium: {
    monthly_name: 'Monthly',
    monthly_desc: 'Billed monthly. Cancel anytime.',
    yearly_name: 'Yearly',
    yearly_desc: '12 months at $1.66/mo.',
    yearly_tag: 'SAVE 45%',
    lifetime_name: 'Lifetime',
    lifetime_desc: 'One-time payment. Own it forever.',
    lifetime_tag: 'BEST VALUE',
    feat_sync: 'Sync across iPhone, iPad & Android',
    feat_history: 'Unlimited Focus History & Statistics',
    feat_skins: "Exclusive 'Focus Fox' Pet Skins",
    feat_noise: 'Advanced White Noise Library',
    feat_support: 'Support Indie Development ❤️',
    proTitle: 'Unlock FocusFlow Pro',
    choosePlan: 'Choose a Plan',
    subscribe: 'Subscribe',
    recurring: 'Recurring billing, cancel anytime.',
    restore: 'Restore Purchases',
  },
  footer: {
    version: 'FocusFlow v1.5.0',
    architecture: 'Local-First Architecture',
  },
  session: {
    recharge: 'Recharge',
    rest: 'Rest',
    breathe: 'Take a deep breath.',
    skipBreak: 'Skip Break',
    complete: 'Session Complete',
    focusedFor: 'Focused for',
    taskCompleted: 'Task Completed!',
    markAsDone: 'Mark as done?',
    earlyStop: 'Session stopped early.',
    avgFocus: 'Avg Focus',
    posture: 'Posture',
    timeline: 'Timeline',
    backHome: 'Back Home',
    focusGuard: 'Focus Guard',
    proPosture: 'Pro Posture',
    fullBodyAi: 'Full Body AI',
    tooClose: 'Too Close',
    paused: 'PAUSED',
    focusTime: 'Focus Time',
    cycleLog: 'Cycle Log',
  },
  sound: {
    title: 'Soundscapes',
    smartVolume: 'Smart Volume',
    smartVolumeDesc: 'Lowers volume when distracted.',
    timerOnly: 'Timer Only',
    alwaysOn: 'Always On',
    frequency: 'Frequency',
    ambience: 'Ambience',
    custom: 'Custom',
    off: 'Off',
    upload: 'Upload',
  }
};

// Simplified Chinese
const zh: typeof en = {
    ...en,
    common: { ...en.common, confirm: '确认', cancel: '取消', back: '返回', save: '保存', delete: '删除', loading: '加载中...' },
    nav: { timer: '专注', tasks: '任务', stats: '统计', settings: '设置' },
    timer: { 
        ...en.timer, 
        ready: '准备专注', estCycle: '预计完成', focusTime: '专注', break: '休息', start: '开始', pause: '暂停', resume: '继续',
        stopwatchActive: '正计时模式', noTasks: '暂无任务', addOne: '去添加任务', selectTask: '选择任务',
        startLabel: '开始时间', duration: '时长', pomos: '番茄数', mode_pomodoro: '番茄钟', mode_stopwatch: '正计时', mode_custom: '自定义'
    },
    tasks: {
        ...en.tasks,
        title: '任务清单', today: '今天', tomorrow: '明天', empty: '今天暂无任务', createFirst: '创建第一个任务',
        editTask: '编辑任务', newTask: '新建任务', whatToDo: '你想专注做什么？', date: '日期', time: '时间',
        priority: '优先级', delete: '删除任务', save: '保存修改', create: '创建任务'
    },
    stats: {
        ...en.stats,
        title: '数据统计', mood_sleeping: '未开始', mood_flow: '心流状态', mood_focused: '专注', mood_low: '状态低迷', mood_distracted: '分心',
        academicRanks: ['新手', '学徒', '学者', '大师', '宗师'], streakDetail: '坚持 {n} 天, +{e} 经验', companion: '专注伴侣',
        petName: 'Focus Fox', streakTitle: '连胜', todaysVibe: '今日状态', avgScore: '平均分', weeklyActivity: '本周活动', last7Days: '近7天'
    },
    settings: {
        ...en.settings,
        title: '设置', cloudSync: '云同步', proDesc: '多设备同步 & 数据备份', enableCloud: '开启云同步', signOut: '退出登录',
        timerConfig: '计时器设置', reset: '重置', focusDuration: '专注时长', shortBreak: '短休息', longBreak: '长休息', intervals: '长休息间隔',
        appearance: '外观', theme: '主题', theme_system: '跟随系统', theme_light: '浅色', theme_dark: '深色',
        performance: '性能', powerSaver: '省电模式', powerSaverDesc: '降低 AI 检测频率以节省电量', language: '语言',
        support: '支持', privacy: '隐私政策', notifications: '通知提醒', addNotification: '添加提醒', notifyAt: '提醒时间点',
        proTitle: '升级 Pro 版', viewOffer: '查看详情', proMember: 'Pro 会员', thanks: '感谢您的支持！'
    },
    session: {
        ...en.session,
        recharge: '能量补给', rest: '休息一下', breathe: '深呼吸，放松身心', skipBreak: '跳过休息', complete: '专注完成',
        focusedFor: '本次专注', taskCompleted: '任务已完成！', markAsDone: '标记为完成？', earlyStop: '提前结束',
        avgFocus: '平均专注度', posture: '坐姿', timeline: '专注曲线', backHome: '返回首页',
        focusGuard: '专注卫士', proPosture: '姿态矫正', fullBodyAi: '全身 AI', tooClose: '距离过近', paused: '已暂停',
        focusTime: '专注时长', cycleLog: '周期记录'
    },
    sound: {
        ...en.sound,
        title: '白噪音', smartVolume: '智能音量', smartVolumeDesc: '分心时自动降低音量', timerOnly: '仅计时', alwaysOn: '始终开启',
        frequency: '频率', ambience: '氛围', custom: '自定义', off: '关闭', upload: '上传'
    }
};

// Traditional Chinese (zh-TW)
const zhTW: typeof en = {
    ...en,
    common: { ...en.common, confirm: '確認', cancel: '取消', back: '返回', save: '保存', delete: '刪除', loading: '加載中...' },
    nav: { timer: '專注', tasks: '任務', stats: '統計', settings: '設置' },
    timer: {
        ...en.timer,
        ready: '準備專注', estCycle: '預計完成', focusTime: '專注', break: '休息', start: '開始', pause: '暫停', resume: '繼續',
        stopwatchActive: '正計時模式', noTasks: '暫無任務', addOne: '去添加任務', selectTask: '選擇任務',
        startLabel: '開始時間', duration: '時長', pomos: '番茄數', mode_pomodoro: '番茄鐘', mode_stopwatch: '正計時', mode_custom: '自定義'
    },
    tasks: {
        ...en.tasks,
        title: '任務清單', today: '今天', tomorrow: '明天', empty: '今天暫無任務', createFirst: '創建第一個任務',
        editTask: '編輯任務', newTask: '新建任務', whatToDo: '你想專注做什麼？', date: '日期', time: '時間',
        priority: '優先級', delete: '刪除任務', save: '保存修改', create: '創建任務'
    },
    stats: {
        ...en.stats,
        title: '數據統計', mood_sleeping: '未開始', mood_flow: '心流狀態', mood_focused: '專注', mood_low: '狀態低迷', mood_distracted: '分心',
        academicRanks: ['新手', '學徒', '學者', '大師', '宗師'], streakDetail: '堅持 {n} 天, +{e} 經驗', companion: '專注伴侶',
        petName: 'Focus Fox', streakTitle: '連勝', todaysVibe: '今日狀態', avgScore: '平均分', weeklyActivity: '本週活動', last7Days: '近7天'
    },
    settings: {
        ...en.settings,
        title: '設置', cloudSync: '雲同步', proDesc: '多設備同步 & 數據備份', enableCloud: '開啓雲同步', signOut: '退出登錄',
        timerConfig: '計時器設置', reset: '重置', focusDuration: '專注時長', shortBreak: '短休息', longBreak: '長休息', intervals: '長休息間隔',
        appearance: '外觀', theme: '主題', theme_system: '跟隨系統', theme_light: '淺色', theme_dark: '深色',
        performance: '性能', powerSaver: '省電模式', powerSaverDesc: '降低 AI 檢測頻率以節省電量', language: '語言',
        support: '支持', privacy: '隱私政策', notifications: '通知提醒', addNotification: '添加提醒', notifyAt: '提醒時間點',
        proTitle: '升級 Pro 版', viewOffer: '查看詳情', proMember: 'Pro 會員', thanks: '感謝您的支持！'
    },
    session: {
        ...en.session,
        recharge: '能量補給', rest: '休息一下', breathe: '深呼吸，放鬆身心', skipBreak: '跳過休息', complete: '專注完成',
        focusedFor: '本次專注', taskCompleted: '任務已完成！', markAsDone: '標記為完成？', earlyStop: '提前結束',
        avgFocus: '平均專注度', posture: '坐姿', timeline: '專注曲線', backHome: '返回首頁',
        focusGuard: '專注衛士', proPosture: '姿態矯正', fullBodyAi: '全身 AI', tooClose: '距離過近', paused: '已暫停',
        focusTime: '專注時長', cycleLog: '週期記錄'
    },
    sound: {
        ...en.sound,
        title: '白噪音', smartVolume: '智能音量', smartVolumeDesc: '分心時自動降低音量', timerOnly: '僅計時', alwaysOn: '始終開啓',
        frequency: '頻率', ambience: '氛圍', custom: '自定義', off: '關閉', upload: '上傳'
    }
};

// French (fr)
const fr: typeof en = {
    ...en,
    common: { ...en.common, confirm: 'Confirmer', cancel: 'Annuler', back: 'Retour', save: 'Enregistrer', delete: 'Supprimer', loading: 'Chargement...' },
    nav: { timer: 'Minuteur', tasks: 'Tâches', stats: 'Stats', settings: 'Paramètres' },
    timer: {
        ...en.timer,
        ready: 'Prêt à Flux', estCycle: 'Cycle Est.', focusTime: 'Concentration', break: 'Pause', start: 'Démarrer', pause: 'Pause', resume: 'Reprendre',
        stopwatchActive: 'Chronomètre actif', noTasks: 'Aucune tâche active', addOne: 'Ajouter une tâche', selectTask: 'Choisir une tâche',
        startLabel: 'Début', duration: 'Durée', pomos: 'Pomos', mode_pomodoro: 'Pomodoro', mode_stopwatch: 'Chronomètre', mode_custom: 'Personnalisé'
    },
    tasks: {
        ...en.tasks,
        title: 'Tâches', today: "Aujourd'hui", tomorrow: 'Demain', empty: 'Aucune tâche pour ce jour', createFirst: 'Créer votre première tâche',
        editTask: 'Modifier la tâche', newTask: 'Nouvelle tâche', whatToDo: 'Sur quoi voulez-vous vous concentrer ?', date: 'Date', time: 'Heure',
        priority: 'Priorité', delete: 'Supprimer la tâche', save: 'Enregistrer', create: 'Créer la tâche'
    },
    stats: {
        ...en.stats,
        title: 'Statistiques', mood_sleeping: 'Dormant', mood_flow: 'Flux Profond', mood_focused: 'Concentré', mood_low: 'Faible Énergie', mood_distracted: 'Distrait',
        academicRanks: ['Novice', 'Apprenti', 'Érudit', 'Maître', 'Grand Maître'], streakDetail: 'Jour {n}, +{e} EXP', companion: 'Compagnon',
        streakTitle: 'Série', todaysVibe: 'Ambiance du jour', avgScore: 'Score Moyen', weeklyActivity: 'Activité Hebdomadaire', last7Days: '7 derniers jours'
    },
    settings: {
        ...en.settings,
        title: 'Paramètres', cloudSync: 'Synchro Cloud', proDesc: 'Sync entre appareils & sauvegarde', enableCloud: 'Activer Cloud Sync', signOut: 'Déconnexion',
        timerConfig: 'Config Minuteur', reset: 'Réinitialiser', focusDuration: 'Durée Concentration', shortBreak: 'Courte Pause', longBreak: 'Longue Pause', intervals: 'Intervalles',
        appearance: 'Apparence', theme: 'Thème', theme_system: 'Système', theme_light: 'Clair', theme_dark: 'Sombre',
        performance: 'Performance', powerSaver: 'Économie d\'énergie', powerSaverDesc: 'Réduit la détection AI pour économiser la batterie.', language: 'Langue',
        support: 'Support', privacy: 'Confidentialité', notifications: 'Notifications', addNotification: 'Ajouter Notification', notifyAt: 'Notifier à',
        proTitle: 'Passer à Pro', viewOffer: 'Voir l\'offre', proMember: 'Membre Pro', thanks: 'Merci de votre soutien !'
    },
    session: {
        ...en.session,
        recharge: 'Recharger', rest: 'Repos', breathe: 'Prenez une grande respiration.', skipBreak: 'Passer la pause', complete: 'Session Terminée',
        focusedFor: 'Concentré pendant', taskCompleted: 'Tâche Terminée !', markAsDone: 'Marquer comme fait ?', earlyStop: 'Arrêt anticipé.',
        avgFocus: 'Focus Moyen', posture: 'Posture', timeline: 'Chronologie', backHome: 'Retour Accueil',
        focusGuard: 'Garde Focus', proPosture: 'Posture Pro', fullBodyAi: 'IA Corps Entier', tooClose: 'Trop Près', paused: 'EN PAUSE',
        focusTime: 'Temps Focus', cycleLog: 'Journal Cycle'
    },
    sound: {
        ...en.sound,
        title: 'Paysages Sonores', smartVolume: 'Volume Intelligent', smartVolumeDesc: 'Baisse le volume quand distrait.', timerOnly: 'Minuteur Seul', alwaysOn: 'Toujours Actif',
        frequency: 'Fréquence', ambience: 'Ambiance', custom: 'Perso', off: 'Désactivé', upload: 'Téléverser'
    }
};

// Japanese (ja)
const ja: typeof en = {
    ...en,
    common: { ...en.common, confirm: '確認', cancel: 'キャンセル', back: '戻る', save: '保存', delete: '削除', loading: '読み込み中...' },
    nav: { timer: 'タイマー', tasks: 'タスク', stats: '統計', settings: '設定' },
    timer: {
        ...en.timer,
        ready: '準備完了', estCycle: '予想サイクル', focusTime: '集中', break: '休憩', start: '開始', pause: '一時停止', resume: '再開',
        stopwatchActive: 'ストップウォッチ起動中', noTasks: 'タスクなし', addOne: 'タスクを追加', selectTask: 'タスクを選択',
        startLabel: '開始', duration: '期間', pomos: 'ポモ', mode_pomodoro: 'ポモドーロ', mode_stopwatch: 'ストップウォッチ', mode_custom: 'カスタム'
    },
    tasks: {
        ...en.tasks,
        title: 'タスク', today: '今日', tomorrow: '明日', empty: '今日のタスクはありません', createFirst: '最初のタスクを作成',
        editTask: 'タスクを編集', newTask: '新規タスク', whatToDo: '何に集中しますか？', date: '日付', time: '時間',
        priority: '優先度', delete: 'タスクを削除', save: '変更を保存', create: 'タスクを作成'
    },
    stats: {
        ...en.stats,
        title: '統計', mood_sleeping: '睡眠中', mood_flow: 'ディープフロー', mood_focused: '集中', mood_low: '低エネルギー', mood_distracted: '散漫',
        academicRanks: ['初心者', '見習い', '学者', '達人', 'グランドマスター'], streakDetail: '{n}日目, +{e} EXP', companion: 'コンパニオン',
        streakTitle: 'ストリーク', todaysVibe: '今日の気分', avgScore: '平均スコア', weeklyActivity: '週間アクティビティ', last7Days: '過去7日間'
    },
    settings: {
        ...en.settings,
        title: '設定', cloudSync: 'クラウド同期', proDesc: 'デバイス間同期とバックアップ', enableCloud: 'クラウド同期を有効化', signOut: 'サインアウト',
        timerConfig: 'タイマー設定', reset: 'リセット', focusDuration: '集中時間', shortBreak: '短い休憩', longBreak: '長い休憩', intervals: 'インターバル',
        appearance: '外観', theme: 'テーマ', theme_system: 'システム', theme_light: 'ライト', theme_dark: 'ダーク',
        performance: 'パフォーマンス', powerSaver: '省電力モード', powerSaverDesc: 'AI検出頻度を下げてバッテリーを節約します。', language: '言語',
        support: 'サポート', privacy: 'プライバシー', notifications: '通知', addNotification: '通知を追加', notifyAt: '通知時間',
        proTitle: 'Proにアップグレード', viewOffer: '詳細を見る', proMember: 'Proメンバー', thanks: 'ご支援ありがとうございます！'
    },
    session: {
        ...en.session,
        recharge: 'リチャージ', rest: '休憩', breathe: '深呼吸してください。', skipBreak: '休憩をスキップ', complete: 'セッション完了',
        focusedFor: '集中時間', taskCompleted: 'タスク完了！', markAsDone: '完了にしますか？', earlyStop: '早期終了。',
        avgFocus: '平均集中度', posture: '姿勢', timeline: 'タイムライン', backHome: 'ホームへ戻る',
        focusGuard: '集中ガード', proPosture: 'Pro姿勢', fullBodyAi: '全身AI', tooClose: '近すぎます', paused: '一時停止中',
        focusTime: '集中時間', cycleLog: 'サイクルログ'
    },
    sound: {
        ...en.sound,
        title: 'サウンドスケープ', smartVolume: 'スマート音量', smartVolumeDesc: '散漫時に音量を下げます。', timerOnly: 'タイマーのみ', alwaysOn: '常時オン',
        frequency: '周波数', ambience: '環境音', custom: 'カスタム', off: 'オフ', upload: 'アップロード'
    }
};

// Korean (ko)
const ko: typeof en = {
    ...en,
    common: { ...en.common, confirm: '확인', cancel: '취소', back: '뒤로', save: '저장', delete: '삭제', loading: '로딩 중...' },
    nav: { timer: '타이머', tasks: '할 일', stats: '통계', settings: '설정' },
    timer: {
        ...en.timer,
        ready: '준비 완료', estCycle: '예상 사이클', focusTime: '집중', break: '휴식', start: '시작', pause: '일시정지', resume: '계속',
        stopwatchActive: '스톱워치 실행 중', noTasks: '할 일 없음', addOne: '할 일 추가', selectTask: '할 일 선택',
        startLabel: '시작', duration: '시간', pomos: '포모', mode_pomodoro: '포모도로', mode_stopwatch: '스톱워치', mode_custom: '사용자 지정'
    },
    tasks: {
        ...en.tasks,
        title: '할 일 목록', today: '오늘', tomorrow: '내일', empty: '오늘의 할 일이 없습니다', createFirst: '첫 번째 할 일 생성',
        editTask: '할 일 편집', newTask: '새 할 일', whatToDo: '무엇에 집중하시겠습니까?', date: '날짜', time: '시간',
        priority: '우선순위', delete: '할 일 삭제', save: '변경사항 저장', create: '할 일 생성'
    },
    stats: {
        ...en.stats,
        title: '통계', mood_sleeping: '수면 중', mood_flow: '몰입 상태', mood_focused: '집중', mood_low: '저에너지', mood_distracted: '산만함',
        academicRanks: ['초보자', '수습생', '학자', '마스터', '그랜드마스터'], streakDetail: '{n}일째, +{e} EXP', companion: '동반자',
        streakTitle: '연속', todaysVibe: '오늘의 기분', avgScore: '평균 점수', weeklyActivity: '주간 활동', last7Days: '최근 7일'
    },
    settings: {
        ...en.settings,
        title: '설정', cloudSync: '클라우드 동기화', proDesc: '기기 간 동기화 및 백업', enableCloud: '클라우드 동기화 켜기', signOut: '로그아웃',
        timerConfig: '타이머 설정', reset: '초기화', focusDuration: '집중 시간', shortBreak: '짧은 휴식', longBreak: '긴 휴식', intervals: '긴 휴식 간격',
        appearance: '화면', theme: '테마', theme_system: '시스템', theme_light: '라이트', theme_dark: '다크',
        performance: '성능', powerSaver: '절전 모드', powerSaverDesc: '배터리 절약을 위해 AI 감지 빈도를 줄입니다.', language: '언어',
        support: '지원', privacy: '개인정보처리방침', notifications: '알림', addNotification: '알림 추가', notifyAt: '알림 시간',
        proTitle: 'Pro로 업그레이드', viewOffer: '혜택 보기', proMember: 'Pro 회원', thanks: '지원해 주셔서 감사합니다!'
    },
    session: {
        ...en.session,
        recharge: '충전', rest: '휴식', breathe: '깊게 숨을 들이마시세요.', skipBreak: '휴식 건너뛰기', complete: '세션 완료',
        focusedFor: '집중 시간', taskCompleted: '할 일 완료!', markAsDone: '완료로 표시할까요?', earlyStop: '세션이 일찍 종료됨.',
        avgFocus: '평균 집중도', posture: '자세', timeline: '타임라인', backHome: '홈으로',
        focusGuard: '집중 가드', proPosture: 'Pro 자세', fullBodyAi: '전신 AI', tooClose: '너무 가까움', paused: '일시정지됨',
        focusTime: '집중 시간', cycleLog: '사이클 로그'
    },
    sound: {
        ...en.sound,
        title: '사운드스케이프', smartVolume: '스마트 볼륨', smartVolumeDesc: '산만할 때 볼륨을 낮춥니다.', timerOnly: '타이머 전용', alwaysOn: '항상 켜짐',
        frequency: '주파수', ambience: '분위기', custom: '사용자 지정', off: '끄기', upload: '업로드'
    }
};

// Spanish (es)
const es: typeof en = {
    ...en,
    common: { ...en.common, confirm: 'Confirmar', cancel: 'Cancelar', back: 'Atrás', save: 'Guardar', delete: 'Eliminar', loading: 'Cargando...' },
    nav: { timer: 'Temp.', tasks: 'Tareas', stats: 'Estad.', settings: 'Ajustes' },
    timer: {
        ...en.timer,
        ready: 'Listo para fluir', estCycle: 'Ciclo est.', focusTime: 'Foco', break: 'Descanso', start: 'Iniciar', pause: 'Pausa', resume: 'Reanudar',
        stopwatchActive: 'Cronómetro activo', noTasks: 'Sin tareas', addOne: 'Añadir tarea', selectTask: 'Seleccionar tarea',
        startLabel: 'Inicio', duration: 'Duración', pomos: 'Pomos', mode_pomodoro: 'Pomodoro', mode_stopwatch: 'Cronómetro', mode_custom: 'Personalizado'
    },
    tasks: {
        ...en.tasks,
        title: 'Tareas', today: 'Hoy', tomorrow: 'Mañana', empty: 'No hay tareas para hoy', createFirst: 'Crea tu primera tarea',
        editTask: 'Editar tarea', newTask: 'Nueva tarea', whatToDo: '¿En qué quieres enfocarte?', date: 'Fecha', time: 'Hora',
        priority: 'Prioridad', delete: 'Eliminar tarea', save: 'Guardar cambios', create: 'Crear tarea'
    },
    stats: {
        ...en.stats,
        title: 'Estadísticas', mood_sleeping: 'Durmiendo', mood_flow: 'Flujo profundo', mood_focused: 'Enfocado', mood_low: 'Baja energía', mood_distracted: 'Distraído',
        academicRanks: ['Novato', 'Aprendiz', 'Erudito', 'Maestro', 'Gran Maestro'], streakDetail: 'Día {n}, +{e} EXP', companion: 'Compañero',
        streakTitle: 'Racha', todaysVibe: 'Vibra de hoy', avgScore: 'Puntuación media', weeklyActivity: 'Actividad semanal', last7Days: 'Últimos 7 días'
    },
    settings: {
        ...en.settings,
        title: 'Ajustes', cloudSync: 'Sinc. Nube', proDesc: 'Sincronizar dispositivos y respaldo', enableCloud: 'Activar Sinc. Nube', signOut: 'Cerrar sesión',
        timerConfig: 'Config. Temporizador', reset: 'Restablecer', focusDuration: 'Duración Foco', shortBreak: 'Descanso Corto', longBreak: 'Descanso Largo', intervals: 'Intervalos',
        appearance: 'Apariencia', theme: 'Tema', theme_system: 'Sistema', theme_light: 'Claro', theme_dark: 'Oscuro',
        performance: 'Rendimiento', powerSaver: 'Ahorro de energía', powerSaverDesc: 'Reduce detección IA para ahorrar batería.', language: 'Idioma',
        support: 'Soporte', privacy: 'Privacidad', notifications: 'Notificaciones', addNotification: 'Añadir notificación', notifyAt: 'Notificar en',
        proTitle: 'Mejorar a Pro', viewOffer: 'Ver oferta', proMember: 'Miembro Pro', thanks: '¡Gracias por tu apoyo!'
    },
    session: {
        ...en.session,
        recharge: 'Recargar', rest: 'Descanso', breathe: 'Respira profundo.', skipBreak: 'Omitir descanso', complete: 'Sesión completa',
        focusedFor: 'Enfocado por', taskCompleted: '¡Tarea completada!', markAsDone: '¿Marcar como hecho?', earlyStop: 'Sesión detenida antes.',
        avgFocus: 'Foco medio', posture: 'Postura', timeline: 'Línea de tiempo', backHome: 'Volver al inicio',
        focusGuard: 'Guardia Foco', proPosture: 'Postura Pro', fullBodyAi: 'IA Cuerpo Completo', tooClose: 'Demasiado cerca', paused: 'PAUSADO',
        focusTime: 'Tiempo Foco', cycleLog: 'Registro Ciclo'
    },
    sound: {
        ...en.sound,
        title: 'Paisajes sonoros', smartVolume: 'Volumen inteligente', smartVolumeDesc: 'Baja el volumen al distraerse.', timerOnly: 'Solo temporizador', alwaysOn: 'Siempre activo',
        frequency: 'Frecuencia', ambience: 'Ambiente', custom: 'Personalizado', off: 'Apagado', upload: 'Subir'
    }
};

// Russian (ru)
const ru: typeof en = {
    ...en,
    common: { ...en.common, confirm: 'Подтвердить', cancel: 'Отмена', back: 'Назад', save: 'Сохранить', delete: 'Удалить', loading: 'Загрузка...' },
    nav: { timer: 'Таймер', tasks: 'Задачи', stats: 'Стат.', settings: 'Настр.' },
    timer: {
        ...en.timer,
        ready: 'Готов к потоку', estCycle: 'Ожид. цикл', focusTime: 'Фокус', break: 'Перерыв', start: 'Старт', pause: 'Пауза', resume: 'Продолжить',
        stopwatchActive: 'Секундомер активен', noTasks: 'Нет задач', addOne: 'Добавить задачу', selectTask: 'Выбрать задачу',
        startLabel: 'Начало', duration: 'Длит.', pomos: 'Помидоры', mode_pomodoro: 'Помидоро', mode_stopwatch: 'Секундомер', mode_custom: 'Свой'
    },
    tasks: {
        ...en.tasks,
        title: 'Задачи', today: 'Сегодня', tomorrow: 'Завтра', empty: 'Нет задач на сегодня', createFirst: 'Создайте первую задачу',
        editTask: 'Ред. задачу', newTask: 'Новая задача', whatToDo: 'На чем сфокусироваться?', date: 'Дата', time: 'Время',
        priority: 'Приоритет', delete: 'Удалить задачу', save: 'Сохранить', create: 'Создать'
    },
    stats: {
        ...en.stats,
        title: 'Статистика', mood_sleeping: 'Спит', mood_flow: 'Поток', mood_focused: 'Фокус', mood_low: 'Мало энергии', mood_distracted: 'Отвлечен',
        academicRanks: ['Новичок', 'Ученик', 'Ученый', 'Мастер', 'Грандмастер'], streakDetail: 'День {n}, +{e} EXP', companion: 'Компаньон',
        streakTitle: 'Серия', todaysVibe: 'Настрой', avgScore: 'Сред. балл', weeklyActivity: 'Активность', last7Days: '7 дней'
    },
    settings: {
        ...en.settings,
        title: 'Настройки', cloudSync: 'Облако', proDesc: 'Синхронизация и бэкап', enableCloud: 'Вкл. облако', signOut: 'Выйти',
        timerConfig: 'Настр. таймера', reset: 'Сброс', focusDuration: 'Длит. фокуса', shortBreak: 'Короткий перерыв', longBreak: 'Длинный перерыв', intervals: 'Интервалы',
        appearance: 'Внешний вид', theme: 'Тема', theme_system: 'Системная', theme_light: 'Светлая', theme_dark: 'Темная',
        performance: 'Производительность', powerSaver: 'Энергосбережение', powerSaverDesc: 'Снижает частоту ИИ для экономии заряда.', language: 'Язык',
        support: 'Поддержка', privacy: 'Конфиденциальность', notifications: 'Уведомления', addNotification: 'Добавить', notifyAt: 'Уведомить в',
        proTitle: 'Обновить до Pro', viewOffer: 'Посмотреть', proMember: 'Pro Участник', thanks: 'Спасибо за поддержку!'
    },
    session: {
        ...en.session,
        recharge: 'Зарядка', rest: 'Отдых', breathe: 'Глубокий вдох.', skipBreak: 'Пропустить', complete: 'Сессия завершена',
        focusedFor: 'Фокус в течение', taskCompleted: 'Задача выполнена!', markAsDone: 'Отметить как готовое?', earlyStop: 'Остановлено рано.',
        avgFocus: 'Сред. фокус', posture: 'Осанка', timeline: 'График', backHome: 'Домой',
        focusGuard: 'Страж фокуса', proPosture: 'Pro Осанка', fullBodyAi: 'ИИ Тела', tooClose: 'Слишком близко', paused: 'ПАУЗА',
        focusTime: 'Время фокуса', cycleLog: 'Лог цикла'
    },
    sound: {
        ...en.sound,
        title: 'Звуки', smartVolume: 'Умная громкость', smartVolumeDesc: 'Тише при отвлечении.', timerOnly: 'Только таймер', alwaysOn: 'Всегда вкл.',
        frequency: 'Частота', ambience: 'Атмосфера', custom: 'Свой', off: 'Выкл', upload: 'Загрузить'
    }
};

// Arabic (ar)
const ar: typeof en = {
    ...en,
    common: { ...en.common, confirm: 'تأكيد', cancel: 'إلغاء', back: 'عودة', save: 'حفظ', delete: 'حذف', loading: 'جار التحميل...' },
    nav: { timer: 'المؤقت', tasks: 'المهام', stats: 'الإحصاء', settings: 'الإعدادات' },
    timer: {
        ...en.timer,
        ready: 'جاهز للتركيز', estCycle: 'دورة متوقعة', focusTime: 'تركيز', break: 'راحة', start: 'بدء', pause: 'إيقاف', resume: 'استئناف',
        stopwatchActive: 'ساعة التوقيف نشطة', noTasks: 'لا مهام نشطة', addOne: 'أضف مهمة', selectTask: 'اختر مهمة',
        startLabel: 'بدء', duration: 'المدة', pomos: 'بومودورو', mode_pomodoro: 'بومودورو', mode_stopwatch: 'ساعة توقيف', mode_custom: 'مخصص'
    },
    tasks: {
        ...en.tasks,
        title: 'المهام', today: 'اليوم', tomorrow: 'غداً', empty: 'لا مهام لهذا اليوم', createFirst: 'أنشئ مهمتك الأولى',
        editTask: 'تعديل المهمة', newTask: 'مهمة جديدة', whatToDo: 'على ماذا تريد التركيز؟', date: 'التاريخ', time: 'الوقت',
        priority: 'الأولوية', delete: 'حذف المهمة', save: 'حفظ التغييرات', create: 'إنشاء المهمة'
    },
    stats: {
        ...en.stats,
        title: 'الإحصائيات', mood_sleeping: 'نائم', mood_flow: 'تدفق عميق', mood_focused: 'مركز', mood_low: 'طاقة منخفضة', mood_distracted: 'مشتت',
        academicRanks: ['مبتدئ', 'متدرب', 'باحث', 'ماهر', 'محترف'], streakDetail: 'يوم {n}, +{e} خبرة', companion: 'رفيق',
        streakTitle: 'تتابع', todaysVibe: 'حالة اليوم', avgScore: 'متوسط النقاط', weeklyActivity: 'نشاط أسبوعي', last7Days: 'آخر 7 أيام'
    },
    settings: {
        ...en.settings,
        title: 'الإعدادات', cloudSync: 'مزامنة سحابية', proDesc: 'مزامنة عبر الأجهزة ونسخ احتياطي', enableCloud: 'تفعيل المزامنة', signOut: 'تسجيل خروج',
        timerConfig: 'إعدادات المؤقت', reset: 'إعادة تعيين', focusDuration: 'مدة التركيز', shortBreak: 'راحة قصيرة', longBreak: 'راحة طويلة', intervals: 'فترات',
        appearance: 'المظهر', theme: 'السمة', theme_system: 'النظام', theme_light: 'فاتح', theme_dark: 'داكن',
        performance: 'الأداء', powerSaver: 'توفير الطاقة', powerSaverDesc: 'يقلل من اكتشاف الذكاء الاصطناعي لتوفير البطارية.', language: 'اللغة',
        support: 'الدعم', privacy: 'الخصوصية', notifications: 'الإشعارات', addNotification: 'إضافة إشعار', notifyAt: 'تنبيه في',
        proTitle: 'ترقية لبرو', viewOffer: 'عرض العرض', proMember: 'عضو برو', thanks: 'شكراً لدعمكم!'
    },
    session: {
        ...en.session,
        recharge: 'شحن', rest: 'راحة', breathe: 'خذ نفساً عميقاً.', skipBreak: 'تخطي الراحة', complete: 'اكتملت الجلسة',
        focusedFor: 'ركزت لمدة', taskCompleted: 'اكتملت المهمة!', markAsDone: 'تحديد كمكتمل؟', earlyStop: 'توقفت الجلسة مبكراً.',
        avgFocus: 'متوسط التركيز', posture: 'وضعية', timeline: 'الجدول الزمني', backHome: 'عودة للرئيسية',
        focusGuard: 'حارس التركيز', proPosture: 'وضعية برو', fullBodyAi: 'ذكاء اصطناعي كامل', tooClose: 'قريب جداً', paused: 'موقوف',
        focusTime: 'وقت التركيز', cycleLog: 'سجل الدورة'
    },
    sound: {
        ...en.sound,
        title: 'المشاهد الصوتية', smartVolume: 'حجم ذكي', smartVolumeDesc: 'يخفض الصوت عند التشتت.', timerOnly: 'المؤقت فقط', alwaysOn: 'دائماً قيد التشغيل',
        frequency: 'التردد', ambience: 'الجو', custom: 'مخصص', off: 'إيقاف', upload: 'رفع'
    }
};

// German (de)
const de: typeof en = {
    ...en,
    common: { ...en.common, confirm: 'Bestätigen', cancel: 'Abbrechen', back: 'Zurück', save: 'Speichern', delete: 'Löschen', loading: 'Laden...' },
    nav: { timer: 'Timer', tasks: 'Aufgaben', stats: 'Statistik', settings: 'Einst.' },
    timer: {
        ...en.timer,
        ready: 'Bereit', estCycle: 'Gesch. Zyklus', focusTime: 'Fokus', break: 'Pause', start: 'Start', pause: 'Pause', resume: 'Weiter',
        stopwatchActive: 'Stoppuhr aktiv', noTasks: 'Keine Aufgaben', addOne: 'Aufgabe hinzufügen', selectTask: 'Aufgabe wählen',
        startLabel: 'Start', duration: 'Dauer', pomos: 'Pomos', mode_pomodoro: 'Pomodoro', mode_stopwatch: 'Stoppuhr', mode_custom: 'Benutzerdef.'
    },
    tasks: {
        ...en.tasks,
        title: 'Aufgaben', today: 'Heute', tomorrow: 'Morgen', empty: 'Keine Aufgaben für heute', createFirst: 'Erste Aufgabe erstellen',
        editTask: 'Aufgabe bearbeiten', newTask: 'Neue Aufgabe', whatToDo: 'Worauf willst du dich konzentrieren?', date: 'Datum', time: 'Zeit',
        priority: 'Priorität', delete: 'Löschen', save: 'Speichern', create: 'Erstellen'
    },
    stats: {
        ...en.stats,
        title: 'Statistiken', mood_sleeping: 'Schlafend', mood_flow: 'Tiefer Fluss', mood_focused: 'Fokussiert', mood_low: 'Wenig Energie', mood_distracted: 'Abgelenkt',
        academicRanks: ['Neuling', 'Lehrling', 'Gelehrter', 'Meister', 'Großmeister'], streakDetail: 'Tag {n}, +{e} EXP', companion: 'Begleiter',
        streakTitle: 'Serie', todaysVibe: 'Heutige Stimmung', avgScore: 'Durchschn.', weeklyActivity: 'Wochenaktivität', last7Days: 'Letzte 7 Tage'
    },
    settings: {
        ...en.settings,
        title: 'Einstellungen', cloudSync: 'Cloud Sync', proDesc: 'Sync & Backup', enableCloud: 'Cloud Sync aktivieren', signOut: 'Abmelden',
        timerConfig: 'Timer-Konfig', reset: 'Zurücksetzen', focusDuration: 'Fokusdauer', shortBreak: 'Kurze Pause', longBreak: 'Lange Pause', intervals: 'Intervalle',
        appearance: 'Aussehen', theme: 'Thema', theme_system: 'System', theme_light: 'Hell', theme_dark: 'Dunkel',
        performance: 'Leistung', powerSaver: 'Energiesparmodus', powerSaverDesc: 'Reduziert KI-Erkennung um Batterie zu sparen.', language: 'Sprache',
        support: 'Support', privacy: 'Datenschutz', notifications: 'Benachrichtigungen', addNotification: 'Hinzu', notifyAt: 'Benachrichtigen bei',
        proTitle: 'Auf Pro upgraden', viewOffer: 'Angebot ansehen', proMember: 'Pro Mitglied', thanks: 'Danke für die Unterstützung!'
    },
    session: {
        ...en.session,
        recharge: 'Aufladen', rest: 'Ausruhen', breathe: 'Tief durchatmen.', skipBreak: 'Überspringen', complete: 'Sitzung beendet',
        focusedFor: 'Fokussiert für', taskCompleted: 'Aufgabe erledigt!', markAsDone: 'Als erledigt markieren?', earlyStop: 'Frühzeitig beendet.',
        avgFocus: 'Durchschn. Fokus', posture: 'Haltung', timeline: 'Zeitstrahl', backHome: 'Zurück',
        focusGuard: 'Fokus-Wächter', proPosture: 'Pro Haltung', fullBodyAi: 'Ganzkörper-KI', tooClose: 'Zu nah', paused: 'PAUSIERT',
        focusTime: 'Fokuszeit', cycleLog: 'Zyklus-Log'
    },
    sound: {
        ...en.sound,
        title: 'Klanglandschaften', smartVolume: 'Intelligente Lautstärke', smartVolumeDesc: 'Senkt Lautstärke bei Ablenkung.', timerOnly: 'Nur Timer', alwaysOn: 'Immer an',
        frequency: 'Frequenz', ambience: 'Ambiente', custom: 'Eigene', off: 'Aus', upload: 'Hochladen'
    }
};

// Hindi (hi)
const hi: typeof en = {
    ...en,
    common: { ...en.common, confirm: 'पुष्टि करें', cancel: 'रद्द करें', back: 'वापस', save: 'सहेजें', delete: 'हटाएं', loading: 'लोड हो रहा है...' },
    nav: { timer: 'टाइमर', tasks: 'कार्य', stats: 'आंकड़े', settings: 'सेटिंग्स' },
    timer: {
        ...en.timer,
        ready: 'तैयार', estCycle: 'अनुमानित चक्र', focusTime: 'फोकस', break: 'ब्रेक', start: 'शुरू', pause: 'रोकें', resume: 'जारी रखें',
        stopwatchActive: 'स्टॉपवॉच सक्रिय', noTasks: 'कोई कार्य नहीं', addOne: 'कार्य जोड़ें', selectTask: 'कार्य चुनें',
        startLabel: 'शुरू', duration: 'अवधि', pomos: 'पोमोस', mode_pomodoro: 'पोमोडोरो', mode_stopwatch: 'स्टॉपवॉच', mode_custom: 'कस्टम'
    },
    tasks: {
        ...en.tasks,
        title: 'कार्य सूची', today: 'आज', tomorrow: 'कल', empty: 'आज कोई कार्य नहीं', createFirst: 'पहला कार्य बनाएं',
        editTask: 'कार्य संपादित करें', newTask: 'नया कार्य', whatToDo: 'आप किस पर ध्यान देना चाहते हैं?', date: 'तारीख', time: 'समय',
        priority: 'प्राथमिकता', delete: 'कार्य हटाएं', save: 'सहेजें', create: 'बनाएं'
    },
    stats: {
        ...en.stats,
        title: 'सांख्यिकी', mood_sleeping: 'सो रहा', mood_flow: 'गहरा प्रवाह', mood_focused: 'केंद्रित', mood_low: 'कम ऊर्जा', mood_distracted: 'विचलित',
        academicRanks: ['नौसिखिया', 'प्रशिक्षु', 'विद्वान', 'मास्टर', 'ग्रैंडमास्टर'], streakDetail: 'दिन {n}, +{e} EXP', companion: 'साथी',
        streakTitle: 'लगातार', todaysVibe: 'आज का मिजाज', avgScore: 'औसत स्कोर', weeklyActivity: 'साप्ताहिक गतिविधि', last7Days: 'पिछले 7 दिन'
    },
    settings: {
        ...en.settings,
        title: 'सेटिंग्स', cloudSync: 'क्लाउड सिंक', proDesc: 'डिवाइस सिंक और बैकअप', enableCloud: 'क्लाउड सिंक सक्षम करें', signOut: 'साइन आउट',
        timerConfig: 'टाइमर कॉन्फ़िगरेशन', reset: 'रीसेट', focusDuration: 'फोकस अवधि', shortBreak: 'छोटा ब्रेक', longBreak: 'लंबा ब्रेक', intervals: 'अंतराल',
        appearance: 'सूरत', theme: 'थीम', theme_system: 'सिस्टम', theme_light: 'लाइट', theme_dark: 'डार्क',
        performance: 'प्रदर्शन', powerSaver: 'पावर सेवर', powerSaverDesc: 'बैटरी बचाने के लिए AI पहचान कम करता है।', language: 'भाषा',
        support: 'समर्थन', privacy: 'गोपनीयता', notifications: 'सूचनाएं', addNotification: 'सूचना जोड़ें', notifyAt: 'सूचित करें',
        proTitle: 'Pro में अपग्रेड करें', viewOffer: 'ऑफर देखें', proMember: 'Pro सदस्य', thanks: 'आपके समर्थन के लिए धन्यवाद!'
    },
    session: {
        ...en.session,
        recharge: 'रिचार्ज', rest: 'आराम', breathe: 'गहरी सांस लें।', skipBreak: 'ब्रेक छोड़ें', complete: 'सत्र पूरा',
        focusedFor: 'फोकस किया', taskCompleted: 'कार्य पूरा!', markAsDone: 'पूर्ण चिह्नित करें?', earlyStop: 'जल्दी रोका गया।',
        avgFocus: 'औसत फोकस', posture: 'मुद्रा', timeline: 'समयरेखा', backHome: 'वापस जाएं',
        focusGuard: 'फोकस गार्ड', proPosture: 'Pro मुद्रा', fullBodyAi: 'पूर्ण शरीर AI', tooClose: 'बहुत करीब', paused: 'रुका हुआ',
        focusTime: 'फोकस समय', cycleLog: 'चक्र लॉग'
    },
    sound: {
        ...en.sound,
        title: 'ध्वनि', smartVolume: 'स्मार्ट वॉल्यूम', smartVolumeDesc: 'विचलित होने पर वॉल्यूम कम करता है।', timerOnly: 'केवल टाइमर', alwaysOn: 'हमेशा चालू',
        frequency: 'आवृत्ति', ambience: 'माहौल', custom: 'कस्टम', off: 'बंद', upload: 'अपलोड'
    }
};

// Create the export object
export const translations: Record<LanguageCode, typeof en> = {
  en: en,
  zh: zh,
  'zh-TW': zhTW,
  fr: fr,
  ja: ja,
  ko: ko,
  es: es,
  ru: ru,
  ar: ar,
  de: de,
  hi: hi,
};
