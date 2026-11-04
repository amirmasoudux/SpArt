import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { BottomAction, ConfirmSheet, PrimaryButton, Screen, SectionLabel, Title, TopBar } from '../components/ui';
import { IconClose } from '../components/icons';
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

  const products = getProducts();
  const count = list.items.reduce((s, i) => s + i.qty, 0);
  const unknown = list.items.filter((i) => !i.productId);

  function update(next: ShoppingList) {
    setList(next);
    saveList(next);
  }

  function changeItem(itemId: string, patch: Partial<ListItem>) {
    update({ ...list!, items: list!.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) });
  }

  function rename(item: ListItem, name: string) {
    const product = matchProduct(name, products);
    changeItem(item.id, {
      name: product ? product.name : name,
      productId: product ? product.id : null,
      unit: product ? product.unit : '',
      categoryId: product ? product.category : 'other',
    });
    setEditing(null);
  }

  function confirmRemove() {
    if (!removing) return;
    update({ ...list!, items: list!.items.filter((i) => i.id !== removing.id) });
    setRemoving(null);
  }

  function confirmList() {
    update({ ...list!, status: 'confirmed' });
    navigate(`/list/${list!.id}/analyze`);
  }

  const groups = getCategories()
    .map((c) => ({ ...c, items: list.items.filter((i) => i.categoryId === c.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <Screen>
      <TopBar label="Step 2 of 2" back="/lists" />
      <Title>Check your list</Title>

      {unknown.length > 0 && (
        <div className="flex flex-col gap-1 rounded-[22px] bg-warn-soft p-4 text-warn-ink">
          <p className="text-[15px] font-extrabold">
            {unknown.length === 1 ? '1 item has no price yet' : `${unknown.length} items have no price yet`}
          </p>
          <p className="text-sm">We keep them on your list, but they don’t count for the best store. Tap one to rename it.</p>
        </div>
      )}

      {list.items.length === 0 && (
        <p className="rounded-[22px] bg-white p-5 text-center text-muted">Your list is empty. Add some items.</p>
      )}

      {groups.map((g) => (
        <section key={g.id} className="flex flex-col gap-1.5" aria-label={g.label}>
          <SectionLabel>{g.label}</SectionLabel>
          <ul className="rounded-[22px] bg-white py-1">
            {g.items.map((item) => (
              <li key={item.id} className="flex min-h-[58px] items-center gap-2 pr-2 pl-4">
                {editing === item.id ? (
                  <form
                    className="flex flex-1 items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const value = new FormData(e.currentTarget).get('name')?.toString().trim();
                      if (value) rename(item, value);
                    }}
                  >
                    <label htmlFor={`name-${item.id}`} className="sr-only">Item name</label>
                    <input
                      id={`name-${item.id}`}
                      name="name"
                      defaultValue={item.name}
                      autoFocus
                      className="h-10 min-w-0 flex-1 rounded-xl border-2 border-brand px-2.5 text-[15px] font-bold outline-none"
                    />
                    <button type="submit" className="min-h-10 rounded-full bg-brand px-3.5 text-[13px] font-extrabold text-white">
                      Done
                    </button>
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing(item.id)}
                      aria-label={`Edit ${item.name}`}
                      className="flex min-h-11 min-w-0 flex-1 flex-col justify-center text-left"
                    >
                      <span className="truncate text-base font-extrabold">{item.name}</span>
                      <span className="text-xs font-bold text-faint">
                        {item.productId ? item.unit : 'No price yet'} · tap to edit
                      </span>
                    </button>
                    <div className="flex items-center gap-0.5 rounded-full bg-bg p-0.5">
                      <button
                        type="button"
                        aria-label={`Less ${item.name}`}
                        disabled={item.qty <= 1}
                        onClick={() => changeItem(item.id, { qty: item.qty - 1 })}
                        className="size-10 rounded-full text-xl font-bold disabled:opacity-30"
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center text-base font-extrabold" aria-live="polite">{item.qty}</span>
                      <button
                        type="button"
                        aria-label={`More ${item.name}`}
                        disabled={item.qty >= 20}
                        onClick={() => changeItem(item.id, { qty: item.qty + 1 })}
                        className="size-10 rounded-full bg-white text-xl font-bold disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => setRemoving(item)}
                      className="flex size-10 items-center justify-center rounded-full text-faint hover:bg-bg"
                    >
                      <IconClose className="size-4" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <Link
        to={`/new?add=${list.id}`}
        className="flex min-h-[52px] items-center justify-center rounded-full border-2 border-dashed border-line text-[15px] font-extrabold"
      >
        + Add more items
      </Link>

      <BottomAction>
        <PrimaryButton onClick={confirmList} disabled={list.items.length === 0}>
          Looks good · {count} {count === 1 ? 'item' : 'items'}
        </PrimaryButton>
      </BottomAction>

      {removing && (
        <ConfirmSheet
          title={`Remove ${removing.name}?`}
          text="It won’t be part of this week’s plan. You can add it again any time."
          confirmLabel="Remove"
          cancelLabel="Keep it"
          danger
          onConfirm={confirmRemove}
          onCancel={() => setRemoving(null)}
        />
      )}
    </Screen>
  );
}
