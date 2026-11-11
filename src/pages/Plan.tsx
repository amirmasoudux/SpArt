import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router';
import { BottomAction, PrimaryLink, Screen, SectionLabel, TopBar } from '../components/ui';
import ReportSheet from '../components/ReportSheet';
import { IconInfo } from '../components/icons';
import { getStores } from '../lib/dataSource';
import { fetchPlan, type PlanResult } from '../lib/api';
import { euro, type PlanLine } from '../lib/plan';
import { getList } from '../lib/storage';

export default function Plan() {
  const { id = '' } = useParams();
  const location = useLocation();
  const list = getList(id);
  // The Analyze screen passes the result along. After a reload, ask again.
  const [result, setResult] = useState<PlanResult | undefined>(location.state as PlanResult | undefined);
  const [reporting, setReporting] = useState<PlanLine | null>(null);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!result && list) fetchPlan(list.items).then(setResult);
  }, [result, list]);

  if (!list) return <Navigate to="/lists" replace />;
  if (!result) return <Screen><p className="text-muted">Loading your plan…</p></Screen>;

  const stores = getStores();
  const [best, ...others] = result.plans;
  const offerLines = best.lines.filter((l) => l.onOffer);
  const otherLines = best.lines.filter((l) => !l.onOffer);
  const chainNames = stores.map((s) => s.name).join(', ');
  const itemOffers = result.itemOffers ?? [];
  const pricedIds = new Set(best.lines.map((l) => l.itemId));
  const toggle = (itemId: string) =>
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });

  return (
    <Screen>
      <TopBar label="Your plan" back={`/list/${list.id}/check`} />

      <section aria-label="Best store" className="animate-rise flex flex-col gap-5 rounded-[28px] bg-white p-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-muted">Cheapest for your list this week</span>
          <span className="text-4xl leading-none font-extrabold tracking-tight">Go to {best.store.name}</span>
          <span className="text-sm text-muted">Your basket ≈ {euro(best.basketTotal)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-muted">You save with this week’s offers</span>
          <span className={`text-[52px] leading-none font-extrabold tracking-tight ${best.saved > 0 ? 'text-save' : 'text-ink'}`}>
            {euro(best.saved)}
          </span>
          <span className="text-[13px] text-muted">
            {offerLines.length} of {best.lines.length} items are on offer at {best.store.name}
          </span>
        </div>
      </section>

      {/* Every item, so it is clear which ones are on offer. Offers first. */}
      <section className="flex flex-col gap-1.5" aria-label={`Your list at ${best.store.name}`}>
        <SectionLabel>Your list at {best.store.name}</SectionLabel>
        <ul className="rounded-[24px] bg-white py-1.5">
          {[...offerLines, ...otherLines].map((l) => (
            <li key={l.itemId} className="flex min-h-[56px] items-center justify-between gap-3 px-[18px] py-2">
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[15px] font-bold">
                  {l.name}
                  {l.qty > 1 ? ` × ${l.qty}` : ''}
                </span>
                {l.onOffer ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-save px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-white uppercase">Offer</span>
                    <span className="text-xs font-extrabold text-save-ink">You save {euro(l.saving)}</span>
                    <button
                      type="button"
                      onClick={() => setReporting(l)}
                      aria-label={`Report a wrong price for ${l.name}`}
                      className="text-xs font-bold text-faint underline"
                    >
                      Wrong price?
                    </button>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-faint">Normal price (≈)</span>
                )}
              </span>
              <span className="flex shrink-0 flex-col items-end whitespace-nowrap">
                <span className={`text-[15px] font-extrabold ${l.onOffer ? 'text-save-ink' : ''}`}>{euro(l.price)}</span>
                {l.onOffer && <span className="text-xs text-faint line-through">{euro(l.price + l.saving)}</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Every item searched in the full Prospekte of all stores, also things outside our price list. */}
      {itemOffers.length > 0 && (
        <section className="flex flex-col gap-1.5" aria-label="In this week's Prospekte">
          <SectionLabel>In this week’s Prospekte</SectionLabel>
          <ul className="flex flex-col gap-2">
            {itemOffers.map((item) => {
              const open = openItems.has(item.itemId);
              const shown = open ? item.offers : item.offers.slice(0, 3);
              return (
                <li key={item.itemId} className="rounded-[24px] bg-white px-[18px] py-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[15px] font-extrabold">{item.name}</span>
                    {!pricedIds.has(item.itemId) && <span className="text-xs font-bold text-faint">Not in our price list</span>}
                  </div>
                  <ul className="mt-2 flex flex-col gap-2">
                    {shown.map((o, i) => (
                      <li key={`${o.chain}-${o.title}-${i}`} className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="shrink-0 rounded-full bg-save-soft px-2 py-0.5 text-[11px] font-extrabold text-save-ink">
                            {o.storeName}
                          </span>
                          <span className="truncate text-[13px] text-muted">
                            {o.title}
                            {o.unitInfo ? ` · ${o.unitInfo}` : ''}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-baseline gap-1.5 whitespace-nowrap">
                          {o.regularPrice && <span className="text-xs text-faint line-through">{euro(o.regularPrice)}</span>}
                          <span className="text-[15px] font-extrabold text-save-ink">{euro(o.price)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  {item.offers.length > 3 && (
                    <button
                      type="button"
                      onClick={() => toggle(item.itemId)}
                      aria-expanded={open}
                      className="mt-2 min-h-8 text-[13px] font-bold text-brand"
                    >
                      {open ? 'Show less' : `Show all ${item.offers.length}`}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {others.length > 0 && (
        <section className="flex flex-col gap-1.5" aria-label="Other stores">
          <SectionLabel>Other stores</SectionLabel>
          <ul className="rounded-[20px] bg-white py-1">
            {others.map((p) => (
              <li key={p.store.id} className="flex min-h-12 items-center justify-between px-[18px] text-sm">
                <span className="font-bold">{p.store.name}</span>
                <span className="font-extrabold text-muted">+{euro(p.basketTotal - best.basketTotal)} more</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {best.noPriceCount > 0 && (
        <p className="flex items-start gap-2 px-1.5 text-[13px] text-muted">
          <IconInfo className="mt-0.5 size-4 shrink-0" />
          {best.noPriceCount} {best.noPriceCount === 1 ? 'item is' : 'items are'} not in our price list yet, so not counted in the store total.{' '}
          {itemOffers.some((i) => !pricedIds.has(i.itemId)) && 'You can still see above where they are on offer.'}
        </p>
      )}

      <p className="px-1.5 text-xs text-faint">
        Based on this week’s Prospekte from {chainNames}. Regular prices are estimates (≈). {result.offerCount} offers this week{result.source === 'local' ? ' (demo data, server offline)' : ''}.{' '}
        <Link to={`/list/${list.id}/analyze`} className="font-bold text-brand underline">
          Check again
        </Link>
      </p>

      <BottomAction>
        <PrimaryLink to={`/list/${list.id}/shop?store=${best.store.id}`} state={best.lines}>Start shopping</PrimaryLink>
      </BottomAction>

      {reporting && <ReportSheet line={reporting} store={best.store} onClose={() => setReporting(null)} />}
    </Screen>
  );
}
