/*
  管理后台 /#/admin：看板（销售趋势/订单分布/热销商品/客服数据）、订单管理（发货操作）、工单管理。
  订单为模拟数据（server/mock/gen-orders.mjs），线索与对话统计为真实数据。
  鉴权：ADMIN_TOKEN 口令，仅存 localStorage。
*/
import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, type PieLabelRenderProps } from "recharts";
import { toast } from "sonner";

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "待付款",
  paid: "待发货",
  shipped: "已发货",
  completed: "已完成",
  refunded: "已退款",
};
const STATUS_COLOR: Record<string, string> = {
  pending_payment: "#d7cdb7",
  paid: "#e0a355",
  shipped: "#5b9fd4",
  completed: "#8cc7a0",
  refunded: "#c95032",
};
const LEAD_TYPE_LABEL: Record<string, string> = { quiz: "测评", consult: "咨询", "human-request": "人工工单" };

type Order = {
  orderNo: string;
  title: string;
  qty: number;
  amount: number;
  status: string;
  customer: string;
  phone: string;
  city: string;
  channel: string;
  createdAt: string;
  trackingNo: string | null;
};
type Lead = {
  receivedAt: string;
  type: string;
  data: Record<string, string>;
  resolved: boolean;
};
type Overview = {
  totalRevenue: number;
  todayRevenue: number;
  totalOrders: number;
  pendingShipment: number;
  byDay: Array<{ date: string; revenue: number; orders: number }>;
  byStatus: Array<{ status: string; count: number }>;
  topSkus: Array<{ title: string; count: number; revenue: number }>;
  leads: { total: number; openTickets: number; byType: Record<string, number> };
  chat: { chatTotal: number; chatByDay: Record<string, number> };
};

