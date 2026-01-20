
import { LanguageCode } from '../types';

type TranslationKeys = typeof en;

const en = {
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    back: 'Back',
    save: 'Save',
    delete: 'Delete',
    loading: 'Loading...'
  },
  nav: {
    timer: 'Timer',
    tasks: 'Tasks',
    stats: 'Stats',
    settings: 'Settings'
  },
  timer: {
    ready: 'Ready to Focus',
    estCycle: 'Est. Cycle',
    focusTime: 'Focus Time',
    break: 'Break',
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    stopwatchActive: 'Stopwatch Mode Active',
    noTasks: 'No active tasks',
    addOne: 'Add one in the Tasks tab',
    selectTask: 'Select Task',
    startLabel: 'START',
    duration: 'DURATION',
    pomos: 'POMOS',
    mode_pomodoro: 'Pomodoro',
    mode_stopwatch: 'Stopwatch',
    mode_custom: 'Custom'
  },
  tasks: {
    title: 'My Tasks',
    empty: 'No tasks yet',
    createFirst: 'Create your first task',
    newTask: 'New Task',
    editTask: 'Edit Task',
    whatToDo: 'What needs to be done?',
    date: 'Date',
    time: 'Time',
    priority: 'Priority',
    estDuration: 'Est. Duration',
    pomodoros: 'Pomodoros',
    sessionsPerTask: 'Sessions per task',
    note: 'Note',
    delete: 'Delete',
    save: 'Save Changes',
    create: 'Create Task',
    today: 'Today',
    tomorrow: 'Tomorrow'
  },
  stats: {
    title: 'Statistics',
    focusHours: 'h',
    today: 'Today',
    tasksDone: 'Tasks Done',
    weeklyActivity: 'Weekly Activity',
    last7Days: 'Last 7 Days',
    focusMaster: 'Focus Master',
    companion: 'Your Companion',
    petName: 'FOX',
    happiness: 'HAPPINESS',
    level: 'Lv.',
    tapCollapse: 'Tap to collapse',
    tapExpand: 'Focus more to feed!',
    deepFocus: 'Deep Focus',
    focused: 'Focused',
    zoningOut: 'Zoning Out',
    distracted: 'Distracted'
  },
  settings: {
    title: 'Settings',
    proTitle: 'FocusFlow Pro',
    proDesc: 'Sync data & support development.',
    viewOffer: 'View Offer',
    proMember: 'Pro Member',
    thanks: 'Thank you for your support!',
    cloudSync: 'Cloud Sync',
    enableCloud: 'Enable Cloud Sync',
    signOut: 'Sign Out',
    timerConfig: 'Timer Configuration',
    focusDuration: 'Focus Duration',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
    intervals: 'Pomos / Round',
    language: 'Language',
    support: 'Support',
    restore: 'Restore Purchases',
    privacy: 'Privacy Policy',
    reset: 'Reset',
    choosePlan: 'Choose a Plan',
    recurring: 'Recurring billing, cancel anytime. By continuing you agree to our Terms of Service and Privacy Policy.',
    subscribe: 'Subscribe for',
    notifications: 'Notifications',
    addNotification: 'Add Time',
    notifyAt: 'Notify at',
    performance: 'Performance',
    powerSaver: 'Power Saver',
    powerSaverDesc: 'Reduces AI detection rate to save battery. Camera remains active for focus tracking.'
  },
  premium: {
    feat_sync: 'Sync across iPhone, iPad & Android',
    feat_history: 'Unlimited Focus History & Statistics',
    feat_skins: "Exclusive 'FOX' Pet Skins",
    feat_noise: 'Advanced White Noise Library',
    feat_support: 'Support Indie Development ❤️',
    monthly_name: 'Monthly',
    monthly_desc: 'Billed monthly. Cancel anytime.',
    yearly_name: 'Yearly',
    yearly_desc: '12 months at best price.',
    yearly_tag: 'SAVE 45%',
    lifetime_name: 'Lifetime',
    lifetime_desc: 'One-time payment. Own it forever.',
    lifetime_tag: 'BEST VALUE'
  },
  session: {
    complete: 'Session Complete!',
    focusedFor: 'You stayed focused for',
    minutes: 'minutes',
    avgFocus: 'Avg Focus',
    posture: 'Posture',
    timeline: 'Focus Timeline',
    cycleLog: 'Cycle Log',
    backHome: 'Back to Home',
    recharge: 'Time to Recharge',
    rest: 'Well Earned Rest',
    breathe: 'Take a deep breath. Look away from screen.',
    skipBreak: 'Skip Break',
    paused: 'Paused',
    focusGuard: 'Focus Guard',
    proPosture: 'Pro: Posture',
    fullBodyAi: 'Full Body AI',
    focusTime: 'Focus Time',
    taskCompleted: 'Task Completed',
    markAsDone: 'Mark as done?',
    sessionDoneAuto: 'Session complete! Task marked as done.',
    sessionDoneManual: 'Session complete. Mark task as done?',
    earlyStop: 'Session stopped early.'
  }
};

