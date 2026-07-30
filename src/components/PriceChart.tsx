import { useEffect, useRef } from "react";
import type { Candle } from "../lib/types";

const COLORS = {
  line: "#e0924c",
  grid: "#363b30",
  faint: "#767a6c",
  surface: "#1a1d17",
  text: "#edefe6",
};

function niceTicks(min: number, max: number, count: number): number[] {
  const range = max - min || 1;
  const raw = range / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max; v += step) ticks.push(v);
  return ticks;
}

interface Layout {
  padL: number;
  padR: number;
  padT: number;
  padB: number;
  plotW: number;
  plotH: number;
}

function layoutFor(w: number, h: number): Layout {
  const padL = 46, padR = 10, padT = 12, padB = 22;
  return { padL, padR, padT, padB, plotW: w - padL - padR, plotH: h - padT - padB };
}

export function PriceChart({ candles }: { candles: Candle[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<Layout | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    if (!canvas || !tooltip || candles.length === 0) return;

    const closes = candles.map((c) => c.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const pad = (max - min) * 0.08 || max * 0.05;
    const yMin = min - pad;
    const yMax = max + pad;
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    function xAt(L: Layout, i: number) {
      return L.padL + (i / (closes.length - 1)) * L.plotW;
    }
    function yAt(L: Layout, v: number) {
      return L.padT + (1 - (v - yMin) / (yMax - yMin)) * L.plotH;
    }

    function draw(hoverIndex: number | null) {
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width, h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const L = layoutFor(w, h);

      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      ctx.font = "10px -apple-system, sans-serif";
      const ticks = niceTicks(yMin, yMax, 4);
      ctx.fillStyle = COLORS.faint;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ticks.forEach((t) => {
        const y = Math.round(yAt(L, t)) + 0.5;
        ctx.beginPath();
        ctx.moveTo(L.padL, y);
        ctx.lineTo(L.padL + L.plotW, y);
        ctx.stroke();
        ctx.fillText("$" + t.toFixed(t < 10 ? 2 : 0), L.padL - 8, y);
      });

      ctx.beginPath();
      closes.forEach((v, i) => {
        const x = xAt(L, i), y = yAt(L, v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(xAt(L, closes.length - 1), L.padT + L.plotH);
      ctx.lineTo(xAt(L, 0), L.padT + L.plotH);
      ctx.closePath();
      ctx.fillStyle = "rgba(224, 146, 76, 0.12)";
      ctx.fill();

      ctx.beginPath();
      closes.forEach((v, i) => {
        const x = xAt(L, i), y = yAt(L, v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.fillStyle = COLORS.faint;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(`${closes.length} sessions ago`, L.padL, h - 6);
      ctx.textAlign = "right";
      ctx.fillText("today", L.padL + L.plotW, h - 6);

      const lastX = xAt(L, closes.length - 1), lastY = yAt(L, closes[closes.length - 1]);
      ctx.beginPath();
      ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.surface;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.line;
      ctx.fill();

      if (hoverIndex != null) {
        const hx = xAt(L, hoverIndex), hy = yAt(L, closes[hoverIndex]);
        ctx.beginPath();
        ctx.moveTo(hx, L.padT);
        ctx.lineTo(hx, L.padT + L.plotH);
        ctx.strokeStyle = COLORS.faint;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(hx, hy, 5, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.surface;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx, hy, 3, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.line;
        ctx.fill();
        ctx.strokeStyle = COLORS.text;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      return L;
    }

    layoutRef.current = draw(null);

    function onMove(clientX: number) {
      if (!canvas || !tooltip) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const L = layoutRef.current;
      if (!L) return;
      const frac = (x - L.padL) / L.plotW;
      let idx = Math.round(frac * (closes.length - 1));
      idx = Math.max(0, Math.min(closes.length - 1, idx));
      layoutRef.current = draw(idx);
      const currentL = layoutRef.current;
      if (!currentL) return;
      const px = xAt(currentL, idx);
      const py = yAt(currentL, closes[idx]);
      tooltip.style.left = px + "px";
      tooltip.style.top = py + "px";
      const sessionsAgo = closes.length - 1 - idx;
      tooltip.textContent = "";
      const priceEl = document.createElement("span");
      priceEl.className = "font-bold text-ink";
      priceEl.textContent = `$${closes[idx].toFixed(2)}`;
      const dateEl = document.createElement("span");
      dateEl.className = "block text-ink-faint";
      dateEl.textContent = sessionsAgo === 0 ? "today" : `${sessionsAgo} sessions ago`;
      tooltip.appendChild(priceEl);
      tooltip.appendChild(dateEl);
      tooltip.classList.remove("opacity-0");
      tooltip.classList.add("opacity-100");
    }
    function onLeave() {
      layoutRef.current = draw(null);
      tooltip?.classList.remove("opacity-100");
      tooltip?.classList.add("opacity-0");
    }

    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) onMove(e.touches[0].clientX);
    };
    const handleResize = () => {
      layoutRef.current = draw(null);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
    canvas.addEventListener("touchend", onLeave);
    window.addEventListener("resize", handleResize);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", onLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, [candles]);

  if (candles.length === 0) return null;

  const week52High = Math.max(...candles.map((c) => c.high));
  const week52Low = Math.min(...candles.map((c) => c.low));

  return (
    <div className="mt-5 border-t border-line pt-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[0.7rem] font-bold uppercase tracking-wider text-ink-faint">
          {candles.length}-session price history
        </span>
        <span className="font-mono text-xs text-ink-faint">
          52w range ${week52Low.toFixed(2)} &ndash; ${week52High.toFixed(2)}
        </span>
      </div>
      <div className="relative">
        <canvas ref={canvasRef} className="block h-[220px] w-full cursor-crosshair" />
        <div
          ref={tooltipRef}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-[115%] whitespace-nowrap border border-line-strong bg-surface px-2 py-1 font-mono text-xs opacity-0 shadow-sm transition-opacity"
        />
      </div>
    </div>
  );
}
