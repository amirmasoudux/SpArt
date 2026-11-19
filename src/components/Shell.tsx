import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router';

// Splash: SpArt's name on violet when the app opens (20 seconds for the Demo Day intro; a tap skips it).
function Splash() {
  const [phase, setPhase] = useState<'show' | 'hide' | 'gone'>('show');
  useEffect(() => {
    const hide = window.setTimeout(() => setPhase('hide'), 20000);
    const gone = window.setTimeout(() => setPhase('gone'), 20400);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(gone);
    };
  }, []);
  if (phase === 'gone') return null;
  return (
    <div
      aria-hidden="true"
      onClick={() => {
        setPhase('hide');
        window.setTimeout(() => setPhase('gone'), 400);
      }}
      className={`splash fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-brand text-white transition-opacity duration-400 ${phase === 'hide' ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
    >
      <span className="splash-logo text-[64px] leading-none font-extrabold tracking-tight">SpArt</span>
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
    <div className="relative flex min-h-dvh items-center justify-center gap-24 bg-[#ecebf4] px-10 py-8">
      {/* Small and quiet, bottom left: doesn't take attention from the app. */}
      <div className="absolute bottom-6 left-8 flex items-center gap-3 rounded-2xl bg-white/70 p-2 pr-4">
        <img src="/linkedin-qr.svg" alt="QR code for LinkedIn" className="size-14 shrink-0" />
        <span className="text-[13px] font-bold text-muted">Let’s connect on LinkedIn</span>
      </div>
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
