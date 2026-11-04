import { useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { BottomAction, PrimaryLink, Screen, SectionLabel, TopBar } from '../components/ui';
import { IconInfo } from '../components/icons';
import { getCurrentOffers, getProducts, getStores } from '../lib/dataSource';
import { TRAVEL_LABELS, euro, rankStores } from '../lib/plan';
import { getList, getSettings, saveSettings } from '../lib/storage';
import type { TravelMode } from '../types';

export default function Plan() {
  const { id = '' } = useParams();
  const list = getList(id);
  const [settings, setSettings] = useState(getSettings);

  if (!list) return <Navigate to="/lists" replace />;

  const ranked = rankStores(list.items, getStores(), getProducts(), getCurrentOffers(), settings);
  const best = ranked[0];
  const others = ranked.slice(1);
  const offerLines = best.lines.filter((l) => l.onOffer);
  const otherLines = best.lines.filter((l) => !l.onOffer);

  function setMode(mode: TravelMode) {
    const next = { ...settings, travelMode: mode };
    setSettings(next);
    saveSettings(next);
  }

  return (
    <Screen>
      <TopBar label="Your plan" back={`/list/${list.id}/check`} />

      <section aria-label="Best store" className="animate-rise flex flex-col gap-5 rounded-[28px] bg-white p-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-muted">Best for your list this week</span>
          <span className="text-4xl leading-none font-extrabold tracking-tight">Go to {best.store.name}</span>
          <span className="text-sm text-muted">
            {best.distance.toFixed(1)} km away · basket {euro(best.basketTotal)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-bold text-muted">Your real saving</span>
          <span className={`text-[52px] leading-none font-extrabold tracking-tight ${best.netSaving > 0 ? 'text-save' : 'text-ink'}`}>
            {euro(Math.max(0, best.netSaving))}
          </span>
          <span className="text-[13px] text-muted">
            {euro(best.offerSavings)} in offers − {euro(best.tripCost)} trip cost
          </span>
        </div>
      </section>

      <div className="flex flex-col gap-2">
        <span className="pl-1.5 text-[13px] font-extrabold text-muted">How do you get there?</span>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TRAVEL_LABELS) as TravelMode[]).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={settings.travelMode === m}
              onClick={() => setMode(m)}
              className={`min-h-10 rounded-full px-4 text-sm font-extrabold transition ${
                settings.travelMode === m ? 'bg-brand-soft text-brand-ink shadow-[inset_0_0_0_2px_var(--color-brand)]' : 'bg-white'
              }`}
            >
              {TRAVEL_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {offerLines.length > 0 && (
        <section className="flex flex-col gap-1.5" aria-label="On offer">
          <SectionLabel>On offer at {best.store.name}</SectionLabel>
          <ul className="rounded-[24px] bg-white py-1.5">
            {offerLines.map((l) => (
              <li key={l.itemId} className="flex min-h-[46px] items-center justify-between gap-3 px-[18px]">
                <span className="text-[15px] font-bold">
                  {l.name}
                  {l.qty > 1 ? ` × ${l.qty}` : ''}
                </span>
                <span className="flex items-center gap-2.5">
                  <span className="text-xs font-extrabold text-save-ink">−{euro(l.saving)}</span>
                  <span className="min-w-14 text-right text-[15px] font-extrabold">{euro(l.price)}</span>
                </span>
              </li>
            ))}
            {otherLines.length > 0 && (
              <li className="px-[18px] pt-1.5 pb-2.5 text-[13px] font-bold text-brand">
                + {otherLines.length} more {otherLines.length === 1 ? 'item' : 'items'} at the normal price
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
                <span className="font-bold">
                  {p.store.name} · {p.distance.toFixed(1)} km
                </span>
                <span className="font-extrabold text-muted">+{euro(p.totalCost - best.totalCost)} in total</span>
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

      <p className="px-1.5 text-xs text-faint">Prices are demo data for Siegburg. Regular prices are estimates (≈).</p>

      <BottomAction>
        <PrimaryLink to={`/list/${list.id}/shop?store=${best.store.id}`}>Start shopping</PrimaryLink>
      </BottomAction>
    </Screen>
  );
}
