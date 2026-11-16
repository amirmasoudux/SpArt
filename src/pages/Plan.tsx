import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router';
import { BottomAction, PrimaryLink, Screen, SectionLabel, TopBar } from '../components/ui';
import { getStores } from '../lib/dataSource';
import { fetchPlan, type PlanResult } from '../lib/api';
import type { Pick } from '../lib/pick';
import { euro } from '../lib/plan';
import { WEEK } from '../lib/prospekt';
import { getList, getMyChains } from '../lib/storage';

const shortDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

function PickRow({ p }: { p: Pick }) {
  return (
    <li className="flex min-h-[56px] items-center justify-between gap-3 px-[18px] py-2.5">
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[15px] font-bold">
          {p.name}
          {p.qty > 1 ? ` × ${p.qty}` : ''}
        </span>
        <span className="truncate text-xs text-muted">
          {p.title}
          {p.perUnit ? ` · ${euro(p.perUnit.value)}/${p.perUnit.unit}` : ''}
        </span>
        <span className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-save px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-white uppercase">Offer</span>
          {p.saving > 0 && <span className="text-xs font-extrabold text-save-ink">You save {euro(p.saving)}</span>}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end whitespace-nowrap">
        <span className="text-[15px] font-extrabold text-save-ink">{euro(p.price)}</span>
        {p.saving > 0 && <span className="text-xs text-faint line-through">{euro(p.price + p.saving)}</span>}
      </span>
    </li>
  );
}

export default function Plan() {
  const { id = '' } = useParams();
  const location = useLocation();
  const list = getList(id);
  const [chains] = useState(getMyChains);
  // The Analyze screen passes the result along. After a reload, ask again.
  const [result, setResult] = useState<PlanResult | undefined>(location.state as PlanResult | undefined);

  useEffect(() => {
    if (!result && list && chains.length) fetchPlan(list.items, chains).then(setResult);
  }, [result, list, chains]);

  if (!list) return <Navigate to="/lists" replace />;
  if (!chains.length) return <Navigate to={`/stores?next=/list/${id}/analyze`} replace />;
  if (!result) return <Screen><p className="text-muted">Loading your plan…</p></Screen>;

  const stores = getStores().filter((s) => result.chains.includes(s.chain));
  const storeNames = stores.map((s) => s.name).join(', ');
  const priced = result.picks.filter((p) => p.kind !== 'none');
  const none = result.picks.filter((p) => p.kind === 'none');
  const onOffer = priced.filter((p) => p.kind === 'offer').length;
  // One section per supermarket, so the user knows what to buy where.
  const byStore = stores
    .map((s) => ({ store: s, picks: priced.filter((p) => p.chain === s.chain).sort((a, b) => b.saving - a.saving) }))
    .filter((g) => g.picks.length > 0);
  const week = WEEK[result.chains[0]];

  return (
    <Screen>
      <TopBar label="Your plan" back={`/list/${list.id}/check`} />

      <section aria-label="Summary" className="animate-rise flex flex-col gap-5 rounded-[28px] bg-white p-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-muted">At {storeNames} this week</span>
          <h1 className="text-[34px] leading-none font-extrabold tracking-tight">
            {byStore.length > 1 ? `Shop at ${byStore.length} stores` : byStore.length === 1 ? `Go to ${byStore[0].store.name}` : 'No prices found'}
          </h1>
          {priced.length > 0 && <span className="text-sm text-muted">Offers on your list {euro(result.total)}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-muted">You save with this week’s offers</span>
          <span className={`text-[52px] leading-none font-extrabold tracking-tight ${result.saved > 0 ? 'text-save' : 'text-ink'}`}>
            {euro(result.saved)}
          </span>
          <span className="text-[13px] text-muted">
            {onOffer} of {result.picks.length} items on offer at your supermarkets
          </span>
        </div>
      </section>

      {byStore.map((g) => (
        <section key={g.store.id} className="flex flex-col gap-1.5" aria-label={`Buy at ${g.store.name}`}>
          <SectionLabel>
            At {g.store.name} · {g.picks.length} {g.picks.length === 1 ? 'item' : 'items'}
          </SectionLabel>
          <ul className="rounded-[24px] bg-white py-1.5">
            {g.picks.map((p) => (
              <PickRow key={p.itemId} p={p} />
            ))}
          </ul>
        </section>
      ))}

      {none.length > 0 && (
        <section className="flex flex-col gap-1.5" aria-label="No offer at your supermarkets">
          <SectionLabel>Not on offer this week</SectionLabel>
          <ul className="rounded-[24px] bg-white py-1.5">
            {none.map((p) => (
              <li key={p.itemId} className="flex min-h-12 items-center justify-between gap-3 px-[18px] text-[15px] font-bold">
                {p.name}
                {p.qty > 1 ? ` × ${p.qty}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="px-1.5 text-xs text-faint">
        Offers: this week’s Prospekte ({shortDate(week.from)} – {shortDate(week.to)}) of {storeNames} in Siegburg, {result.offerCount} offers.
{' '}Only offers, no estimated prices. Pack sizes are compared by the price per kg or litre when the Prospekt prints it. A saving is shown when the Prospekt prints the old price.
        {result.source === 'local' ? ' (Built-in data, server offline.)' : ''}{' '}
        <Link to={`/stores?next=/list/${list.id}/analyze`} className="font-bold text-brand underline">
          Change supermarkets
        </Link>
      </p>

      <BottomAction>
        <PrimaryLink to={`/list/${list.id}/shop`} state={result}>
          Start shopping
        </PrimaryLink>
      </BottomAction>
    </Screen>
  );
}
