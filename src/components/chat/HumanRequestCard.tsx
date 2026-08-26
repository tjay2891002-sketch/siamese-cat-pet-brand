/*
  转人工留资卡：机器人无法解决或用户主动点击时出现。
  预填测评留下的联系方式与最近对话摘要，提交为 human-request 类型的工单线索。
*/
import { useState } from "react";
import { Headset, SendHorizonal } from "lucide-react";
import { toast } from "sonner";
import { reportLead } from "@/lib/leads";
import type { ChatMessage } from "./useDifyChat";

type Props = {
  messages: ChatMessage[];
  catName?: string;
  onClose: () => void;
};

/** 从测评线索里预填联系方式 */
function prefillContact(): string {
  try {
    const leads = JSON.parse(localStorage.getItem("nine-lives-kitchen-leads") ?? "[]") as Array<{ contact?: string }>;
    return leads[0]?.contact ?? "";
  } catch {
    return "";
  }
}

export function HumanRequestCard({ messages, catName, onClose }: Props) {
  const [contact, setContact] = useState(prefillContact);
  const [note, setNote] = useState(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    return lastUser ? `想咨询：${lastUser.text}` : "";
  });
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (!contact.trim()) {
      toast.error("请留下联系方式，人工客服才能找到你。");
      return;
    }
    const transcript = messages
      .slice(-6)
      .map((m) => `${m.role === "user" ? "用户" : "基米厨房 老吴"}: ${m.text}`)
      .join("\n");
    reportLead("human-request", { catName: catName ?? "", contact: contact.trim(), note: note.trim(), transcript });
    setSubmitted(true);
    toast.success("已转交人工客服，我们会尽快联系你。");
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-primary bg-card p-4 text-sm">
        <p className="font-bold text-primary">已收到，转交人工客服 🐾</p>
        <p className="mt-1 text-muted-foreground">我们会通过 {contact} 尽快联系你，请留意消息。</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary bg-card p-4">
      <p className="flex items-center gap-1.5 text-sm font-bold text-primary">
        <Headset className="h-4 w-4" /> 转人工客服
      </p>
      <p className="mt-1 text-xs text-muted-foreground">留下联系方式，人工客服会尽快联系你（会带上本次对话记录）</p>
      <input
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder="微信 / 手机号 / 邮箱"
        className="mt-3 h-10 w-full rounded-full bg-background px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="简单说说要解决的问题…"
        rows={2}
        className="mt-2 w-full rounded-2xl bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
      />
      <div className="mt-3 flex gap-2">
        <button
          onClick={submit}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary py-2 text-sm font-bold text-primary-foreground"
        >
          <SendHorizonal className="h-4 w-4" /> 提交
        </button>
        <button
          onClick={onClose}
          className="rounded-full border border-border px-4 text-sm text-muted-foreground hover:text-foreground"
        >
          再想想
        </button>
      </div>
    </div>
  );
}
