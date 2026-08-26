/*
  轻量压测：对薄后台并发打请求，统计成功率、延迟分位数与吞吐（零额外依赖）。
  用法：
    node scripts/load-test.mjs [baseUrl] [concurrency] [durationSec] [--with-leads]
  示例：
    node scripts/load-test.mjs http://localhost:8787 30 8
    node scripts/load-test.mjs http://localhost:8787 20 5 --with-leads
*/
import http from "node:http";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) || "http://localhost:8787";
const withLeads = args.includes("--with-leads");
const nums = args.filter((a) => /^\d+(\.\d+)?$/.test(a)).map(Number);
const concurrency = nums[0] || 30;
const durationSec = nums[1] || 8;

const url = new URL(base);
const endpoints = [{ path: "/api/health", method: "GET" }];
if (withLeads) {
  endpoints.push({
    path: "/api/leads",
    method: "POST",
    body: JSON.stringify({ type: "load-test", data: { name: "压测", contact: "load-test", message: "压力测试" } }),
  });
}

const stats = { total: 0, ok: 0, fail: 0, latency: [] };

function request(ep) {
  return new Promise((resolve) => {
    const started = performance.now();
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: ep.path,
        method: ep.method,
        headers: { "Content-Type": "application/json", ...(ep.body ? { "Content-Length": Buffer.byteLength(ep.body) } : {}) },
      },
      (res) => {
        res.resume();
        res.on("end", () => {
          const ms = performance.now() - started;
          stats.total++;
          stats.latency.push(ms);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) stats.ok++;
          else stats.fail++;
          resolve();
        });
      },
    );
    req.on("error", () => {
      const ms = performance.now() - started;
      stats.total++;
      stats.latency.push(ms);
      stats.fail++;
      resolve();
    });
    if (ep.body) req.write(ep.body);
    req.end();
  });
}

async function main() {
  const start = performance.now();
  const workers = Array.from({ length: concurrency }, async () => {
    let i = 0;
    while (performance.now() - start < durationSec * 1000) {
      await request(endpoints[i % endpoints.length]);
      i++;
    }
  });
  await Promise.all(workers);

  const elapsed = (performance.now() - start) / 1000;
  const sorted = stats.latency.slice().sort((a, b) => a - b);
  const pct = (p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : 0);
  const okRate = stats.total ? (stats.ok / stats.total) * 100 : 0;

  console.log("— 压测结果 —");
  console.log("目标:", base, "| 并发:", concurrency, "| 时长:", durationSec + "s", "| 端点:", endpoints.map((e) => e.path).join(", "));
  console.log("请求总数:", stats.total);
  console.log("成功率:", okRate.toFixed(2) + "%", "(成功", stats.ok + ", 失败", stats.fail + ")");
  console.log("吞吐:", (stats.total / elapsed).toFixed(1), "req/s");
  if (sorted.length) {
    console.log("延迟 p50:", pct(0.5).toFixed(0) + "ms", "| p95:", pct(0.95).toFixed(0) + "ms", "| max:", pct(1).toFixed(0) + "ms");
  }
  process.exit(stats.fail === 0 ? 0 : 1);
}

main();
