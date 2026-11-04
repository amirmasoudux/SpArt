import { Link } from 'react-router';
import { Screen, SectionLabel } from '../components/ui';
import { euro } from '../lib/plan';
import { getTrips } from '../lib/storage';

export default function Savings() {
  const trips = getTrips();
  const now = new Date();
  const month = now.toLocaleDateString('en-GB', { month: 'long' });
  const monthTrips = trips.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const saved = monthTrips.reduce((s, t) => s + t.netSaving, 0);
  const tripCosts = monthTrips.reduce((s, t) => s + t.tripCost, 0);
  const lastSix = trips.slice(0, 6).reverse();
  const max = Math.max(1, ...lastSix.map((t) => t.netSaving));
  const short = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <Screen nav>
      <h1 className="text-[30px] font-extrabold tracking-tight">Savings</h1>

      <section className="flex flex-col gap-5 rounded-[28px] bg-white p-6" aria-label={`Saved in ${month}`}>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold text-muted">Saved in {month}</span>
          <span className="text-[56px] leading-none font-extrabold tracking-tight text-save">{euro(Math.max(0, saved))}</span>
          <span className="text-sm text-muted">after {euro(tripCosts)} in trip costs</span>
        </div>
        {lastSix.length > 0 && (
          <div
            className="flex h-24 items-end gap-2.5"
            role="img"
            aria-label={`Net saving per trip: ${lastSix.map((t) => euro(t.netSaving)).join(', ')}`}
          >
            {lastSix.map((t, i) => (
              <div key={t.id} className="flex flex-1 flex-col items-center gap-1.5">
                <span
                  className={`w-full rounded-xl ${i === lastSix.length - 1 ? 'bg-save' : 'bg-save-soft'}`}
                  style={{ height: `${Math.max(6, (Math.max(0, t.netSaving) / max) * 72)}px` }}
                />
                <span className="text-xs font-bold text-muted">{short(t.date)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <SectionLabel>Past trips</SectionLabel>
      {trips.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[24px] bg-white p-6 text-center">
          <p className="text-muted">No trips yet. Your first saving shows up here after shopping.</p>
          <Link to="/new" className="rounded-full bg-brand-soft px-4 py-2.5 text-sm font-extrabold text-brand">
            Write a list
          </Link>
        </div>
      ) : (
        <ul className="rounded-[24px] bg-white py-1">
          {trips.map((t) => (
            <li key={t.id} className="flex min-h-16 items-center justify-between px-[18px]">
              <span className="flex flex-col gap-0.5">
                <span className="text-base font-extrabold">{t.storeName}</span>
                <span className="text-[13px] text-muted">
                  {short(t.date)} · {t.itemCount} items
                </span>
              </span>
              <span className="flex flex-col items-end gap-0.5">
                <span className="text-base font-extrabold text-save-ink">+{euro(Math.max(0, t.netSaving))}</span>
                <span className="text-[13px] text-muted">{euro(t.total)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
