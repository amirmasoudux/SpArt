import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { IconCheck } from '../components/icons';
import { getStores } from '../lib/dataSource';
import { fetchPlan, type PlanResult } from '../lib/api';
import { getList, getMyChains } from '../lib/storage';
import { getProspektOffers, WEEK } from '../lib/prospekt';

// The "working on it" moment between the list and the plan.
// It shows the user WHERE the answer comes from: this week's Prospekte.
// While the steps play, the plan is fetched from the backend.

const STEP_MS = 650;

function shortDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function Analyze() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const list = getList(id);
  const [chains] = useState(getMyChains);
  // Only the user's supermarkets and their Prospekte.
  const stores = getStores().filter((s) => chains.includes(s.chain));
  const offers = getProspektOffers().filter((o) => chains.includes(o.chain));

  // Steps: one per store Prospekt, then "match items", then "compare".
  const totalSteps = stores.length + 2;
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<PlanResult | null>(null);
  const started = useRef(false);

  // Ask the backend once, while the steps play.
  useEffect(() => {
    if (!list || !chains.length || started.current) return;
    started.current = true;
    fetchPlan(list.items, chains).then(setResult);
  }, [list, chains]);

  useEffect(() => {
    const fast = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (step >= totalSteps) {
      if (!result) return; // steps done, still waiting for the answer
      const t = setTimeout(() => navigate(`/list/${id}/plan`, { replace: true, state: result }), fast ? 0 : 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), fast ? 80 : STEP_MS);
    return () => clearTimeout(t);
  }, [step, totalSteps, id, navigate, result]);

  if (!list) return <Navigate to="/lists" replace />;
  if (!chains.length) return <Navigate to={`/stores?next=/list/${id}/analyze`} replace />;

  const weeks = Object.values(WEEK);
  const from = offers.length ? new Date(`${weeks.map((w) => w.from).sort()[0]}T00:00:00`) : null;
  const to = offers.length ? new Date(`${weeks.map((w) => w.to).sort().at(-1)}T00:00:00`) : null;
  const count = list.items.length;
  const matchDone = step > stores.length;
  const compareDone = step > stores.length + 1;

  const row = (label: string, done: boolean, active: boolean) => (
    <li key={label} className={`flex items-center gap-3.5 transition-opacity ${done || active ? 'opacity-100' : 'opacity-60'}`}>
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
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-center gap-8 bg-bg px-6 py-12" aria-live="polite">
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
          {row(`Searching your ${count} ${count === 1 ? 'item' : 'items'}`, matchDone, step === stores.length)}
          {row('Finding the best price for each item', compareDone, step === stores.length + 1)}
        </ul>
      </div>

      <p className="text-center text-sm text-faint">{offers.length} offers this week from your {stores.length === 1 ? 'supermarket' : `${stores.length} supermarkets`}</p>
    </main>
  );
}
