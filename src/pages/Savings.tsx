import { Screen } from '../components/ui';
import { euro } from '../lib/plan';
import { getTrips } from '../lib/storage';

export default function Savings() {
  const trips = getTrips();
  const now = new Date();
  const thisMonth = trips.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const saved = thisMonth.reduce((sum, t) => sum + t.saved, 0);

  return (
    <Screen>
      <h1 className="text-2xl font-bold">Savings</h1>
      <div className="rounded-lg border bg-white p-4">
        <p className="text-sm text-muted">Saved this month</p>
        <p className="text-4xl font-bold text-green-700">{euro(saved)}</p>
        <p className="text-sm text-muted">{thisMonth.length} trip(s)</p>
      </div>

      <h2 className="text-sm font-bold text-muted uppercase">Past trips</h2>
      {trips.length === 0 && <p className="text-muted">No trips yet.</p>}
      <ul className="rounded-lg border bg-white">
        {trips.map((t) => (
          <li key={t.id} className="flex justify-between border-b p-3 last:border-b-0">
            <span>
              {t.storeName} · {new Date(t.date).toLocaleDateString('en-GB')}
            </span>
            <span className="text-green-700">+{euro(t.saved)}</span>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