async function api(path: string, token: string, init?: RequestInit) {
  const res = await fetch(path, init);
  if (res.status === 401) throw new Error("口令错误");
  if (!res.ok) throw new Error(`请求失败 ${res.status}`);
  return res.json();
}

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem("admin-token") ?? "");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"dashboard" | "orders" | "tickets">("dashboard");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [orders, setOrders] = useState<{ total: number; orders: Order[] }>({ total: 0, orders: [] });
  const [orderStatus, setOrderStatus] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadFilter, setLeadFilter] = useState("all");
  const [leadSearch, setLeadSearch] = useState("");

  const loadOverview = useCallback(async (t: string) => {
    setOverview(await api(`/api/admin/overview?token=${t}`, t));
  }, []);
  const loadOrders = useCallback(async (t: string, status: string, page: number) => {
    setOrders(await api(`/api/admin/orders?token=${t}&status=${status}&page=${page}`, t));
  }, []);
  const loadLeads = useCallback(async (t: string) => {
    setLeads((await api(`/api/admin/leads?token=${t}`, t)).leads);
  }, []);

  const login = async (t: string) => {
    try {
      await loadOverview(t);
      localStorage.setItem("admin-token", t);
      setAuthed(true);
    } catch {
      toast.error("口令错误或后台未启动");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (token) void login(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (authed && tab === "orders")
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadOrders(token, orderStatus, orderPage);
  }, [authed, tab, orderStatus, orderPage, token, loadOrders]);
  useEffect(() => {
    if (authed && tab === "tickets")
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadLeads(token);
  }, [authed, tab, token, loadLeads]);

  const visibleLeads = leads.filter((l) => {
    const matchType = leadFilter === "all" || l.type === leadFilter;
    const q = leadSearch.trim().toLowerCase();
    const hay = `${l.data.catName || ""} ${l.data.name || ""} ${l.data.contact || ""}`.toLowerCase();
    return matchType && (!q || hay.includes(q));
  });

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void login(token);
          }}
          className="w-80 rounded-2xl border border-border bg-card p-6"
        >
          <h1 className="mb-1 text-xl font-bold">基米厨房 · 运营后台</h1>
          <p className="mb-4 text-sm text-muted-foreground">输入管理口令（.env 的 ADMIN_TOKEN）</p>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="h-10 w-full rounded-lg bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
            placeholder="ADMIN_TOKEN"
          />
          <button className="mt-4 w-full rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground">进入</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">基米厨房 · 运营后台</h1>
          <nav className="flex gap-2">
            {([["dashboard", "数据看板"], ["orders", "订单管理"], ["tickets", "线索工单"]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-full px-4 py-1.5 text-sm font-bold ${tab === key ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {tab === "dashboard" && overview && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                ["总成交额", `¥${overview.totalRevenue.toLocaleString()}`],
                ["今日成交", `¥${overview.todayRevenue.toLocaleString()}`],
                ["总订单", overview.totalOrders],
                ["待发货", overview.pendingShipment],
                ["线索总数", overview.leads.total],
                ["待处理工单", overview.leads.openTickets],
                ["客服对话量", overview.chat.chatTotal],
                ["今日对话", overview.chat.chatByDay[new Date().toISOString().slice(0, 10)] ?? 0],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-2xl font-bold">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 font-bold">近 30 天成交趋势</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={overview.byDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3b5041" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#d7cdb7" }} tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: "#d7cdb7" }} />
                  <Tooltip contentStyle={{ background: "#26392d", border: "1px solid #3b5041", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="revenue" name="成交额" stroke="#e0a355" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="orders" name="订单数" stroke="#8cc7a0" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-4 font-bold">订单状态分布</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={overview.byStatus} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80} label={(p: PieLabelRenderProps) => { const s = p as unknown as { status?: string; count?: number }; return `${STATUS_LABEL[s.status ?? ""] ?? s.status ?? ""} ${s.count ?? 0}`; }}>
                      {overview.byStatus.map((s) => (
                        <Cell key={s.status} fill={STATUS_COLOR[s.status] ?? "#d7cdb7"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#26392d", border: "1px solid #3b5041", borderRadius: 12 }} formatter={(v: number, n: string) => [v, STATUS_LABEL[n] ?? n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-4 font-bold">热销商品（按成交额）</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={overview.topSkus} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#d7cdb7" }} />
                    <YAxis type="category" dataKey="title" width={150} tick={{ fontSize: 11, fill: "#d7cdb7" }} />
                    <Tooltip contentStyle={{ background: "#26392d", border: "1px solid #3b5041", borderRadius: 12 }} />
                    <Bar dataKey="revenue" name="成交额" fill="#e0a355" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-3">
              <select
                value={orderStatus}
                onChange={(e) => {
                  setOrderStatus(e.target.value);
                  setOrderPage(1);
                }}
                className="h-9 rounded-lg bg-background px-3 text-sm outline-none"
              >
                <option value="">全部状态</option>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <span className="text-sm text-muted-foreground">共 {orders.total} 单</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2">订单号</th><th>商品</th><th>金额</th><th>客户</th><th>状态</th><th>下单时间</th><th>操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.orders.map((o) => (
                  <tr key={o.orderNo} className="border-b border-border/50">
                    <td className="py-2.5 font-mono text-xs">{o.orderNo}</td>
                    <td>{o.title} ×{o.qty}</td>
                    <td>¥{o.amount}</td>
                    <td>{o.customer}（{o.city}）</td>
                    <td><span style={{ color: STATUS_COLOR[o.status] }}>{STATUS_LABEL[o.status]}</span></td>
                    <td className="text-xs text-muted-foreground">{o.createdAt.slice(0, 16).replace("T", " ")}</td>
                    <td>
                      {o.status === "paid" && (
                        <button
                          onClick={async () => {
                            await api("/api/admin/orders/ship", token, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ token, orderNo: o.orderNo }),
                            });
                            toast.success(`订单 ${o.orderNo} 已发货`);
                            void loadOrders(token, orderStatus, orderPage);
                          }}
                          className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"
                        >
                          发货
                        </button>
                      )}
                      {o.trackingNo && <span className="font-mono text-xs text-muted-foreground">{o.trackingNo}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex items-center gap-3 text-sm">
              <button disabled={orderPage <= 1} onClick={() => setOrderPage((p) => p - 1)} className="rounded-full border border-border px-3 py-1 disabled:opacity-40">上一页</button>
              <span className="text-muted-foreground">第 {orderPage} 页</span>
              <button disabled={orderPage * 20 >= orders.total} onClick={() => setOrderPage((p) => p + 1)} className="rounded-full border border-border px-3 py-1 disabled:opacity-40">下一页</button>
            </div>
          </div>
        )}

        {tab === "tickets" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-border px-3 py-1 text-sm">共 {leads.length}</span>
                <span className="rounded-full border border-primary px-3 py-1 text-sm text-primary">待处理 {leads.filter((l) => !l.resolved).length}</span>
                {Object.entries(LEAD_TYPE_LABEL).map(([k, v]) => {
                  const c = leads.filter((l) => l.type === k).length;
                  return <span key={k} className="rounded-full border border-border px-3 py-1 text-sm">{v} {c}</span>;
                })}
              </div>
              <div className="flex items-center gap-2">
                <select value={leadFilter} onChange={(e) => setLeadFilter(e.target.value)} className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary">
                  <option value="all">全部类型</option>
                  {Object.entries(LEAD_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)} placeholder="搜猫名/联系方式" className="h-9 w-44 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            {visibleLeads.length === 0 && <p className="text-muted-foreground">暂无线索</p>}
            {visibleLeads.map((l) => (
              <div key={l.receivedAt} className={`rounded-2xl border bg-card p-4 ${l.resolved ? "border-border opacity-60" : "border-primary"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">{LEAD_TYPE_LABEL[l.type] ?? l.type}</span>
                    <span className="font-bold">{l.data.catName || l.data.name || "访客"}</span>
                    <span className="text-muted-foreground">{l.data.contact}</span>
                    <span className="text-xs text-muted-foreground">{l.receivedAt.slice(0, 16).replace("T", " ")}</span>
                  </div>
                  {!l.resolved && (
                    <button
                      onClick={async () => {
                        await api("/api/admin/leads/resolve", token, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ token, receivedAt: l.receivedAt }),
                        });
                        void loadLeads(token);
                      }}
                      className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary"
                    >
                      标记已处理
                    </button>
                  )}
                </div>
                {(l.data.note || l.data.message) && <p className="mt-2 text-sm">{l.data.note || l.data.message}</p>}
                {l.data.transcript && (
                  <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-background p-3 text-xs text-muted-foreground">{l.data.transcript}</pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
