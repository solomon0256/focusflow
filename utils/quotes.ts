
import { LanguageCode } from '../types';

interface Quote {
  text: string;
  author: string;
}

// 31 Quotes to cover a max month, rotating by day of month
const QUOTES_DB: Record<string, { en: Quote, zh: Quote }> = {
  "1": { en: { text: "Focus is the key to all success.", author: "Anonymous" }, zh: { text: "专注是成功之钥。", author: "佚名" } },
  "2": { en: { text: "The secret of getting ahead is getting started.", author: "Mark Twain" }, zh: { text: "领先的秘诀在于开始。", author: "马克·吐温" } },
  "3": { en: { text: "It always seems impossible until it's done.", author: "Nelson Mandela" }, zh: { text: "在完成之前，一切看似不可能。", author: "曼德拉" } },
  "4": { en: { text: "Don’t watch the clock; do what it does. Keep going.", author: "Sam Levenson" }, zh: { text: "别盯着钟表，像它一样前进。", author: "萨姆·莱文森" } },
  "5": { en: { text: "Lost time is never found again.", author: "Benjamin Franklin" }, zh: { text: "逝去的时光不再复返。", author: "富兰克林" } },
  "6": { en: { text: "Quality is not an act, it is a habit.", author: "Aristotle" }, zh: { text: "优秀不是一种行为，而是一种习惯。", author: "亚里士多德" } },
  "7": { en: { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" }, zh: { text: "专注于高效，而非忙碌。", author: "蒂姆·费里斯" } },
  "8": { en: { text: "Determine never to be idle.", author: "John Wesley" }, zh: { text: "下定决心，绝不虚度。", author: "约翰·卫斯理" } },
  "9": { en: { text: "Your future is created by what you do today.", author: "Unknown" }, zh: { text: "你的未来由今天创造。", author: "佚名" } },
  "10": { en: { text: "Discipline is doing what needs to be done.", author: "Anonymous" }, zh: { text: "自律就是做必须做的事。", author: "佚名" } },
  "11": { en: { text: "Success is the sum of small efforts.", author: "Robert Collier" }, zh: { text: "成功是点滴努力的积累。", author: "罗伯特·科利尔" } },
  "12": { en: { text: "One way to keep momentum is to have constantly greater goals.", author: "Michael Korda" }, zh: { text: "保持动力的秘诀是不断树立更大的目标。", author: "迈克尔·科达" } },
  "13": { en: { text: "Action is the foundational key to all success.", author: "Picasso" }, zh: { text: "行动是成功的基石。", author: "毕加索" } },
  "14": { en: { text: "Concentrate all your thoughts upon the work at hand.", author: "Graham Bell" }, zh: { text: "全神贯注于手头的工作。", author: "贝尔" } },
  "15": { en: { text: "Until we can manage time, we can manage nothing else.", author: "Peter Drucker" }, zh: { text: "不能管理时间，便什么都无法管理。", author: "德鲁克" } },
  "16": { en: { text: "Simplicity is the ultimate sophistication.", author: "Da Vinci" }, zh: { text: "至繁归于至简。", author: "达芬奇" } },
  "17": { en: { text: "He who has a why to live can bear almost any how.", author: "Nietzsche" }, zh: { text: "知其为何而活，便能忍受任何生活。", author: "尼采" } },
  "18": { en: { text: "Deep focus is a superpower.", author: "Unknown" }, zh: { text: "深度专注是一种超能力。", author: "佚名" } },
  "19": { en: { text: "Efficiency is doing things right; effectiveness is doing the right things.", author: "Peter Drucker" }, zh: { text: "效率是把事做对，效能是做对的事。", author: "德鲁克" } },
  "20": { en: { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" }, zh: { text: "业余者等待灵感，专业者直接开工。", author: "斯蒂芬·金" } },
  "21": { en: { text: "Do the hard jobs first.", author: "Dale Carnegie" }, zh: { text: "先做困难的事。", author: "卡耐基" } },
  "22": { en: { text: "The shorter way to do many things is to do only one thing at a time.", author: "Mozart" }, zh: { text: "多快好省的秘诀是一次只做一件事。", author: "莫扎特" } },
  "23": { en: { text: "Time stays long enough for anyone who will use it.", author: "Leonardo da Vinci" }, zh: { text: "善用时间者，时间总够用。", author: "达芬奇" } },
  "24": { en: { text: "Start where you are. Use what you have.", author: "Arthur Ashe" }, zh: { text: "就地开始，尽你所能。", author: "阿瑟·阿什" } },
  "25": { en: { text: "Absorb what is useful, discard what is not.", author: "Bruce Lee" }, zh: { text: "取其精华，去其糟粕。", author: "李小龙" } },
  "26": { en: { text: "Stay hungry, stay foolish.", author: "Steve Jobs" }, zh: { text: "求知若饥，虚心若愚。", author: "乔布斯" } },
  "27": { en: { text: "Learning never exhausts the mind.", author: "Da Vinci" }, zh: { text: "学习永不耗尽心智。", author: "达芬奇" } },
  "28": { en: { text: "Well done is better than well said.", author: "Benjamin Franklin" }, zh: { text: "说得好不如做得好。", author: "富兰克林" } },
  "29": { en: { text: "Perseverance is failing 19 times and succeeding the 20th.", author: "Julie Andrews" }, zh: { text: "毅力是失败19次后第20次的成功。", author: "朱莉·安德鲁斯" } },
  "30": { en: { text: "Yesterday is gone. Tomorrow is not yet here. We have only today.", author: "Mother Teresa" }, zh: { text: "昨日已逝，明日未至，唯有今朝。", author: "特蕾莎修女" } },
  "31": { en: { text: "Mastery demands focus.", author: "Unknown" }, zh: { text: "精通需要专注。", author: "佚名" } }
};

export const getDailyQuote = (language: LanguageCode): Quote => {
    const day = new Date().getDate().toString();
    const quoteEntry = QUOTES_DB[day] || QUOTES_DB["1"];
    
    // Simple fallback logic: if language is Chinese-ish, use 'zh', else 'en'
    if (language === 'zh' || language === 'zh-TW') {
        return quoteEntry.zh;
    }
    return quoteEntry.en;
};
