import { useEffect, useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { fetchPlan } from '../lib/api';
import { getList } from '../lib/storage';

// Simple version: a plain loader while the plan is fetched from the backend.

export default function Analyze() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const list = getList(id);
  const started = useRef(false);

  // Ask the backend once, then go to the plan.
  useEffect(() => {
    if (!list || started.current) return;
    started.current = true;
    fetchPlan(list.items).then((result) => navigate(`/list/${id}/plan`, { replace: true, state: result }));
  }, [list, id, navigate]);

  if (!list) return <Navigate to="/lists" replace />;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col items-center justify-center gap-4 bg-bg px-6" aria-live="polite">
      <span className="size-10 animate-spin rounded-full border-4 border-line border-t-brand" aria-hidden="true" />
      <p className="text-[15px] text-muted">Checking this week’s Prospekte…</p>
    </div>
  );
}
