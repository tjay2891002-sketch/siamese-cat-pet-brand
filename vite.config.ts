/// <reference types="vitest" />
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  plugins: [
    react({
      babel: {
        plugins:
          command === "serve"
            ? [
                // Inject data-source attribute for AI agent source location.
                // Dev-only: keeps internal source paths out of the production bundle.
                "./scripts/babel-plugin-jsx-source-location.cjs",
              ]
            : [],
      },
    }),
    tailwindcss(),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  base: "./",
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 600,
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // 拆分重型依赖，减小主包体积、提升缓存命中
        manualChunks(id) {
          if (id.includes("/node_modules/three/")) return "vendor-three";
          if (/\/node_modules\/(recharts|d3-|victory-vendor)\//.test(id)) return "vendor-charts";
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "vendor-react";
        },
      },
    },
  },
  server: {
    // 公网演示用内网穿透时，允许外部域名访问开发服务器（仅影响 dev server，不影响构建产物）
    allowedHosts: true,
    proxy: {
      // 薄后台（server/index.mjs，pnpm server 启动）
      "/api": { target: "http://localhost:8787", changeOrigin: true },
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: false,
  },
}));
