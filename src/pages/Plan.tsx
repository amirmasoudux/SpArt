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
            {offerLines.length} {offerLines.length === 1 ? 'item is' : 'items are'} in the {best.store.name} Prospekt
          </span>
        </div>
      </section>

      {offerLines.length > 0 && (
        <section className="flex flex-col gap-1.5" aria-label="On offer">
          <SectionLabel>In the {best.store.name} Prospekt</SectionLabel>
          <ul className="rounded-[24px] bg-white py-1.5">
            {offerLines.map((l) => (
              <li key={l.itemId} className="flex min-h-[52px] items-center justify-between gap-3 px-[18px] py-1.5">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[15px] font-bold">
                    {l.name}
                    {l.qty > 1 ? ` × ${l.qty}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setReporting(l)}
                    aria-label={`Report a wrong price for ${l.name}`}
                    className="self-start text-xs font-bold text-faint underline"
                  >
                    Wrong price?
                  </button>
                </span>
                <span className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
                  <span className="text-xs font-extrabold text-save-ink">−{euro(l.saving)}</span>
                  <span className="min-w-14 text-right text-[15px] font-extrabold">{euro(l.price)}</span>
                </span>
              </li>
            ))}
            {otherLines.length > 0 && (
              <li className="px-[18px] pt-1.5 pb-2.5 text-[13px] font-bold text-brand">
                + {otherLines.length} more {otherLines.length === 1 ? 'item' : 'items'} at the normal price (≈)
              </li>
            )}
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
          {best.noPriceCount} {best.noPriceCount === 1 ? 'item is' : 'items are'} not in our price list yet, so not counted.
        </p>
      )}

      <p className="px-1.5 text-xs text-faint">
        Based on this week’s Prospekte from {chainNames}. Regular prices are estimates (≈). {result.offerCount} offers this week{result.source === 'local' ? ' (demo data, server offline)' : ''}.{' '}
        <Link to={`/list/${list.id}/analyze`} className="font-bold text-brand underline">
          Check again
        </Link>
      </p>

      <BottomAction>
        <PrimaryLink to={`/list/${list.id}/shop?store=${best.store.id}`}>Start shopping</PrimaryLink>
      </BottomAction>

      {reporting && <ReportSheet line={reporting} store={best.store} onClose={() => setReporting(null)} />}
    </Screen>
  );
}
