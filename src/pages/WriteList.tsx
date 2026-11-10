import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { BottomAction, PrimaryButton, Screen, Title, TopBar } from '../components/ui';
import { getProducts } from '../lib/dataSource';
import { newId, parseList } from '../lib/parseList';
import { improveUnknownItems } from '../lib/api';
import { getGuestId, getList, saveList } from '../lib/storage';

const EXAMPLES = ['2 milk', 'eggs', 'some gouda', 'bananas', 'pasta', 'coffee'];

function defaultTitle(): string {
  return 'List of ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function WriteList() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const addTo = params.get('add'); // adding more items to an existing list
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    // 1) Fast rules for the words we know. 2) The AI only for the rest.
    const parsed = parseList(text, getProducts());
    if (parsed.length === 0) return;
    setBusy(true);
    const items = await improveUnknownItems(parsed);
    setBusy(false);

    const existing = addTo ? getList(addTo) : undefined;
    const now = new Date().toISOString();
    const list = existing
      ? { ...existing, status: 'draft' as const, items: [...existing.items, ...items] }
      : { id: newId(), ownerId: getGuestId(), title: defaultTitle(), status: 'draft' as const, items, createdAt: now, updatedAt: now };
    saveList(list);
    navigate(`/list/${list.id}/check`, { replace: Boolean(addTo) });
  }

  function addExample(word: string) {
    setText((t) => (t.trim() ? `${t.trim().replace(/,$/, '')}, ${word}` : word));
  }

  return (
    <Screen>
      <form onSubmit={submit} className="flex flex-1 flex-col gap-4">
        <TopBar label={addTo ? 'Add more items' : 'Step 1 of 2'} back={addTo ? `/list/${addTo}/check` : '/'} />
        <Title>What do you need?</Title>
        <p className="text-[15px] text-muted">Type your items the way you say them. Commas or new lines are fine.</p>

        <label htmlFor="list-text" className="sr-only">Your shopping list</label>
        <textarea
          id="list-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="2 milk, eggs, some gouda, bananas…"
          rows={7}
          autoFocus
          className="w-full resize-none rounded-[24px] border-2 border-transparent bg-white p-5 text-[17px] leading-relaxed outline-none placeholder:text-faint focus:border-brand"
        />

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-extrabold text-muted">Quick add</span>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => addExample(w)}
                className="min-h-10 rounded-full bg-white px-4 text-sm font-bold transition hover:bg-brand-soft"
              >
                + {w}
              </button>
            ))}
          </div>
        </div>

        <BottomAction>
          <PrimaryButton type="submit" disabled={!text.trim() || busy}>
            {busy ? 'Reading your list…' : 'Check my list'}
          </PrimaryButton>
        </BottomAction>
      </form>
    </Screen>
  );
}
