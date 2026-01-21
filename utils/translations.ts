
import { LanguageCode } from '../types';

type TranslationKeys = typeof en;

const en = {
  common: { confirm: 'Confirm', cancel: 'Cancel', back: 'Back', save: 'Save', delete: 'Delete', loading: 'Loading...' },
  nav: { timer: 'Timer', tasks: 'Tasks', stats: 'Stats', settings: 'Settings' },
  timer: { ready: 'Ready to Focus', estCycle: 'Est. Cycle', focusTime: 'Focus Time', break: 'Break', start: 'Start', pause: 'Pause', resume: 'Resume', stopwatchActive: 'Stopwatch Mode Active', noTasks: 'No active tasks', addOne: 'Add one in the Tasks tab', selectTask: 'Select Task', startLabel: 'START', duration: 'DURATION', pomos: 'POMOS', mode_pomodoro: 'Pomodoro', mode_stopwatch: 'Stopwatch', mode_custom: 'Custom' },
  tasks: { title: 'My Tasks', empty: 'No tasks yet', createFirst: 'Create your first task', newTask: 'New Task', editTask: 'Edit Task', whatToDo: 'What needs to be done?', date: 'Date', time: 'Time', priority: 'Priority', estDuration: 'Est. Duration', pomodoros: 'Pomodoros', sessionsPerTask: 'Sessions per task', note: 'Note', delete: 'Delete', save: 'Save Changes', create: 'Create Task', today: 'Today', tomorrow: 'Tomorrow' },
  stats: {
    title: 'Statistics',
    focusHours: 'h',
    today: 'Today Focus',
    tasksDone: 'Tasks Done',
    growthTitle: 'Growth Checklist',
    growthLogin: 'Daily Login',
    growthTask: 'Tasks Completed',
    growthExp: 'Study Growth',
    growthExpRule: '10 EXP / 25m',
    weeklyActivity: 'Weekly Activity',
    last7Days: 'Last 7 Days',
    focusMaster: 'Focus Master',
    companion: 'Your Companion',
    petName: 'FOX',
    happiness: 'HAPPINESS',
    level: 'LV',
    academicRanks: ["Kindergarten", "Elem. 1st", "Elem. 2nd", "Elem. 3rd", "Elem. 4th", "Elem. 5th", "Elem. 6th", "Middle 7th", "Middle 8th", "Middle 9th", "High 10th", "High 11th", "High 12th", "High Senior", "College 1st", "College 2nd", "College 3rd", "College 4th", "Master 1st", "Master 2nd", "PhD Candidate", "PhD Researcher", "PhD Finalist", "Postdoc", "Assistant Prof.", "Associate Prof.", "Professor", "Dean"],
    tapCollapse: 'Tap to collapse',
    tapExpand: 'Focus more to feed!',
    deepFocus: 'Deep Focus',
    focused: 'Focused',
    zoningOut: 'Zoning Out',
    distracted: 'Distracted',
    streakTitle: 'Streak Rewards',
    streakDays: 'Streak Days',
    todayTier: 'Today Tier',
    expReward: 'Next Reward',
    streakCushion: 'Cushion Active'
  },
  settings: { title: 'Settings', proTitle: 'FocusFlow Pro', proDesc: 'Sync data & support development.', viewOffer: 'View Offer', proMember: 'Pro Member', thanks: 'Thank you!', cloudSync: 'Cloud Sync', enableCloud: 'Enable Cloud Sync', signOut: 'Sign Out', timerConfig: 'Timer Config', focusDuration: 'Focus', shortBreak: 'Short Break', longBreak: 'Long Break', intervals: 'Pomos', language: 'Language', support: 'Support', restore: 'Restore', privacy: 'Privacy', reset: 'Reset', choosePlan: 'Choose a Plan', recurring: 'Recurring billing.', subscribe: 'Subscribe', notifications: 'Notifications', addNotification: 'Add Time', notifyAt: 'Notify at', performance: 'Performance', powerSaver: 'Power Saver', powerSaverDesc: 'Saves battery.' },
  footer: { version: 'FocusFlow v1.4.0', architecture: 'Local-First' },
  premium: { feat_sync: 'Sync Devices', feat_history: 'Unlimited Stats', feat_skins: 'Fox Skins', feat_noise: 'White Noise', feat_support: 'Support Dev ❤️', monthly_name: 'Monthly', monthly_desc: 'Billed monthly.', yearly_name: 'Yearly', yearly_desc: 'Best price.', yearly_tag: 'SAVE 45%', lifetime_name: 'Lifetime', lifetime_desc: 'One-time.', lifetime_tag: 'VALUE' },
  session: { complete: 'Done!', focusedFor: 'Focused for', minutes: 'min', avgFocus: 'Avg', posture: 'Posture', timeline: 'Timeline', cycleLog: 'Log', backHome: 'Home', recharge: 'Recharge', rest: 'Rest', breathe: 'Breathe', skipBreak: 'Skip', paused: 'Paused', focusGuard: 'Guard', proPosture: 'Posture', fullBodyAi: 'Full AI', focusTime: 'Focus', taskCompleted: 'Done', markAsDone: 'Mark done?', sessionDoneAuto: 'Auto-saved', sessionDoneManual: 'Save?', earlyStop: 'Stopped' }
};

