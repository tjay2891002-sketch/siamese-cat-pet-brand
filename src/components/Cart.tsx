/*
  购物车抽屉 + 结算留资：MVP 阶段把「加入购物车 → 结算」落到真实线索，联动薄后台 → 飞书群 / 多维表格。
*/
import { useState } from "react";
import type { FormEvent } from "react";
import { Minus, Plus, Send, X } from "lucide-react";
import { toast } from "sonner";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reportLead } from "@/lib/leads";
import { buildCheckoutSummary, calcTotal } from "@/lib/cart";

export type CartItem = { id: string; title: string; price: number; emoji: string; kind: "product" | "plan"; qty: number };

type CartDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
};

const CART_KEY = "nine-lives-kitchen-cart";

function persist(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function CartDrawer({ open, onOpenChange, items, setItems }: CartDrawerProps) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [contact, setContact] = useState("");
  const [name, setName] = useState("猫咪家长");
  const total = calcTotal(items);

  const setQty = (id: string, kind: CartItem["kind"], qty: number) => {
    const next = items.map((i) => (i.id === id && i.kind === kind ? { ...i, qty: Math.max(1, qty) } : i));
    setItems(next);
    persist(next);
  };
  const remove = (id: string, kind: CartItem["kind"]) => {
    const next = items.filter((i) => !(i.id === id && i.kind === kind));
    setItems(next);
    persist(next);
  };

  const submitCheckout = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!contact.trim()) {
      toast.error("请留下联系方式，方便客服对接。");
      return;
    }
    const payload = {
      name: name.trim() || "猫咪家长",
      contact: contact.trim(),
      message: buildCheckoutSummary(items, total),
      items: items.map((i) => ({ title: i.title, qty: i.qty, price: i.price })),
      total,
      submittedAt: new Date().toISOString(),
    };
    reportLead("consult", payload);
    setItems([]);
    persist([]);
    setCheckoutOpen(false);
    setContact("");
    onOpenChange(false);
    toast.success("订单意向已提交，客服会尽快联系你。");
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>购物车</SheetTitle>
            <SheetDescription>共 {items.reduce((sum, i) => sum + i.qty, 0)} 件</SheetDescription>
          </SheetHeader>
          <div className="space-y-3">
            {items.length === 0 && <p className="text-muted-foreground">购物车还是空的，去挑点好吃的吧。</p>}
            {items.map((i) => (
              <div key={i.id + i.kind} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10 text-2xl">{i.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{i.title}</p>
                  <p className="text-sm text-primary">¥{i.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setQty(i.id, i.kind, i.qty - 1)}>
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-6 text-center text-sm font-bold">{i.qty}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setQty(i.id, i.kind, i.qty + 1)}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <button onClick={() => remove(i.id, i.kind)} className="text-muted-foreground hover:text-primary">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {items.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <div className="flex justify-between text-lg font-black">
                <span>合计</span>
                <span className="text-primary">¥{total.toFixed(2)}</span>
              </div>
              <Button onClick={() => setCheckoutOpen(true)} className="mt-4 h-12 w-full rounded-full font-black">
                <Send className="mr-2 h-4 w-4" />去结算（留资）
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>提交订单意向</DialogTitle>
            <DialogDescription>MVP 阶段先登记，客服会带着试吃说明联系你，不用现在付款。</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitCheckout} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="co-name">称呼</Label>
              <Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-contact">手机 / 微信 / 邮箱</Label>
              <Input id="co-contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="用于发送试吃与开吃说明" />
            </div>
            <Button type="submit" className="w-full rounded-full font-black">
              <Send className="mr-2 h-4 w-4" />确认提交
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}