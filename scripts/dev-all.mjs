/*
  一键启动前后端（跨平台、零额外依赖）。
  - server: 零依赖 Node 薄后台（server/index.mjs）
  - web:    Vite 开发服务器（node_modules/vite/bin/vite.js）
  用法：pnpm dev:all
*/
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const viteBin = path.join(root, "node_modules", "vite", "bin", "vite.js");
const serverEntry = path.join(root, "server", "index.mjs");

const procs = [];
let shuttingDown = false;

function launch(name, args) {
  const child = spawn(process.execPath, args, { stdio: "inherit", cwd: root });
  child.on("exit", (code) => {
    if (shuttingDown) return;
    console.log(`\n[dev-all] ${name} 退出（code=${code}），正在关闭另一个…`);
    shutdown();
  });
  procs.push(child);
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("\n[dev-all] 正在关闭…");
  for (const c of procs) {
    try { c.kill("SIGTERM"); } catch {}
  }
  setTimeout(() => {
    for (const c of procs) {
      try { c.kill("SIGKILL"); } catch {}
    }
    process.exit(0);
  }, 1000);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("[dev-all] 启动后端 + 前端…");
launch("server", [serverEntry]);
launch("web", [viteBin]);
