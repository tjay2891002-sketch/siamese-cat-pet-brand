/*
  设计路线：暗调私厨 × 宠物健康 DTC。
  首页执行：把 PRD 中的 Smalls 高转化漏斗中文化为“先测评、再试吃、再订阅”的可上线 MVP；
  交互上接入真实前端测评、线索收集、套餐展示与静态表单落地策略。
*/
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, BadgeCheck, Cat, Check, ChefHat, ClipboardCopy, Clock3, HeartPulse, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, Sparkles, Star, Truck, Utensils, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { QuizDialog } from "@/components/QuizDialog";
import { LeadCapture } from "@/components/LeadCapture";
import ParticleField from "@/components/ParticleField";
import ChatWidget from "@/components/chat/ChatWidget";
import { CartDrawer, type CartItem } from "@/components/Cart";
import { isLocalHost, useBackendHealth } from "@/hooks/useBackendHealth";
import { findExactMatch, matchesTrendFilters } from "@/lib/recommendation";
import { brand, comparisons, faqs, navItems, products, proofItems, recommendationFilterOptions, recommendationMatrix, reviews, stats, steps, subscriptionPlans } from "@/data/site";

import catWindow from "@/assets/cats/cat-window.webp";
import brandFilm from "@/assets/cats/siamese-brand-film.mp4?url";

interface HomeProps {
  targetSection?: string;
}

const stepIcons = [Cat, ChefHat, Truck];

const CART_KEY = "nine-lives-kitchen-cart";
const toneColors = ["#2c4437", "#1d3a2f", "#273f31", "#20332a", "#2b3d33", "#24372e"];

const categorySections = [
  { key: "food", label: "主食" },
  { key: "snack", label: "零食" },
  { key: "litter", label: "猫砂猫厕" },
  { key: "care", label: "营养保健" },
  { key: "toy", label: "玩具" },
  { key: "grooming", label: "美容护理" },
] as const;

