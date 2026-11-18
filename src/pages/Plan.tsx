import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { BottomAction, PrimaryLink, Screen, SectionLabel, TopBar } from '../components/ui';
import { getCategories, getStores } from '../lib/dataSource';
import { fetchPlan, resultOf, type PlanResult, type PlanState } from '../lib/api';
import type { Pick, StorePlan } from '../lib/pick';
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

// One card per chosen supermarket, cheapest first. Swipe (or tap a dot) to see the next one;
// the card in view is the one you shop at.
function StoreSlider({
  stores,
  index,
  nameOf,
  itemsLabel,
  onChange,
}: {
  stores: StorePlan[];
  index: number;
  nameOf: (c: Chain) => string;
  itemsLabel: string;
  onChange: (i: number) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const cardAt = (i: number) => track.current?.children[i] as HTMLElement | undefined;
  const scrollTo = (i: number, smooth = true) => {
    const el = cardAt(i);
    if (el && track.current) track.current.scrollTo({ left: el.offsetLeft - track.current.offsetLeft - 20, behavior: smooth ? 'smooth' : 'auto' });
  };

  // Start on the chosen card (after a reload or coming back from the shop screen).
  useEffect(() => {
    scrollTo(index, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The card closest to the left edge is the one in view.
  const timer = useRef<number | undefined>(undefined);
  const onScroll = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const t = track.current;
      if (!t) return;
      let nearest = 0;
      let dist = Infinity;
      [...t.children].forEach((c, i) => {
        const d = Math.abs((c as HTMLElement).offsetLeft - t.offsetLeft - 20 - t.scrollLeft);
        if (d < dist) {
          dist = d;
          nearest = i;
        }
      });
      if (nearest !== index) onChange(nearest);
    }, 120);
  };

  return (
    <section aria-label="Your supermarkets" aria-roledescription="carousel" className="animate-rise -mx-5 flex flex-col gap-3">
      <div
        ref={track}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-px-5 px-5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {stores.map((s, i) => {
          const on = i === index;
          return (
            <article
              key={s.chain}
              aria-roledescription="slide"
              aria-label={`${nameOf(s.chain)}, ${i + 1} of ${stores.length}`}
              onClick={() => !on && (scrollTo(i), onChange(i))}
              className={`flex w-[86%] shrink-0 snap-start flex-col gap-3.5 rounded-[28px] bg-white p-5 ${on ? 'outline-2 outline-brand' : ''} ${stores.length === 1 ? 'w-full' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-[15px] font-extrabold ${i === 0 ? 'bg-brand-soft text-brand' : 'bg-line text-muted'}`}
                  >
                    {nameOf(s.chain).slice(0, 1)}
                  </span>
                  <span className="truncate text-lg font-extrabold">{nameOf(s.chain)}</span>
                </span>
                {i === 0 && stores.length > 1 && (
                  <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-white uppercase">Best</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-semibold text-muted">{itemsLabel}</span>
                <span className="text-[40px] leading-none font-extrabold tracking-tight">{euro(s.basket)}</span>
              </div>
              {s.saved > 0 && (
                <span className="self-start rounded-full bg-save-soft px-3 py-1.5 text-sm font-extrabold text-save-ink">
                  You save {euro(s.saved)} with offers
                </span>
              )}
              <div className="mt-auto flex items-center justify-between border-t-2 border-dashed border-line pt-2.5 text-[13px] font-bold text-muted">
                <span>
                  {s.onOffer} of {s.picks.length} items on offer
                </span>
                {stores.length > 1 && (
                  <span>
                    {i + 1} / {stores.length}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {stores.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {stores.map((s, i) => (
            <button
              key={s.chain}
              type="button"
              aria-label={`Show ${nameOf(s.chain)}`}
              aria-current={i === index}
              onClick={() => (scrollTo(i), onChange(i))}
              className="flex h-6 items-center"
            >
              <span className={`block h-[7px] rounded-full transition-all ${i === index ? 'w-5 bg-brand' : 'w-[7px] bg-faint/50'}`} />
            </button>
          ))}
        </div>
      )}
    </section>
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

  const choose = (c: Chain) => {
    setChosen(c);
    // Remember the choice, so a reload keeps it.
    navigate(location.pathname, { replace: true, state: { result, chain: c } });
  };
  const index = Math.max(0, result.stores.findIndex((s) => s.chain === plan.chain));
  const allCompared = comparedCount === plan.picks.length;
  return (
    <Screen>
      <TopBar label="Your plan" back={`/list/${list.id}/check`} />

      <h1 className="sr-only">Your plan: {nameOf(plan.chain)}</h1>
      <StoreSlider
        stores={result.stores}
        index={index}
        nameOf={nameOf}
        itemsLabel={allCompared ? `Your ${comparedCount} ${comparedCount === 1 ? 'item' : 'items'}` : `Same ${comparedCount} items in every store`}
        onChange={(i) => choose(result.stores[i].chain)}
      />

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
