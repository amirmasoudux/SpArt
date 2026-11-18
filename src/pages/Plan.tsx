import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { BottomAction, PrimaryLink, Screen, SectionLabel, TopBar } from '../components/ui';
import { getCategories, getStores } from '../lib/dataSource';
import { fetchPlan, resultOf, type PlanResult, type PlanState } from '../lib/api';
import type { Pick } from '../lib/pick';
import { euro } from '../lib/plan';
import { WEEK } from '../lib/prospekt';
import { getList, getMyChains } from '../lib/storage';
import type { Chain } from '../types';

const shortDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

const monthYear = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

// One line of the shopping list: the item and its price in the chosen supermarket —
// this week's offer, or the normal price (with its source), or no price.
function PickRow({ p, storeName, compared }: { p: Pick; storeName: string; compared: boolean }) {
  return (
    <li className="flex min-h-[56px] items-center justify-between gap-3 px-[18px] py-2.5">
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[15px] font-bold">
          {p.name}
          {p.qty > 1 ? ` × ${p.qty}` : ''}
        </span>
        {p.kind === 'offer' && (
          <>
            <span className="truncate text-xs text-muted">
              {p.packs > 1 ? `${p.packs} × ` : ''}
              {p.title}
              {p.per100g ? ' · per 100 g' : ''}
              {p.bigPack ? ` · big pack, ${p.bigPack}` : ''}
              {p.perUnit ? ` · ${euro(p.perUnit.value)}/${p.perUnit.unit}` : ''}
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-save px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-white uppercase">Offer</span>
              {p.saving > 0 && <span className="text-xs font-extrabold text-save-ink">You save {euro(p.saving)}</span>}
            </span>
          </>
        )}
        {p.kind === 'normal' && p.normal && (
          <>
            <span className="truncate text-xs text-muted">
              {p.packs > 1 ? `${p.packs} × ` : ''}
              {p.title} · {p.normal.size}
            </span>
            <span className="text-xs text-faint">
              <span className="font-bold">Normal price</span> · {p.normal.source}, {monthYear(p.normal.date)}
            </span>
          </>
        )}
        {p.kind === 'none' && <span className="text-xs font-bold text-faint">No price for {storeName} yet</span>}
        {p.kind !== 'none' && !compared && <span className="text-xs text-faint">Not in the comparison (another store has no price)</span>}
      </span>
      {p.kind !== 'none' && (
        <span className="flex shrink-0 flex-col items-end whitespace-nowrap">
          <span className={`text-[15px] font-extrabold ${p.kind === 'offer' ? 'text-save-ink' : ''}`}>{euro(p.price)}</span>
          {p.saving > 0 && <span className="text-xs text-faint line-through">{euro(p.price + p.saving)}</span>}
        </span>
      )}
    </li>
  );
}

