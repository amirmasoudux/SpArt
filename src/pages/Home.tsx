import { Link } from 'react-router';
import { Screen } from '../components/ui';
import { getLists } from '../lib/storage';

export default function Home() {
  const lastList = getLists()[0];

  return (
    <Screen>
      <h1 className="text-2xl font-bold">SpArt</h1>
      <p className="text-muted">Write your shopping list. Soon: we find the cheapest store for it.</p>

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
    </Screen>
  );
}
