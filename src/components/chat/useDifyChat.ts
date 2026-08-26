/*
  客服数据源：优先走 Dify Chatflow API（SSE 流式）；未配置环境变量时回退到本地假数据，
  保证 Dify 部署完成前 UI 仍可预览。
  配置：复制项目根目录 .env.example 为 .env，填入 VITE_DIFY_API_URL / VITE_DIFY_API_KEY。
  猫咪档案：读取测评（QuizDialog）存在 localStorage 的最新一条 lead，
  作为会话变量传给 Dify，实现“客服已读档案”。
*/
import { useState } from "react";
import { products } from "@/data/site";

export type ChatCard = {
  title: string;
  tag: string;
  price: string;
  bullets: string[];
};

export type ChatMessage = {
  id: number;
  role: "user" | "bot";
  text: string;
  card?: ChatCard;
  human?: boolean;
};

export type CatProfile = {
  catName: string;
  age: string;
  weight: string;
  picky: string;
};

const API_URL = (import.meta.env.VITE_DIFY_API_URL as string | undefined)?.replace(/\/$/, "");
/** 是否走真实客服后端（薄后台 /api 代理）；未配置时组件整体隐藏（生产环境），开发环境用假数据预览 */
export const DIFY_READY = Boolean(API_URL);

const LEADS_KEY = "nine-lives-kitchen-leads"; // 与 QuizDialog 一致
const CONVERSATION_KEY = "chat-conversation-id";

export function readCatProfile(): CatProfile | null {
  try {
    const leads = JSON.parse(localStorage.getItem(LEADS_KEY) ?? "[]") as Array<Partial<CatProfile>>;
    const latest = leads[0];
    if (!latest?.catName) return null;
    return {
      catName: latest.catName,
      age: latest.age ?? "",
      weight: latest.weight ?? "",
      picky: latest.picky ?? "",
    };
  } catch {
    return null;
  }
}

export const QUICK_CHIPS = ["我家猫很挑食，适合吗？", "怎么退款？", "冷链多久能到？", "多猫家庭怎么买划算？"];

export function openingMessage(profile: CatProfile | null): string {
  if (profile) {
    return `您好，我是基米厨房 老吴 🐾 看到 ${profile.catName} 的档案（${profile.weight}、${profile.picky}），关于鲜食、换粮、配送、退款都可以问我～`;
  }
  return "您好，我是基米厨房 老吴 🐾 关于鲜食、换粮、配送、退款都可以问我。完成测评建立猫咪档案后，我还能给更贴合主子的建议～";
}

/** 剥离 DeepSeek 的思考块；思考未闭合时返回空串（前端显示“正在输入”） */
function stripThinking(raw: string): string {
  const open = raw.indexOf("<think>");
  if (open === -1) return raw;
  const close = raw.indexOf("</think>");
  if (close === -1) return "";
  return (raw.slice(0, open) + raw.slice(close + "</think>".length)).trimStart();
}

/** Dify 提示词约定：答案输出 [PRODUCT:产品id] → 渲染产品卡片；输出 [HUMAN] → 弹出人工留资卡 */
function extractCard(text: string): { text: string; card?: ChatCard; human?: boolean } {
  const human = text.includes("[HUMAN]") || undefined;
  const cleaned = text.replace("[HUMAN]", "").trim();
  const match = cleaned.match(/\[PRODUCT:([\w-]+)\]/);
  if (!match) return { text: cleaned, human };
  const product = products.find((p) => p.id === match[1]);
  if (!product) return { text: cleaned, human };
  return {
    text: cleaned.replace(match[0], "").trim(),
    card: { title: product.title, tag: product.tag, price: product.price, bullets: product.bullets },
    human,
  };
}

// ---------- 假数据回退（Dify 未配置时） ----------

