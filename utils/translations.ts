
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
    intervals: 'Intervals',
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
    notifyAt: 'Notify at'
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
    focusTime: 'Focus Time'
  }
};

export const translations: Record<LanguageCode, TranslationKeys> = {
  en: en,
  // 简体中文
  zh: {
    common: { confirm: '确认', cancel: '取消', back: '返回', save: '保存', delete: '删除', loading: '加载中...' },
    nav: { timer: '计时', tasks: '任务', stats: '统计', settings: '设置' },
    timer: { ready: '准备专注', estCycle: '预计时长', focusTime: '专注时长', break: '休息', start: '开始', pause: '暂停', resume: '继续', stopwatchActive: '正计时模式运行中', noTasks: '暂无进行中的任务', addOne: '去任务页添加一个吧', selectTask: '选择任务', startLabel: '开始', duration: '时长', pomos: '番茄数', mode_pomodoro: '番茄钟', mode_stopwatch: '正计时', mode_custom: '自定义' },
    tasks: { title: '我的任务', empty: '暂无任务', createFirst: '创建你的第一个任务', newTask: '新建任务', editTask: '编辑任务', whatToDo: '准备做什么？', date: '日期', time: '时间', priority: '优先级', estDuration: '预计时长', pomodoros: '番茄钟', sessionsPerTask: '个番茄时间 / 任务', note: '备注', delete: '删除', save: '保存修改', create: '创建任务', today: '今天', tomorrow: '明天' },
    stats: { title: '数据统计', focusHours: '小时', today: '今日专注', tasksDone: '完成任务', weeklyActivity: '周活跃度', last7Days: '最近7天', focusMaster: '专注达人', companion: '你的伙伴', petName: 'FOX', happiness: '开心值', level: 'Lv.', tapCollapse: '点击收起', tapExpand: '多专注来喂养它！', deepFocus: '深度专注', focused: '专注中', zoningOut: '游离', distracted: '分心' },
    settings: { title: '设置', proTitle: 'FocusFlow Pro', proDesc: '云端同步 & 支持开发者', viewOffer: '查看详情', proMember: 'Pro 会员', thanks: '感谢您的支持！', cloudSync: '云同步', enableCloud: '开启云同步', signOut: '退出登录', timerConfig: '计时器配置', focusDuration: '专注时长', shortBreak: '短休息', longBreak: '长休息', intervals: '长休息间隔', language: '语言', support: '支持', restore: '恢复购买', privacy: '隐私政策', reset: '重置', choosePlan: '选择方案', recurring: '自动续费，随时取消。继续即代表同意服务条款和隐私政策。', subscribe: '订阅 价格:', notifications: '通知提醒', addNotification: '添加时间', notifyAt: '提醒时间' },
    premium: { feat_sync: '多端同步 (iOS/Android)', feat_history: '无限历史记录与统计', feat_skins: '解锁“FOX”限定皮肤', feat_noise: '高级白噪音库', feat_support: '支持独立开发者 ❤️', monthly_name: '月度会员', monthly_desc: '按月付费，随时取消。', yearly_name: '年度会员', yearly_desc: '12个月超值优惠。', yearly_tag: '省 45%', lifetime_name: '终身买断', lifetime_desc: '一次付费，永久拥有。', lifetime_tag: '最超值' },
    session: { complete: '专注完成！', focusedFor: '你保持专注了', minutes: '分钟', avgFocus: '平均专注度', posture: '体态', timeline: '专注时间轴', cycleLog: '周期日志', backHome: '返回主页', recharge: '休息一下', rest: '好好休息', breathe: '深呼吸，看看远处。', skipBreak: '跳过休息', paused: '已暂停', focusGuard: '专注卫士', proPosture: 'Pro: 体态', fullBodyAi: '全身 AI', focusTime: '专注时长' }
  },
  // 繁体中文 (Traditional Chinese)
  'zh-TW': {
    common: { confirm: '確認', cancel: '取消', back: '返回', save: '儲存', delete: '刪除', loading: '載入中...' },
    nav: { timer: '計時', tasks: '任務', stats: '統計', settings: '設定' },
    timer: { ready: '準備專注', estCycle: '預計時長', focusTime: '專注時長', break: '休息', start: '開始', pause: '暫停', resume: '繼續', stopwatchActive: '正計時模式運行中', noTasks: '暫無進行中的任務', addOne: '去任務頁添加一個吧', selectTask: '選擇任務', startLabel: '開始', duration: '時長', pomos: '番茄數', mode_pomodoro: '番茄鐘', mode_stopwatch: '正計時', mode_custom: '自定義' },
    tasks: { title: '我的任務', empty: '暫無任務', createFirst: '創建你的第一個任務', newTask: '新建任務', editTask: '編輯任務', whatToDo: '準備做什麼？', date: '日期', time: '時間', priority: '優先級', estDuration: '預計時長', pomodoros: '番茄鐘', sessionsPerTask: '個番茄時間 / 任務', note: '備註', delete: '刪除', save: '儲存修改', create: '創建任務', today: '今天', tomorrow: '明天' },
    stats: { title: '數據統計', focusHours: '小時', today: '今日專注', tasksDone: '完成任務', weeklyActivity: '週活躍度', last7Days: '最近7天', focusMaster: '專注達人', companion: '你的夥伴', petName: 'FOX', happiness: '開心值', level: 'Lv.', tapCollapse: '點擊收起', tapExpand: '多專注來餵養牠！', deepFocus: '深度專注', focused: '專注中', zoningOut: '遊離', distracted: '分心' },
    settings: { title: '設定', proTitle: 'FocusFlow Pro', proDesc: '雲端同步 & 支持開發者', viewOffer: '查看詳情', proMember: 'Pro 會員', thanks: '感謝您的支持！', cloudSync: '雲同步', enableCloud: '開啟雲同步', signOut: '登出', timerConfig: '計時器配置', focusDuration: '專注時長', shortBreak: '短休息', longBreak: '長休息', intervals: '長休息間隔', language: '語言', support: '支持', restore: '恢復購買', privacy: '隱私政策', reset: '重置', choosePlan: '選擇方案', recurring: '自動續費，隨時取消。繼續即代表同意服務條款和隱私政策。', subscribe: '訂閱 價格:', notifications: '通知提醒', addNotification: '添加時間', notifyAt: '提醒時間' },
    premium: { feat_sync: '多端同步 (iOS/Android)', feat_history: '無限歷史記錄與統計', feat_skins: '解鎖“FOX”限定皮膚', feat_noise: '高級白噪音庫', feat_support: '支持獨立開發者 ❤️', monthly_name: '月度會員', monthly_desc: '按月付費，隨時取消。', yearly_name: '年度會員', yearly_desc: '12個月超值優惠。', yearly_tag: '省 45%', lifetime_name: '終身買斷', lifetime_desc: '一次付費，永久擁有。', lifetime_tag: '最超值' },
    session: { complete: '專注完成！', focusedFor: '你保持專注了', minutes: '分鐘', avgFocus: '平均專注度', posture: '體態', timeline: '專注時間軸', cycleLog: '週期日誌', backHome: '返回主頁', recharge: '休息一下', rest: '好好休息', breathe: '深呼吸，看看遠處。', skipBreak: '跳過休息', paused: '已暫停', focusGuard: '專注衛士', proPosture: 'Pro: 體態', fullBodyAi: '全身 AI', focusTime: '專注時長' }
  },
  // Français (French)
  fr: {
    common: { confirm: 'Confirmer', cancel: 'Annuler', back: 'Retour', save: 'Enregistrer', delete: 'Supprimer', loading: 'Chargement...' },
    nav: { timer: 'Minuteur', tasks: 'Tâches', stats: 'Stats', settings: 'Réglages' },
    timer: { ready: 'Prêt à focaliser', estCycle: 'Cycle est.', focusTime: 'Temps de focus', break: 'Pause', start: 'Démarrer', pause: 'Pause', resume: 'Reprendre', stopwatchActive: 'Chronomètre actif', noTasks: 'Aucune tâche active', addOne: 'Ajoutez-en une dans l\'onglet Tâches', selectTask: 'Sélectionner une tâche', startLabel: 'DÉBUT', duration: 'DURÉE', pomos: 'POMOS', mode_pomodoro: 'Pomodoro', mode_stopwatch: 'Chronomètre', mode_custom: 'Perso' },
    tasks: { title: 'Mes Tâches', empty: 'Aucune tâche', createFirst: 'Créez votre première tâche', newTask: 'Nouvelle Tâche', editTask: 'Modifier Tâche', whatToDo: 'Que faut-il faire ?', date: 'Date', time: 'Heure', priority: 'Priorité', estDuration: 'Durée est.', pomodoros: 'Pomodoros', sessionsPerTask: 'Sessions par tâche', note: 'Note', delete: 'Supprimer', save: 'Enregistrer', create: 'Créer Tâche', today: 'Aujourd\'hui', tomorrow: 'Demain' },
    stats: { title: 'Statistiques', focusHours: 'h', today: 'Aujourd\'hui', tasksDone: 'Tâches finies', weeklyActivity: 'Activité Hebdo', last7Days: '7 derniers jours', focusMaster: 'Maître Focus', companion: 'Compagnon', petName: 'FOX', happiness: 'BONHEUR', level: 'Niv.', tapCollapse: 'Réduire', tapExpand: 'Concentrez-vous pour nourrir !', deepFocus: 'Focus Profond', focused: 'Concentré', zoningOut: 'Distrait', distracted: 'Interrompu' },
    settings: { title: 'Réglages', proTitle: 'FocusFlow Pro', proDesc: 'Synchro & soutien au dév.', viewOffer: 'Voir l\'offre', proMember: 'Membre Pro', thanks: 'Merci de votre soutien !', cloudSync: 'Cloud Sync', enableCloud: 'Activer Cloud Sync', signOut: 'Déconnexion', timerConfig: 'Config Minuteur', focusDuration: 'Durée Focus', shortBreak: 'Courte Pause', longBreak: 'Longue Pause', intervals: 'Intervalles', language: 'Langue', support: 'Support', restore: 'Restaurer les achats', privacy: 'Confidentialité', reset: 'Réinitialiser', choosePlan: 'Choisir un plan', recurring: 'Facturation récurrente, annulation à tout moment.', subscribe: 'S\'abonner pour', notifications: 'Notifications', addNotification: 'Ajouter', notifyAt: 'Notifier à' },
    premium: { feat_sync: 'Synchro iPhone, iPad & Android', feat_history: 'Historique & Stats illimités', feat_skins: 'Skins exclusifs "FOX"', feat_noise: 'Bruit blanc avancé', feat_support: 'Soutenez un dév indé ❤️', monthly_name: 'Mensuel', monthly_desc: 'Facturé chaque mois.', yearly_name: 'Annuel', yearly_desc: '12 mois au meilleur prix.', yearly_tag: '-45%', lifetime_name: 'À vie', lifetime_desc: 'Paiement unique.', lifetime_tag: 'BEST SELLER' },
    session: { complete: 'Session Terminée !', focusedFor: 'Vous êtes resté concentré', minutes: 'minutes', avgFocus: 'Focus Moyen', posture: 'Posture', timeline: 'Chronologie', cycleLog: 'Journal', backHome: 'Retour Accueil', recharge: 'Temps de recharge', rest: 'Repos mérité', breathe: 'Respirez profondément.', skipBreak: 'Passer la pause', paused: 'En pause', focusGuard: 'Gardien Focus', proPosture: 'Pro : Posture', fullBodyAi: 'IA Corporelle', focusTime: 'Temps Focus' }
  },
  // 日本語 (Japanese)
  ja: {
    common: { confirm: '確認', cancel: 'キャンセル', back: '戻る', save: '保存', delete: '削除', loading: '読み込み中...' },
    nav: { timer: 'タイマー', tasks: 'タスク', stats: '統計', settings: '設定' },
    timer: { ready: '集中準備', estCycle: '予想サイクル', focusTime: '集中時間', break: '休憩', start: '開始', pause: '一時停止', resume: '再開', stopwatchActive: 'ストップウォッチ起動中', noTasks: 'タスクがありません', addOne: 'タスクタブで追加してください', selectTask: 'タスク選択', startLabel: '開始', duration: '期間', pomos: 'ポモドーロ', mode_pomodoro: 'ポモドーロ', mode_stopwatch: 'ストップウォッチ', mode_custom: 'カスタム' },
    tasks: { title: 'マイタスク', empty: 'タスクなし', createFirst: '最初のタスクを作成', newTask: '新規タスク', editTask: 'タスク編集', whatToDo: '何をしますか？', date: '日付', time: '時間', priority: '優先度', estDuration: '予想時間', pomodoros: 'ポモドーロ', sessionsPerTask: 'セッション/タスク', note: 'メモ', delete: '削除', save: '変更を保存', create: 'タスク作成', today: '今日', tomorrow: '明日' },
    stats: { title: '統計データ', focusHours: '時間', today: '今日の集中', tasksDone: '完了タスク', weeklyActivity: '週間アクティビティ', last7Days: '過去7日間', focusMaster: '集中マスター', companion: 'パートナー', petName: 'FOX', happiness: '幸福度', level: 'Lv.', tapCollapse: 'タップして縮小', tapExpand: '集中して育てよう！', deepFocus: '深い集中', focused: '集中', zoningOut: '注意散漫', distracted: '離脱' },
    settings: { title: '設定', proTitle: 'FocusFlow Pro', proDesc: '同期＆開発サポート', viewOffer: '詳細を見る', proMember: 'Pro メンバー', thanks: 'ご支援ありがとうございます！', cloudSync: 'クラウド同期', enableCloud: '同期を有効化', signOut: 'ログアウト', timerConfig: 'タイマー設定', focusDuration: '集中時間', shortBreak: '短い休憩', longBreak: '長い休憩', intervals: '長休憩の間隔', language: '言語', support: 'サポート', restore: '購入を復元', privacy: 'プライバシー', reset: 'リセット', choosePlan: 'プランを選択', recurring: '自動更新。いつでもキャンセル可能。', subscribe: '登録する', notifications: '通知設定', addNotification: '追加', notifyAt: '通知時間' },
    premium: { feat_sync: 'スマホ・タブレット同期', feat_history: '無制限の履歴と統計', feat_skins: '限定ペットスキン', feat_noise: '高音質ホワイトノイズ', feat_support: '個人開発を応援 ❤️', monthly_name: '月額プラン', monthly_desc: '毎月請求。キャンセル自由。', yearly_name: '年額プラン', yearly_desc: '12ヶ月でお得。', yearly_tag: '45% OFF', lifetime_name: '買い切り', lifetime_desc: '一度の支払いで永久利用。', lifetime_tag: 'ベスト' },
    session: { complete: 'セッション完了！', focusedFor: '集中した時間', minutes: '分', avgFocus: '平均集中度', posture: '姿勢', timeline: 'タイムライン', cycleLog: 'サイクルログ', backHome: 'ホームへ戻る', recharge: 'リチャージタイム', rest: '休憩しましょう', breathe: '深呼吸して、遠くを見ましょう。', skipBreak: '休憩をスキップ', paused: '一時停止中', focusGuard: 'フォーカスガード', proPosture: 'Pro: 姿勢', fullBodyAi: '全身 AI', focusTime: '集中時間' }
  },
  // 한국어 (Korean)
  ko: {
    common: { confirm: '확인', cancel: '취소', back: '뒤로', save: '저장', delete: '삭제', loading: '로딩 중...' },
    nav: { timer: '타이머', tasks: '할 일', stats: '통계', settings: '설정' },
    timer: { ready: '집중 준비', estCycle: '예상 주기', focusTime: '집중 시간', break: '휴식', start: '시작', pause: '일시정지', resume: '계속', stopwatchActive: '스톱워치 모드', noTasks: '진행 중인 작업 없음', addOne: '작업 탭에서 추가하세요', selectTask: '작업 선택', startLabel: '시작', duration: '기간', pomos: '뽀모', mode_pomodoro: '뽀모도로', mode_stopwatch: '스톱워치', mode_custom: '사용자 지정' },
    tasks: { title: '나의 할 일', empty: '할 일이 없습니다', createFirst: '첫 번째 작업 만들기', newTask: '새 작업', editTask: '작업 수정', whatToDo: '무엇을 하시겠습니까?', date: '날짜', time: '시간', priority: '우선순위', estDuration: '예상 시간', pomodoros: '뽀모도로', sessionsPerTask: '세션 / 작업', note: '메모', delete: '삭제', save: '저장', create: '작업 생성', today: '오늘', tomorrow: '내일' },
    stats: { title: '통계', focusHours: '시간', today: '오늘 집중', tasksDone: '완료된 작업', weeklyActivity: '주간 활동', last7Days: '최근 7일', focusMaster: '집중 마스터', companion: '반려 동물', petName: 'FOX', happiness: '행복도', level: 'Lv.', tapCollapse: '접기', tapExpand: '집중해서 키우세요!', deepFocus: '깊은 집중', focused: '집중함', zoningOut: '멍때림', distracted: '산만함' },
    settings: { title: '설정', proTitle: 'FocusFlow Pro', proDesc: '동기화 및 개발 지원', viewOffer: '혜택 보기', proMember: 'Pro 멤버', thanks: '지원해 주셔서 감사합니다!', cloudSync: '클라우드 동기화', enableCloud: '동기화 켜기', signOut: '로그아웃', timerConfig: '타이머 설정', focusDuration: '집중 시간', shortBreak: '짧은 휴식', longBreak: '긴 휴식', intervals: '긴 휴식 간격', language: '언어', support: '지원', restore: '구매 복원', privacy: '개인정보 처리방침', reset: '초기화', choosePlan: '요금제 선택', recurring: '정기 결제, 언제든지 취소 가능.', subscribe: '구독하기', notifications: '알림 설정', addNotification: '시간 추가', notifyAt: '알림 시간' },
    premium: { feat_sync: '모든 기기 동기화', feat_history: '무제한 기록 및 통계', feat_skins: '한정판 FOX 스킨', feat_noise: '고급 화이트 노이즈', feat_support: '1인 개발자 후원 ❤️', monthly_name: '월간', monthly_desc: '매월 결제.', yearly_name: '연간', yearly_desc: '12개월 최저가.', yearly_tag: '45% 할인', lifetime_name: '평생', lifetime_desc: '한 번 결제로 평생 소장.', lifetime_tag: '추천' },
    session: { complete: '집중 완료!', focusedFor: '집중한 시간', minutes: '분', avgFocus: '평균 집중도', posture: '자세', timeline: '타임라인', cycleLog: '기록', backHome: '홈으로', recharge: '충전 시간', rest: '휴식하세요', breathe: '심호흡을 하고 먼 곳을 바라보세요.', skipBreak: '휴식 건너뛰기', paused: '일시정지됨', focusGuard: '포커스 가드', proPosture: 'Pro: 자세', fullBodyAi: '전신 AI', focusTime: '집중 시간' }
  },
  // Español (Spanish)
  es: {
    common: { confirm: 'Confirmar', cancel: 'Cancelar', back: 'Atrás', save: 'Guardar', delete: 'Eliminar', loading: 'Cargando...' },
    nav: { timer: 'Temp.', tasks: 'Tareas', stats: 'Estad.', settings: 'Ajustes' },
    timer: { ready: 'Listo para enfocar', estCycle: 'Ciclo est.', focusTime: 'Tiempo foco', break: 'Descanso', start: 'Iniciar', pause: 'Pausa', resume: 'Reanudar', stopwatchActive: 'Cronómetro activo', noTasks: 'No hay tareas activas', addOne: 'Añade una en Tareas', selectTask: 'Seleccionar tarea', startLabel: 'INICIO', duration: 'DURACIÓN', pomos: 'POMOS', mode_pomodoro: 'Pomodoro', mode_stopwatch: 'Cronómetro', mode_custom: 'Personalizado' },
    tasks: { title: 'Mis Tareas', empty: 'Sin tareas', createFirst: 'Crea tu primera tarea', newTask: 'Nueva Tarea', editTask: 'Editar Tarea', whatToDo: '¿Qué hay que hacer?', date: 'Fecha', time: 'Hora', priority: 'Prioridad', estDuration: 'Duración est.', pomodoros: 'Pomodoros', sessionsPerTask: 'Sesiones por tarea', note: 'Nota', delete: 'Eliminar', save: 'Guardar Cambios', create: 'Crear Tarea', today: 'Hoy', tomorrow: 'Mañana' },
    stats: { title: 'Estadísticas', focusHours: 'h', today: 'Hoy', tasksDone: 'Tareas Hechas', weeklyActivity: 'Actividad Semanal', last7Days: 'Últimos 7 días', focusMaster: 'Maestro del Foco', companion: 'Compañero', petName: 'FOX', happiness: 'FELICIDAD', level: 'Nv.', tapCollapse: 'Tocar para colapsar', tapExpand: '¡Enfócate para alimentar!', deepFocus: 'Foco Profundo', focused: 'Enfocado', zoningOut: 'Distraído', distracted: 'Interrumpido' },
    settings: { title: 'Ajustes', proTitle: 'FocusFlow Pro', proDesc: 'Sincronización y apoyo.', viewOffer: 'Ver Oferta', proMember: 'Miembro Pro', thanks: '¡Gracias por tu apoyo!', cloudSync: 'Nube', enableCloud: 'Activar Sincronización', signOut: 'Cerrar Sesión', timerConfig: 'Config. Temporizador', focusDuration: 'Duración Foco', shortBreak: 'Descanso Corto', longBreak: 'Descanso Largo', intervals: 'Intervalos', language: 'Idioma', support: 'Soporte', restore: 'Restaurar Compras', privacy: 'Privacidad', reset: 'Reiniciar', choosePlan: 'Elige un plan', recurring: 'Facturación recurrente, cancela cuando quieras.', subscribe: 'Suscribirse por', notifications: 'Notificaciones', addNotification: 'Añadir', notifyAt: 'Notificar a' },
    premium: { feat_sync: 'Sincroniza en iPhone y Android', feat_history: 'Historial ilimitado', feat_skins: 'Skins exclusivos', feat_noise: 'Ruido blanco avanzado', feat_support: 'Apoya el desarrollo indie ❤️', monthly_name: 'Mensual', monthly_desc: 'Facturado mensualmente.', yearly_name: 'Anual', yearly_desc: '12 meses al mejor precio.', yearly_tag: '-45%', lifetime_name: 'De por vida', lifetime_desc: 'Pago único.', lifetime_tag: 'MEJOR VALOR' },
    session: { complete: '¡Sesión Completada!', focusedFor: 'Te has enfocado por', minutes: 'minutos', avgFocus: 'Foco Promedio', posture: 'Postura', timeline: 'Línea de tiempo', cycleLog: 'Registro', backHome: 'Volver al Inicio', recharge: 'Hora de recargar', rest: 'Descanso merecido', breathe: 'Respira hondo. Mira lejos.', skipBreak: 'Omitir descanso', paused: 'Pausado', focusGuard: 'Guardia de Foco', proPosture: 'Pro: Postura', fullBodyAi: 'IA Corporal', focusTime: 'Tiempo Foco' }
  },
  // Русский (Russian)
  ru: {
    common: { confirm: 'ОК', cancel: 'Отмена', back: 'Назад', save: 'Сохранить', delete: 'Удалить', loading: 'Загрузка...' },
    nav: { timer: 'Таймер', tasks: 'Задачи', stats: 'Стат.', settings: 'Настр.' },
    timer: { ready: 'Готов к фокусу', estCycle: 'Цикл', focusTime: 'Фокус', break: 'Перерыв', start: 'Старт', pause: 'Пауза', resume: 'Продолжить', stopwatchActive: 'Секундомер включен', noTasks: 'Нет активных задач', addOne: 'Добавьте задачу', selectTask: 'Выбрать задачу', startLabel: 'СТАРТ', duration: 'ДЛИТ.', pomos: 'ПОМО', mode_pomodoro: 'Помодоро', mode_stopwatch: 'Секундомер', mode_custom: 'Свой' },
    tasks: { title: 'Мои Задачи', empty: 'Нет задач', createFirst: 'Создайте первую задачу', newTask: 'Новая задача', editTask: 'Изменить задачу', whatToDo: 'Что нужно сделать?', date: 'Дата', time: 'Время', priority: 'Приоритет', estDuration: 'Длительность', pomodoros: 'Помодоро', sessionsPerTask: 'Сессий на задачу', note: 'Заметка', delete: 'Удалить', save: 'Сохранить', create: 'Создать', today: 'Сегодня', tomorrow: 'Завтра' },
    stats: { title: 'Статистика', focusHours: 'ч', today: 'Сегодня', tasksDone: 'Сделано', weeklyActivity: 'Активность', last7Days: '7 дней', focusMaster: 'Мастер Фокуса', companion: 'Питомец', petName: 'FOX', happiness: 'СЧАСТЬЕ', level: 'Ур.', tapCollapse: 'Свернуть', tapExpand: 'Фокусируйся, чтобы кормить!', deepFocus: 'Поток', focused: 'Фокус', zoningOut: 'Витание', distracted: 'Отвлекся' },
    settings: { title: 'Настройки', proTitle: 'FocusFlow Pro', proDesc: 'Синхронизация и поддержка.', viewOffer: 'Подробнее', proMember: 'Pro Участник', thanks: 'Спасибо за поддержку!', cloudSync: 'Облако', enableCloud: 'Включить синхронизацию', signOut: 'Выйти', timerConfig: 'Настройки таймера', focusDuration: 'Длительность фокуса', shortBreak: 'Короткий перерыв', longBreak: 'Длинный перерыв', intervals: 'Интервалы', language: 'Язык', support: 'Поддержка', restore: 'Восстановить покупки', privacy: 'Конфиденциальность', reset: 'Сброс', choosePlan: 'Выберите план', recurring: 'Автопродление, отмена в любое время.', subscribe: 'Подписаться за', notifications: 'Уведомления', addNotification: 'Добавить', notifyAt: 'Время' },
    premium: { feat_sync: 'Синхронизация iOS/Android', feat_history: 'Безлимитная история', feat_skins: 'Эксклюзивные скины', feat_noise: 'Белый шум', feat_support: 'Поддержка разработки ❤️', monthly_name: 'Месячный', monthly_desc: 'Оплата ежемесячно.', yearly_name: 'Годовой', yearly_desc: '12 месяцев выгодно.', yearly_tag: '-45%', lifetime_name: 'Навсегда', lifetime_desc: 'Разовый платеж.', lifetime_tag: 'ВЫГОДНО' },
    session: { complete: 'Сессия завершена!', focusedFor: 'Вы фокусировались', minutes: 'минут', avgFocus: 'Сред. фокус', posture: 'Осанка', timeline: 'График', cycleLog: 'Журнал', backHome: 'На главную', recharge: 'Время отдыха', rest: 'Заслуженный отдых', breathe: 'Сделайте глубокий вдох.', skipBreak: 'Пропустить', paused: 'Пауза', focusGuard: 'Защита фокуса', proPosture: 'Pro: Осанка', fullBodyAi: 'AI Тела', focusTime: 'Время фокуса' }
  },
  // العربية (Arabic)
  ar: {
    common: { confirm: 'تأكيد', cancel: 'إلغاء', back: 'رجوع', save: 'حفظ', delete: 'حذف', loading: 'جار التحميل...' },
    nav: { timer: 'المؤقت', tasks: 'المهام', stats: 'الإحصائيات', settings: 'الإعدادات' },
    timer: { ready: 'مستعد للتركيز', estCycle: 'دورة تقديرية', focusTime: 'وقت التركيز', break: 'استراحة', start: 'بدء', pause: 'إيقاف مؤقت', resume: 'استئناف', stopwatchActive: 'ساعة التوقيت نشطة', noTasks: 'لا توجد مهام نشطة', addOne: 'أضف واحدة في المهام', selectTask: 'اختر مهمة', startLabel: 'بدء', duration: 'المدة', pomos: 'فترات', mode_pomodoro: 'بومودورو', mode_stopwatch: 'ساعة توقيت', mode_custom: 'مخصص' },
    tasks: { title: 'مهامي', empty: 'لا مهام بعد', createFirst: 'أنشئ مهمتك الأولى', newTask: 'مهمة جديدة', editTask: 'تعديل المهمة', whatToDo: 'ماذا تريد أن تفعل؟', date: 'التاريخ', time: 'الوقت', priority: 'الأولوية', estDuration: 'المدة المقدرة', pomodoros: 'بومودورو', sessionsPerTask: 'جلسات لكل مهمة', note: 'ملاحظة', delete: 'حذف', save: 'حفظ التغييرات', create: 'إنشاء مهمة', today: 'اليوم', tomorrow: 'غداً' },
    stats: { title: 'الإحصائيات', focusHours: 'س', today: 'اليوم', tasksDone: 'المهام المنجزة', weeklyActivity: 'النشاط الأسبوعي', last7Days: 'آخر 7 أيام', focusMaster: 'سيد التركيز', companion: 'رفيقك', petName: 'FOX', happiness: 'السعادة', level: 'مستوى', tapCollapse: 'اضغط للطي', tapExpand: 'ركز أكثر لإطعامه!', deepFocus: 'تركيز عميق', focused: 'مركز', zoningOut: 'شارد الذهن', distracted: 'مشتت' },
    settings: { title: 'الإعدادات', proTitle: 'FocusFlow برو', proDesc: 'مزامنة البيانات ودعم التطوير.', viewOffer: 'عرض العرض', proMember: 'عضو برو', thanks: 'شكراً لدعمك!', cloudSync: 'مزامنة سحابية', enableCloud: 'تفعيل المزامنة', signOut: 'تسجيل الخروج', timerConfig: 'إعدادات المؤقت', focusDuration: 'مدة التركيز', shortBreak: 'استراحة قصيرة', longBreak: 'استراحة طويلة', intervals: 'الفترات', language: 'اللغة', support: 'الدعم', restore: 'استعادة المشتريات', privacy: 'الخصوصية', reset: 'إعادة تعيين', choosePlan: 'اختر خطة', recurring: 'دفع متكرر، إلغاء في أي وقت.', subscribe: 'اشتراك بـ', notifications: 'الإشعارات', addNotification: 'إضافة', notifyAt: 'تنبيه في' },
    premium: { feat_sync: 'مزامنة عبر الأجهزة', feat_history: 'تاريخ وإحصائيات غير محدودة', feat_skins: 'أشكال حصرية للثعلب', feat_noise: 'مكتبة ضوضاء بيضاء', feat_support: 'دعم المطور المستقل ❤️', monthly_name: 'شهري', monthly_desc: 'يدفع شهرياً.', yearly_name: 'سنوي', yearly_desc: 'أفضل سعر لمدة 12 شهر.', yearly_tag: 'وفر 45%', lifetime_name: 'مدى الحياة', lifetime_desc: 'دفعة واحدة للأبد.', lifetime_tag: 'أفضل قيمة' },
    session: { complete: 'اكتملت الجلسة!', focusedFor: 'بقيت مركزاً لمدة', minutes: 'دقيقة', avgFocus: 'متوسط التركيز', posture: 'الوضعية', timeline: 'الجدول الزمني', cycleLog: 'سجل الدورات', backHome: 'عودة للرئيسية', recharge: 'وقت الشحن', rest: 'راحة مستحقة', breathe: 'تنفس بعمق. انظر بعيداً.', skipBreak: 'تخطي الاستراحة', paused: 'متوقف', focusGuard: 'حارس التركيز', proPosture: 'برو: الوضعية', fullBodyAi: 'ذكاء اصطناعي للجسد', focusTime: 'وقت التركيز' }
  },
  // Deutsch (German)
  de: {
    common: { confirm: 'Bestätigen', cancel: 'Abbrechen', back: 'Zurück', save: 'Speichern', delete: 'Löschen', loading: 'Lädt...' },
    nav: { timer: 'Timer', tasks: 'Aufgaben', stats: 'Statistik', settings: 'Einst.' },
    timer: { ready: 'Bereit zum Fokus', estCycle: 'Gesch. Zyklus', focusTime: 'Fokuszeit', break: 'Pause', start: 'Start', pause: 'Pause', resume: 'Weiter', stopwatchActive: 'Stoppuhr aktiv', noTasks: 'Keine aktiven Aufgaben', addOne: 'Erstelle eine im Tab Aufgaben', selectTask: 'Aufgabe wählen', startLabel: 'START', duration: 'DAUER', pomos: 'POMOS', mode_pomodoro: 'Pomodoro', mode_stopwatch: 'Stoppuhr', mode_custom: 'Benutzerdef.' },
    tasks: { title: 'Meine Aufgaben', empty: 'Keine Aufgaben', createFirst: 'Erstelle deine erste Aufgabe', newTask: 'Neue Aufgabe', editTask: 'Aufgabe bearbeiten', whatToDo: 'Was ist zu tun?', date: 'Datum', time: 'Zeit', priority: 'Priorität', estDuration: 'Gesch. Dauer', pomodoros: 'Pomodoros', sessionsPerTask: 'Einheiten pro Aufgabe', note: 'Notiz', delete: 'Löschen', save: 'Speichern', create: 'Erstellen', today: 'Heute', tomorrow: 'Morgen' },
    stats: { title: 'Statistik', focusHours: 'Std', today: 'Heute', tasksDone: 'Erledigt', weeklyActivity: 'Wochenaktivität', last7Days: 'Letzte 7 Tage', focusMaster: 'Fokus-Meister', companion: 'Begleiter', petName: 'FOX', happiness: 'GLÜCK', level: 'Lvl.', tapCollapse: 'Einklappen', tapExpand: 'Fokussiere dich, um zu füttern!', deepFocus: 'Tiefer Fokus', focused: 'Fokussiert', zoningOut: 'Abgeschweift', distracted: 'Abgelenkt' },
    settings: { title: 'Einstellungen', proTitle: 'FocusFlow Pro', proDesc: 'Sync & Support.', viewOffer: 'Angebot ansehen', proMember: 'Pro Mitglied', thanks: 'Danke für deine Unterstützung!', cloudSync: 'Cloud Sync', enableCloud: 'Sync aktivieren', signOut: 'Abmelden', timerConfig: 'Timer-Konfiguration', focusDuration: 'Fokusdauer', shortBreak: 'Kurze Pause', longBreak: 'Lange Pause', intervals: 'Intervalle', language: 'Sprache', support: 'Hilfe', restore: 'Käufe wiederherstellen', privacy: 'Datenschutz', reset: 'Zurücksetzen', choosePlan: 'Plan wählen', recurring: 'Wiederkehrende Abrechnung, jederzeit kündbar.', subscribe: 'Abonnieren für', notifications: 'Benachrichtigungen', addNotification: 'Hinzufügen', notifyAt: 'Zeit' },
    premium: { feat_sync: 'Sync auf iPhone, iPad & Android', feat_history: 'Unbegrenzte Historie', feat_skins: 'Exklusive Fuchs-Skins', feat_noise: 'Erweitertes Weißes Rauschen', feat_support: 'Unterstütze Indie-Entwickler ❤️', monthly_name: 'Monatlich', monthly_desc: 'Monatliche Abrechnung.', yearly_name: 'Jährlich', yearly_desc: '12 Monate zum Bestpreis.', yearly_tag: '-45%', lifetime_name: 'Lebenslang', lifetime_desc: 'Einmalzahlung.', lifetime_tag: 'BESTER WERT' },
    session: { complete: 'Sitzung beendet!', focusedFor: 'Du warst fokussiert für', minutes: 'Minuten', avgFocus: 'Ø Fokus', posture: 'Haltung', timeline: 'Zeitstrahl', cycleLog: 'Zyklus-Log', backHome: 'Zurück', recharge: 'Aufladen', rest: 'Verdiente Pause', breathe: 'Tief atmen. In die Ferne schauen.', skipBreak: 'Pause überspringen', paused: 'Pausiert', focusGuard: 'Fokus-Wächter', proPosture: 'Pro: Haltung', fullBodyAi: 'Körper-KI', focusTime: 'Fokuszeit' }
  },
  // हिन्दी (Hindi)
  hi: {
    common: { confirm: 'पुष्टि करें', cancel: 'रद्द करें', back: 'वापस', save: 'सहेजें', delete: 'हटाएं', loading: 'लोड हो रहा है...' },
    nav: { timer: 'टाइमर', tasks: 'कार्य', stats: 'आंकड़े', settings: 'सेटिंग्स' },
    timer: { ready: 'फोकस के लिए तैयार', estCycle: 'अनुमानित चक्र', focusTime: 'फोकस समय', break: 'विराम', start: 'शुरू', pause: 'रोकें', resume: 'जारी रखें', stopwatchActive: 'स्टॉपवॉच सक्रिय', noTasks: 'कोई सक्रिय कार्य नहीं', addOne: 'कार्य टैब में एक जोड़ें', selectTask: 'कार्य चुनें', startLabel: 'शुरू', duration: 'अवधि', pomos: 'पोमोस', mode_pomodoro: 'पोमोडोरो', mode_stopwatch: 'स्टॉपवॉच', mode_custom: 'कस्टम' },
    tasks: { title: 'मेरे कार्य', empty: 'कोई कार्य नहीं', createFirst: 'अपना पहला कार्य बनाएं', newTask: 'नया कार्य', editTask: 'कार्य संपादित करें', whatToDo: 'क्या करना है?', date: 'तारीख', time: 'समय', priority: 'प्राथमिकता', estDuration: 'अनुमानित अवधि', pomodoros: 'पोमोडोरो', sessionsPerTask: 'सत्र प्रति कार्य', note: 'नोट', delete: 'हटाएं', save: 'परिवर्तन सहेजें', create: 'कार्य बनाएं', today: 'आज', tomorrow: 'कल' },
    stats: { title: 'आंकड़े', focusHours: 'घंटे', today: 'आज', tasksDone: 'कार्य पूर्ण', weeklyActivity: 'साप्ताहिक गतिविधि', last7Days: 'पिछले 7 दिन', focusMaster: 'फोकस मास्टर', companion: 'साथी', petName: 'FOX', happiness: 'खुशी', level: 'स्तर', tapCollapse: 'छिपाने के लिए टैप करें', tapExpand: 'खिलाने के लिए फोकस करें!', deepFocus: 'गहरा फोकस', focused: 'फोकस', zoningOut: 'ध्यान भटका', distracted: 'विचलित' },
    settings: { title: 'सेटिंग्स', proTitle: 'FocusFlow प्रो', proDesc: 'सिंक और विकास का समर्थन करें।', viewOffer: 'ऑफर देखें', proMember: 'प्रो सदस्य', thanks: 'आपके समर्थन के लिए धन्यवाद!', cloudSync: 'क्लाउड सिंक', enableCloud: 'सिंक सक्षम करें', signOut: 'साइन आउट', timerConfig: 'टाइमर कॉन्फ़िगरेशन', focusDuration: 'फोकस अवधि', shortBreak: 'लघु विराम', longBreak: 'दीर्घ विराम', intervals: 'अंतराल', language: 'भाषा', support: 'समर्थन', restore: 'खरीदारी बहाल करें', privacy: 'गोपनीयता', reset: 'रीसेट', choosePlan: 'योजना चुनें', recurring: 'आवर्ती बिलिंग, कभी भी रद्द करें।', subscribe: 'सदस्यता लें', notifications: 'सूचनाएं', addNotification: 'जोड़ें', notifyAt: 'समय' },
    premium: { feat_sync: 'सभी उपकरणों पर सिंक करें', feat_history: 'असीमित इतिहास और आंकड़े', feat_skins: 'विशेष FOX स्किन्स', feat_noise: 'उन्नत व्हाइट नॉइज़', feat_support: 'इंडी डेवलपर का समर्थन करें ❤️', monthly_name: 'मासिक', monthly_desc: 'मासिक बिल।', yearly_name: 'वार्षिक', yearly_desc: 'सर्वोत्तम मूल्य पर 12 महीने।', yearly_tag: '45% बचाएं', lifetime_name: 'आजीवन', lifetime_desc: 'एक बार भुगतान।', lifetime_tag: 'सर्वोत्तम मूल्य' },
    session: { complete: 'सत्र पूर्ण!', focusedFor: 'आप फोकस रहे', minutes: 'मिनट', avgFocus: 'औसत फोकस', posture: 'आसन', timeline: 'समयरेखा', cycleLog: 'चक्र लॉग', backHome: 'घर वापस', recharge: 'रिचार्ज का समय', rest: 'आराम करें', breathe: 'गहरी सांस लें। दूर देखें।', skipBreak: 'विराम छोड़ें', paused: 'रोका गया', focusGuard: 'फोकस गार्ड', proPosture: 'प्रो: आसन', fullBodyAi: 'पूर्ण शरीर AI', focusTime: 'फोकस समय' }
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