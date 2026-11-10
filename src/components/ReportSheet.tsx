import { useState } from 'react';
import { sendReport, type ReportInput } from '../lib/api';
import type { PlanLine } from '../lib/plan';
import type { Store } from '../types';

// "Wrong price?" → the user tells us what is wrong. Bad data is the biggest risk of the app,
// so users help keep it correct.
const KINDS: { id: ReportInput['kind']; label: string }[] = [
  { id: 'wrong_price', label: 'Price is different' },
  { id: 'offer_ended', label: 'Offer has ended' },
  { id: 'not_in_store', label: 'Not in the store' },
];

export default function ReportSheet({ line, store, onClose }: { line: PlanLine; store: Store; onClose: () => void }) {
  const [kind, setKind] = useState<ReportInput['kind']>('wrong_price');
  const [price, setPrice] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  async function submit() {
    if (!line.productId) return;
    setState('sending');
    const correctPrice = kind === 'wrong_price' && price ? Number(price.replace(',', '.')) : null;
    const ok = await sendReport({ productId: line.productId, storeId: store.id, kind, correctPrice: correctPrice || null });
    setState(ok ? 'sent' : 'failed');
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-ink/55" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        onClick={(e) => e.stopPropagation()}
        className="animate-sheet mx-auto flex w-full max-w-[440px] flex-col gap-4 rounded-t-[28px] bg-white px-5 pt-3 pb-8"
      >
        <span className="mx-auto h-1.5 w-10 rounded-full bg-line" />
        {state === 'sent' ? (
          <>
            <h2 id="report-title" className="text-[22px] font-extrabold">Thank you!</h2>
            <p className="text-[15px] text-muted">We’ll check {line.name} at {store.name}. Reports like yours keep the prices right.</p>
            <button type="button" onClick={onClose} className="h-[58px] rounded-full bg-brand text-[17px] font-bold text-white">
              Done
            </button>
          </>
        ) : (
          <>
            <h2 id="report-title" className="text-[22px] font-extrabold">What’s wrong?</h2>
            <p className="text-[15px] text-muted">
              {line.name} at {store.name}
            </p>
            <div className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  aria-pressed={kind === k.id}
                  onClick={() => setKind(k.id)}
                  className={`min-h-10 rounded-full px-4 text-sm font-extrabold ${
                    kind === k.id ? 'bg-brand-soft text-brand-ink shadow-[inset_0_0_0_2px_var(--color-brand)]' : 'bg-bg'
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>
            {kind === 'wrong_price' && (
              <label className="flex flex-col gap-1.5 text-sm font-bold text-muted">
                Price in the store (optional)
                <input
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 1,19"
                  className="h-12 rounded-2xl border-2 border-line px-4 text-base font-bold text-ink outline-none focus:border-brand"
                />
              </label>
            )}
            {state === 'failed' && <p className="text-sm font-bold text-danger">Couldn’t send it. Please try again later.</p>}
            <button
              type="button"
              onClick={submit}
              disabled={state === 'sending'}
              className="h-[58px] rounded-full bg-brand text-[17px] font-bold text-white disabled:opacity-50"
            >
              {state === 'sending' ? 'Sending…' : 'Send report'}
            </button>
            <button type="button" onClick={onClose} className="h-[52px] rounded-full bg-bg text-base font-bold">
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
