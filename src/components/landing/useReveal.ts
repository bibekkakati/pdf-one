import { useEffect, useRef, useState } from 'react';

// Scroll-reveal: content renders visible on the server/prerender, then hides and fades in once observed.
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [state, setState] = useState<'static' | 'hidden' | 'shown'>('static');

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) return; // already on screen
    setState('hidden');
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setState('shown'); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const className = state === 'hidden' ? 'opacity-0 translate-y-4' : state === 'shown' ? 'animate-reveal-up' : '';
  return { ref, className };
}
