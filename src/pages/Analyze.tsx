import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { IconCheck } from '../components/icons';
import { getCurrentOffers, getStores } from '../lib/dataSource';
import { getList } from '../lib/storage';

// The "working on it" moment between the list and the plan.
// It shows the user WHERE the answer comes from: this week's Prospekte.
// Later the same screen waits for the real API call.

const STEP_MS = 650;

function shortDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function Analyze() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const list = getList(id);
  const stores = getStores();
  const offers = getCurrentOffers();

  // Steps: one per store Prospekt, then "match items", then "compare".
  const totalSteps = stores.length + 2;
  const [step, setStep] = useState(0);

  useEffect(() => {
    const fast = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (step >= totalSteps) {
      const t = setTimeout(() => navigate(`/list/${id}/plan`, { replace: true }), fast ? 0 : 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), fast ? 80 : STEP_MS);
    return () => clearTimeout(t);
  }, [step, totalSteps, id, navigate]);

  if (!list) return <Navigate to="/lists" replace />;

  const from = offers.length ? new Date(Math.min(...offers.map((o) => o.validFrom.getTime()))) : null;
  const to = offers.length ? new Date(Math.max(...offers.map((o) => o.validTo.getTime()))) : null;
  const count = list.items.filter((i) => i.productId).length;
  const matchDone = step > stores.length;
  const compareDone = step > stores.length + 1;

  const row = (label: string, done: boolean, active: boolean) => (
    <li key={label} className={`flex items-center gap-3.5 transition-opacity ${done || active ? 'opacity-100' : 'opacity-40'}`}>
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
          done ? 'bg-save text-white' : active ? 'border-[3px] border-brand border-t-transparent animate-spin' : 'border-2 border-line'
        }`}
      >
        {done && <IconCheck className="size-4" />}
      </span>
      <span className="text-[17px] font-bold">{label}</span>
    </li>
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-center gap-8 bg-bg px-6 py-12" aria-live="polite">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-extrabold tracking-wider text-brand uppercase">Finding your best plan</span>
        <h1 className="text-[30px] leading-tight font-extrabold tracking-tight">Checking this week’s Prospekte</h1>
        {from && to && (
          <p className="text-[15px] text-muted">
            Offers valid {shortDate(from)} – {shortDate(to)}
          </p>
        )}
      </div>

      <div className="rounded-[28px] bg-white p-6">
        <ul className="flex flex-col gap-5">
          {stores.map((s, i) => row(`${s.name} Prospekt`, step > i, step === i))}
          {row(`Matching your ${count} ${count === 1 ? 'item' : 'items'}`, matchDone, step === stores.length)}
          {row('Finding the cheapest store', compareDone, step === stores.length + 1)}
        </ul>
      </div>

      <p className="text-center text-sm text-faint">{offers.length} offers this week from {stores.length} supermarkets</p>
    </div>
  );
}