function fakeReply(input: string): { text: string; card?: ChatCard } {
  if (/退|包退|售后/.test(input)) {
    return {
      text: "首单试吃装签收 7 天内，猫咪不爱吃可申请全额退款，无需退货，1-3 个工作日原路退回。订阅则在下次发货前 48 小时暂停即可，未发货周期全额退。依据《售后与退款政策》（拟定稿）。",
    };
  }
  if (/配送|冷链|多久|发货|快递/.test(input)) {
    return {
      text: "工作日 16:00 前的订单 48 小时内发出，全程 -18°C 冷链 + 干冰保温箱，一般 1-3 天送达。收到后请尽快放入冷冻室，若干冰残余请勿徒手触碰哦。",
    };
  }
  if (/多猫|划算|优惠/.test(input)) {
    return {
      text: "多猫家庭推荐「多猫省心计划」¥359/2 周：最多 3 只猫档案、口味组合发货、用品凑单折扣，还有专属客服提醒补货。[PRODUCT:fresh-chicken-starter]",
    };
  }
  return {
    text: "很适合先小份试吃。类似情况的猫咪里，94% 对鸡肉温煮餐适应良好（样本 42 只）。建议搭配冻干肠胃小方做 7 天渐进换粮，而且首单不爱吃全额包退，可以放心让主子投票。[PRODUCT:fresh-chicken-starter]",
  };
}

// ---------- Hook ----------

let nextId = 1;

export function useDifyChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: "bot", ...extractCard(openingMessage(readCatProfile())) },
  ]);
  const [typing, setTyping] = useState(false);

  /** 用户可能在页面加载后才完成测评：面板打开时重读档案并刷新开场白（对话未开始时） */
  const refreshProfile = () => {
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0].role !== "bot") return prev;
      return [{ id: 0, role: "bot", ...extractCard(openingMessage(readCatProfile())) }];
    });
  };

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { id: nextId++, role: "user", text }]);
    setTyping(true);
    if (DIFY_READY) {
      void streamFromDify(text);
    } else {
      fakeStream(text);
    }
  };

  /** 模拟流式输出，便于在 Dify 就绪前预览交互 */
  const fakeStream = (input: string) => {
    const reply = extractCard(fakeReply(input).text);
    setTimeout(() => {
      const botId = nextId++;
      setMessages((prev) => [...prev, { id: botId, role: "bot", text: "" }]);
      let i = 0;
      const timer = setInterval(() => {
        i += 2;
        const done = i >= reply.text.length;
        setMessages((prev) =>
          prev.map((m) => (m.id === botId ? { ...m, text: reply.text.slice(0, i), card: done ? reply.card : undefined } : m)),
        );
        if (done) {
          clearInterval(timer);
          setTyping(false);
        }
      }, 40);
    }, 600);
  };

  /** 调用 Dify /chat-messages（SSE），逐段追加回答 */
  const streamFromDify = async (query: string) => {
    const botId = nextId++;
    setMessages((prev) => [...prev, { id: botId, role: "bot", text: "" }]);
    const patch = (partial: Partial<ChatMessage>) =>
      setMessages((prev) => prev.map((m) => (m.id === botId ? { ...m, ...partial } : m)));

    try {
      const profile = readCatProfile();
      const res = await fetch(`${API_URL}/chat-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          inputs: profile ? { cat_name: profile.catName, cat_age: profile.age, cat_weight: profile.weight, cat_picky: profile.picky } : {},
          response_mode: "streaming",
          conversation_id: localStorage.getItem(CONVERSATION_KEY) ?? "",
          user: "site-visitor",
        }),
      });
      if (!res.ok || !res.body) throw new Error(`Dify API ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const chunk of events) {
          const line = chunk.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          try {
            const payload = JSON.parse(line.slice(5).trim()) as {
              event?: string;
              answer?: string;
              conversation_id?: string;
            };
            if (payload.event === "message" && payload.answer) {
              answer += payload.answer;
              patch({ text: stripThinking(answer) });
            }
            if (payload.event === "message_end" && payload.conversation_id) {
              localStorage.setItem(CONVERSATION_KEY, payload.conversation_id);
            }
          } catch {
            // 忽略心跳/注释行
          }
        }
      }
      patch(extractCard(stripThinking(answer)));
    } catch {
      patch({ text: "抱歉，客服系统暂时开小差了，请稍后再试，或发送邮件至 hello@kimi.example 联系我们。" });
    } finally {
      setTyping(false);
    }
  };

  return { messages, typing, send, refreshProfile };
}
