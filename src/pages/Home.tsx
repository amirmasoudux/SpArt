import { Link } from 'react-router';
import { Screen } from '../components/ui';
import { euro } from '../lib/plan';
import { getLists, getTrips } from '../lib/storage';

export default function Home() {
  const lastList = getLists()[0];
  const now = new Date();
  const savedThisMonth = getTrips()
    .filter((t) => new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear())
    .reduce((sum, t) => sum + t.saved, 0);

  return (
    <Screen>
      <h1 className="text-2xl font-bold">SpArt</h1>
      <p className="text-muted">Write your shopping list. We find the cheapest store for it.</p>

      <Link to="/new" className="rounded-lg bg-brand p-4 text-center font-semibold text-white">
        + Write a new list
      </Link>

      {lastList && (
        <Link to={`/list/${lastList.id}/check`} className="rounded-lg border bg-white p-4">
          <span className="block text-sm text-muted">Last list</span>
          <span className="font-semibold">
            {lastList.title} ({lastList.items.length} items)
          </span>
        </Link>
      )}
      <Link to="/savings" className="rounded-lg border bg-white p-4">
        <span className="block text-sm text-muted">Saved this month</span>
        <span className="text-2xl font-bold text-green-700">{euro(savedThisMonth)}</span>
      </Link>
    </Screen>
  );
}
