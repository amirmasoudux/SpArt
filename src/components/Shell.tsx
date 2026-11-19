import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useLocation } from 'react-router';

// Splash: "SpArt" pops up on violet, € coins jump out of it and fall, then "The art of Sparen".
// About two seconds, then it fades away. With Reduce Motion: no movement, just the name.
const COINS = [
  { x: -120, r: -200, d: 0.5 },
  { x: 95, r: 240, d: 0.58 },
  { x: -55, r: 160, d: 0.66 },
  { x: 140, r: -180, d: 0.74 },
  { x: -150, r: 220, d: 0.82 },
  { x: 40, r: -260, d: 0.9 },
];
function Splash() {
  const [phase, setPhase] = useState<'show' | 'hide' | 'gone'>('show');
  useEffect(() => {
    const hide = window.setTimeout(() => setPhase('hide'), 2000);
    const gone = window.setTimeout(() => setPhase('gone'), 2400);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(gone);
    };
  }, []);
  if (phase === 'gone') return null;
  return (
    <div
      aria-hidden="true"
      className={`splash fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 overflow-hidden bg-brand text-white transition-opacity duration-400 ${phase === 'hide' ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
    >
      <div className="relative flex items-center justify-center">
        {COINS.map((c, i) => (
          <span
            key={i}
            className="splash-coin absolute flex size-11 items-center justify-center rounded-full border-[3px] border-[#e0a91b] bg-[#f5c542] text-xl font-extrabold text-[#7a5300]"
            style={{ '--x': `${c.x}px`, '--r': `${c.r}deg`, animationDelay: `${c.d}s` } as CSSProperties}
          >
            €
          </span>
        ))}
        <span className="splash-logo relative text-[64px] leading-none font-extrabold tracking-tight">SpArt</span>
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