export default function Plan() {
  const { id = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const list = getList(id);
  const [chains] = useState(getMyChains);
  // The Analyze screen passes the result along. After a reload, ask again.
  const [result, setResult] = useState<PlanResult | undefined>(() => resultOf(location.state as PlanState));
  // The supermarket to shop in: the best one, unless the user taps another.
  const [chosen, setChosen] = useState<Chain | undefined>(() => {
    const s = location.state as PlanState;
    return s && 'result' in s ? s.chain : undefined;
  });

  useEffect(() => {
    if ((!result || !Array.isArray(result.stores) || !Array.isArray(result.compared)) && list && chains.length) fetchPlan(list.items, chains).then(setResult);
  }, [result, list, chains]);

  if (!list) return <Navigate to="/lists" replace />;
  if (!chains.length) return <Navigate to={`/stores?next=/list/${id}/analyze`} replace />;
  if (!result || !Array.isArray(result.stores) || !Array.isArray(result.compared)) return <Screen><p className="text-muted">Loading your plan…</p></Screen>;

  const stores = getStores();
  const nameOf = (c: Chain) => stores.find((s) => s.chain === c)?.name ?? c;
  const best = result.stores[0];
  const plan = result.stores.find((s) => s.chain === chosen) ?? best;

  // The shopping list ordered by category (Fruit & veg, Dairy…), like walking through the supermarket.
  const known = new Set(getCategories().map((c) => c.id));
  const pickFor = (itemId: string) => plan.picks.find((p) => p.itemId === itemId);
  const groups = getCategories()
    .map((c) => ({
      ...c,
      picks: list.items
        .filter((i) => (known.has(i.categoryId) ? i.categoryId : 'other') === c.id)
        .map((i) => pickFor(i.id))
        .filter((p): p is Pick => Boolean(p)),
    }))
    .filter((g) => g.picks.length > 0);
  const week = WEEK[plan.chain];
  const comparedCount = result.compared.length;
  const isCompared = (itemId: string) => result.compared.includes(itemId);

  // The card compares only two stores: the one you shop at and the next best (or the best, if you picked another).
  const other = plan.chain === best.chain ? result.stores[1] : best;
  const diff = other ? Math.round((other.basket - plan.basket) * 100) / 100 : 0;
  const maxBasket = Math.max(plan.basket, other?.basket ?? 0) || 1;
  const choose = (c: Chain) => {
    setChosen(c);
    // Remember the choice, so a reload keeps it.
    navigate(location.pathname, { replace: true, state: { result, chain: c } });
  };
  const storeBox = (s: typeof plan, on: boolean) => (
    <button
      key={s.chain}
      type="button"
      aria-pressed={on}
      onClick={() => choose(s.chain)}
      className={`flex min-w-0 flex-col gap-2 rounded-[20px] p-3.5 text-left ${on ? 'bg-brand-soft outline-2 outline-brand' : 'bg-bg'}`}
    >
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`flex size-[30px] shrink-0 items-center justify-center rounded-[10px] text-sm font-extrabold ${on ? 'bg-white text-brand' : 'bg-line text-muted'}`}
        >
          {nameOf(s.chain).slice(0, 1)}
        </span>
        <span className={`truncate text-[15px] font-extrabold ${on ? '' : 'text-muted'}`}>{nameOf(s.chain)}</span>
      </span>
      <span className={`text-[26px] leading-none font-extrabold tracking-tight ${on ? '' : 'text-muted'}`}>{euro(s.basket)}</span>
      <span className="h-2 rounded-full bg-white/60">
        <span className={`block h-2 rounded-full ${on ? 'bg-brand' : 'bg-faint/40'}`} style={{ width: `${Math.max(8, (s.basket / maxBasket) * 100)}%` }} />
      </span>
    </button>
  );

  return (
    <Screen>
      <TopBar label="Your plan" back={`/list/${list.id}/check`} />

      <section aria-label="Summary" className="animate-rise flex flex-col gap-4 rounded-[28px] bg-white p-5">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold text-muted">{plan.chain === best.chain ? 'Best for your list' : 'Your choice'}</span>
          <h1 className="text-[30px] leading-none font-extrabold tracking-tight">Go to {nameOf(plan.chain)}</h1>
        </div>

        {other ? (
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-2 gap-2.5">
              {storeBox(plan, true)}
              {storeBox(other, false)}
            </div>
            {comparedCount < plan.picks.length && (
              <span className="px-1 text-xs text-muted">Same {comparedCount} items in both stores</span>
            )}
          </div>
        ) : (
          <span className="text-[46px] leading-none font-extrabold tracking-tight">{euro(plan.total)}</span>
        )}

        {plan.saved > 0 ? (
          <div className="flex flex-col items-start gap-1">
            <span className="rounded-full bg-save-soft px-3.5 py-2 text-[15px] font-extrabold text-save-ink">
              You save {euro(plan.saved)} with offers
            </span>
            {other && diff !== 0 && (
              <span className="px-1 text-[13px] text-muted">
                {euro(Math.abs(diff))} {diff > 0 ? 'less' : 'more'} than at {nameOf(other.chain)}
              </span>
            )}
          </div>
        ) : (
          other &&
          diff > 0 && (
            <span className="self-start rounded-full bg-save-soft px-3.5 py-2 text-[15px] font-extrabold text-save-ink">
              {euro(diff)} less than at {nameOf(other.chain)}
            </span>
          )
        )}

        <div className="flex items-center justify-between border-t-2 border-dashed border-line pt-3 text-[15px] font-bold">
          <span>
            Whole list at {nameOf(plan.chain)} ({plan.priced} {plan.priced === 1 ? 'item' : 'items'})
          </span>
          <span className="font-extrabold">{euro(plan.total)}</span>
        </div>
      </section>

      <details className="group rounded-[22px] bg-white">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-5 text-[15px] font-bold">
          Your list · {plan.picks.length} {plan.picks.length === 1 ? 'item' : 'items'} · {plan.onOffer} on offer
          <span aria-hidden="true" className="text-muted transition group-open:rotate-180">▾</span>
        </summary>
        <div className="flex flex-col gap-3 px-1 pb-3">
          {groups.map((g) => (
            <section key={g.id} className="flex flex-col gap-1" aria-label={g.label}>
              <SectionLabel>{g.label}</SectionLabel>
              <ul className="py-0.5">
                {g.picks.map((p) => (
                  <PickRow key={p.itemId} p={p} storeName={nameOf(plan.chain)} compared={isCompared(p.itemId)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </details>

      {result.stores.length > 2 && (
        <details className="group rounded-[22px] bg-white">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-5 text-[15px] font-bold">
            All your supermarkets
            <span aria-hidden="true" className="text-muted transition group-open:rotate-180">▾</span>
          </summary>
          <ul className="pb-2">
            {result.stores.map((s) => (
              <li key={s.chain}>
                <button
                  type="button"
                  aria-pressed={s.chain === plan.chain}
                  onClick={() => choose(s.chain)}
                  className="flex min-h-12 w-full items-center justify-between px-5 text-left text-[15px]"
                >
                  <span className={s.chain === plan.chain ? 'font-extrabold text-brand' : 'font-bold'}>{nameOf(s.chain)}</span>
                  <span className="font-bold">
                    {euro(s.basket)} <span className="text-xs font-normal text-muted">· {s.onOffer} on offer</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <details className="group rounded-[22px] bg-white">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-5 text-[15px] font-bold">
          How we compared
          <span aria-hidden="true" className="text-muted transition group-open:rotate-180">▾</span>
        </summary>
        <p className="px-5 pb-4 text-[13px] leading-relaxed text-muted">
          Offers: this week’s Prospekte in Siegburg ({shortDate(week.from)} – {shortDate(week.to)}). Normal prices: ALDI SÜD website, REWE online shop
          (Siegburg) and Open Prices (receipts and shelf labels in Germany). Every price is what you pay for the amount on your list (e.g. 500 g pasta,
          1 l milk). Stores are compared on the items they all have. “You save” uses the old price printed in the Prospekt. No estimates.
          {result.source === 'local' ? ' (Built-in data, server offline.)' : ''}{' '}
          <Link to={`/stores?next=/list/${list.id}/analyze`} className="font-bold text-brand underline">
            Change supermarkets
          </Link>
        </p>
      </details>

      <BottomAction>
        <PrimaryLink to={`/list/${list.id}/shop`} state={{ result, chain: plan.chain }}>
          Shop at {nameOf(plan.chain)}
        </PrimaryLink>
      </BottomAction>
    </Screen>
  );
}
