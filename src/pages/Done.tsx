import { Link, Navigate, useParams } from 'react-router';
import { IconCheck } from '../components/icons';
import { euro } from '../lib/plan';
import { getTrip } from '../lib/storage';

export default function Done() {
  const { id = '' } = useParams();
  const trip = getTrip(id);
  const target = Math.max(0, trip?.saved ?? 0);
  if (!trip) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col gap-6 bg-brand px-6 pt-14 pb-8 text-white">
      <div className="flex flex-1 flex-col justify-center gap-4">
        <span className="flex size-[76px] items-center justify-center rounded-[26px] bg-save">
          <IconCheck className="size-9" />
        </span>
        <p className="text-[17px] font-bold text-white/85">Trip done. You saved</p>
        <p className="text-[76px] leading-none font-extrabold tracking-tighter" aria-live="polite">
          {euro(target)}
        </p>
        <p className="text-[15px] leading-relaxed text-white/85">
          At {trip.storeName} · {trip.itemCount} items · {euro(trip.total)} · thanks to this week’s Prospekt offers.
        </p>
      </div>
      <div className="flex flex-col gap-3 rounded-[28px] bg-white/15 p-5">
        <p className="text-xl font-extrabold">Saved on this phone</p>
        <p className="text-[15px] text-white/85">Your trip is in Savings. Accounts to keep it on every device are coming later.</p>
        <Link to="/savings" className="flex h-14 items-center justify-center rounded-full bg-white text-base font-extrabold text-ink">
          See my savings
        </Link>
        <Link to="/" className="flex min-h-11 items-center justify-center text-[15px] font-bold text-white/85">
          Back home
        </Link>
      </div>
    </div>
  );
}
