import { useState } from 'react';
import { useNavigate } from 'react-router';
import { BottomAction, PrimaryButton, Screen, Title, TopBar } from '../components/ui';
import { fetchMealPlan, type MealAnswers } from '../lib/api';

// "Tell me what to buy": 4 quick questions. The answers go to the server, which plans the meals.
type Option<T> = { value: T; label: string };

const DAYS: Option<number>[] = [
  { value: 3, label: '3 days' },
  { value: 5, label: '5 days' },
  { value: 7, label: '7 days' },
];
const MEALS: Option<number>[] = [
  { value: 1, label: 'Dinner' },
  { value: 2, label: '+ Lunch' },
  { value: 3, label: 'All 3' },
];
const COOK: Option<MealAnswers['cook']>[] = [
  { value: 'quick', label: 'Quick only' },
  { value: 'normal', label: 'Normal' },
  { value: 'love', label: 'Love it' },
];
const AVOID: Option<MealAnswers['avoid'][number]>[] = [
  { value: 'meat', label: 'Vegetarian' },
  { value: 'pork', label: 'No pork' },
  { value: 'fish', label: 'No fish' },
  { value: 'dairy', label: 'No dairy' },
];

const chip = (on: boolean) =>
  `min-h-12 rounded-2xl px-3 text-[15px] font-bold transition ${
    on ? 'bg-brand-soft text-brand-ink shadow-[inset_0_0_0_2px_var(--color-brand)]' : 'bg-white'
  }`;

function Question<T>({ title, options, value, onPick }: { title: string; options: Option<T>[]; value: T; onPick: (v: T) => void }) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2.5 text-[15px] font-extrabold">{title}</legend>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button key={o.label} type="button" aria-pressed={value === o.value} onClick={() => onPick(o.value)} className={chip(value === o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function Meals() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<MealAnswers>({ days: 5, mealsPerDay: 1, cook: 'quick', avoid: [] });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  function toggleAvoid(v: MealAnswers['avoid'][number]) {
    setAnswers((a) => ({ ...a, avoid: a.avoid.includes(v) ? a.avoid.filter((x) => x !== v) : [...a.avoid, v] }));
  }

  async function plan() {
    setBusy(true);
    setFailed(false);
    const result = await fetchMealPlan(answers);
    setBusy(false);
    if (!result) {
      setFailed(true);
      return;
    }
    navigate('/meals/plan', { state: result });
  }

  return (
    <Screen>
      <TopBar label="Tell me what to buy" back="/" />
      <Title>What’s your week like?</Title>

      <Question title="How many days?" options={DAYS} value={answers.days} onPick={(days) => setAnswers({ ...answers, days })} />
      <Question title="Meals per day" options={MEALS} value={answers.mealsPerDay} onPick={(mealsPerDay) => setAnswers({ ...answers, mealsPerDay })} />
      <Question title="Do you cook?" options={COOK} value={answers.cook} onPick={(cook) => setAnswers({ ...answers, cook })} />

      <fieldset className="flex flex-col">
        <legend className="mb-2.5 text-[15px] font-extrabold">Anything you don’t eat?</legend>
        <div className="flex flex-wrap gap-2">
          {AVOID.map((o) => (
            <button key={o.value} type="button" aria-pressed={answers.avoid.includes(o.value)} onClick={() => toggleAvoid(o.value)} className={`${chip(answers.avoid.includes(o.value))} px-4`}>
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>

      {failed && <p className="rounded-2xl bg-warn-soft p-4 text-sm font-bold text-warn-ink">The meal planner needs the server. Start it and try again.</p>}

      <BottomAction>
        <PrimaryButton onClick={plan} disabled={busy}>
          {busy ? 'Planning your week…' : 'Plan my week'}
        </PrimaryButton>
      </BottomAction>
    </Screen>
  );
}
