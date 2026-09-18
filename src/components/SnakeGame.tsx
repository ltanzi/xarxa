"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "@/i18n/hook";

const CELL = 16;
const START_TICK_MS = 125;
const MIN_TICK_MS = 55;
const SPEEDUP_PER_APPLE = 6;
// Hold an arrow to sprint. Scales the current tick rather than replacing it,
// so the boost still feels like a boost at top speed.
const BOOST_FACTOR = 0.45;
const BOOST_MIN_TICK_MS = 35;
// Per-browser, per-device. Nothing reaches the server — this is a doodle on
// the landing page, not a leaderboard.
const BEST_SCORE_KEY = "xarxa:snake:best";
// Quiet on purpose: this fires on a landing page, not in a game the visitor
// chose to open. Loud enough to notice, soft enough not to startle.
const EAT_GAIN = 0.05;
// The crash carries more weight than the pickup — it's the one moment that
// should register — so it's louder and longer than the eat blip.
const CRASH_GAIN = 0.11;
const SNAKE_COLOR = "rgba(40, 40, 40, 0.18)";
const APPLE_COLOR = "rgba(120, 170, 75, 0.55)";
const HINT_COLOR = "rgba(40, 40, 40, 0.45)";

export function SnakeGame() {
  const { t } = useTranslation();
  // Refs, not deps: the canvas loop reads the current label on each tick, so
  // a language switch takes effect without tearing down and restarting the
  // game.
  const hintRef = useRef(t("landing.snakeHint"));
  hintRef.current = t("landing.snakeHint");
  const bestLabelRef = useRef(t("landing.snakeBest"));
  bestLabelRef.current = t("landing.snakeBest");
  const currentLabelRef = useRef(t("landing.snakeCurrent"));
  currentLabelRef.current = t("landing.snakeCurrent");

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
    let timeoutId = 0;
    const heldArrows = new Set<string>();
    // The row the snake idles on. The status line is pinned to it so the
    // score stays put while the snake moves.
    let idleRow = 0;
    let bestScore = 0;
    try {
      bestScore = Math.max(0, Number(window.localStorage.getItem(BEST_SCORE_KEY)) || 0);
    } catch {
      // Private windows and blocked site data throw on access; a missing
      // best is not worth failing the game over.
    }

    const score = () => Math.max(0, snake.length - 3);

    /**
     * Two short tones, synthesised rather than loaded: no audio files to ship
     * or fetch, and a couple of oscillators weigh nothing.
     *
     * The context is created on the first arrow press, never on page load —
     * browsers start one suspended until a user gesture, and building it
     * eagerly just earns a console warning on every visit.
     */
    let audioCtx: AudioContext | null = null;
    let audioBroken = false;
    let audioLogged = false;

    function unlockAudio() {
      if (audioBroken) return;
      if (!audioCtx) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) {
          audioBroken = true;
          return;
        }
        try {
          audioCtx = new Ctor();
        } catch {
          audioBroken = true;
          return;
        }
      }
      if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    }

    function tone(type: OscillatorType, from: number, to: number, seconds: number, gain: number) {
      if (!audioCtx || audioCtx.state !== "running") return;
      try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const amp = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(from, now);
        // Exponential ramps can't touch zero, hence the small floors here
        // and on the gain tail.
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + seconds);
        amp.gain.setValueAtTime(gain, now);
        amp.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
        osc.connect(amp).connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + seconds);
      } catch (err) {
        // A failed beep is never worth interrupting the game for, but silent
        // permanent silence is impossible to diagnose — leave one trace.
        if (!audioLogged) {
          audioLogged = true;
          console.debug("[SnakeGame audio]", err);
        }
      }
    }

    // Short and upward — a pickup.
    const playEat = () => tone("triangle", 660, 1320, 0.09, EAT_GAIN);
    // Lower, longer and falling — a stop.
    const playCrash = () => tone("sawtooth", 200, 60, 0.35, CRASH_GAIN);

    function recordScore() {
      const s = score();
      if (s <= bestScore) return;
      bestScore = s;
      try {
        window.localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
      } catch {
        // Same as above — keep the in-memory best for this session.
      }
    }

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

      // Publish the hint's baseline so the landing page's corner link can sit
      // on exactly the same line. It can't be a constant: the row grid is
      // floored, so the hint's distance from the bottom shifts by up to a
      // cell as the window resizes. Mirrors the startY in reset().
      const hintRow = Math.max(2, rows - 4);
      const hintBaseline = hintRow * CELL + topOffset - CELL * 0.4;
      document.documentElement.style.setProperty(
        "--snake-hint-bottom",
        `${Math.round(window.innerHeight - hintBaseline)}px`,
      );
    }

    /**
     * Everything the page actually draws is solid, and each thing is solid in
     * the shape you can see: a button is its rectangle (border and fill
     * included), a paragraph is its letters.
     *
     * The old version measured glyphs for anything with text and only fell
     * back to the element box when there was none — so a bordered button
     * blocked its lettering but not its border, and the filled "browse the
     * board" button was passable everywhere except the letters themselves.
     */
    function paintsBox(el: Element, cs: CSSStyleDeclaration) {
      // Replaced elements have no text to measure; their box is all there is.
      // toUpperCase because SVG elements preserve case: an inline <svg>
      // reports "svg", so a bare "SVG" entry here never matched and the
      // element stayed passable.
      const tag = el.tagName.toUpperCase();
      if (["IMG", "VIDEO", "CANVAS", "SVG", "IFRAME", "PICTURE"].includes(tag)) return true;
      const bg = cs.backgroundColor;
      if (bg && bg !== "transparent" && !bg.startsWith("rgba(0, 0, 0, 0)")) return true;
      return (["top", "right", "bottom", "left"] as const).some((side) => {
        const style = cs.getPropertyValue(`border-${side}-style`);
        return (
          style !== "none" &&
          style !== "hidden" &&
          parseFloat(cs.getPropertyValue(`border-${side}-width`)) > 0
        );
      });
    }

    function readObstacles() {
      const range = document.createRange();
      const rects: DOMRect[] = [];
      const viewportArea = window.innerWidth * window.innerHeight;

      const pushGlyphs = (node: Node) => {
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
      };

      const walk = (el: Element) => {
        if (el === canvas) return;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden") return;
        if (parseFloat(cs.opacity || "1") === 0) return;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        // A layout wrapper that happens to paint a background would wall off
        // the whole board if taken literally, so anything covering most of
        // the viewport is treated as scenery and descended into instead.
        const coversPage = rect.width * rect.height > viewportArea * 0.6;

        if (!coversPage && paintsBox(el, cs)) {
          rects.push(rect);
          return; // the box IS the obstacle — don't also measure its letters
        }

        for (const child of Array.from(el.childNodes)) {
          if (child.nodeType === Node.TEXT_NODE) pushGlyphs(child);
          else if (child.nodeType === Node.ELEMENT_NODE) walk(child as Element);
        }
      };

      // Scan the page content rather than an opt-in attribute list, so new
      // markup is solid by default instead of invisibly passable. The nav is
      // outside `main` and already excluded by topOffset.
      const root = canvas!.closest("main") ?? document.body;
      for (const child of Array.from(root.children)) walk(child);
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
      // Called on death as well as at startup, so this is where a finished
      // run is banked. At startup the snake is empty, so it scores 0 and
      // changes nothing.
      recordScore();
      // Center the snake's start cell horizontally on the hint text,
      // so the head's circle sits visually under "press any arrow".
      ctx!.font = `14px ${bodyFont}`;
      const hintWidth = ctx!.measureText(hintRef.current).width;
      const hintCenterPx = brandX + hintWidth / 2;
      const startX = Math.max(2, Math.round((hintCenterPx - CELL / 2) / CELL));
      const startY = Math.max(2, rows - 4);
      idleRow = startY;
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

      if (snake.length > 0) {
        const head = snake[0];
        ctx!.fillStyle = HINT_COLOR;
        ctx!.font = `14px ${bodyFont}`;
        ctx!.textAlign = "left";
        ctx!.textBaseline = "alphabetic";

        // While idle this is the hint; once moving it becomes the live score,
        // so the line never jumps position — only its content changes.
        const parts = [
          idle ? hintRef.current : `${currentLabelRef.current} ${score()}`,
        ];
        // A best only appears once there is one; a "best 0" on a first visit
        // would be noise.
        if (bestScore > 0) parts.push(`${bestLabelRef.current} ${bestScore}`);

        // X anchored to the navbar brand so "p of press" sits under the
        // "x of xarxa". Y uses the idle row once the snake is moving, so the
        // score stays put instead of chasing it; while idle the two are the
        // same row (reset() sets both), so the line never jumps.
        const y = (idle ? head.y : idleRow) * CELL + topOffset - CELL * 0.4;
        ctx!.fillText(parts.join("   ·   "), brandX, y);
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
        // Here rather than in reset(), which is also the startup path.
        // tone() would refuse to play at load anyway (no audio context until
        // the first keypress), but a crash sound belongs on the crash, not in
        // a function whose other caller is initialisation.
        playCrash();
        reset();
        draw();
        return;
      }

      snake.unshift(next);
      if (next.x === apple.x && next.y === apple.y) {
        playEat();
        spawnApple();
      } else {
        snake.pop();
      }
      draw();
    }

    const ARROWS: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };

    function handleKey(e: KeyboardEvent) {
      const next = ARROWS[e.key];
      if (!next) return;
      e.preventDefault();
      // This keypress is the user gesture the audio context needs.
      unlockAudio();

      // Holding any arrow sprints. Tracked as a set because releasing one key
      // while another is still down should keep the sprint going.
      // The OS repeats keydown while a key is held; this membership check is
      // what stops every repeat re-entering the branch below and resetting the
      // pending tick, which would stall the snake.
      if (!heldArrows.has(e.key)) {
        heldArrows.add(e.key);
        // Only the 0 -> 1 transition changes speed. A second arrow pressed
        // while one is already down is already boosted.
        if (heldArrows.size === 1) reschedule();
      }

      const moving = direction.dx !== 0 || direction.dy !== 0;
      if (moving && next[0] === -direction.dx && next[1] === -direction.dy) return;
      pending = { dx: next[0], dy: next[1] };
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (!ARROWS[e.key]) return;
      if (heldArrows.delete(e.key) && heldArrows.size === 0) reschedule();
    }

    // Tabbing away mid-sprint never delivers the keyup, which would leave the
    // snake boosted forever.
    function handleBlur() {
      if (heldArrows.size === 0) return;
      heldArrows.clear();
      reschedule();
    }

    resize();
    readObstacles();
    reset();
    draw();

    function currentDelay() {
      const eaten = Math.max(0, snake.length - 3);
      const base = Math.max(MIN_TICK_MS, START_TICK_MS - eaten * SPEEDUP_PER_APPLE);
      if (heldArrows.size === 0) return base;
      return Math.max(BOOST_MIN_TICK_MS, Math.round(base * BOOST_FACTOR));
    }

    let tickFailed = false;
    function scheduleNext() {
      timeoutId = window.setTimeout(() => {
        try {
          tick();
        } catch (err) {
          // Stop rather than reschedule: a deterministically throwing tick
          // would log once per frame — up to 28 times a second under sprint —
          // for as long as the tab stays open. The game is decorative, so a
          // dead one is a far better outcome than a console flood.
          if (!tickFailed) {
            tickFailed = true;
            console.error("[SnakeGame tick]", err);
          }
          return;
        }
        scheduleNext();
      }, currentDelay());
    }

    // Swap the pending tick for one at the new speed, so press and release
    // both bite immediately instead of after the current step finishes.
    function reschedule() {
      window.clearTimeout(timeoutId);
      scheduleNext();
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
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(timeoutId);
      if (scrollRaf) window.cancelAnimationFrame(scrollRaf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("scroll", onScroll);
      // Browsers cap how many audio contexts a page may hold; leaking one per
      // mount would eventually silence the game.
      audioCtx?.close().catch(() => {});
      // Leave no stale value behind for a page without the game on it.
      document.documentElement.style.removeProperty("--snake-hint-bottom");
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none hidden md:block"
    />
  );
}
