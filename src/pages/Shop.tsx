import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { BottomAction, PrimaryButton, Screen, SectionLabel } from '../components/ui';
import ReportSheet from '../components/ReportSheet';
import { IconCheck, IconClose } from '../components/icons';
import { getCategories, getStores } from '../lib/dataSource';
import { fetchPlan, type PlanResult } from '../lib/api';
import type { Pick } from '../lib/pick';
import { euro } from '../lib/plan';
import { newId } from '../lib/parseList';
import { getGuestId, getList, getMyChains, saveList, saveTrip } from '../lib/storage';
import type { ListItem, ShoppingList } from '../types';

export default function Shop() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [list, setList] = useState<ShoppingList | undefined>(() => getList(id));
  // The plan: passed from the plan screen, or asked again after a reload.
  const [result, setResult] = useState<PlanResult | undefined>(location.state as PlanResult | undefined);
  const [reporting, setReporting] = useState<Pick | null>(null);

  useEffect(() => {
    if (!result && list) fetchPlan(list.items, getMyChains()).then(setResult);
  }, [result, list]);

  if (!list) return <Navigate to="/lists" replace />;
  if (!result) return <Screen><p className="text-muted">Loading your list…</p></Screen>;

  const stores = getStores();
  const pickFor = (itemId: string) => result.picks.find((p) => p.itemId === itemId);
  const storeOf = (p?: Pick) => stores.find((s) => s.chain === p?.chain);
  const done = list.items.filter((i) => i.checked).length;
  const total = list.items.length;

  // The list ordered by category, like walking through a supermarket.
  const known = new Set(getCategories().map((c) => c.id));
  const groups = getCategories()
    .map((c) => ({ key: c.id, label: c.label, items: list.items.filter((i) => (known.has(i.categoryId) ? i.categoryId : 'other') === c.id) }))
    .filter((g) => g.items.length > 0);
  const usedStores = stores.filter((s) => result.picks.some((p) => p.kind === 'offer' && p.chain === s.chain)).map((s) => s.name);

  function toggle(itemId: string) {
    const next = { ...list!, items: list!.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)) };
    setList(next);
    saveList(next);
  }

  function finish() {
    // The trip counts only what was put in the cart.
    const bought = list!.items.filter((i) => i.checked).map((i) => pickFor(i.id));
    const firstStore = storeOf(bought.find((p) => p?.chain)) ?? stores[0];
    const trip = {
      id: newId(),
      ownerId: getGuestId(),
      listId: list!.id,
      storeId: firstStore.id,
      storeName: usedStores.join(' + ') || firstStore.name,
      itemCount: bought.length,
      total: Math.round(bought.reduce((s, p) => s + (p?.price ?? 0), 0) * 100) / 100,
      saved: Math.round(bought.reduce((s, p) => s + (p?.saving ?? 0), 0) * 100) / 100,
      date: new Date().toISOString(),
    };
    saveTrip(trip);
    saveList({ ...list!, status: 'done' });
    navigate(`/trip/${trip.id}`, { replace: true });
  }

  const row = (item: ListItem) => {
    const p = pickFor(item.id);
    const priced = p && p.kind !== 'none';
    return (
      <li key={item.id} className="flex items-center gap-2 pr-4">
        <button
          type="button"
          aria-pressed={item.checked}
          onClick={() => toggle(item.id)}
          className="flex min-h-[54px] min-w-0 flex-1 items-center gap-3.5 px-4 py-2 text-left"
        >
          <span
            className={`flex size-[26px] shrink-0 items-center justify-center rounded-[9px] transition ${
              item.checked ? 'bg-save text-white' : 'border-2 border-line'
            }`}
          >
            {item.checked && <IconCheck className="size-3.5" />}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className={`text-base font-bold ${item.checked ? 'text-faint line-through' : ''}`}>
              {item.name}
              {item.qty > 1 ? ` × ${item.qty}` : ''}
            </span>
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-faint">
              {priced ? (
                <>
                  <span className="shrink-0 rounded-full bg-save px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-white uppercase">
                    {storeOf(p)?.name}
                  </span>
                  <span className="truncate">{p.title}</span>
                </>
              ) : (
                <span className="truncate">No offer this week</span>
              )}
            </span>
          </span>
        </button>
        {priced && (
          <span className="flex shrink-0 flex-col items-end gap-0.5">
            <span className="text-[15px] font-extrabold text-save-ink">{euro(p.price)}</span>
            {p.title && (
              <button
                type="button"
                onClick={() => setReporting(p)}
                aria-label={`Report a wrong price for ${item.name}`}
                className="text-xs font-bold text-faint underline"
              >
                Wrong price?
              </button>
            )}
          </span>
        )}
      </li>
    );
  };

  return (
    <Screen>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-muted">Shopping at {usedStores.join(' + ') || 'your supermarkets'}</span>
          <h1 className="text-[28px] font-extrabold tracking-tight">
            {done} of {total} in cart
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/list/${list.id}/plan`, { state: result })}
          aria-label="Close checklist"
          className="flex size-11 items-center justify-center rounded-full bg-white"
        >
          <IconClose className="size-[18px]" />
        </button>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Items in your basket" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
        <div className="h-full rounded-full bg-save transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>

      {groups.map((g) => (
        <section key={g.key} className="flex flex-col gap-1.5" aria-label={g.label}>
          <SectionLabel>{g.label}</SectionLabel>
          <ul className="rounded-[24px] bg-white py-1">{g.items.map(row)}</ul>
        </section>
      ))}

      {reporting && storeOf(reporting) && <ReportSheet line={reporting} store={storeOf(reporting)!} onClose={() => setReporting(null)} />}

      <BottomAction>
        <PrimaryButton onClick={finish} disabled={done === 0}>
          {done === total ? 'Finish shopping' : `Finish with ${done} of ${total}`}
        </PrimaryButton>
      </BottomAction>
    </Screen>
  );
}