const zh = {
  common: { confirm: '确认', cancel: '取消', back: '返回', save: '保存', delete: '删除', loading: '加载中...' },
  nav: { timer: '计时', tasks: '任务', stats: '统计', settings: '设置' },
  timer: { ready: '准备专注', estCycle: '预计时长', focusTime: '专注时长', break: '休息', start: '开始', pause: '暂停', resume: '继续', stopwatchActive: '正计时模式运行中', noTasks: '暂无进行中的任务', addOne: '去任务页添加一个吧', selectTask: '选择任务', startLabel: '开始', duration: '时长', pomos: '番茄数', mode_pomodoro: '番茄钟', mode_stopwatch: '正计时', mode_custom: '自定义' },
  tasks: { title: '我的任务', empty: '暂无任务', createFirst: '创建任务', newTask: '新建任务', editTask: '编辑任务', whatToDo: '准备做什么？', date: '日期', time: '时间', priority: '优先级', estDuration: '时长', pomodoros: '番茄钟', sessionsPerTask: '个番茄时间', note: '备注', delete: '删除', save: '保存', create: '创建', today: '今天', tomorrow: '明天' },
  stats: {
    title: '数据统计',
    focusHours: '小时',
    today: '今日专注',
    tasksDone: '完成任务',
    growthTitle: '今日成长清单',
    growthLogin: '今日登录',
    growthTask: '完成任务',
    growthExp: '今日学习累积',
    growthExpRule: '每25分钟+10',
    weeklyActivity: '周活跃度',
    last7Days: '最近7天',
    focusMaster: '专注达人',
    companion: '你的伙伴',
    petName: 'FOX',
    happiness: '开心值',
    level: '等级',
    academicRanks: ["幼稚园", "小学一年级", "小学二年级", "小学三年级", "小学四年级", "小学五年级", "小学六年级", "初一 (7年级)", "初二 (8年级)", "初三 (9年级)", "高一 (10年级)", "高二 (11年级)", "高三 (12年级)", "高四 (Senior)", "大一 (Freshman)", "大二 (Sophomore)", "大三 (Junior)", "大四 (Senior)", "硕士研一", "硕士研二", "博士候选人", "博士研究员", "博士毕业年", "博士后工作站", "助理教授", "副教授", "终身教授", "院士 / 院长"],
    tapCollapse: '点击收起',
    tapExpand: '多专注来喂养它！',
    deepFocus: '深度专注',
    focused: '专注中',
    zoningOut: '游离',
    distracted: '分心',
    streakTitle: '连胜奖励',
    streakDays: '连续登录',
    todayTier: '当前等级',
    expReward: '专注可得',
    streakCushion: '缓冲保护中'
  },
  settings: { title: '设置', proTitle: 'FocusFlow Pro', proDesc: '云端同步 & 支持开发', viewOffer: '查看详情', proMember: 'Pro 会员', thanks: '感谢支持！', cloudSync: '云同步', enableCloud: '开启云同步', signOut: '退出登录', timerConfig: '计时器配置', focusDuration: '专注时长', shortBreak: '短休息', longBreak: '长休息', intervals: '每轮番茄数', language: '语言', support: '支持', restore: '恢复购买', privacy: '隐私政策', reset: '重置', choosePlan: '选择方案', recurring: '自动续费。', subscribe: '订阅', notifications: '通知提醒', addNotification: '添加时间', notifyAt: '提醒时间', performance: '性能模式', powerSaver: '省电模式', powerSaverDesc: '节省电量。' },
  footer: { version: 'FocusFlow v1.4.0', architecture: 'Local-First' },
  premium: { feat_sync: '多端同步', feat_history: '无限统计', feat_skins: '限定皮肤', feat_noise: '白噪音', feat_support: '支持作者 ❤️', monthly_name: '月度', monthly_desc: '按月付费。', yearly_name: '年度', yearly_desc: '超值价格。', yearly_tag: '省 45%', lifetime_name: '终身', lifetime_desc: '一次买断。', lifetime_tag: '最超值' },
  session: { complete: '专注完成！', focusedFor: '你保持专注了', minutes: '分钟', avgFocus: '平均度', posture: '体态', timeline: '时间轴', cycleLog: '日志', backHome: '返回主页', recharge: '充电中', rest: '休息时间', breathe: '深呼吸', skipBreak: '跳过', paused: '已暂停', focusGuard: '卫士', proPosture: '体态', fullBodyAi: '全身 AI', focusTime: '专注', taskCompleted: '任务完成', markAsDone: '标记完成？', sessionDoneAuto: '自动保存', sessionDoneManual: '保存结果？', earlyStop: '提前结束' }
};

