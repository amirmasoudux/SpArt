import { useEffect, useRef, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { IconBack, IconChart, IconHome, IconList } from './icons';

// Page frame: phone-width column, centred on bigger screens.
export function Screen({ children, nav = false }: { children: ReactNode; nav?: boolean }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-bg">
      <main className={`flex flex-1 flex-col gap-4 px-5 pt-12 ${nav ? 'pb-28' : 'pb-8'}`}>{children}</main>
      {nav && <BottomNav />}
    </div>
  );
}

export function TopBar({ label, back }: { label: string; back?: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => (back ? navigate(back) : navigate(-1))}
        aria-label="Back"
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white"
      >
        <IconBack className="size-5" />
      </button>
      <span className="text-[15px] font-bold text-muted">{label}</span>
    </div>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <h1 className="text-[30px] leading-tight font-extrabold tracking-tight">{children}</h1>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="pl-1.5 text-xs font-extrabold tracking-wider text-muted uppercase">{children}</h2>;
}

const primary =
  'flex h-[58px] w-full items-center justify-center rounded-full bg-brand px-6 text-[17px] font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40';

export function PrimaryButton(props: { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit' }) {
  return (
    <button type={props.type ?? 'button'} onClick={props.onClick} disabled={props.disabled} className={primary}>
      {props.children}
    </button>
  );
}

export function PrimaryLink({ to, children, state }: { to: string; children: ReactNode; state?: unknown }) {
  return (
    <Link to={to} state={state} className={primary}>
      {children}
    </Link>
  );
}

// Sticks the main action to the bottom of the screen.
export function BottomAction({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-0 -mx-5 mt-auto bg-gradient-to-t from-bg from-70% to-transparent px-5 pt-6 pb-6">{children}</div>;
}

// Bottom sheet used for every "are you sure?" question.
export function ConfirmSheet(props: {
  title: string;
  text: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && props.onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-ink/55" onClick={props.onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(e) => e.stopPropagation()}
        className="animate-sheet mx-auto flex w-full max-w-[440px] flex-col gap-3.5 rounded-t-[28px] bg-white px-5 pt-3 pb-8"
      >
        <span className="mx-auto h-1.5 w-10 rounded-full bg-line" />
        <h2 id="sheet-title" className="text-[22px] font-extrabold tracking-tight">{props.title}</h2>
        <p className="text-[15px] leading-relaxed text-muted">{props.text}</p>
        <button
          type="button"
          onClick={props.onConfirm}
          className={`h-[58px] rounded-full text-[17px] font-bold text-white ${props.danger ? 'bg-danger' : 'bg-brand'}`}
        >
          {props.confirmLabel}
        </button>
        <button ref={cancelRef} type="button" onClick={props.onCancel} className="h-[58px] rounded-full bg-bg text-[17px] font-bold">
          {props.cancelLabel ?? 'Cancel'}
        </button>
      </div>
    </div>
  );
}

function BottomNav() {
  const item = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-12 flex-col items-center justify-center gap-1 text-xs ${isActive ? 'font-extrabold text-ink' : 'font-bold text-faint'}`;
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 mx-auto grid w-full max-w-[440px] grid-cols-3 bg-white px-4 pt-2.5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <NavLink to="/" end className={item}>
        <IconHome className="size-6" />
        Home
      </NavLink>
      <NavLink to="/lists" className={item}>
        <IconList className="size-6" />
        List
      </NavLink>
      <NavLink to="/savings" className={item}>
        <IconChart className="size-6" />
        Savings
      </NavLink>
    </nav>
  );
}
