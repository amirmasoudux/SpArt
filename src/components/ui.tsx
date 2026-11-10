import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router';

// Page frame: phone-width column with a simple nav at the bottom.
export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 pb-20">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-md border-t bg-white">
        <NavLink to="/" end className={({ isActive }) => `flex-1 p-3 text-center ${isActive ? 'font-bold' : 'text-muted'}`}>
          Home
        </NavLink>
        <NavLink to="/lists" className={({ isActive }) => `flex-1 p-3 text-center ${isActive ? 'font-bold' : 'text-muted'}`}>
          My lists
        </NavLink>
        <NavLink to="/savings" className={({ isActive }) => `flex-1 p-3 text-center ${isActive ? 'font-bold' : 'text-muted'}`}>
          Savings
        </NavLink>
      </nav>
    </div>
  );
}

export function BackLink({ to }: { to: string }) {
  return (
    <Link to={to} className="text-brand">
      ← Back
    </Link>
  );
}

export function Button(props: { children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean }) {
  return (
    <button
      type={props.type ?? 'button'}
      onClick={props.onClick}
      disabled={props.disabled}
      className="rounded-lg bg-brand px-4 py-3 font-semibold text-white disabled:opacity-40"
    >
      {props.children}
    </button>
  );
}

// Simple "are you sure?" box, used before deleting something.
export function Confirm(props: { text: string; onYes: () => void; onNo: () => void }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
      <div role="dialog" aria-modal="true" className="flex w-full max-w-sm flex-col gap-4 rounded-lg bg-white p-4">
        <p className="font-semibold">{props.text}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={props.onNo} className="rounded-lg border px-4 py-2">
            Cancel
          </button>
          <button type="button" onClick={props.onYes} className="rounded-lg bg-red-600 px-4 py-2 text-white">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
