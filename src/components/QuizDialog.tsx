/*
  设计路线：暗调私厨 × 宠物健康 DTC。
  组件目标：静态 MVP 的核心转化组件；无需后端即可完成问卷、生成推荐、保存线索，并预留第三方表单接入。
*/
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, CheckCircle2, Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { quizOptions } from "@/data/site";
import type { QuizLead } from "@/data/site";

const STORAGE_KEY = "nine-lives-kitchen-leads";

type QuizDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const getRecommendation = (lead: Omit<QuizLead, "submittedAt">) => {
  const isPicky = lead.picky.includes("非常") || lead.goals.includes("改善挑食");
  const gut = lead.goals.includes("肠胃更稳定");
  const weight = lead.goals.includes("控制体重");

  if (isPicky && gut) {
    return {
      title: "鸡肉温煮餐 + 冻干肠胃小方",
      desc: "先用气味温和的鸡肉鲜食打开食欲，再用冻干小方帮助换粮过渡。建议从 25% 鲜食比例开始。",
      plan: "试吃启动包 ¥39",
    };
  }
  if (weight) {
    return {
      title: "控热量鲜食订阅计划",
      desc: "按体重估算每日热量，先从单猫 3 日试吃开始，观察饱腹感与便便状态后再订阅。",
      plan: "单猫鲜食订阅 ¥199 / 2 周起",
    };
  }
  return {
    title: "原切鸡肉温煮餐试吃包",
    desc: "适合作为鲜食入门方案，先验证猫咪接受度，再决定是否加入周期配送。",
    plan: "试吃启动包 ¥39",
  };
};

export function QuizDialog({ open, onOpenChange }: QuizDialogProps) {
  const [step, setStep] = useState<"form" | "result">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<Omit<QuizLead, "submittedAt">>({
    catName: "奶盖",
    age: quizOptions.ages[1],
    weight: "4.6",
    picky: quizOptions.picky[1],
    goals: ["改善挑食", "肠胃更稳定"],
    contactType: quizOptions.contacts[0],
    contact: "",
    note: "",
  });

  const recommendation = useMemo(() => getRecommendation(form), [form]);

  const toggleGoal = (goal: string) => {
    setForm((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal) ? prev.goals.filter((item) => item !== goal) : [...prev.goals, goal],
    }));
  };

  const submitLead = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.contact.trim()) {
      toast.error("请留下一个联系方式，方便发送试吃与换粮建议。");
      return;
    }
    setIsSubmitting(true);
    const lead: QuizLead = { ...form, submittedAt: new Date().toISOString() };
    const previous = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as QuizLead[];
    localStorage.setItem(STORAGE_KEY, JSON.stringify([lead, ...previous].slice(0, 50)));

    window.setTimeout(() => {
      setIsSubmitting(false);
      setStep("result");
      toast.success("测评已生成，线索已暂存到浏览器。上线后可接飞书/表单服务。");
    }, 500);
  };

  const copyLead = async () => {
    const payload = JSON.stringify({ ...form, recommendation }, null, 2);
    await navigator.clipboard.writeText(payload);
    toast.success("测评数据已复制，可粘贴到表格或客服系统。");
  };

  const close = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      window.setTimeout(() => setStep("form"), 250);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/15 bg-[#14231c] text-foreground sm:max-w-3xl">
        <DialogHeader>
          <Badge className="mb-3 w-fit bg-primary text-primary-foreground hover:bg-primary">
            <Sparkles className="mr-2 h-4 w-4" />30 秒猫咪健康测评
          </Badge>
          <DialogTitle className="font-display text-3xl font-black md:text-4xl">先懂主子，再推荐试吃方案</DialogTitle>
          <DialogDescription className="text-foreground/65">
            静态 MVP 版本会把表单结果保存到浏览器本地；正式上线可把这里接入飞书多维表格、金数据或客服系统。
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <form onSubmit={submitLead} className="mt-4 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="catName">猫咪名字</Label>
                <Input id="catName" value={form.catName} onChange={(e) => setForm({ ...form, catName: e.target.value })} className="border-white/15 bg-white/10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">体重（kg）</Label>
                <Input id="weight" inputMode="decimal" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="border-white/15 bg-white/10" />
              </div>
            </div>

            <div className="space-y-3">
              <Label>年龄阶段</Label>
              <RadioGroup value={form.age} onValueChange={(age) => setForm({ ...form, age })} className="grid gap-3 md:grid-cols-3">
                {quizOptions.ages.map((age) => (
                  <Label key={age} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[.06] p-4 font-bold">
                    <RadioGroupItem value={age} /> {age}
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>挑食程度</Label>
              <RadioGroup value={form.picky} onValueChange={(picky) => setForm({ ...form, picky })} className="grid gap-3 md:grid-cols-3">
                {quizOptions.picky.map((item) => (
                  <Label key={item} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[.06] p-4 font-bold">
                    <RadioGroupItem value={item} /> {item}
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>最想解决的问题</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {quizOptions.goals.map((goal) => (
                  <Label key={goal} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[.06] p-4 font-bold">
                    <Checkbox checked={form.goals.includes(goal)} onCheckedChange={() => toggleGoal(goal)} /> {goal}
                  </Label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[.8fr_1.2fr]">
              <div className="space-y-3">
                <Label>联系方式类型</Label>
                <RadioGroup value={form.contactType} onValueChange={(contactType) => setForm({ ...form, contactType })} className="grid gap-2">
                  {quizOptions.contacts.map((item) => (
                    <Label key={item} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 font-bold">
                      <RadioGroupItem value={item} /> {item}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">联系方式</Label>
                <Input id="contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="例如：微信号 / 手机号 / 邮箱" className="border-white/15 bg-white/10" />
                <Label htmlFor="note" className="pt-2">补充说明</Label>
                <Textarea id="note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="例如：最近软便、黑下巴、只吃某个口味……" className="min-h-24 border-white/15 bg-white/10" />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="h-14 w-full rounded-full text-base font-black">
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
              生成专属试吃建议
            </Button>
          </form>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="rounded-[2rem] bg-primary p-6 text-primary-foreground">
              <div className="flex items-center gap-3 text-sm font-black">
                <CheckCircle2 className="h-5 w-5" />已为 {form.catName || "猫咪"} 生成推荐
              </div>
              <h3 className="mt-4 font-display text-3xl font-black">{recommendation.title}</h3>
              <p className="mt-3 text-base font-bold leading-8 opacity-85">{recommendation.desc}</p>
              <p className="mt-5 rounded-full bg-black/15 px-4 py-3 text-sm font-black">建议套餐：{recommendation.plan}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Button onClick={copyLead} variant="secondary" className="h-13 rounded-full font-black">
                <Copy className="mr-2 h-5 w-5" />复制测评线索
              </Button>
              <Button onClick={() => close(false)} className="h-13 rounded-full font-black">
                回到页面继续了解 <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm leading-7 text-foreground/55">
              上线接入建议：将表单提交地址替换为飞书多维表格 Webhook、金数据公开表单、Formspree endpoint 或企业微信客服二维码。
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
