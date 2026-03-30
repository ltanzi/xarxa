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
    const h = window.innerHeight;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.scale(dpr, dpr);

    // Seeded random
    let seed = 42;
    function seededRandom() {
      seed = (seed * 16807 + 0) % 2147483647;
      return (seed - 1) / 2147483646;
    }

    // Simple 2D noise approximation using seeded random grid
    const noiseGrid: number[][] = [];
    const gridSize = 24;
    const cols = Math.ceil(w / gridSize) + 2;
    const rows = Math.ceil(h / gridSize) + 2;

    for (let i = 0; i < cols; i++) {
      noiseGrid[i] = [];
      for (let j = 0; j < rows; j++) {
        noiseGrid[i][j] = seededRandom() * Math.PI * 2;
      }
    }

    function getAngle(x: number, y: number): number {
      const col = Math.floor(x / gridSize);
      const row = Math.floor(y / gridSize);
      const fx = (x / gridSize) - col;
      const fy = (y / gridSize) - row;

      const c = Math.min(col, cols - 2);
      const r = Math.min(row, rows - 2);

      const a00 = noiseGrid[c]?.[r] ?? 0;
      const a10 = noiseGrid[c + 1]?.[r] ?? 0;
      const a01 = noiseGrid[c]?.[r + 1] ?? 0;
      const a11 = noiseGrid[c + 1]?.[r + 1] ?? 0;

      const top = a00 + (a10 - a00) * fx;
      const bot = a01 + (a11 - a01) * fx;
      return top + (bot - top) * fy;
    }

    // Scatter seed points
    const numParticles = Math.floor((w * h) / 3500);
    const particles: { x: number; y: number; life: number }[] = [];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: seededRandom() * w,
        y: seededRandom() * h,
        life: 80 + Math.floor(seededRandom() * 160),
      });
    }

    // Draw flow trails
    ctx.lineCap = "round";
    ctx.lineWidth = 0.5;

    for (const p of particles) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);

      let px = p.x;
      let py = p.y;

      for (let step = 0; step < p.life; step++) {
        const angle = getAngle(px, py);
        const nx = px + Math.cos(angle) * 1.5;
        const ny = py + Math.sin(angle) * 1.5;

        if (nx < -10 || nx > w + 10 || ny < -10 || ny > h + 10) break;

        ctx.lineTo(nx, ny);
        px = nx;
        py = ny;
      }

      ctx.strokeStyle = "rgba(26, 26, 26, 0.025)";
      ctx.stroke();
    }

    // Scatter subtle dots at particle origins
    for (const p of particles) {
      if (seededRandom() > 0.7) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(26, 26, 26, 0.04)";
        ctx.fill();
      }
    }

    const handleResize = () => {
      // Re-render on significant resize
      const newW = window.innerWidth;
      const newH = window.innerHeight;
      if (Math.abs(newW - w) > 100 || Math.abs(newH - h) > 100) {
        window.location.reload();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 1 }}
    />
  );
}