export default function Home({ targetSection }: HomeProps) {
  const [quizOpen, setQuizOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [trendFilters, setTrendFilters] = useState<Record<"age" | "weight" | "feeding", string[]>>({ age: [], weight: [], feeding: [] });
  const [catMatchForm, setCatMatchForm] = useState<Record<"age" | "weight" | "feeding", string>>({ age: "", weight: "", feeding: "" });
  const [trialPlanGenerated, setTrialPlanGenerated] = useState(false);
  const [trialPlanItems, setTrialPlanItems] = useState<Array<{ id: string; label: string; done: boolean }>>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const backendHealth = useBackendHealth();
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const page = targetSection === "shop" ? "shop" : targetSection === "recommend" ? "recommend" : "home";
  // 每页独立滚动记忆：首次进入回到顶部，切回时恢复该页上次所在位置
  const pageScrollRef = useRef<Record<string, number>>({});
  const activePageRef = useRef(page);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [plansOpen, setPlansOpen] = useState(false);
  const toggleCategory = (key: string) => setOpenCategories((prev) => ({ ...prev, [key]: !prev[key] }));

  const filterLabels = {
    age: "年龄段",
    weight: "体重区间",
    feeding: "喂养方式",
  } as const;

  const toggleTrendFilter = (dimension: "age" | "weight" | "feeding", value: string) => {
    setTrendFilters((prev) => {
      const exists = prev[dimension].includes(value);
      return {
        ...prev,
        [dimension]: exists ? prev[dimension].filter((item) => item !== value) : [...prev[dimension], value],
      };
    });
  };

  const clearTrendFilters = () => {
    setTrendFilters({ age: [], weight: [], feeding: [] });
    setCatMatchForm({ age: "", weight: "", feeding: "" });
    setTrialPlanGenerated(false);
    setTrialPlanItems([]);
  };

  const updateCatMatchForm = (dimension: "age" | "weight" | "feeding", value: string) => {
    const next = { ...catMatchForm, [dimension]: value };
    setCatMatchForm(next);
    setTrialPlanGenerated(false);
    setTrialPlanItems([]);
    setTrendFilters({
      age: next.age ? [next.age] : [],
      weight: next.weight ? [next.weight] : [],
      feeding: next.feeding ? [next.feeding] : [],
    });
  };

  const isOptionAvailable = (dimension: "age" | "weight" | "feeding", value: string) => {
    return recommendationMatrix.some((record) => record[dimension] === value && matchesTrendFilters(record, trendFilters, { [dimension]: [] }));
  };

  const activeTrendRecords = useMemo(() => recommendationMatrix.filter((record) => matchesTrendFilters(record, trendFilters)), [trendFilters]);
  const chartPoints = useMemo(() => {
    const issues = Array.from(new Set(recommendationMatrix.map((item) => item.issue)));
    return issues
      .map((issue) => {
        const rows = activeTrendRecords.filter((item) => item.issue === issue);
        const sample = rows.reduce((sum, item) => sum + item.sample, 0);
        const weightedRate = sample ? Math.round(rows.reduce((sum, item) => sum + item.rate * item.sample, 0) / sample) : 0;
        const best = rows.slice().sort((a, b) => b.rate - a.rate)[0];
        return { label: issue, rate: weightedRate, sample, plan: best?.plan ?? "暂无匹配推荐" };
      })
      .filter((item) => item.sample > 0)
      .map((point, index, arr) => ({
        ...point,
        x: arr.length === 1 ? 50 : 8 + (index * 84) / (arr.length - 1),
        y: 92 - ((point.rate - 65) / 35) * 72,
      }));
  }, [activeTrendRecords]);
  const chartPath = chartPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const sampleTotal = activeTrendRecords.reduce((sum, item) => sum + item.sample, 0);
  const selectedFilterTotal = trendFilters.age.length + trendFilters.weight.length + trendFilters.feeding.length;
  const weightedTotalRate = sampleTotal ? Math.round(activeTrendRecords.reduce((sum, item) => sum + item.rate * item.sample, 0) / sampleTotal) : 0;
  const selectedTrendSummary = (["age", "weight", "feeding"] as const).flatMap((dimension) =>
    trendFilters[dimension].map((value) => ({ dimension, label: filterLabels[dimension], value })),
  );
  const sortedTrendRecords = activeTrendRecords.slice().sort((a, b) => b.rate - a.rate);
  const topTrendRecord = sortedTrendRecords[0];
  const exactCatMatch = findExactMatch(recommendationMatrix, catMatchForm);
  const catMatchFilledCount = (["age", "weight", "feeding"] as const).filter((dimension) => catMatchForm[dimension]).length;
  const catMatchReady = catMatchFilledCount === 3;
  const generateTrialPlan = () => {
    if (!catMatchReady || !exactCatMatch) {
      toast.error("请先补齐年龄段、体重区间和喂养方式，再生成试吃方案。");
      return;
    }
    setTrialPlanItems([
      { id: "profile", label: `猫咪画像：${exactCatMatch.age} / ${exactCatMatch.weight} / ${exactCatMatch.feeding}`, done: true },
      { id: "issue", label: `主要问题类型：${exactCatMatch.issue}，推荐命中率 ${exactCatMatch.rate}%（样本 ${exactCatMatch.sample}）`, done: true },
      { id: "plan", label: `建议试吃方案：${exactCatMatch.plan}`, done: true },
      { id: "transition", label: "换粮建议：前 3 天按 25% 鲜食比例混合，观察便便和食欲后逐步提高。", done: false },
      { id: "followup", label: "客服跟进：确认城市冷链范围、猫咪禁忌食材、试吃包发货时间。", done: false },
    ]);
    setTrialPlanGenerated(true);
    toast.success(`已生成试吃方案：${exactCatMatch.plan}`);
  };

  const toggleTrialPlanItem = (id: string) => {
    setTrialPlanItems((items) => items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };

  const copyTrialPlanForService = async () => {
    if (!exactCatMatch || !trialPlanItems.length) {
      toast.error("请先生成试吃方案，再复制给客服/飞书表单。");
      return;
    }
    const content = [
      "【基米厨房试吃方案线索】",
      `年龄段：${catMatchForm.age || "未填写"}`,
      `体重区间：${catMatchForm.weight || "未填写"}`,
      `喂养方式：${catMatchForm.feeding || "未填写"}`,
      `匹配问题：${exactCatMatch.issue}`,
      `推荐命中率：${exactCatMatch.rate}%` ,
      `样本量：${exactCatMatch.sample}`,
      "",
      "【可执行清单】",
      ...trialPlanItems.map((item, index) => `${index + 1}. ${item.done ? "[已确认]" : "[待确认]"} ${item.label}`),
    ].join("\n");
    await navigator.clipboard.writeText(content);
    toast.success("试吃方案清单已复制，可直接粘贴给客服或飞书表单。");
  };

  useEffect(() => {
    if (targetSection && targetSection !== "shop" && targetSection !== "recommend") {
      document.getElementById(targetSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [targetSection]);

  useEffect(() => {
    history.scrollRestoration = "manual";
    const handleScroll = () => {
      pageScrollRef.current[activePageRef.current] = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useLayoutEffect(() => {
    const prevPage = activePageRef.current;
    if (prevPage === page) return;
    const next = pageScrollRef.current[page] ?? 0;
    activePageRef.current = page;
    window.scrollTo(0, next);
  }, [page]);

  const openQuiz = () => setQuizOpen(true);
  const scrollToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const addToCart = useCallback((item: Omit<CartItem, "qty">) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id && i.kind === item.kind);
      const next: CartItem[] = existing
        ? prev.map((i) => (i.id === item.id && i.kind === item.kind ? { ...i, qty: i.qty + 1 } : i))
        : [...prev, { ...item, qty: 1 }];
      localStorage.setItem(CART_KEY, JSON.stringify(next));
      return next;
    });
  }, []);


  return (
    <main className="grain min-h-screen overflow-hidden text-foreground">
      <ParticleField />
      <QuizDialog open={quizOpen} onOpenChange={setQuizOpen} />

      <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/10 bg-[#16261f]/80 backdrop-blur-2xl">
        <div className="flex items-center justify-center bg-primary px-4 py-2 text-center text-[13px] font-black tracking-wide text-primary-foreground">
          新人限时：首单试吃 5 折 + 终身赠冻干小样 · 今天为主子开餐
        </div>
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8" aria-label="主导航">
          <Link href="/" className="group flex items-center gap-3" aria-label="回到首页">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_0_28px_rgba(230,161,65,.35)] transition-transform group-hover:rotate-12">
              <Cat className="h-6 w-6" />
            </span>
            <span>
              <span className={"block font-display text-xl font-black leading-none " + (page === "home" ? "[text-shadow:0_0_14px_rgba(255,255,255,.4)]" : "")}>{brand.name}</span>
              <span className="text-xs font-bold tracking-[0.28em] text-primary/80">{brand.englishName}</span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => {
              const isActive = page === item.href.slice(1);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "rounded-full px-4 py-2 text-sm font-bold transition " +
                    (isActive
                      ? "bg-white/10 text-primary"
                      : "text-foreground/75 hover:bg-white/10 hover:text-primary")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {isLocalHost() && (
              <span
                className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-foreground/60 sm:flex"
                title={backendHealth === "online" ? "后台服务在线" : backendHealth === "offline" ? "后台服务离线" : "正在检测后台服务"}
              >
                <span className={"h-1.5 w-1.5 rounded-full " + (backendHealth === "online" ? "bg-emerald-400" : backendHealth === "offline" ? "bg-red-400" : "bg-amber-300")} />
                {backendHealth === "online" ? "服务在线" : backendHealth === "offline" ? "服务离线" : "连接中"}
              </span>
            )}
            <button onClick={() => setCartOpen(true)} className="relative grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-foreground/80 transition hover:border-primary hover:text-primary" aria-label="打开购物车">
              <ShoppingBag className="h-5 w-5" />
              {cartItems.length > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-black text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </button>
            <Link href="/recommend">
              <Button className="rounded-full px-5 font-black shadow-[0_16px_40px_rgba(230,161,65,.26)]" aria-label="开启测评">
                开启测评 <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </nav>
      </header>

          {page === "home" && (
            <>
      <section className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-4 pb-24 pt-44 md:px-8 lg:grid-cols-[1.05fr_.95fr] lg:pt-40">
        <div className="absolute -left-24 top-40 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="reveal-up relative z-10">
          <Badge className="mb-6 rounded-full border border-primary/30 bg-primary/15 px-4 py-2 text-sm font-black text-primary hover:bg-primary/15">
            <Sparkles className="mr-2 h-4 w-4" />不是猫粮，是专属健康开餐计划
          </Badge>
          <h1 className="font-display text-balance text-5xl font-black leading-[0.96] tracking-[-0.05em] text-foreground md:text-7xl xl:text-8xl">
            {brand.slogan}
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-9 text-foreground/76 md:text-xl">
            基于可上线 MVP 设计：先用猫咪健康测评收集真实需求，再推荐低温温煮鲜食、试吃套餐和用品组合。静态站也能承接转化，后续可无缝接入飞书表格、客服与支付系统。
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link href="/recommend">
              <Button size="lg" className="h-14 rounded-full px-7 text-base font-black">
                30 秒生成猫咪方案 <Wand2 className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/plans">
              <Button size="lg" variant="secondary" className="h-14 rounded-full px-7 text-base font-black">
                查看试吃套餐 <PackageCheck className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 text-sm md:grid-cols-4">
            {proofItems.map((item) => (
              <div key={item} className="glass-card rounded-2xl px-4 py-3 font-bold text-foreground/86">
                <Check className="mb-2 h-4 w-4 text-primary" />{item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 min-h-[620px] reveal-up [animation-delay:.12s]">
          <div className="absolute left-0 top-10 h-[520px] w-[78%] overflow-hidden rounded-[2.4rem] border border-white/15 shadow-[0_40px_120px_rgba(0,0,0,.44)] md:left-8">
            <video className="h-full w-full object-cover" src={brandFilm} poster={catWindow} autoPlay muted loop playsInline aria-label="暹罗猫品牌氛围视频" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#16261f]/80 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 rounded-3xl bg-black/45 p-4 backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[.3em] text-primary">Kitchen Film</p>
              <p className="mt-1 text-lg font-black">戴帽主厨，今日营业</p>
            </div>
          </div>
          <img src={catWindow} alt="戴蓝色帽子的暹罗猫望向窗外" className="float-slow absolute right-0 top-0 h-[350px] w-[54%] rounded-[2rem] border-4 border-[#eadfbd] object-cover shadow-[0_30px_80px_rgba(0,0,0,.42)]" />
          <div className="absolute bottom-8 right-3 w-[78%] rotate-[-2deg] rounded-[2rem] bg-primary p-5 text-primary-foreground shadow-[0_22px_70px_rgba(230,161,65,.33)] md:right-10 md:w-[58%]">
            <p className="font-display text-4xl font-black leading-none">100%</p>
            <p className="mt-2 text-sm font-black">猫咪不爱吃，全额包退。先试吃，再决定长期订阅。</p>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-black/20 py-5" aria-label="品牌卖点滚动条">
        <div className="marquee-track flex w-[200%] gap-6 whitespace-nowrap text-sm font-black tracking-[.18em] text-foreground/65">
          {[...proofItems, ...proofItems, ...proofItems, ...proofItems].map((item, index) => (
            <span key={`${item}-${index}`} className="flex items-center gap-4">
              <Star className="h-4 w-4 fill-primary text-primary" /> {item}
            </span>
          ))}
        </div>
      </section>


        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-4 py-4 md:px-8" aria-label="首页快捷导航">
          {[{ id: "nutrition", label: "配方" }, { id: "kitchen", label: "透明厨房" }, { id: "faq", label: "常见疑虑" }].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToSection(item.id)}
              className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-black text-foreground/70 transition hover:border-primary hover:text-primary"
            >
              {item.label}
            </button>
          ))}
        </nav>

      <section id="nutrition" className="relative mx-auto max-w-7xl px-4 py-24 md:px-8">
        <div className="mb-12 grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
          <div>
            <Badge className="mb-5 bg-white/10 text-foreground hover:bg-white/10">营养主张</Badge>
            <h2 className="font-display text-4xl font-black tracking-[-0.04em] md:text-6xl">该有的都在，不该有的一口不加。</h2>
          </div>
          <p className="text-lg leading-9 text-foreground/70">PRD 的核心不是“卖猫粮”，而是用透明配方降低决策焦虑。我们把传统膨化粮的痛点直接摊开，再给出更安心的鲜食路径。</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {comparisons.map((row, index) => (
            <Card key={row.good} className="magnetic-hover glass-card overflow-hidden rounded-[2rem] border-white/15 bg-transparent text-card-foreground">
              <CardContent className="p-0">
                <div className="border-b border-white/10 bg-destructive/20 p-6">
                  <p className="mb-2 text-xs font-black tracking-[.25em] text-red-200">传统问题 0{index + 1}</p>
                  <p className="text-lg font-black text-foreground/86">{row.bad}</p>
                </div>
                <div className="p-6">
                  <p className="mb-2 text-xs font-black tracking-[.25em] text-primary">鲜厨方案</p>
                  <p className="text-xl font-black leading-8">{row.good}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section id="kitchen" className="mx-auto grid max-w-7xl gap-10 px-4 py-24 md:px-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
        <div className="relative">
          <img src={catWindow} alt="暹罗猫在窗边观察" className="h-[620px] w-full rounded-[2.4rem] object-cover shadow-[0_30px_90px_rgba(0,0,0,.36)]" />
          <div className="absolute -bottom-8 right-6 max-w-sm rounded-[2rem] bg-primary p-6 text-primary-foreground shadow-2xl">
            <p className="font-display text-4xl font-black">Chop · Steam · Freeze · Ship</p>
            <p className="mt-3 font-bold opacity-85">切碎、温蒸、速冻、冷链发出。把厨房说清楚，才值得被信任。</p>
          </div>
        </div>
        <div className="lg:pl-8">
          <Badge className="mb-5 bg-white/10 text-foreground hover:bg-white/10">透明厨房</Badge>
          <h2 className="font-display text-4xl font-black tracking-[-0.04em] md:text-6xl">看得见的工艺，比营销词更有说服力。</h2>
          <div className="mt-8 space-y-5">
            {[{ icon: Utensils, text: "人食级原切肉源，分批检测留样" }, { icon: Clock3, text: "低温慢煮，保留肉质口感与水分" }, { icon: ShieldCheck, text: "冷冻锁鲜，配送节点可追踪" }].map(({ icon: Icon, text }) => (
              <div key={text} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[.05] p-5">
                <Icon className="mt-1 h-6 w-6 shrink-0 text-primary" />
                <p className="text-lg font-bold leading-8 text-foreground/76">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>





      <section className="mx-auto max-w-7xl px-4 py-24 md:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {stats.map((item) => (
            <div key={item.value} className="glass-card rounded-[2rem] p-8">
              <p className="font-display text-6xl font-black text-primary">{item.value}</p>
              <h3 className="mt-4 text-2xl font-black">{item.label}</h3>
              <p className="mt-3 text-sm font-bold text-foreground/55">{item.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = stepIcons[index];
            return (
              <div key={step.title} className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.06] p-7">
                <Icon className="mb-10 h-11 w-11 text-primary" />
                <h3 className="text-2xl font-black">{step.title}</h3>
                <p className="mt-4 leading-8 text-foreground/67">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>


      <section id="faq" className="mx-auto grid max-w-7xl gap-10 px-4 py-24 md:px-8 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <Badge className="mb-5 bg-primary/15 text-primary hover:bg-primary/15">常见疑虑</Badge>
          <h2 className="font-display text-4xl font-black tracking-[-0.04em] md:text-6xl">猫不吃怎么办？预算会不会爆？</h2>
          <p className="mt-6 leading-8 text-foreground/68">把购买前最常见的犹豫放在最后一次转化前解决，降低试吃门槛。</p>
        </div>
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={faq.q} value={`q${index}`} className="rounded-3xl border border-white/10 bg-white/[.06] px-6">
              <AccordionTrigger className="text-left text-xl font-black">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-base leading-8 text-foreground/68">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>


            </>
          )}
          {page === "shop" && (
            <>
      <section id="shop" className="relative bg-[#111d18] pb-24 pt-40 md:pt-44">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Badge className="mb-5 bg-primary/15 text-primary hover:bg-primary/15">Goods for cats</Badge>
              <h2 className="font-display text-4xl font-black tracking-[-0.04em] md:text-6xl">主食、零食、用品，一次配齐。</h2>
            </div>
            <Button variant="secondary" onClick={() => setCartOpen(true)} className="h-13 rounded-full px-6 font-black">打开购物车 <ShoppingBag className="ml-2 h-5 w-5" /></Button>
          </div>

          <div className="space-y-4">
            {categorySections.map((section) => {
              const items = products.filter((product) => product.category === section.key);
              const open = !!openCategories[section.key];
              return (
                <div key={section.key} className="rounded-[1.8rem] border border-white/10 bg-white/[.04]">
                  <button
                    type="button"
                    onClick={() => toggleCategory(section.key)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left md:p-6"
                    aria-expanded={open}
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-2xl font-black md:text-3xl">{section.label}</h3>
                      <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-black text-primary">{items.length} 件</span>
                    </div>
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                      {open ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </span>
                  </button>
                  {open && (
                    <div className="grid gap-6 border-t border-white/10 p-5 sm:grid-cols-2 lg:grid-cols-4 md:p-6">
                      {items.map((product) => (
                        <Card key={product.id} className="magnetic-hover overflow-hidden rounded-[2rem] border-white/10 bg-[#20332a] text-card-foreground">
                          <CardContent className="p-0">
                            <div className="relative grid h-52 place-items-center" style={{ backgroundColor: toneColors[product.tone] }}>
                              <span className="text-7xl drop-shadow-[0_8px_18px_rgba(0,0,0,.35)]">{product.emoji}</span>
                              <Badge className="absolute left-4 top-4 bg-primary text-primary-foreground hover:bg-primary">{product.tag}</Badge>
                            </div>
                            <div className="p-5">
                              <h3 className="font-display text-xl font-black">{product.title}</h3>
                              <p className="mt-3 min-h-16 text-sm leading-7 text-foreground/68">{product.desc}</p>
                              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                                <span className="font-black text-primary">{product.price}</span>
                                <Button size="sm" onClick={() => addToCart({ id: product.id, title: product.title, price: product.priceValue, emoji: product.emoji, kind: "product" })} className="rounded-full">加入购物车</Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="rounded-[1.8rem] border border-white/10 bg-white/[.04]">
              <button
                type="button"
                onClick={() => setPlansOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left md:p-6"
                aria-expanded={plansOpen}
              >
                <div className="flex items-center gap-3">
                  <h3 className="font-display text-2xl font-black md:text-3xl">订阅套餐</h3>
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-black text-primary">{subscriptionPlans.length} 个方案</span>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                  {plansOpen ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </span>
              </button>
              {plansOpen && (
                <div className="grid gap-4 border-t border-white/10 p-5 md:p-6 lg:grid-cols-3">
                  {subscriptionPlans.map((plan) => (
                    <article key={plan.id} className="rounded-[1.5rem] bg-[#20332a] p-6 text-foreground shadow-xl">
                      <Badge className="mb-4 bg-primary text-primary-foreground hover:bg-primary">{plan.highlight}</Badge>
                      <h3 className="font-display text-2xl font-black">{plan.name}</h3>
                      <p className="mt-2 text-sm leading-7 text-foreground/65">{plan.desc}</p>
                      <div className="mt-5 flex items-end gap-2">
                        <span className="font-display text-4xl font-black text-primary">{plan.price}</span>
                        <span className="pb-1 text-sm font-bold text-foreground/55">{plan.period}</span>
                      </div>
                      <ul className="mt-4 space-y-2">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex gap-3 text-sm font-bold text-foreground/76"><Check className="h-5 w-5 shrink-0 text-primary" />{feature}</li>
                        ))}
                      </ul>
                      <Button onClick={() => addToCart({ id: plan.id, title: plan.name, price: plan.priceValue, emoji: "📦", kind: "plan" })} className="mt-5 w-full rounded-full font-black">加入购物车</Button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>






            </>
          )}
          {page === "recommend" && (
            <>
      <section id="reviews" className="cream-panel pb-24 pt-40 md:pt-44">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-12 max-w-3xl">
            <Badge className="mb-5 bg-[#14251d] text-primary hover:bg-[#14251d]">测评生成器</Badge>
            <h2 className="font-display text-4xl font-black tracking-[-0.04em] md:text-6xl">30 秒生成猫咪试吃方案。</h2>
          </div>
          <div id="recommend" className="mb-12 rounded-[2.2rem] bg-[#14251d] p-5 text-foreground shadow-xl md:p-8">
            <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-black tracking-[.28em] text-primary">LINKED FILTER DASHBOARD</p>
                <h3 className="mt-2 font-display text-3xl font-black md:text-4xl">推荐命中率联动筛选图表</h3>
              </div>
              <p className="max-w-md text-sm font-bold leading-7 text-foreground/58">MVP 样例数据：年龄段、体重区间、喂养方式支持多选；无数据组合会自动变灰，图表根据当前筛选实时重算。</p>
            </div>

            <div className="mb-7 grid gap-4 lg:grid-cols-3" aria-label="推荐命中率联动筛选器">
              {(["age", "weight", "feeding"] as const).map((dimension) => (
                <div key={dimension} className="rounded-[1.5rem] border border-white/10 bg-white/[.055] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-black tracking-[.18em] text-primary">{filterLabels[dimension]}</h4>
                    <span className="text-xs font-black text-foreground/38">可多选</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recommendationFilterOptions[dimension].map((option) => {
                      const selected = trendFilters[dimension].includes(option);
                      const available = isOptionAvailable(dimension, option);
                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={!available && !selected}
                          aria-pressed={selected}
                          onClick={() => toggleTrendFilter(dimension, option)}
                          className={`rounded-full px-3.5 py-2 text-xs font-black transition ${selected ? "bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(230,161,65,.24)]" : available ? "bg-white/10 text-foreground/70 hover:bg-white/15 hover:text-foreground" : "cursor-not-allowed bg-white/[.035] text-foreground/22"}`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6 rounded-[1.6rem] border border-primary/25 bg-primary/10 p-4 md:p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground">筛选摘要</span>
                    <span className="text-sm font-black text-primary">{selectedFilterTotal ? `已选择 ${selectedFilterTotal} 个条件` : "当前查看全部样本"}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2" aria-label="当前已选筛选条件">
                    {selectedTrendSummary.length ? (
                      selectedTrendSummary.map((item) => (
                        <button
                          key={`${item.dimension}-${item.value}`}
                          type="button"
                          onClick={() => toggleTrendFilter(item.dimension, item.value)}
                          className="rounded-full border border-primary/25 bg-[#14251d] px-3 py-2 text-xs font-black text-foreground transition hover:border-primary hover:text-primary"
                          title="点击移除此筛选条件"
                        >
                          {item.label}：{item.value} ×
                        </button>
                      ))
                    ) : (
                      <span className="rounded-full border border-white/10 bg-white/[.06] px-3 py-2 text-xs font-black text-foreground/55">未选择筛选条件 · 展示全部样本</span>
                    )}
                  </div>
                </div>

                <div className="grid min-w-[260px] grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl bg-[#14251d] px-3 py-3">
                    <p className="text-xs font-black text-foreground/45">匹配样本</p>
                    <p className="mt-1 font-display text-2xl font-black text-primary">{sampleTotal}</p>
                  </div>
                  <div className="rounded-2xl bg-[#14251d] px-3 py-3">
                    <p className="text-xs font-black text-foreground/45">平均命中</p>
                    <p className="mt-1 font-display text-2xl font-black text-primary">{weightedTotalRate}%</p>
                  </div>
                  <Button type="button" variant="secondary" onClick={clearTrendFilters} disabled={!selectedFilterTotal} className="h-full rounded-2xl px-3 text-sm font-black disabled:opacity-40">
                    一键重置
                  </Button>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-4 md:flex-row md:items-center md:justify-between">
                <p className="text-xs font-bold leading-6 text-foreground/45">提示：点击摘要标签可单独移除条件；点击“一键重置”可恢复全部样本视图。</p>
                <Button type="button" onClick={() => setDetailDrawerOpen(true)} className="rounded-full px-5 font-black">
                  查看筛选结果详情 <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <Sheet open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}>
              <SheetContent side="right" className="w-full overflow-y-auto border-white/10 bg-[#14251d] text-foreground sm:max-w-2xl">
                <SheetHeader className="border-b border-white/10 p-6">
                  <SheetTitle className="font-display text-3xl font-black text-foreground">筛选结果详情</SheetTitle>
                  <SheetDescription className="text-foreground/58">
                    展开查看当前筛选命中的分组样本明细、命中率、样本量、推荐方案和推荐依据。
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-5 p-6">
                  <div className="rounded-[1.5rem] border border-primary/25 bg-primary/10 p-5">
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl bg-black/20 p-4">
                        <p className="text-xs font-black text-foreground/45">匹配分组</p>
                        <p className="mt-1 font-display text-3xl font-black text-primary">{activeTrendRecords.length}</p>
                      </div>
                      <div className="rounded-2xl bg-black/20 p-4">
                        <p className="text-xs font-black text-foreground/45">匹配样本</p>
                        <p className="mt-1 font-display text-3xl font-black text-primary">{sampleTotal}</p>
                      </div>
                      <div className="rounded-2xl bg-black/20 p-4">
                        <p className="text-xs font-black text-foreground/45">平均命中</p>
                        <p className="mt-1 font-display text-3xl font-black text-primary">{weightedTotalRate}%</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedTrendSummary.length ? selectedTrendSummary.map((item) => (
                        <span key={`${item.dimension}-${item.value}`} className="rounded-full bg-[#14251d] px-3 py-2 text-xs font-black text-foreground/78">
                          {item.label}：{item.value}
                        </span>
                      )) : <span className="rounded-full bg-[#14251d] px-3 py-2 text-xs font-black text-foreground/58">全部样本视图</span>}
                    </div>
                  </div>

                  {topTrendRecord && (
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[.055] p-5">
                      <p className="text-xs font-black tracking-[.22em] text-primary">TOP MATCH</p>
                      <h4 className="mt-2 text-2xl font-black">当前最高命中组合：{topTrendRecord.age} · {topTrendRecord.weight} · {topTrendRecord.feeding}</h4>
                      <p className="mt-3 text-sm font-bold leading-7 text-foreground/58">
                        推荐依据：该组合属于“{topTrendRecord.issue}”问题类型，样本量 {topTrendRecord.sample}，命中率 {topTrendRecord.rate}%。当前推荐更适合优先展示「{topTrendRecord.plan}」。
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {sortedTrendRecords.length ? sortedTrendRecords.map((record, index) => (
                      <article key={`${record.age}-${record.weight}-${record.feeding}-${record.issue}`} className="rounded-[1.35rem] border border-white/10 bg-white/[.05] p-5">
                        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                          <div>
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-foreground/70">#{index + 1}</span>
                              <span className="rounded-full bg-primary px-3 py-1 text-xs font-black text-primary-foreground">{record.rate}% 命中</span>
                              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-foreground/70">样本 {record.sample}</span>
                            </div>
                            <h4 className="mt-4 text-xl font-black">{record.age} · {record.weight} · {record.feeding}</h4>
                            <p className="mt-2 text-sm font-bold text-foreground/52">问题类型：{record.issue}</p>
                          </div>
                          <div className="rounded-2xl bg-black/20 px-4 py-3 text-right md:min-w-44">
                            <p className="text-xs font-black text-foreground/45">推荐方案</p>
                            <p className="mt-1 text-sm font-black leading-6 text-primary">{record.plan}</p>
                          </div>
                        </div>
                        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${record.rate}%` }} />
                        </div>
                        <p className="mt-3 text-xs font-bold leading-6 text-foreground/45">
                          推荐依据：按当前猫咪档案维度，该组合的历史样本显示“{record.issue}”相关推荐接受度为 {record.rate}%；样本量越高，后续越适合进入自动推荐规则。
                        </p>
                      </article>
                    )) : (
                      <div className="rounded-[1.35rem] border border-white/10 bg-white/[.05] p-6 text-center">
                        <p className="text-lg font-black">当前筛选暂无匹配样本</p>
                        <p className="mt-2 text-sm text-foreground/52">可以减少筛选条件，或等待真实运营数据补充更多组合。</p>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="mb-6 overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[.055]">
              <div className="border-b border-white/10 bg-black/15 p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                  <div>
                    <p className="text-sm font-black tracking-[.24em] text-primary">CAT MATCH WIZARD</p>
                    <h4 className="mt-2 font-display text-2xl font-black md:text-3xl">我家猫咪命中哪个组合？</h4>
                  </div>
                  <p className="max-w-md text-sm font-bold leading-6 text-foreground/50">填写基础情况后自动联动筛选，先预估命中组合，再一键生成试吃方案。</p>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {[
                    { step: "01", title: "填写", desc: `${catMatchFilledCount}/3 项已完成`, active: catMatchFilledCount < 3 },
                    { step: "02", title: "预估", desc: exactCatMatch ? `${exactCatMatch.rate}% 命中` : "等待样本匹配", active: catMatchFilledCount === 3 && !trialPlanGenerated },
                    { step: "03", title: "生成", desc: trialPlanGenerated ? "试吃方案已生成" : "一键输出方案", active: trialPlanGenerated },
                  ].map((item) => (
                    <div key={item.step} className={`rounded-2xl border px-4 py-3 transition ${item.active ? "border-primary bg-primary/15" : "border-white/10 bg-white/[.045]"}`}>
                      <p className="text-xs font-black tracking-[.22em] text-primary">STEP {item.step}</p>
                      <p className="mt-1 text-lg font-black">{item.title}</p>
                      <p className="mt-1 text-xs font-bold text-foreground/45">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-[.95fr_1.05fr]">
                <div className="space-y-3">
                  {(["age", "weight", "feeding"] as const).map((dimension) => (
                    <label key={dimension} className="block rounded-[1.2rem] bg-black/15 p-4">
                      <span className="mb-2 block text-xs font-black tracking-[.18em] text-primary">{filterLabels[dimension]}</span>
                      <select
                        value={catMatchForm[dimension]}
                        onChange={(event) => updateCatMatchForm(dimension, event.target.value)}
                        className="h-11 w-full rounded-xl border border-white/10 bg-[#14251d] px-3 text-sm font-black text-foreground outline-none ring-primary/0 transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                      >
                        <option value="">请选择</option>
                        {recommendationFilterOptions[dimension].map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>

                <div className="rounded-[1.35rem] bg-primary/10 p-5">
                  {exactCatMatch ? (
                    <div className="flex h-full flex-col justify-between gap-5">
                      <div>
                        <p className="text-xs font-black tracking-[.18em] text-primary">预估匹配结果</p>
                        <h5 className="mt-2 text-2xl font-black leading-tight">{exactCatMatch.age} · {exactCatMatch.weight} · {exactCatMatch.feeding}</h5>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-[#14251d] p-4">
                            <p className="text-xs font-black text-foreground/45">问题类型</p>
                            <p className="mt-1 text-lg font-black text-primary">{exactCatMatch.issue}</p>
                          </div>
                          <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
                            <p className="text-xs font-black opacity-75">预估命中</p>
                            <p className="mt-1 font-display text-3xl font-black">{exactCatMatch.rate}%</p>
                          </div>
                        </div>
                        <p className="mt-4 text-sm font-bold leading-7 text-foreground/55">推荐依据：同类样本 {exactCatMatch.sample} 组，当前组合更适合优先尝试「{exactCatMatch.plan}」。</p>
                      </div>

                      <div className="rounded-[1.2rem] border border-white/10 bg-black/15 p-4">
                        <p className="text-xs font-black tracking-[.18em] text-primary">试吃方案</p>
                        {trialPlanGenerated ? (
                          <>
                            <p className="mt-2 text-xl font-black">{exactCatMatch.plan}</p>
                            <ul className="mt-3 space-y-2">
                              {trialPlanItems.map((item, index) => (
                                <li key={item.id}>
                                  <button
                                    type="button"
                                    onClick={() => toggleTrialPlanItem(item.id)}
                                    className={`flex w-full items-start gap-2 text-left text-sm font-bold leading-6 ${
                                      item.done ? "text-foreground/45 line-through" : "text-foreground/80"
                                    }`}
                                  >
                                    <span className={`mt-1 grid size-4 shrink-0 place-items-center rounded-full border ${item.done ? "border-primary bg-primary text-primary-foreground" : "border-white/25"}`}>
                                      {item.done ? <Check className="h-3 w-3" /> : null}
                                    </span>
                                    <span>{index + 1}. {item.label}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                              <Button type="button" onClick={copyTrialPlanForService} className="rounded-full font-black">
                                <ClipboardCopy className="mr-2 h-4 w-4" /> 复制清单
                              </Button>
                              <Button type="button" variant="secondary" onClick={generateTrialPlan} className="rounded-full font-black">
                                重新生成
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="mt-2 text-xl font-black">完成填写后可一键生成</p>
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                              <Button type="button" onClick={generateTrialPlan} disabled={!catMatchReady} className="rounded-full font-black disabled:opacity-45">
                                一键生成试吃方案 <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                              <Button type="button" variant="secondary" onClick={openQuiz} className="rounded-full font-black">
                                带入完整测评
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full min-h-72 flex-col items-center justify-center rounded-[1.2rem] border border-dashed border-white/15 p-6 text-center">
                      <p className="font-display text-2xl font-black">先完成左侧填写</p>
                      <p className="mt-3 text-sm font-bold leading-7 text-foreground/50">选择年龄段、体重区间、喂养方式后，会自动预估命中组合并联动看板筛选。</p>
                      <Button type="button" variant="secondary" onClick={clearTrendFilters} className="mt-5 rounded-full font-black">重置表单</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {chartPoints.length ? (
              <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr] lg:items-stretch">
                <div className="rounded-[1.7rem] border border-white/10 bg-black/15 p-5 md:p-7">
                  <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
                    <div>
                      <h4 className="text-2xl font-black">筛选后推荐命中率变化</h4>
                      <p className="mt-2 text-sm font-bold leading-6 text-foreground/55">横轴为猫咪问题类型，纵轴为加权推荐命中率；选择更多条件后曲线会联动变化。</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-primary">匹配样本 {sampleTotal}</span>
                  </div>
                  <svg viewBox="0 0 100 100" className="h-64 w-full overflow-visible" role="img" aria-label="筛选后推荐命中率变化图">
                    {[20, 40, 60, 80].map((line) => (
                      <line key={line} x1="4" x2="96" y1={line} y2={line} stroke="rgba(255,255,255,.10)" strokeWidth="0.45" />
                    ))}
                    <path d={chartPath} fill="none" stroke="oklch(0.76 0.147 61)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                    {chartPoints.map((point) => (
                      <g key={point.label}>
                        <line x1={point.x} x2={point.x} y1={point.y} y2="92" stroke="rgba(230,161,65,.20)" strokeDasharray="1.4 1.4" />
                        <circle cx={point.x} cy={point.y} r="3.2" fill="oklch(0.76 0.147 61)" stroke="#14251d" strokeWidth="1.8" />
                        <text x={point.x} y={Math.max(8, point.y - 7)} textAnchor="middle" className="fill-current text-[5px] font-black text-primary">{point.rate}%</text>
                      </g>
                    ))}
                  </svg>
                  <div className="grid gap-2 md:grid-cols-5">
                    {chartPoints.map((point) => (
                      <div key={point.label} className="rounded-2xl bg-white/[.06] px-3 py-3 text-center">
                        <p className="text-sm font-black">{point.label}</p>
                        <p className="mt-1 text-xs font-bold text-foreground/45">样本 {point.sample}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3">
                  {chartPoints.map((point) => (
                    <article key={point.label} className="rounded-[1.35rem] border border-white/10 bg-white/[.055] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-black">{point.label}</h4>
                          <p className="mt-2 text-sm font-black leading-6 text-primary">{point.plan}</p>
                        </div>
                        <span className="rounded-full bg-primary px-3 py-1 text-sm font-black text-primary-foreground">{point.rate}%</span>
                      </div>
                      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10" aria-label={`${point.label}推荐命中率 ${point.rate}%`}>
                        <div className="h-full rounded-full bg-primary shadow-[0_0_18px_rgba(230,161,65,.45)]" style={{ width: `${point.rate}%` }} />
                      </div>
                      <p className="mt-3 text-xs font-bold text-foreground/45">样本量 {point.sample} · 加权推荐命中率</p>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[1.7rem] border border-white/10 bg-white/[.055] p-8 text-center">
                <h4 className="text-2xl font-black">当前筛选暂无样本</h4>
                <p className="mt-3 text-sm font-bold text-foreground/55">取消部分条件后即可恢复图表；上线后真实样本增加，这里的可选组合会更丰富。</p>
                <Button type="button" onClick={clearTrendFilters} className="mt-6 rounded-full font-black">清空筛选</Button>
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {reviews.map((review) => (
              <div key={review.name} className="rounded-[2rem] bg-[#14251d] p-7 text-foreground shadow-xl">
                <div className="mb-6 flex gap-1 text-primary">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}</div>
                <p className="min-h-40 text-lg font-bold leading-9 text-foreground/82">“{review.text}”</p>
                <p className="mt-7 border-t border-white/10 pt-5 font-black text-primary">{review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



            </>
          )}
      <footer className="relative overflow-hidden border-t border-white/10 bg-[#0f1a15] px-4 py-20 md:px-8">
        <div className="absolute inset-0 paw-pattern opacity-30" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <Badge className="mb-6 bg-primary text-primary-foreground hover:bg-primary"><HeartPulse className="mr-2 h-4 w-4" />为主子开一份健康档案</Badge>
            <h2 className="font-display text-5xl font-black leading-tight tracking-[-0.05em] md:text-7xl">先试吃，别硬买。让猫咪投票。</h2>
            <Link href="/recommend">
              <Button variant="secondary" className="mt-7 h-14 rounded-full px-7 text-base font-black">立即开启测评 <ArrowRight className="ml-2 h-5 w-5" /></Button>
            </Link>
          </div>
          <LeadCapture />
        </div>
        <div className="relative mx-auto mt-16 flex max-w-7xl flex-col justify-between gap-4 border-t border-white/10 pt-8 text-sm font-bold text-foreground/50 md:flex-row">
          <span>© 2026 {brand.name} {brand.englishName}</span>
          <span className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-primary" />静态 MVP：测评与线索已可用，支付/订单可在下一阶段接入</span>
        </div>
      </footer>

      <ChatWidget onOpenQuiz={openQuiz} />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} items={cartItems} setItems={setCartItems} />
    </main>
  );
}
