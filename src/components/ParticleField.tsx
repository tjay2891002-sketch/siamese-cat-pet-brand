/*
  ParticleField —— 全屏 3D 粒子背景层。
  设计意图：贴合「暗调私厨 × 宠物健康」品牌调，用焦糖橙 + 奶油白的光点
  模拟「厨房温热蒸汽 / 漂浮光尘」，在深森林绿底色之上缓慢上浮、轻微旋转；
  鼠标向下滚动时整体向外炸散并淡出，做 hero → 内文的章节转场感。

  工程要点：
  - 单次 draw call（THREE.Points），数千粒子也只占极低开销；
  - 贴图用 canvas 生成径向光晕，配合 AdditiveBlending 做加法发光叠加；
  - 鼠标做轻微视差（相机偏移），强化 3D 纵深；
  - 滚动驱动散开：读 scrollY 算 0→1 进度，放大 + 相机后退 + 淡出 + 视差衰减，回滚自动复原；
  - 尊重 prefers-reduced-motion（静态渲染单帧，不持续动画、不响应滚动散开）；
  - 标签页隐藏时暂停 RAF，可见时恢复，省电省性能；
  - StrictMode 双挂载安全：effect 内建、卸载时彻底 dispose 并移除 canvas。
*/
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface ParticleFieldProps {
  /** 粒子数量；默认 2000，足够铺满视口又不挤。 */
  count?: number;
  /** 整体不透明度，0–1。 */
  opacity?: number;
}

// 品牌色板（与 index.css 的 oklch 主色对应，这里用线性 sRGB 近似，喂给 vertex color）。
const PALETTE = [
  new THREE.Color("#e6a141"), // 焦糖橙 primary
  new THREE.Color("#eec4b8"), // 奶油暖白
  new THREE.Color("#b46c32"), // 深焦糖 accent
  new THREE.Color("#7fae8c"), // 森林绿点缀（少量，呼应底色）
];

export default function ParticleField({ count = 2000, opacity = 0.9 }: ParticleFieldProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // —— 无障碍：尊重「减少动态」偏好 ——
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // —— 场景 / 相机 / 渲染器 ——
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 28);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // 透明，露出 body 的森林绿径向底
    container.appendChild(renderer.domElement);

    // —— 光晕贴图：canvas 径向渐变，避免硬边方块粒子 ——
    const makeGlowTexture = () => {
      const size = 64;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.25, "rgba(255,255,255,0.55)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };
    const glowTexture = makeGlowTexture();

    // —— 粒子几何：位置 + 颜色 + 个体运动参数 ——
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const drift = new Float32Array(count * 3); // 每粒：[上浮速度, 横向摇摆幅度, 摇摆相位]

    const FIELD = { x: 60, y: 36, z: 24 }; // 粒子分布体积（宽 / 高 / 深）

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * FIELD.x;
      positions[i * 3 + 1] = (Math.random() - 0.5) * FIELD.y;
      positions[i * 3 + 2] = (Math.random() - 0.5) * FIELD.z;

      // 80% 暖色，20% 绿点缀，让光尘偏「厨房暖光」而非随机银河。
      const c = Math.random() < 0.2 ? PALETTE[3] : PALETTE[Math.floor(Math.random() * 3)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      drift[i * 3] = 0.01 + Math.random() * 0.03; // 上浮速度
      drift[i * 3 + 1] = 0.4 + Math.random() * 1.1; // 横向摇摆幅度
      drift[i * 3 + 2] = Math.random() * Math.PI * 2; // 摇摆相位
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.55,
      map: glowTexture,
      vertexColors: true,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // —— 鼠标视差（reduced-motion 下关闭） ——
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (!reducedMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    // —— 尺寸自适应 ——
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // —— 标签页可见性：隐藏时暂停，避免空跑耗电 ——
    let paused = false;
    const onVisibility = () => {
      paused = document.hidden;
      if (!paused && !reducedMotion) requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVisibility);

    // —— 动画主循环 ——
    let rafId = 0;
    let t = 0;
    // 滚动散开进度 0→1：滚过 hero 约 1.2 屏时粒子散尽，露出下方内容；回滚自动复原
    const scrollProgress = { current: 0, target: 0 };
    const loop = () => {
      if (paused) return;
      rafId = requestAnimationFrame(loop);
      t += 0.016;

      // 读取滚动量并平滑插值，避免滚轮跳变
      scrollProgress.target = Math.min(Math.max(window.scrollY / (window.innerHeight * 1.2), 0), 1);
      scrollProgress.current += (scrollProgress.target - scrollProgress.current) * 0.12;
      const p = scrollProgress.current;

      const pos = geometry.attributes.position.array as Float32Array;
      const halfY = FIELD.y / 2;
      for (let i = 0; i < count; i++) {
        // 缓慢上浮（蒸汽隐喻）
        pos[i * 3 + 1] += drift[i * 3];
        // 横向轻摆
        pos[i * 3] += Math.sin(t * 0.5 + drift[i * 3 + 2]) * drift[i * 3 + 1] * 0.01;
        // 越过顶部回到底部，循环
        if (pos[i * 3 + 1] > halfY) pos[i * 3 + 1] = -halfY;
      }
      geometry.attributes.position.needsUpdate = true;

      // 滚动散开：整体放大 = 向外炸散，相机后退拉开纵深，自转加速加离心感
      points.scale.setScalar(1 + p * 2.4);
      points.rotation.y = t * 0.02 * (1 + p * 3.5);
      points.rotation.x = Math.sin(t * 0.05) * 0.04;
      camera.position.z = 28 + p * 52;

      // 相机视差缓动，随滚动衰减（散开后不再跟随鼠标）
      current.x += (target.x - current.x) * 0.05;
      current.y += (target.y - current.y) * 0.05;
      camera.position.x = current.x * 3 * (1 - p);
      camera.position.y = -current.y * 2 * (1 - p);
      camera.lookAt(0, 0, 0);

      // 整体淡出，到 p=1 时几乎不可见；cream-panel 等不透明 section 还会再遮一层
      material.opacity = opacity * (1 - p * 0.92);

      renderer.render(scene, camera);
    };

    if (reducedMotion) {
      renderer.render(scene, camera); // 静态单帧
    } else {
      requestAnimationFrame(loop);
    }

    // —— 卸载清理（StrictMode 双挂载也安全） ——
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      geometry.dispose();
      material.dispose();
      glowTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [count, opacity]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
}
