import { Link } from 'react-router';
import { Screen } from '../components/ui';
import { IconPen, IconSpark } from '../components/icons';
import { getLists } from '../lib/storage';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const lastList = getLists()[0];

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
          <span className="text-[15px] text-muted">Type it the way you say it.</span>
        </span>
      </Link>

      <div aria-disabled="true" className="flex items-center gap-4 rounded-[28px] bg-white/60 px-6 py-5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
          <IconSpark className="size-6" />
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-lg font-extrabold text-muted">Tell me what to buy</span>
          <span className="text-sm text-faint">Meal plan → list</span>
        </span>
        <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-extrabold text-brand-ink">Soon</span>
      </div>

      {lastList && (
        <Link to={`/list/${lastList.id}/check`} className="flex items-center justify-between gap-3 rounded-[22px] bg-white px-[18px] py-3.5">
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[13px] font-bold text-muted">Last list</span>
            <span className="truncate text-[15px] font-extrabold">
              {lastList.title} · {lastList.items.length} items
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-brand-soft px-3.5 py-2 text-[13px] font-extrabold text-brand">Open</span>
        </Link>
      )}
    </Screen>
  );
}
