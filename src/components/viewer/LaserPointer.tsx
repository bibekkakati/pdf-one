import { useEffect, useRef } from 'react';

const TRAIL_MS = 260;

/** Full-screen red laser dot with a fading trail. Purely visual; never blocks clicks. */
const LaserPointer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const color = getComputedStyle(document.documentElement).getPropertyValue('--laser').trim() || '0 100% 50%';
    const hsl = (a: number) => `hsl(${color} / ${a})`;
    let pts: { x: number; y: number; t: number }[] = [];
    let raf = 0;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const onMove = (e: PointerEvent) => { pts.push({ x: e.clientX, y: e.clientY, t: performance.now() }); };
    const frame = () => {
      const now = performance.now();
      pts = pts.filter(p => now - p.t < TRAIL_MS);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.lineCap = 'round';
      for (let i = 1; i < pts.length; i++) {
        const life = 1 - (now - pts[i].t) / TRAIL_MS;
        ctx.strokeStyle = hsl(life * 0.7);
        ctx.lineWidth = 2 + life * 5;
        ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke();
      }
      const last = pts[pts.length - 1] || lastPos;
      if (last) {
        lastPos = last;
        ctx.shadowColor = hsl(0.9); ctx.shadowBlur = 16;
        ctx.fillStyle = hsl(1);
        ctx.beginPath(); ctx.arc(last.x, last.y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(frame);
    };
    let lastPos: { x: number; y: number } | null = null;
    resize();
    addEventListener('resize', resize);
    addEventListener('pointermove', onMove);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); removeEventListener('pointermove', onMove); };
  }, []);
  return <canvas ref={canvasRef} data-testid="laser-pointer" className="fixed inset-0 z-[100] pointer-events-none" style={{ width: '100vw', height: '100vh' }} />;
};

export default LaserPointer;
