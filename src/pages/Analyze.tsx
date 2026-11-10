import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Screen } from '../components/ui';
import { getStores } from '../lib/dataSource';
import { fetchPlan } from '../lib/api';
import { getList } from '../lib/storage';

// "Checking this week's Prospekte": asks the backend for the plan,
// and shows the steps so the user sees where the answer comes from.
export default function Analyze() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const list = getList(id);
  const stores = getStores();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!list) return;
    // Show one step every 600 ms while the request runs.
    const timer = setInterval(() => setStep((s) => s + 1), 600);
    const minWait = new Promise((r) => setTimeout(r, 600 * (stores.length + 1)));
    Promise.all([fetchPlan(list.items), minWait]).then(([result]) => {
      clearInterval(timer);
      navigate(`/list/${id}/plan`, { replace: true, state: result });
    });
    return () => clearInterval(timer);
  }, [id]); // run once per list

  if (!list) return <Navigate to="/lists" replace />;

  return (
    <Screen>
      <h1 className="text-2xl font-bold">Checking this week’s Prospekte…</h1>
      <ul className="flex flex-col gap-2 rounded-lg border bg-white p-4">
        {stores.map((s, i) => (
          <li key={s.id}>
            {step > i ? '✓' : '…'} {s.name} Prospekt
          </li>
        ))}
        <li>{step > stores.length ? '✓' : '…'} Finding the cheapest store</li>
      </ul>
    </Screen>
  );
}
