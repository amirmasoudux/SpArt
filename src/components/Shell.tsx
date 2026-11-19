import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useLocation } from 'react-router';

// Splash: groceries fall into a basket, the basket shakes and "SpArt" jumps out of it,
// then "The art of Sparen". About 2.5 seconds, then it fades away. With Reduce Motion: just the name.
const ITEMS = [
  { e: '🍌', x: -38, d: 0.05, r: -40 },
  { e: '🧀', x: 30, d: 0.25, r: 30 },
  { e: '🥛', x: -8, d: 0.45, r: -20 },
  { e: '🍎', x: 42, d: 0.62, r: 50 },
  { e: '🍕', x: -30, d: 0.8, r: -35 },
];
function Splash() {
  const [phase, setPhase] = useState<'show' | 'hide' | 'gone'>('show');
  useEffect(() => {
    const hide = window.setTimeout(() => setPhase('hide'), 2600);
    const gone = window.setTimeout(() => setPhase('gone'), 3000);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(gone);
    };
  }, []);
  if (phase === 'gone') return null;
  return (
    <div
      aria-hidden="true"
      className={`splash fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 overflow-hidden bg-brand text-white transition-opacity duration-400 ${phase === 'hide' ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
    >
      <div className="relative h-[280px] w-[240px]">
        <span className="splash-logo absolute inset-x-0 top-6 text-center text-[64px] leading-none font-extrabold tracking-tight">SpArt</span>
        {ITEMS.map((it) => (
          <span
            key={it.e}
            className="splash-item absolute bottom-[78px] left-1/2 -ml-5 text-[40px] leading-none"
            style={{ '--x': `${it.x}px`, '--r': `${it.r}deg`, animationDelay: `${it.d}s` } as CSSProperties}
          >
            {it.e}
          </span>
        ))}
        <svg className="splash-basket absolute bottom-0 left-1/2 -ml-[80px]" width="160" height="120" viewBox="0 0 160 120" fill="none">
          <path d="M44 46 C44 10 116 10 116 46" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
          <path d="M10 46 H150 L134 112 H26 Z" fill="#fff" />
          <path d="M10 46 H150" stroke="#fff" strokeWidth="10" strokeLinecap="round" />
          <path d="M54 62 L58 98 M80 62 V98 M106 62 L102 98" stroke="#5b3df5" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>
      <span className="splash-tag text-lg font-semibold text-white/80">The art of Sparen</span>
    </div>
  );
}

// Big screens: the app sits in a phone frame, with SpArt's name next to it.
const DESKTOP = '(min-width: 900px) and (min-height: 700px)';
function useDesktop() {
  const [desk, setDesk] = useState(() => typeof window !== 'undefined' && window.matchMedia(DESKTOP).matches);
  useEffect(() => {
    const m = window.matchMedia(DESKTOP);
    const on = () => setDesk(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return desk;
}

export default function Shell({ children }: { children: ReactNode }) {
  const desk = useDesktop();
  const screen = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  // Each new screen starts at the top (inside the phone frame the page scrolls in the frame).
  useEffect(() => {
    screen.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [pathname]);

  if (!desk) {
    return (
      <>
        <Splash />
        {children}
      </>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center gap-24 bg-[#ecebf4] px-10 py-8">
      <div className="flex max-w-[380px] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-[64px] leading-none font-extrabold tracking-tight text-brand">SpArt</span>
          <span className="text-2xl font-bold">The art of Sparen</span>
        </div>
        <p className="text-lg leading-relaxed text-muted">Write your shopping list. SpArt tells you which supermarket is cheapest for your whole basket.</p>
      </div>
      {/* transform: fixed parts of the app (bottom bar, sheets, splash) stay inside the phone */}
      <div className="phone relative h-[min(844px,calc(100dvh-64px))] w-[390px] shrink-0 overflow-hidden rounded-[56px] border-[12px] border-ink bg-bg shadow-[0_30px_80px_-20px_rgba(19,18,31,0.45)] [transform:translateZ(0)]">
        <div ref={screen} className="phone-screen h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Splash />
          {children}
        </div>
      </div>
    </div>
  );
}
