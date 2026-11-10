import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router';
import { BackLink, Screen } from '../components/ui';
import { fetchPlan, type PlanResult } from '../lib/api';
import { euro } from '../lib/plan';
import { getList } from '../lib/storage';

export default function Plan() {
  const { id = '' } = useParams();
  const location = useLocation();
  const list = getList(id);
  // The Analyze screen passes the result along. After a reload, ask again.
  const [result, setResult] = useState<PlanResult | undefined>(location.state as PlanResult | undefined);

  useEffect(() => {
    if (!result && list) fetchPlan(list.items).then(setResult);
  }, [result, list]);

  if (!list) return <Navigate to="/lists" replace />;
  if (!result) return <Screen><p>Loading…</p></Screen>;

  const [best, ...others] = result.plans;
  const offerLines = best.lines.filter((l) => l.onOffer);

  return (
    <Screen>
      <BackLink to={`/list/${list.id}/check`} />
      <div className="rounded-lg border bg-white p-4">
        <p className="text-sm text-muted">Cheapest for your list this week</p>
        <h1 className="text-3xl font-bold">Go to {best.store.name}</h1>
        <p>Basket ≈ {euro(best.basketTotal)}</p>
        <p className="mt-2 text-2xl font-bold text-green-700">You save {euro(best.saved)}</p>
      </div>

      {offerLines.length > 0 && (
        <section>
          <h2 className="mb-1 text-sm font-bold text-muted uppercase">In the {best.store.name} Prospekt</h2>
          <ul className="rounded-lg border bg-white">
            {offerLines.map((l) => (
              <li key={l.itemId} className="flex justify-between border-b p-2 last:border-b-0">
                <span>
                  {l.name} {l.qty > 1 && `× ${l.qty}`}
                </span>
                <span>
                  {euro(l.price)} <span className="text-sm text-green-700">(−{euro(l.saving)})</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-1 text-sm font-bold text-muted uppercase">Other stores</h2>
        <ul className="rounded-lg border bg-white">
          {others.map((p) => (
            <li key={p.store.id} className="flex justify-between border-b p-2 last:border-b-0">
              <span>{p.store.name}</span>
              <span className="text-muted">+{euro(p.basketTotal - best.basketTotal)}</span>
            </li>
          ))}
        </ul>
      </section>

      {best.noPriceCount > 0 && <p className="text-sm text-muted">{best.noPriceCount} item(s) have no price yet and are not counted.</p>}
      <p className="text-xs text-muted">
        {result.offerCount} offers this week · {result.source === 'server' ? 'from the server' : 'demo data (server not running)'}
      </p>

      <Link to={`/list/${list.id}/shop?store=${best.store.id}`} className="rounded-lg bg-brand p-3 text-center font-semibold text-white">
        Start shopping
      </Link>
    </Screen>
  );
}
