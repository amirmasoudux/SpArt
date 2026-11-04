import { useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { BottomAction, PrimaryButton, Screen, SectionLabel } from '../components/ui';
import { IconCheck, IconClose } from '../components/icons';
import { getCategories, getCurrentOffers, getProducts, getStores } from '../lib/dataSource';
import { newId } from '../lib/parseList';
import { planForStore } from '../lib/plan';
import { getGuestId, getList, getSettings, saveList, saveTrip } from '../lib/storage';
import type { ShoppingList } from '../types';

export default function Shop() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [list, setList] = useState<ShoppingList | undefined>(() => getList(id));

  const stores = getStores();
  const store = stores.find((s) => s.id === params.get('store')) ?? stores[0];

  if (!list) return <Navigate to="/lists" replace />;

  const done = list.items.filter((i) => i.checked).length;
  const total = list.items.length;

  function toggle(itemId: string) {
    const next = { ...list!, items: list!.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)) };
    setList(next);
    saveList(next);
  }

  function finish() {
    // The trip counts only what was put in the cart.
    const bought = list!.items.filter((i) => i.checked);
    const plan = planForStore(bought, store, getProducts(), getCurrentOffers(), getSettings());
    const trip = {
      id: newId(),
      ownerId: getGuestId(),
      listId: list!.id,
      storeId: store.id,
      storeName: store.name,
      itemCount: bought.length,
      total: plan.basketTotal,
      offerSavings: plan.offerSavings,
      tripCost: plan.tripCost,
      netSaving: plan.netSaving,
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
                  className="flex min-h-[54px] w-full items-center gap-3.5 px-4 text-left"
                >
                  <span
                    className={`flex size-[26px] shrink-0 items-center justify-center rounded-[9px] transition ${
                      item.checked ? 'bg-save text-white' : 'border-2 border-line'
                    }`}
                  >
                    {item.checked && <IconCheck className="size-3.5" />}
                  </span>
                  <span className={`text-base font-bold ${item.checked ? 'text-faint line-through' : ''}`}>
                    {item.name}
                    {item.qty > 1 ? ` × ${item.qty}` : ''}
                  </span>
                  {item.unit && <span className="ml-auto text-xs text-faint">{item.unit}</span>}
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
