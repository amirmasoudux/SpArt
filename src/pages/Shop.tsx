import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { BackLink, Button, Screen } from '../components/ui';
import { fetchPlan } from '../lib/api';
import { euro, type PlanLine } from '../lib/plan';
import { getCategories, getStores } from '../lib/dataSource';
import { newId } from '../lib/parseList';
import { getGuestId, getList, saveList, saveTrip } from '../lib/storage';
import type { ShoppingList } from '../types';

export default function Shop() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [list, setList] = useState<ShoppingList | undefined>(() => getList(id));
  const store = getStores().find((s) => s.id === params.get('store')) ?? getStores()[0];
  const location = useLocation();
  // Which items are on offer here: passed from the plan, or asked again after a reload.
  const [lines, setLines] = useState<PlanLine[]>((location.state as PlanLine[] | null) ?? []);
  useEffect(() => {
    if (lines.length || !list) return;
    fetchPlan(list.items).then(({ plans }) => setLines((plans.find((p) => p.store.id === store.id) ?? plans[0]).lines));
  }, [lines.length, list, store.id]);
  const offerFor = (itemId: string) => lines.find((l) => l.itemId === itemId && l.onOffer);

  if (!list) return <Navigate to="/lists" replace />;

  const done = list.items.filter((i) => i.checked).length;

  function toggle(itemId: string) {
    const next = { ...list!, items: list!.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)) };
    setList(next);
    saveList(next);
  }

  // Save the trip: only what went into the cart counts.
  async function finish() {
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
      <BackLink to={`/list/${list.id}/plan`} />
      <h1 className="text-2xl font-bold">
        Shopping at {store.name} ({done}/{list.items.length})
      </h1>

      {groups.map((g) => (
        <section key={g.id}>
          <h2 className="mb-1 text-sm font-bold text-muted uppercase">{g.label}</h2>
          <ul className="rounded-lg border bg-white">
            {g.items.map((item) => (
              <li key={item.id} className="border-b last:border-b-0">
                <label className="flex items-center gap-3 p-2">
                  <input type="checkbox" checked={item.checked} onChange={() => toggle(item.id)} className="h-5 w-5" />
                  <span className={item.checked ? 'text-muted line-through' : ''}>
                    {item.name} {item.qty > 1 && `× ${item.qty}`}
                  </span>
                  {offerFor(item.id) && (
                    <span className="ml-auto rounded bg-green-700 px-1.5 py-0.5 text-xs font-bold text-white">
                      OFFER {euro(offerFor(item.id)!.price)}
                    </span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <Button onClick={finish} disabled={done === 0}>
        Finish shopping
      </Button>
    </Screen>
  );
}
