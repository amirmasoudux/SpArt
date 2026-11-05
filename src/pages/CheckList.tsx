import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { BackLink, Button, Confirm, Screen } from '../components/ui';
import { getCategories, getProducts } from '../lib/dataSource';
import { matchProduct } from '../lib/parseList';
import { getList, saveList } from '../lib/storage';
import type { ListItem, ShoppingList } from '../types';

export default function CheckList() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState<ShoppingList | undefined>(() => getList(id));
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<ListItem | null>(null);

  if (!list) return <Navigate to="/lists" replace />;

  // Save every change right away, so nothing is lost.
  function update(next: ShoppingList) {
    setList(next);
    saveList(next);
  }

  function changeItem(itemId: string, patch: Partial<ListItem>) {
    update({ ...list!, items: list!.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) });
  }

  // When the name changes, try to find the product again.
  function rename(item: ListItem, name: string) {
    const product = matchProduct(name, getProducts());
    changeItem(item.id, {
      name: product ? product.name : name,
      productId: product ? product.id : null,
      unit: product ? product.unit : '',
      categoryId: product ? product.category : 'other',
    });
    setEditing(null);
  }

  function removeItem() {
    update({ ...list!, items: list!.items.filter((i) => i.id !== removing!.id) });
    setRemoving(null);
  }

  function saveAndClose() {
    update({ ...list!, status: 'confirmed' });
    navigate('/lists');
  }

  // Group the items by category (Dairy, Fruit & veg, ...).
  const groups = getCategories()
    .map((c) => ({ ...c, items: list.items.filter((i) => i.categoryId === c.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <Screen>
      <BackLink to="/lists" />
      <h1 className="text-2xl font-bold">Check your list</h1>

      {groups.map((g) => (
        <section key={g.id}>
          <h2 className="mb-1 text-sm font-bold text-muted uppercase">{g.label}</h2>
          <ul className="rounded-lg border bg-white">
            {g.items.map((item) => (
              <li key={item.id} className="flex items-center gap-2 border-b p-2 last:border-b-0">
                {editing === item.id ? (
                  <input
                    aria-label="Item name"
                    defaultValue={item.name}
                    autoFocus
                    onBlur={(e) => rename(item, e.target.value.trim() || item.name)}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className="flex-1 rounded border p-1"
                  />
                ) : (
                  <button type="button" onClick={() => setEditing(item.id)} className="flex-1 text-left">
                    {item.name} <span className="text-sm text-muted">{item.productId ? item.unit : '(no price yet)'}</span>
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Less ${item.name}`}
                  disabled={item.qty <= 1}
                  onClick={() => changeItem(item.id, { qty: item.qty - 1 })}
                  className="h-8 w-8 rounded border disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-6 text-center">{item.qty}</span>
                <button
                  type="button"
                  aria-label={`More ${item.name}`}
                  onClick={() => changeItem(item.id, { qty: item.qty + 1 })}
                  className="h-8 w-8 rounded border"
                >
                  +
                </button>
                <button type="button" aria-label={`Remove ${item.name}`} onClick={() => setRemoving(item)} className="px-2 text-red-600">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <Link to={`/new?add=${list.id}`} className="text-brand">
        + Add more items
      </Link>

      <Button onClick={saveAndClose} disabled={list.items.length === 0}>
        Save list
      </Button>

      {removing && <Confirm text={`Remove ${removing.name}?`} onYes={removeItem} onNo={() => setRemoving(null)} />}
    </Screen>
  );
}
