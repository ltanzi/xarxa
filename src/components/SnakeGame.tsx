"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "@/i18n/hook";

const CELL = 16;
const START_TICK_MS = 125;
const MIN_TICK_MS = 55;
const SPEEDUP_PER_APPLE = 6;
const SNAKE_COLOR = "rgba(40, 40, 40, 0.18)";
const APPLE_COLOR = "rgba(120, 170, 75, 0.55)";
const HINT_COLOR = "rgba(40, 40, 40, 0.45)";

export function SnakeGame({ obstacleSelector = "[data-snake-obstacle]" }: { obstacleSelector?: string }) {
  const { t } = useTranslation();
  const hintRef = useRef(t("landing.snakeHint"));
  hintRef.current = t("landing.snakeHint");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (reducedMotion || !isDesktop) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cols = 0;
    let rows = 0;
    let topOffset = 0;
    let brandX = 24;
    const bodyFont = getComputedStyle(document.body).fontFamily;
    let snake: { x: number; y: number }[] = [];
    let direction = { dx: 0, dy: 0 };
    let pending = { dx: 0, dy: 0 };
    let apple = { x: 0, y: 0 };
    let obstacleRects: DOMRect[] = [];

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      canvas!.style.width = `${window.innerWidth}px`;
      canvas!.style.height = `${window.innerHeight}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const nav = document.querySelector("nav");
      topOffset = nav ? Math.ceil(nav.getBoundingClientRect().height) : 0;
      // The "xarxa" brand link is the first <a> inside <nav>. Snap the
      // hint text's left edge to its left edge so they line up exactly.
      const brand = nav?.querySelector("a");
      brandX = brand ? Math.round(brand.getBoundingClientRect().left) : 24;
      cols = Math.floor(window.innerWidth / CELL);
      rows = Math.floor((window.innerHeight - topOffset) / CELL);
    }

    function readObstacles() {
      const range = document.createRange();
      const rects: DOMRect[] = [];
      const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || "";
          for (let i = 0; i < text.length; i++) {
            if (!text[i].trim()) continue;
            try {
              range.setStart(node, i);
              range.setEnd(node, i + 1);
              for (const r of Array.from(range.getClientRects())) {
                if (r.width > 0 && r.height > 0) rects.push(r);
              }
            } catch {
              // best-effort: skip glyphs whose Range can't be measured
            }
          }
        } else {
          node.childNodes.forEach(walk);
        }
      };
      for (const el of Array.from(document.querySelectorAll(obstacleSelector))) {
        const before = rects.length;
        walk(el);
        if (rects.length === before) {
          rects.push(el.getBoundingClientRect());
        }
      }
      obstacleRects = rects;
    }

    function cellInObstacle(x: number, y: number) {
      const px = x * CELL + CELL / 2;
      const py = y * CELL + topOffset + CELL / 2;
      return obstacleRects.some((r) => px >= r.left && px <= r.right && py >= r.top && py <= r.bottom);
    }

    function spawnApple() {
      for (let i = 0; i < 200; i++) {
        const x = Math.floor(Math.random() * cols);
        const y = Math.floor(Math.random() * rows);
        if (cellInObstacle(x, y)) continue;
        if (snake.some((s) => s.x === x && s.y === y)) continue;
        apple = { x, y };
        return;
      }
    }

    function reset() {
      // Center the snake's start cell horizontally on the hint text,
      // so the head's circle sits visually under "press any arrow".
      ctx!.font = `14px ${bodyFont}`;
      const hintWidth = ctx!.measureText(hintRef.current).width;
      const hintCenterPx = brandX + hintWidth / 2;
      const startX = Math.max(2, Math.round((hintCenterPx - CELL / 2) / CELL));
      const startY = Math.max(2, rows - 4);
      snake = [
        { x: startX, y: startY },
        { x: startX, y: startY },
        { x: startX, y: startY },
      ];
      direction = { dx: 0, dy: 0 };
      pending = { dx: 0, dy: 0 };
      spawnApple();
    }

    function starPath(cx: number, cy: number, outerR: number, innerR: number, points = 5) {
      ctx!.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const angle = -Math.PI / 2 + (i * Math.PI) / points;
        const r = i % 2 === 0 ? outerR : innerR;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.closePath();
    }

    function draw() {
      ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight);

      ctx!.fillStyle = SNAKE_COLOR;
      for (const s of snake) {
        ctx!.beginPath();
        ctx!.arc(s.x * CELL + CELL / 2, s.y * CELL + topOffset + CELL / 2, CELL / 2 - 1, 0, Math.PI * 2);
        ctx!.fill();
      }

      const idle = direction.dx === 0 && direction.dy === 0 && pending.dx === 0 && pending.dy === 0;

      if (!idle) {
        ctx!.fillStyle = APPLE_COLOR;
        starPath(apple.x * CELL + CELL / 2, apple.y * CELL + topOffset + CELL / 2, CELL / 2, CELL / 2 * 0.55, 7);
        ctx!.fill();
      }

      if (idle && snake.length > 0) {
        const head = snake[0];
        ctx!.fillStyle = HINT_COLOR;
        ctx!.font = `14px ${bodyFont}`;
        ctx!.textAlign = "left";
        ctx!.textBaseline = "alphabetic";
        // X anchored to the navbar brand so "p of press" stays under
        // the "x of xarxa" regardless of where the snake idles or
        // which page is mounted. Y still tracks the snake's head so
        // the hint feels attached to the apple/snake.
        ctx!.fillText(hintRef.current, brandX, head.y * CELL + topOffset - CELL * 0.4);
      }
    }

    function tick() {
      direction = pending;
      if (direction.dx === 0 && direction.dy === 0) {
        draw();
        return;
      }

      const head = snake[0];
      const next = {
        x: ((head.x + direction.dx) % cols + cols) % cols,
        y: ((head.y + direction.dy) % rows + rows) % rows,
      };

      const selfHit = snake.some((s) => s.x === next.x && s.y === next.y);
      const obstacleHit = cellInObstacle(next.x, next.y);

      if (selfHit || obstacleHit) {
        reset();
        draw();
        return;
      }

      snake.unshift(next);
      if (next.x === apple.x && next.y === apple.y) {
        spawnApple();
      } else {
        snake.pop();
      }
      draw();
    }

    function handleKey(e: KeyboardEvent) {
      const map: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      };
      const next = map[e.key];
      if (!next) return;
      const moving = direction.dx !== 0 || direction.dy !== 0;
      if (moving && next[0] === -direction.dx && next[1] === -direction.dy) return;
      pending = { dx: next[0], dy: next[1] };
      e.preventDefault();
    }

    resize();
    readObstacles();
    reset();
    draw();

    let timeoutId = 0;
    function scheduleNext() {
      const eaten = Math.max(0, snake.length - 3);
      const delay = Math.max(MIN_TICK_MS, START_TICK_MS - eaten * SPEEDUP_PER_APPLE);
      timeoutId = window.setTimeout(() => {
        try {
          tick();
        } catch (err) {
          console.error("[SnakeGame tick]", err);
        }
        scheduleNext();
      }, delay);
    }
    scheduleNext();

    let scrollRaf = 0;
    function onScroll() {
      if (scrollRaf) return;
      scrollRaf = window.requestAnimationFrame(() => {
        scrollRaf = 0;
        readObstacles();
      });
    }
    const onResize = () => {
      resize();
      readObstacles();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(timeoutId);
      if (scrollRaf) window.cancelAnimationFrame(scrollRaf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [obstacleSelector]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none hidden md:block"
    />
  );
}
