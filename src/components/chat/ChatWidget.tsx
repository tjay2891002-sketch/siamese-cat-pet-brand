/*
  智能客服组件（正式版）。
  UI 定型于原型评审：圆形可拖拽启动按钮 + 大字号对话排版 + 猫咪档案卡 + 横向产品卡。
  数据源见 useDifyChat.ts：配置了 Dify 环境变量则走真实 API，否则开发环境用假数据预览；
  生产环境未配置 Dify 时组件不渲染。
*/
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Cat, ClipboardList, Headset, SendHorizonal, X } from "lucide-react";
import { DIFY_READY, QUICK_CHIPS, readCatProfile, useDifyChat } from "./useDifyChat";
import { HumanRequestCard } from "./HumanRequestCard";

const NO_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const BTN = 64; // 按钮边长（移动端放大）
const GAP = 12; // 按钮与面板间距
const PANEL_W = 420;
const EDGE = 8; // 距屏幕边缘最小距离
const POS_KEY = "chat-widget-pos";

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

type ChatWidgetProps = {
  /** 点击“去测评”时打开测评弹窗（由 Home 注入） */
  onOpenQuiz?: () => void;
};

export default function ChatWidget({ onOpenQuiz }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, typing, send, refreshProfile } = useDifyChat();
  const listRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState(readCatProfile);
  const [humanCardOpen, setHumanCardOpen] = useState(false);
  const [humanDismissedId, setHumanDismissedId] = useState<number | null>(null);

  const lastBot = [...messages].reverse().find((m) => m.role === "bot");
  const showHumanCard = humanCardOpen || (Boolean(lastBot?.human) && lastBot?.id !== humanDismissedId);

  // 面板点击打开时重读档案：用户可能刚做完测评（避免 effect 内同步 setState）

  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  // 按钮位置：距右/下边缘的偏移。优先读 localStorage，默认右下角（24, 24）
  const [pos, setPos] = useState(() => {
    const fallback = { r: 24, b: 24 };
    try {
      const saved = JSON.parse(localStorage.getItem(POS_KEY) ?? "null") as { r: number; b: number } | null;
      if (saved && Number.isFinite(saved.r) && Number.isFinite(saved.b)) {
        return {
          r: clamp(saved.r, EDGE, window.innerWidth - BTN - EDGE),
          b: clamp(saved.b, EDGE, window.innerHeight - BTN - EDGE),
        };
      }
    } catch {
      // 本地数据损坏时用默认位置
    }
    return fallback;
  });
  const drag = useRef({ active: false, moved: false, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setViewport({ w, h });
      setPos((p) => ({ r: clamp(p.r, EDGE, w - BTN - EDGE), b: clamp(p.b, EDGE, h - BTN - EDGE) }));
    };
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const submit = () => {
    send(input);
    setInput("");
  };

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const x = viewport.w - pos.r - BTN;
    const y = viewport.h - pos.b - BTN;
    drag.current = { active: true, moved: false, offsetX: e.clientX - x, offsetY: e.clientY - y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current.active) return;
    const nx = clamp(e.clientX - drag.current.offsetX, EDGE, viewport.w - BTN - EDGE);
    const ny = clamp(e.clientY - drag.current.offsetY, EDGE, viewport.h - BTN - EDGE);
    const nr = viewport.w - nx - BTN;
    const nb = viewport.h - ny - BTN;
    if (Math.abs(nr - pos.r) + Math.abs(nb - pos.b) > 4) drag.current.moved = true;
    setPos({ r: nr, b: nb });
  };

  const onPointerUp = () => {
    // 位移小于阈值视为点击，切换面板；打开时重读最新测评档案
    if (drag.current.active && !drag.current.moved) {
      const next = !open;
      setOpen(next);
      if (next) {
        setProfile(readCatProfile());
        refreshProfile();
      }
    }
    if (drag.current.moved) localStorage.setItem(POS_KEY, JSON.stringify(pos));
    drag.current.active = false;
  };

  // 面板跟随：上下按半屏翻转，水平以按钮为中心并收敛进视口
  const btnTop = viewport.h - pos.b - BTN;
  const btnCenterX = viewport.w - pos.r - BTN / 2;
  const placeAbove = btnTop + BTN / 2 > viewport.h / 2;
  const panelH = placeAbove
    ? Math.min(600, viewport.h - (pos.b + BTN + GAP) - EDGE)
    : Math.min(600, pos.b - GAP - EDGE);
  const panelLeft = clamp(btnCenterX - PANEL_W / 2, EDGE, Math.max(EDGE, viewport.w - PANEL_W - EDGE));
  const panelPos = placeAbove
    ? { left: panelLeft, bottom: pos.b + BTN + GAP }
    : { left: panelLeft, top: viewport.h - pos.b + GAP };

  // 生产环境未配置 Dify 时不渲染；开发环境始终渲染（假数据预览）
  if (!import.meta.env.DEV && !DIFY_READY) return null;

  return (
    <>
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        aria-label="打开猫咪顾问（可拖拽）"
        style={{ right: pos.r, bottom: pos.b, touchAction: "none" }}
        className="fixed z-40 flex h-16 w-16 cursor-grab items-center justify-center rounded-full border-2 border-border bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105 active:cursor-grabbing"
      >
        {open ? <X className="h-7 w-7" /> : <Cat className="h-8 w-8" />}
      </button>

      {open && (
        <div
          style={{ ...panelPos, height: panelH, width: `min(${PANEL_W}px, calc(100vw - ${EDGE * 2}px))` }}
          className="fixed z-40 flex flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-xl"
        >
          {/* 头部 */}
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Cat className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold">基米厨房 老吴 · 猫咪顾问</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> 在线
              </p>
            </div>
            <button
              onClick={() => setHumanCardOpen(true)}
              aria-label="转人工客服"
              title="转人工客服"
              className="text-muted-foreground hover:text-primary"
            >
              <Headset className="h-5 w-5" />
            </button>
            <button onClick={() => setOpen(false)} aria-label="关闭" className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 猫咪档案卡：已测评显示档案，未测评引导去测评 */}
          {profile ? (
            <div className="mx-5 mt-4 rounded-2xl border border-primary bg-card p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-primary">
                <BadgeCheck className="h-3.5 w-3.5" /> 已完成测评 · {profile.catName}的档案
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                {[profile.age, profile.weight, profile.picky].filter(Boolean).map((item) => (
                  <span key={item} className="rounded-full bg-background px-2.5 py-1 text-foreground">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenQuiz}
              className="mx-5 mt-4 flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-left hover:border-primary"
            >
              <span className="text-sm text-muted-foreground">完成测评建立猫咪档案，基米厨房 老吴能给出更贴合的建议</span>
              <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-primary">
                <ClipboardList className="h-4 w-4" /> 去测评
              </span>
            </button>
          )}

          {/* 对话区 */}
          <div ref={listRef} className={`flex-1 space-y-6 overflow-y-auto px-6 py-6 ${NO_SCROLLBAR}`}>
            {messages.map((m) =>
              m.role === "user" ? (
                <p key={m.id} className="text-right text-base font-bold text-primary">
                  {m.text}
                </p>
              ) : (
                <div key={m.id} className="text-base leading-loose text-foreground">
                  {m.text}
                  {m.card && (
                    <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border border-primary bg-card p-4">
                      <div>
                        <p className="text-xs text-primary">
                          {m.card.tag} · {m.card.price}
                        </p>
                        <p className="text-lg font-bold">{m.card.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{m.card.bullets.join(" · ")}</p>
                      </div>
                      <button className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
                        去试吃
                      </button>
                    </div>
                  )}
                </div>
              ),
            )}
            {typing && <p className="text-sm text-muted-foreground">基米厨房 老吴正在输入…</p>}
            {showHumanCard && (
              <HumanRequestCard
                messages={messages}
                catName={profile?.catName}
                onClose={() => {
                  setHumanDismissedId(lastBot?.id ?? null);
                  setHumanCardOpen(false);
                }}
              />
            )}
          </div>

          {/* 快捷问题 */}
          <div className={`flex gap-2 overflow-x-auto px-6 pb-3 ${NO_SCROLLBAR}`}>
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => send(chip)}
                className="shrink-0 rounded-full border border-border px-3.5 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-primary"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* 输入区 */}
          <div className="flex items-center gap-2 border-t border-border p-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="问问基米厨房 老吴：挑食、换粮、配送、退款…"
              className="h-11 flex-1 rounded-full bg-card px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={submit}
              aria-label="发送"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <SendHorizonal className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
