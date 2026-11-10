import { useState } from 'react';
import { Link } from 'react-router';
import { Confirm, Screen } from '../components/ui';
import { deleteList, getLists } from '../lib/storage';
import type { ShoppingList } from '../types';

export default function Lists() {
  const [lists, setLists] = useState(getLists);
  const [removing, setRemoving] = useState<ShoppingList | null>(null);

  function removeList() {
    deleteList(removing!.id);
    setLists(getLists());
    setRemoving(null);
  }

  return (
    <Screen>
      <h1 className="text-2xl font-bold">My lists</h1>

      {lists.length === 0 && <p className="text-muted">No lists yet.</p>}

      <ul className="flex flex-col gap-2">
        {lists.map((l) => (
          <li key={l.id} className="flex items-center gap-2 rounded-lg border bg-white p-3">
            <Link to={`/list/${l.id}/check`} className="flex-1">
              <span className="block font-semibold">{l.title}</span>
              <span className="text-sm text-muted">
                {l.items.length} items · {l.status === 'done' ? 'shopped' : l.status === 'confirmed' ? 'saved' : 'draft'}
              </span>
            </Link>
            {l.status !== 'done' && l.items.length > 0 && (
              <Link to={`/list/${l.id}/analyze`} className="px-2 text-brand">
                Plan
              </Link>
            )}
            <button type="button" onClick={() => setRemoving(l)} className="px-2 text-red-600">
              Delete
            </button>
          </li>
        ))}
      </ul>

      <Link to="/new" className="rounded-lg bg-brand p-3 text-center font-semibold text-white">
        + New list
      </Link>

      {removing && <Confirm text={`Delete ${removing.title}?`} onYes={removeList} onNo={() => setRemoving(null)} />}
    </Screen>
  );
}
