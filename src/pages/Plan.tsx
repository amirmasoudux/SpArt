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

  return (
    <Screen>
      <TopBar label="Your plan" back={`/list/${list.id}/check`} />

      <section aria-label="Summary" className="animate-rise flex flex-col gap-5 rounded-[28px] bg-white p-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-muted">
            {plan.chain === best.chain ? (result.stores.length > 1 ? 'Cheapest for your list' : 'Your supermarket') : 'Your choice'}
          </span>
          <h1 className="text-[34px] leading-none font-extrabold tracking-tight">Go to {nameOf(plan.chain)}</h1>
          <span className="text-sm text-muted">
            {plan.priced} of {plan.picks.length} items with a price · {plan.onOffer} on offer
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-muted">
            {result.stores.length > 1 ? `Your basket · ${comparedCount} items with a price in every store, same amounts` : 'Your basket'}
          </span>
          <span className="text-[52px] leading-none font-extrabold tracking-tight">{euro(result.stores.length > 1 ? plan.basket : plan.total)}</span>
          {result.stores.length > 1 && plan.chain === best.chain && result.stores[1] && result.stores[1].basket > plan.basket && (
            <span className="text-sm font-extrabold text-save-ink">
              {euro(result.stores[1].basket - plan.basket)} cheaper than {nameOf(result.stores[1].chain)}
            </span>
          )}
          <span className="text-[13px] text-muted">
            At the shelf, your packs: {euro(plan.total)}
            {plan.saved > 0 ? ` · offers save you ${euro(plan.saved)}` : ''}
          </span>
        </div>
      </section>

      {result.stores.length > 1 && (
        <section aria-label="Your supermarkets" className="flex flex-col gap-1.5">
          <SectionLabel>Your supermarkets</SectionLabel>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {result.stores.map((s) => {
              const on = s.chain === plan.chain;
              return (
                <button
                  key={s.chain}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setChosen(s.chain);
                    // Remember the choice, so a reload keeps it.
                    navigate(location.pathname, { replace: true, state: { result, chain: s.chain } });
                  }}
                  className={`flex min-w-[118px] shrink-0 flex-col items-start gap-0.5 rounded-[20px] border-2 bg-white px-4 py-3 text-left ${on ? 'border-brand' : 'border-transparent'}`}
                >
                  <span className="text-[15px] font-extrabold">{nameOf(s.chain)}</span>
                  <span className="text-sm font-bold">{euro(s.basket)}</span>
                  <span className="text-xs text-muted">{s.onOffer} on offer</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {groups.map((g) => (
        <section key={g.id} className="flex flex-col gap-1.5" aria-label={g.label}>
          <SectionLabel>{g.label}</SectionLabel>
          <ul className="rounded-[24px] bg-white py-1.5">
            {g.picks.map((p) => (
              <PickRow key={p.itemId} p={p} storeName={nameOf(plan.chain)} compared={isCompared(p.itemId)} />
            ))}
          </ul>
        </section>
      ))}

      <p className="px-1.5 text-xs text-faint">
        Offers: {nameOf(plan.chain)} Prospekt in Siegburg ({shortDate(week.from)} – {shortDate(week.to)}). Normal prices: ALDI SÜD website, REWE online
        shop (Siegburg) and Open Prices (receipts and shelf labels in Germany). No estimates: an item without a real price is left out of the
        comparison. A saving is shown when the Prospekt prints the old price.
        {result.source === 'local' ? ' (Built-in data, server offline.)' : ''}{' '}
        <Link to={`/stores?next=/list/${list.id}/analyze`} className="font-bold text-brand underline">
          Change supermarkets
        </Link>
      </p>

      <BottomAction>
        <PrimaryLink to={`/list/${list.id}/shop`} state={{ result, chain: plan.chain }}>
          Shop at {nameOf(plan.chain)}
        </PrimaryLink>
      </BottomAction>
    </Screen>
  );
}
