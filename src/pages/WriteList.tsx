import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { BackLink, Button, Screen } from '../components/ui';
import { getProducts } from '../lib/dataSource';
import { newId, parseList } from '../lib/parseList';
import { getGuestId, getList, saveList } from '../lib/storage';

export default function WriteList() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const addTo = params.get('add'); // adding more items to an existing list
  const [text, setText] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const items = parseList(text, getProducts());
    if (items.length === 0) return;

    const existing = addTo ? getList(addTo) : undefined;
    const now = new Date().toISOString();
    const list = existing
      ? { ...existing, items: [...existing.items, ...items] }
      : {
          id: newId(),
          ownerId: getGuestId(),
          title: 'List of ' + new Date().toLocaleDateString('en-GB'),
          status: 'draft' as const,
          items,
          createdAt: now,
          updatedAt: now,
        };
    saveList(list);
    navigate(`/list/${list.id}/check`);
  }

  return (
    <Screen>
      <BackLink to="/" />
      <h1 className="text-2xl font-bold">What do you need?</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label htmlFor="list-text" className="text-muted">
          Type your items, separated by commas.
        </label>
        <textarea
          id="list-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="2 milk, eggs, some gouda, bananas"
          rows={6}
          className="rounded-lg border bg-white p-3"
        />
        <Button type="submit" disabled={!text.trim()}>
          Check my list
        </Button>
      </form>
    </Screen>
  );
}
