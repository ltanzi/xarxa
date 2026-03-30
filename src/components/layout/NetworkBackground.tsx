"use client";

import { useEffect, useRef } from "react";

export function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight * 2; // cover scroll area

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.scale(dpr, dpr);

    // Seeded random
    let seed = 71;
    function seededRandom() {
      seed = (seed * 16807 + 0) % 2147483647;
      return (seed - 1) / 2147483646;
    }

    // Generate smooth noise field using seeded random + interpolation
    const resolution = 60;
    const cols = Math.ceil(w / resolution) + 2;
    const rows = Math.ceil(h / resolution) + 2;
    const field: number[][] = [];

    for (let i = 0; i < cols; i++) {
      field[i] = [];
      for (let j = 0; j < rows; j++) {
        field[i][j] = seededRandom();
      }
    }

    // Smooth interpolation
    function smoothstep(t: number) {
      return t * t * (3 - 2 * t);
    }

    function sampleField(x: number, y: number): number {
      const gx = x / resolution;
      const gy = y / resolution;
      const ix = Math.floor(gx);
      const iy = Math.floor(gy);
      const fx = smoothstep(gx - ix);
      const fy = smoothstep(gy - iy);

      const c = Math.min(ix, cols - 2);
      const r = Math.min(iy, rows - 2);
      if (c < 0 || r < 0) return 0;

      const a = field[c][r] + (field[c + 1][r] - field[c][r]) * fx;
      const b = field[c][r + 1] + (field[c + 1][r + 1] - field[c][r + 1]) * fx;
      return a + (b - a) * fy;
    }

    // Draw contour lines using marching squares
    const step = 4; // pixel resolution for sampling
    const numLevels = 12;
    const levels = Array.from({ length: numLevels }, (_, i) => (i + 1) / (numLevels + 1));

    ctx.lineWidth = 0.8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const level of levels) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.beginPath();

      for (let x = 0; x < w - step; x += step) {
        for (let y = 0; y < h - step; y += step) {
          const tl = sampleField(x, y);
          const tr = sampleField(x + step, y);
          const br = sampleField(x + step, y + step);
          const bl = sampleField(x, y + step);

          // Marching squares case
          const c =
            (tl >= level ? 8 : 0) |
            (tr >= level ? 4 : 0) |
            (br >= level ? 2 : 0) |
            (bl >= level ? 1 : 0);

          if (c === 0 || c === 15) continue;

          // Interpolation helpers
          const lerp = (a: number, b: number) => (level - a) / (b - a);

          const top = x + lerp(tl, tr) * step;
          const right = y + lerp(tr, br) * step;
          const bottom = x + lerp(bl, br) * step;
          const left = y + lerp(tl, bl) * step;

          const segments: [number, number, number, number][] = [];

          switch (c) {
            case 1: case 14: segments.push([x, left, bottom, y + step]); break;
            case 2: case 13: segments.push([bottom, y + step, x + step, right]); break;
            case 3: case 12: segments.push([x, left, x + step, right]); break;
            case 4: case 11: segments.push([top, y, x + step, right]); break;
            case 5: segments.push([x, left, top, y]); segments.push([bottom, y + step, x + step, right]); break;
            case 6: case 9: segments.push([top, y, bottom, y + step]); break;
            case 7: case 8: segments.push([x, left, top, y]); break;
            case 10: segments.push([top, y, x + step, right]); segments.push([x, left, bottom, y + step]); break;
          }

          for (const [x1, y1, x2, y2] of segments) {
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
          }
        }
      }

      ctx.stroke();
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
