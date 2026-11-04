import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ConfirmSheet, PrimaryLink, Screen, SectionLabel } from '../components/ui';
import { IconClose } from '../components/icons';
import { newId } from '../lib/parseList';
import { deleteList, getGuestId, getLists, saveList } from '../lib/storage';
import type { ShoppingList } from '../types';

export default function Lists() {
  const navigate = useNavigate();
  const [lists, setLists] = useState(getLists);
  const [removing, setRemoving] = useState<ShoppingList | null>(null);

  const current = lists.find((l) => l.status !== 'done');
  const earlier = lists.filter((l) => l.status === 'done');
  const short = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  // "Use again": a fresh copy of an old list, nothing ticked.
  function reuseList(old: ShoppingList) {
    const now = new Date().toISOString();
    const copy: ShoppingList = {
      ...old,
      id: newId(),
      ownerId: getGuestId(),
      status: 'draft',
      title: `${old.title} (again)`,
      items: old.items.map((i) => ({ ...i, id: newId(), checked: false })),
      createdAt: now,
      updatedAt: now,
    };
    saveList(copy);
    navigate(`/list/${copy.id}/check`);
  }

  function confirmRemove() {
    if (!removing) return;
    deleteList(removing.id);
    setLists(getLists());
    setRemoving(null);
  }

  return (
    <Screen nav>
      <h1 className="text-[30px] font-extrabold tracking-tight">My lists</h1>

      {current && (
        <>
          <SectionLabel>This week</SectionLabel>
          <section className="flex flex-col gap-4 rounded-[28px] bg-white p-5" aria-label={current.title}>
            <div className="flex items-start justify-between gap-3">
              <span className="flex flex-col gap-1">
                <span className="text-xl font-extrabold tracking-tight">{current.title}</span>
                <span className="text-sm text-muted">
                  {current.items.length} items · edited {short(current.updatedAt)}
                </span>
              </span>
              <button
                type="button"
                aria-label={`Delete ${current.title}`}
                onClick={() => setRemoving(current)}
                className="flex size-10 items-center justify-center rounded-full text-faint hover:bg-bg"
              >
                <IconClose className="size-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {current.items.slice(0, 6).map((i) => (
                <span key={i.id} className="rounded-xl bg-bg px-2.5 py-1.5 text-[13px] font-bold">
                  {i.name}
                  {i.qty > 1 ? ` × ${i.qty}` : ''}
                </span>
              ))}
              {current.items.length > 6 && (
                <span className="px-2.5 py-1.5 text-[13px] font-bold text-muted">+{current.items.length - 6} more</span>
              )}
            </div>
            <div className="flex gap-2 border-t border-line pt-3.5">
              <Link to={`/list/${current.id}/check`} className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-brand-soft text-sm font-extrabold text-brand">
                Edit
              </Link>
              <Link to={`/list/${current.id}/plan`} className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-brand text-sm font-extrabold text-white">
                See plan
              </Link>
            </div>
          </section>
        </>
      )}

      {earlier.length > 0 && (
        <>
          <SectionLabel>Earlier</SectionLabel>
          <ul className="rounded-[22px] bg-white py-1">
            {earlier.map((l) => (
              <li key={l.id} className="flex min-h-16 items-center gap-3 pr-2.5 pl-[18px]">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-base font-extrabold">{l.title}</span>
                  <span className="truncate text-[13px] text-muted">
                    {short(l.updatedAt)} · {l.items.length} items
                  </span>
                </span>
                <button type="button" onClick={() => reuseList(l)} className="min-h-10 rounded-full bg-bg px-3.5 text-[13px] font-extrabold">
                  Use again
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {lists.length === 0 && (
        <p className="rounded-[24px] bg-white p-6 text-center text-muted">No lists yet. Write your first one, it takes a minute.</p>
      )}

      <div className="mt-auto pt-2">
        <PrimaryLink to="/new">+ New list</PrimaryLink>
      </div>

      {removing && (
        <ConfirmSheet
          title={`Delete ${removing.title}?`}
          text="The list will be removed from this phone. You can’t undo this."
          confirmLabel="Delete"
          cancelLabel="Keep it"
          danger
          onConfirm={confirmRemove}
          onCancel={() => setRemoving(null)}
        />
      )}
    </Screen>
  );
}
