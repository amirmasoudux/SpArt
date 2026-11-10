import { Link } from 'react-router';
import { Screen } from '../components/ui';
import { IconPen, IconSpark } from '../components/icons';
import { getLists, getTrips } from '../lib/storage';
import { euro } from '../lib/plan';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const lastList = getLists()[0];
  const now = new Date();
  const monthTrips = getTrips().filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const saved = monthTrips.reduce((s, t) => s + t.saved, 0);

  return (
    <Screen nav>
      <p className="text-[15px] font-bold text-muted">{greeting()}</p>
      <h1 className="mb-2 text-[34px] leading-[1.1] font-extrabold tracking-tight">What are we buying this week?</h1>

      <Link to="/new" className="animate-rise flex flex-col gap-7 rounded-[28px] bg-white p-6 transition hover:shadow-md">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-white">
          <IconPen className="size-6" />
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-2xl font-extrabold tracking-tight">Write my list</span>
          <span className="text-[15px] text-muted">Type it. We check this week’s Prospekte.</span>
        </span>
      </Link>

      <Link to="/meals" className="flex items-center gap-4 rounded-[28px] bg-white px-6 py-5 transition hover:shadow-md">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
          <IconSpark className="size-6" />
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-lg font-extrabold">Tell me what to buy</span>
          <span className="text-sm text-muted">4 questions → meal plan → list</span>
        </span>
      </Link>

      {lastList && (
        <Link
          to={lastList.status === 'done' ? '/lists' : `/list/${lastList.id}/check`}
          className="flex items-center justify-between gap-3 rounded-[22px] bg-white px-[18px] py-3.5"
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[13px] font-bold text-muted">Last list</span>
            <span className="truncate text-[15px] font-extrabold">
              {lastList.title} · {lastList.items.length} items
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-brand-soft px-3.5 py-2 text-[13px] font-extrabold text-brand">
            {lastList.status === 'done' ? 'See lists' : 'Continue'}
          </span>
        </Link>
      )}

      <div className="flex-1" />

      <Link to="/savings" className="flex items-end justify-between rounded-[28px] bg-white px-6 py-[22px]">
        <span className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-muted">Saved this month</span>
          <span className="text-[40px] leading-none font-extrabold tracking-tight text-save">{euro(Math.max(0, saved))}</span>
        </span>
        <span className="text-sm font-bold text-muted">
          {monthTrips.length} {monthTrips.length === 1 ? 'trip' : 'trips'}
        </span>
      </Link>
    </Screen>
  );
}
