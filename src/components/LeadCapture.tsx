/*
  设计路线：暗调私厨 × 宠物健康 DTC。
  组件目标：静态站落地阶段的轻量线索收集区，承接暂不接支付/后台时的真实转化。
*/
import { useState } from "react";
import type { FormEvent } from "react";
import { Mail, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const STORAGE_KEY = "nine-lives-kitchen-consults";

export function LeadCapture() {
  const [name, setName] = useState("猫咪家长");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("想先了解试吃包和冷链配送范围。");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contact.trim()) {
      toast.error("请留下联系方式，方便发送试吃说明。");
      return;
    }
    const payload = { name, contact, message, submittedAt: new Date().toISOString() };
    const previous = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    localStorage.setItem(STORAGE_KEY, JSON.stringify([payload, ...previous].slice(0, 50)));
    toast.success("咨询线索已暂存。正式上线时可接入飞书/企业微信/邮箱通知。");
    setContact("");
  };

  return (
    <form onSubmit={submit} className="rounded-[2rem] bg-primary p-7 text-primary-foreground shadow-[0_25px_80px_rgba(230,161,65,.28)]">
      <div className="mb-6 flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-black/15">
          <MessageCircle className="h-6 w-6" />
        </span>
        <div>
          <h3 className="font-display text-3xl font-black">想先聊聊？留下线索就能开跑。</h3>
          <p className="mt-2 text-sm font-bold opacity-80">MVP 阶段推荐先用表单收集意向，再由客服完成试吃包转化。</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lead-name">称呼</Label>
          <Input id="lead-name" value={name} onChange={(e) => setName(e.target.value)} className="border-black/10 bg-white/80 text-[#17261f]" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-contact">微信 / 手机 / 邮箱</Label>
          <Input id="lead-contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="用于发送测评和试吃说明" className="border-black/10 bg-white/80 text-[#17261f] placeholder:text-[#17261f]/45" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Label htmlFor="lead-message">想了解什么</Label>
        <Textarea id="lead-message" value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-24 border-black/10 bg-white/80 text-[#17261f]" />
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button type="submit" variant="secondary" className="h-13 rounded-full px-6 font-black">
          <Send className="mr-2 h-5 w-5" />提交咨询线索
        </Button>
        <a href="mailto:hello@ninelives.example?subject=九命鲜厨试吃咨询" className="inline-flex h-13 items-center justify-center rounded-full border border-black/15 px-6 text-sm font-black transition hover:bg-black/10">
          <Mail className="mr-2 h-5 w-5" />邮件咨询入口
        </a>
      </div>
    </form>
  );
}
