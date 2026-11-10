import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { BottomAction, PrimaryButton, Screen, SectionLabel } from '../components/ui';
import { IconCheck, IconClose } from '../components/icons';
import { getCategories, getStores } from '../lib/dataSource';
import { fetchPlan } from '../lib/api';
import { euro, type PlanLine } from '../lib/plan';
import { newId } from '../lib/parseList';
import { getGuestId, getList, saveList, saveTrip } from '../lib/storage';
import type { ShoppingList } from '../types';

export default function Shop() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [list, setList] = useState<ShoppingList | undefined>(() => getList(id));

  const location = useLocation();
  const stores = getStores();
  const store = stores.find((s) => s.id === params.get('store')) ?? stores[0];
  // Which items are on offer at this store: passed from the plan, or asked again after a reload.
  const [lines, setLines] = useState<PlanLine[]>((location.state as PlanLine[] | null) ?? []);

  useEffect(() => {
    if (lines.length || !list) return;
    fetchPlan(list.items).then(({ plans }) => setLines((plans.find((p) => p.store.id === store.id) ?? plans[0]).lines));
  }, [lines.length, list, store.id]);
  const offerFor = (itemId: string) => lines.find((l) => l.itemId === itemId && l.onOffer);

  if (!list) return <Navigate to="/lists" replace />;

  const done = list.items.filter((i) => i.checked).length;
  const total = list.items.length;

  function toggle(itemId: string) {
    const next = { ...list!, items: list!.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)) };
    setList(next);
    saveList(next);
  }

  async function finish() {
    // The trip counts only what was put in the cart.
    const bought = list!.items.filter((i) => i.checked);
    const { plans } = await fetchPlan(bought);
    const plan = plans.find((p) => p.store.id === store.id) ?? plans[0];
    const trip = {
      id: newId(),
      ownerId: getGuestId(),
      listId: list!.id,
      storeId: store.id,
      storeName: store.name,
      itemCount: bought.length,
      total: plan.basketTotal,
      saved: plan.saved,
      date: new Date().toISOString(),
    };
    saveTrip(trip);
    saveList({ ...list!, status: 'done' });
    navigate(`/trip/${trip.id}`, { replace: true });
  }

  const groups = getCategories()
    .map((c) => ({ ...c, items: list.items.filter((i) => i.categoryId === c.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <Screen>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-muted">Shopping at {store.name}</span>
          <h1 className="text-[28px] font-extrabold tracking-tight">
            {done} of {total} in cart
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/list/${list.id}/plan`)}
          aria-label="Close checklist"
          className="flex size-11 items-center justify-center rounded-full bg-white"
        >
          <IconClose className="size-[18px]" />
        </button>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
        <div className="h-full rounded-full bg-save transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>

      {groups.map((g) => (
        <section key={g.id} className="flex flex-col gap-1.5" aria-label={g.label}>
          <SectionLabel>{g.label}</SectionLabel>
          <ul className="rounded-[24px] bg-white py-1">
            {g.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={item.checked}
                  onClick={() => toggle(item.id)}
                  className="flex min-h-[54px] w-full items-center gap-3.5 px-4 py-2 text-left"
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
                    {offerFor(item.id) && (
                      <span className="flex items-center gap-1.5 text-xs font-extrabold text-save-ink">
                        <span className="rounded-full bg-save px-2 py-0.5 text-[11px] tracking-wide text-white uppercase">Offer</span>
                        Prospekt price {euro(offerFor(item.id)!.price)}
                      </span>
                    )}
                  </span>
                  {item.unit && <span className="shrink-0 text-xs text-faint">{item.unit}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <BottomAction>
        <PrimaryButton onClick={finish} disabled={done === 0}>
          {done === total ? 'Finish shopping' : `Finish with ${done} of ${total}`}
        </PrimaryButton>
      </BottomAction>
    </Screen>
  );
}
