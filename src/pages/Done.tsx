import { Link, Navigate, useParams } from 'react-router';
import { Screen } from '../components/ui';
import { euro } from '../lib/plan';
import { getTrip } from '../lib/storage';

export default function Done() {
  const { id = '' } = useParams();
  const trip = getTrip(id);
  if (!trip) return <Navigate to="/" replace />;

  return (
    <Screen>
      <h1 className="text-2xl font-bold">Trip saved ✓</h1>
      <p className="text-4xl font-bold text-green-700">You saved {euro(trip.saved)}</p>
      <p className="text-muted">
        {trip.storeName} · {trip.itemCount} items · {euro(trip.total)}
      </p>
      <Link to="/savings" className="rounded-lg bg-brand p-3 text-center font-semibold text-white">
        See my savings
      </Link>
      <Link to="/" className="text-center text-brand">
        Back home
      </Link>
    </Screen>
  );
}