export const translations: Record<LanguageCode, TranslationKeys> = {
  en: en,
  // 简体中文
  zh: {
    ...en, // Fallback
    common: { confirm: '确认', cancel: '取消', back: '返回', save: '保存', delete: '删除', loading: '加载中...' },
    nav: { timer: '计时', tasks: '任务', stats: '统计', settings: '设置' },
    timer: { ready: '准备专注', estCycle: '预计时长', focusTime: '专注时长', break: '休息', start: '开始', pause: '暂停', resume: '继续', stopwatchActive: '正计时模式运行中', noTasks: '暂无进行中的任务', addOne: '去任务页添加一个吧', selectTask: '选择任务', startLabel: '开始', duration: '时长', pomos: '番茄数', mode_pomodoro: '番茄钟', mode_stopwatch: '正计时', mode_custom: '自定义' },
    tasks: { title: '我的任务', empty: '暂无任务', createFirst: '创建你的第一个任务', newTask: '新建任务', editTask: '编辑任务', whatToDo: '准备做什么？', date: '日期', time: '时间', priority: '优先级', estDuration: '预计时长', pomodoros: '番茄钟', sessionsPerTask: '个番茄时间 / 任务', note: '备注', delete: '删除', save: '保存修改', create: '创建任务', today: '今天', tomorrow: '明天' },
    stats: { title: '数据统计', focusHours: '小时', today: '今日专注', tasksDone: '完成任务', weeklyActivity: '周活跃度', last7Days: '最近7天', focusMaster: '专注达人', companion: '你的伙伴', petName: 'FOX', happiness: '开心值', level: 'Lv.', tapCollapse: '点击收起', tapExpand: '多专注来喂养它！', deepFocus: '深度专注', focused: '专注中', zoningOut: '游离', distracted: '分心' },
    settings: { title: '设置', proTitle: 'FocusFlow Pro', proDesc: '云端同步 & 支持开发者', viewOffer: '查看详情', proMember: 'Pro 会员', thanks: '感谢您的支持！', cloudSync: '云同步', enableCloud: '开启云同步', signOut: '退出登录', timerConfig: '计时器配置', focusDuration: '专注时长', shortBreak: '短休息', longBreak: '长休息', intervals: '每轮番茄数', language: '语言', support: '支持', restore: '恢复购买', privacy: '隐私政策', reset: '重置', choosePlan: '选择方案', recurring: '自动续费，随时取消。继续即代表同意服务条款和隐私政策。', subscribe: '订阅 价格:', notifications: '通知提醒', addNotification: '添加时间', notifyAt: '提醒时间', performance: '性能模式', powerSaver: '省电模式', powerSaverDesc: '降低AI检测频率以节省电量。专注追踪功能保持开启。' },
    premium: { feat_sync: '多端同步 (iOS/Android)', feat_history: '无限历史记录与统计', feat_skins: '解锁“FOX”限定皮肤', feat_noise: '高级白噪音库', feat_support: '支持独立开发者 ❤️', monthly_name: '月度会员', monthly_desc: '按月付费，随时取消。', yearly_name: '年度会员', yearly_desc: '12个月超值优惠。', yearly_tag: '省 45%', lifetime_name: '终身买断', lifetime_desc: '一次付费，永久拥有。', lifetime_tag: '最超值' },
    session: { complete: '专注完成！', focusedFor: '你保持专注了', minutes: '分钟', avgFocus: '平均专注度', posture: '体态', timeline: '专注时间轴', cycleLog: '周期日志', backHome: '返回主页', recharge: '休息一下', rest: '好好休息', breathe: '深呼吸，看看远处。', skipBreak: '跳过休息', paused: '已暂停', focusGuard: '专注卫士', proPosture: 'Pro: 体态', fullBodyAi: '全身 AI', focusTime: '专注时长', taskCompleted: '任务已完成', markAsDone: '标记为完成？', sessionDoneAuto: '专注结束，任务已自动完成。', sessionDoneManual: '专注结束。标记任务为完成？', earlyStop: '专注提前结束。' }
  },
  // 繁体中文 (Traditional Chinese)
  'zh-TW': {
    ...en,
    common: { confirm: '確認', cancel: '取消', back: '返回', save: '儲存', delete: '刪除', loading: '載入中...' },
    nav: { timer: '計時', tasks: '任務', stats: '統計', settings: '設定' },
    timer: { ready: '準備專注', estCycle: '預計時長', focusTime: '專注時長', break: '休息', start: '開始', pause: '暫停', resume: '繼續', stopwatchActive: '正計時模式運行中', noTasks: '暫無進行中的任務', addOne: '去任務頁添加一個吧', selectTask: '選擇任務', startLabel: '開始', duration: '時長', pomos: '番茄數', mode_pomodoro: '番茄鐘', mode_stopwatch: '正計時', mode_custom: '自定義' },
    tasks: { title: '我的任務', empty: '暫無任務', createFirst: '創建你的第一個任務', newTask: '新建任務', editTask: '編輯任務', whatToDo: '準備做什麼？', date: '日期', time: '時間', priority: '優先級', estDuration: '預計時長', pomodoros: '番茄鐘', sessionsPerTask: '個番茄時間 / 任務', note: '備註', delete: '刪除', save: '儲存修改', create: '創建任務', today: '今天', tomorrow: '明天' },
    stats: { title: '數據統計', focusHours: '小時', today: '今日專注', tasksDone: '完成任務', weeklyActivity: '週活躍度', last7Days: '最近7天', focusMaster: '專注達人', companion: '你的夥伴', petName: 'FOX', happiness: '開心值', level: 'Lv.', tapCollapse: '點擊收起', tapExpand: '多專注來餵養牠！', deepFocus: '深度專注', focused: '專注中', zoningOut: '遊離', distracted: '分心' },
    settings: { title: '設定', proTitle: 'FocusFlow Pro', proDesc: '雲端同步 & 支持開發者', viewOffer: '查看詳情', proMember: 'Pro 會員', thanks: '感謝您的支持！', cloudSync: '雲同步', enableCloud: '開啟雲同步', signOut: '登出', timerConfig: '計時器配置', focusDuration: '專注時長', shortBreak: '短休息', longBreak: '長休息', intervals: '每輪番茄數', language: '語言', support: '支持', restore: '恢復購買', privacy: '隱私政策', reset: '重置', choosePlan: '選擇方案', recurring: '自動續費，隨時取消。繼續即代表同意服務條款和隱私政策。', subscribe: '訂閱 價格:', notifications: '通知提醒', addNotification: '添加時間', notifyAt: '提醒時間', performance: '性能模式', powerSaver: '省電模式', powerSaverDesc: '降低 AI 檢測頻率以節省電量。專注追踪功能保持開啟。' },
    premium: { feat_sync: '多端同步 (iOS/Android)', feat_history: '無限歷史記錄與統計', feat_skins: '解鎖“FOX”限定皮膚', feat_noise: '高級白噪音庫', feat_support: '支持獨立開發者 ❤️', monthly_name: '月度會員', monthly_desc: '按月付費，隨時取消。', yearly_name: '年度會員', yearly_desc: '12個月超值優惠。', yearly_tag: '省 45%', lifetime_name: '終身買斷', lifetime_desc: '一次付費，永久擁有。', lifetime_tag: '最超值' },
    session: { complete: '專注完成！', focusedFor: '你保持專注了', minutes: '分鐘', avgFocus: '平均專注度', posture: '體態', timeline: '專注時間軸', cycleLog: '週期日誌', backHome: '返回主頁', recharge: '休息一下', rest: '好好休息', breathe: '深呼吸，看看遠處。', skipBreak: '跳過休息', paused: '已暫停', focusGuard: '專注衛士', proPosture: 'Pro: 體態', fullBodyAi: '全身 AI', focusTime: '專注時長', taskCompleted: '任務已完成', markAsDone: '標記為完成？', sessionDoneAuto: '專注結束，任務已自動完成。', sessionDoneManual: '專注結束。標記任務為完成？', earlyStop: '專注提前結束。' }
  },
  // Français (French)
  fr: {
    ...en,
    settings: { ...en.settings, title: 'Réglages', performance: 'Performance', powerSaver: 'Mode Éco', powerSaverDesc: 'Réduit la fréquence de l\'IA pour économiser la batterie.' },
  },
  // 日本語 (Japanese)
  ja: {
    ...en,
    settings: { ...en.settings, title: '設定', performance: 'パフォーマンス', powerSaver: '省電力モード', powerSaverDesc: 'AI検出頻度を下げてバッテリーを節約します。' },
  },
  // 한국어 (Korean)
  ko: {
    ...en,
    settings: { ...en.settings, title: '설정', performance: '성능', powerSaver: '절전 모드', powerSaverDesc: '배터리 절약을 위해 AI 감지 빈도를 줄입니다.' },
  },
  // Español (Spanish)
  es: {
    ...en,
    settings: { ...en.settings, title: 'Ajustes', performance: 'Rendimiento', powerSaver: 'Ahorro de Energía', powerSaverDesc: 'Reduce la detección de IA para ahorrar batería.' },
  },
  // Русский (Russian)
  ru: {
    ...en,
    settings: { ...en.settings, title: 'Настройки', performance: 'Производительность', powerSaver: 'Энергосбережение', powerSaverDesc: 'Снижает частоту опроса AI для экономии заряда.' },
  },
  // العربية (Arabic)
  ar: {
    ...en,
    settings: { ...en.settings, title: 'الإعدادات', performance: 'الأداء', powerSaver: 'موفر الطاقة', powerSaverDesc: 'يقلل من معدل كشف الذكاء الاصطناعي لتوفير البطارية.' },
  },
  // Deutsch (German)
  de: {
    ...en,
    settings: { ...en.settings, title: 'Einstellungen', performance: 'Leistung', powerSaver: 'Stromsparmodus', powerSaverDesc: 'Reduziert die KI-Erkennungsrate, um Akku zu sparen.' },
  },
  // हिन्दी (Hindi)
  hi: {
    ...en,
    settings: { ...en.settings, title: 'सेटिंग्स', performance: 'प्रदर्शन', powerSaver: 'बैटरी सेवर', powerSaverDesc: 'बैटरी बचाने के लिए AI पहचान दर कम करता है।' },
  }
};

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
    en: 'English',
    zh: '中文 (简体)',
    'zh-TW': '中文 (繁體)',
    fr: 'Français',
    ja: '日本語',
    ko: '한국어',
    es: 'Español',
    ru: 'Русский',
    ar: 'العربية',
    de: 'Deutsch',
    hi: 'हिन्दी'
};