const ko = {
  common: { confirm: '확인', cancel: '취소', back: '뒤로', save: '저장', delete: '삭제', loading: '로딩 중...' },
  nav: { timer: '타이머', tasks: '작업', stats: '통계', settings: '설정' },
  timer: { ready: '몰입 준비', estCycle: '예상 시간', focusTime: '몰입 시간', break: '휴식', start: '시작', pause: '일시정지', resume: '재개', stopwatchActive: '스톱워치 모드 실행 중', noTasks: '진행 중인 작업 없음', addOne: '작업 탭에서 추가하세요', selectTask: '작업 선택', startLabel: '시작', duration: '기간', pomos: '뽀모도르', mode_pomodoro: '뽀모도르', mode_stopwatch: '스톱워치', mode_custom: '커스텀' },
  tasks: { title: '나의 작업', empty: '작업 없음', createFirst: '첫 작업 만들기', newTask: '새 작업', editTask: '작업 수정', whatToDo: '무엇을 할까요?', date: '날짜', time: '시간', priority: '우선순위', estDuration: '예상 시간', pomodoros: '뽀모도르', sessionsPerTask: '작업당 세션', note: '메모', delete: '삭제', save: '저장', create: '생성', today: '오늘', tomorrow: '내일' },
  stats: {
    title: '데이터 통계',
    focusHours: '시간',
    today: '오늘의 몰입',
    tasksDone: '완료된 작업',
    growthTitle: '오늘의 성장',
    growthLogin: '일일 로그인',
    growthTask: '작업 완료',
    growthExp: '학습 경험치',
    growthExpRule: '25분당 10 EXP',
    weeklyActivity: '주간 활동',
    last7Days: '최근 7일',
    focusMaster: '몰입 마스터',
    companion: '나의 파트너',
    petName: 'FOX',
    happiness: '행복도',
    level: '레벨',
    academicRanks: ["유치원", "초등 1학년", "초등 2학년", "초등 3학년", "초등 4학년", "초등 5학년", "초등 6학년", "중등 1학년", "중등 2학년", "중등 3학년", "고등 1학년", "고등 2학년", "고등 3학년", "대입 준비생", "대학 1학년", "대학 2학년", "대학 3학년", "대학 4학년", "석사 1년", "석사 2년", "박사 수료", "박사 연구원", "박사 졸업반", "포스트닥터", "조교수", "부교수", "정교수", "학장"],
    tapCollapse: '접으려면 탭하세요',
    tapExpand: '더 집중해서 키워보세요!',
    deepFocus: '딥 포커스',
    focused: '집중 중',
    zoningOut: '멍때림',
    distracted: '산만함',
    streakTitle: '연속 보상',
    streakDays: '연속 로그인',
    todayTier: '현재 등급',
    expReward: '몰입 시 획득',
    streakCushion: '보호막 활성화'
  },
  settings: { title: '설정', proTitle: 'FocusFlow Pro', proDesc: '데이터 동기화 및 개발 지원', viewOffer: '제안 보기', proMember: 'Pro 멤버', thanks: '감사합니다!', cloudSync: '클라우드 동기화', enableCloud: '동기화 활성화', signOut: '로그아웃', timerConfig: '타이머 설정', focusDuration: '몰입 시간', shortBreak: '짧은 휴식', longBreak: '긴 휴식', intervals: '세션 수', language: '언어', support: '지원', restore: '구매 복원', privacy: '개인정보 정책', reset: '초기화', choosePlan: '플랜 선택', recurring: '정기 결제됩니다.', subscribe: '구독하기', notifications: '알림', addNotification: '시간 추가', notifyAt: '알림 시간', performance: '성능', powerSaver: '절전 모드', powerSaverDesc: '배터리를 절약합니다.' },
  footer: { version: 'FocusFlow v1.4.0', architecture: '로컬 우선' },
  premium: { feat_sync: '기기 동기화', feat_history: '무제한 통계', feat_skins: '한정 스킨', feat_noise: '백색 소음', feat_support: '개발자 후원 ❤️', monthly_name: '월간', monthly_desc: '매월 결제.', yearly_name: '연간', yearly_desc: '최고의 가격.', yearly_tag: '45% 할인', lifetime_name: '평생', lifetime_desc: '한 번 결제.', lifetime_tag: '최고 가치' },
  session: { complete: '몰입 완료!', focusedFor: '집중한 시간', minutes: '분', avgFocus: '평균 몰입도', posture: '자세', timeline: '타임라인', cycleLog: '기록', backHome: '홈으로', recharge: '충전 중', rest: '휴식 시간', breathe: '심호흡을 하세요', skipBreak: '휴식 건너뛰기', paused: '일시정지됨', focusGuard: '가드', proPosture: 'Pro: 자세', fullBodyAi: '전신 AI', focusTime: '몰입', taskCompleted: '작업 완료', markAsDone: '완료로 표시?', sessionDoneAuto: '자동 저장됨', sessionDoneManual: '결과를 저장할까요?', earlyStop: '조기 종료' }
};

