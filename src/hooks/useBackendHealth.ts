/*
  后台连接状态：轮询 /api/health，用于在页面顶部显示「服务在线/离线」。
  只在本地 & 局域网访问时展示并轮询，避免对外演示（隧道/公网）或生产环境出现「服务离线」造成误解。
*/
import { useEffect, useState } from "react";

export type BackendHealth = "checking" | "online" | "offline";

/** 是否为 IPv4 私网地址（10/8、172.16/12、192.168/16） */
function isPrivateIpv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const parts = m.slice(1).map(Number);
  if (parts.some((n) => n < 0 || n > 255)) return false;
  const [a, b] = parts;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

/** 是否在本地 / 局域网访问（本地调试才显示后端状态） */
export function isLocalHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local")) return true;
  if (isPrivateIpv4(host)) return true;
  // IPv6 ULA（fc00::/7）与链路本地（fe80::/10）简判
  if (/^(fc|fd)[0-9a-f:]/i.test(host) || /^(fe[89ab])[0-9a-f:]/i.test(host)) return true;
  return false;
}

export function useBackendHealth(): BackendHealth {
  const [status, setStatus] = useState<BackendHealth>("checking");

  useEffect(() => {
    if (!isLocalHost()) return;

    let alive = true;
    const check = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (alive) setStatus(res.ok ? "online" : "offline");
      } catch {
        if (alive) setStatus("offline");
      }
    };

    check();
    const timer = setInterval(check, 15000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return status;
}
