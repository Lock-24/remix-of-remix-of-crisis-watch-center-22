import { useEffect, useRef } from "react";

/** Original ambient campus-signal animation; not the licensed Neural Flash component. */
export function CampusBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let last = 0;
    const draw = (time: number) => {
      frame = requestAnimationFrame(draw);
      if (document.hidden || time - last < 45) return;
      last = time;
      const width = canvas.clientWidth, height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      ctx.clearRect(0, 0, width, height);
      const t = motion.matches ? 0 : time / 24000;
      ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue("--signal-stroke").trim();
      ctx.lineWidth = 1;
      for (let i = 0; i < 14; i++) {
        ctx.beginPath();
        for (let x = 0; x <= width; x += 16) {
          const y = height * .35 + i * 24 + Math.sin(x / 320 + t + i * .16) * 90 + Math.cos(x / 180 - t) * 24;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);
  return <canvas ref={canvasRef} aria-hidden="true" className="campus-background pointer-events-none fixed inset-0 h-full w-full" />;
}