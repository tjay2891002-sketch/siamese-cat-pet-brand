/*
  后端集成测试：在测试端口启动一个隔离的薄后台（临时数据目录、飞书/Dify 关闭），
  验证 /api/health 与 /api/leads 的落库与鉴权。不会污染真实 server/data 或触发飞书推送。
*/
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import net from "node:net";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "kimi-leads-"));
const ADMIN_TOKEN = "test-admin-token";

let server: ChildProcess;
let base = "";

function getFreePort(): Promise<number> {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, () => {
      const port = (s.address() as net.AddressInfo).port;
      s.close(() => resolve(port));
    });
  });
}

async function isHealthy(url: string): Promise<boolean> {
  try {
    const res = await fetch(url + "/api/health");
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForHealth(url: string, tries = 40): Promise<void> {
  for (let i = 0; i < tries; i++) {
    if (await isHealthy(url)) return;
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("后端未在预期时间内就绪");
}

beforeAll(async () => {
  const port = await getFreePort();
  base = "http://localhost:" + port;
  server = spawn(process.execPath, [path.join(ROOT, "server", "index.mjs")], {
    env: {
      ...process.env,
      BACKEND_PORT: String(port),
      DATA_DIR,
      DIFY_API_KEY: "",
      FEISHU_APP_ID: "",
      FEISHU_APP_SECRET: "",
      FEISHU_CHAT_ID: "",
      NOTIFY_WEBHOOK_URL: "",
      ADMIN_TOKEN,
    },
    stdio: ["ignore", "ignore", "pipe"],
  });
  await waitForHealth(base);
}, 15000);

afterAll(() => {
  server?.kill("SIGTERM");
  try { fs.rmSync(DATA_DIR, { recursive: true, force: true }); } catch (e) { console.warn("清理临时目录失败", e); }
});

describe("后端集成", () => {
  it("/api/health 返回 ok 与服务状态", async () => {
    const res = await fetch(base + "/api/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.services).toHaveProperty("dify");
    expect(body.services).toHaveProperty("feishu");
  });

  it("POST /api/leads 落库到隔离数据目录", async () => {
    const res = await fetch(base + "/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "quiz", data: { catName: "集成测试猫", age: "成猫 1-7 岁", weight: "4-6kg", contact: "test-contact" } }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const file = path.join(DATA_DIR, "leads.jsonl");
    const lines = fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
    expect(lines.some((l) => l.includes("集成测试猫"))).toBe(true);
  });

  it("GET /api/leads 未带 token 返回 401", async () => {
    const res = await fetch(base + "/api/leads");
    expect(res.status).toBe(401);
  });

  it("GET /api/leads?token=... 可读取线索", async () => {
    const res = await fetch(base + "/api/leads?token=" + ADMIN_TOKEN);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.leads.some((l: { data?: { catName?: string } }) => l.data?.catName === "集成测试猫")).toBe(true);
  });
});