export const translations: Record<LanguageCode, TranslationKeys> = {
  en: en,
  zh: zh,
  'zh-TW': { ...zh, stats: { ...zh.stats, academicRanks: ["幼稚園", "小一", "小二", "小三", "小四", "小五", "小六", "初一", "初二", "初三", "高一", "高二", "高三", "高四", "大一", "大二", "大三", "大四", "碩一", "碩二", "博士候選", "博士研究", "博士畢業", "博士後", "助教", "副教授", "教授", "院士"] } },
  fr: { ...en, common: { ...en.common, confirm: 'Confirmer', cancel: 'Annuler', back: 'Retour' }, nav: { timer: 'Minuteur', tasks: 'Tâches', stats: 'Stats', settings: 'Paramètres' } },
  ja: { ...en, common: { ...en.common, confirm: '確認', cancel: 'キャンセル', back: '戻る' }, nav: { timer: 'タイマー', tasks: 'タスク', stats: '統計', settings: '設定' } },
  ko: ko,
  es: { ...en, common: { ...en.common, confirm: 'Confirmar', cancel: 'Cancelar', back: 'Volver' }, nav: { timer: 'Temporizador', tasks: 'Tareas', stats: 'Estadísticas', settings: 'Ajustes' } },
  ru: { ...en, common: { ...en.common, confirm: 'Подтвердить', cancel: 'Отмена', back: 'Назад' }, nav: { timer: 'Таймер', tasks: 'Задачи', stats: 'Статистика', settings: 'Настройки' } },
  ar: { ...en, common: { ...en.common, confirm: 'تأكيد', cancel: 'إلغاء', back: 'رجوع' }, nav: { timer: 'المؤقت', tasks: 'المهام', stats: 'الإحصائيات', settings: 'الإعدادات' } },
  de: { ...en, common: { ...en.common, confirm: 'Bestätigen', cancel: 'Abbrechen', back: 'Zurück' }, nav: { timer: 'Timer', tasks: 'Aufgaben', stats: 'Statistiken', settings: 'Einstellungen' } },
  hi: { ...en, common: { ...en.common, confirm: 'पुष्टि करें', cancel: 'رद्द करें', back: 'पीछे' }, nav: { timer: 'タイマー', tasks: 'कार्य', stats: 'आंकड़े', settings: 'सेटिंग्स' } }
};

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
    en: 'English', zh: '中文 (简体)', 'zh-TW': '中文 (繁體)', fr: 'Français', ja: '日本語', ko: '한국어', es: 'Español', ru: 'Русский', ar: 'العربية', de: 'Deutsch', hi: 'हिन्दी'
};
