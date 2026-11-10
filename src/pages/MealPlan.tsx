import { Navigate, useLocation, useNavigate } from 'react-router';
import { BottomAction, PrimaryButton, Screen, SectionLabel, Title, TopBar } from '../components/ui';
import { getProducts } from '../lib/dataSource';
import { improveUnknownItems, type Meal } from '../lib/api';
import { newId, parseList } from '../lib/parseList';
import { getGuestId, saveList } from '../lib/storage';

// The meal plan, and one button to turn all ingredients into a shopping list.
export default function MealPlan() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state as { meals: Meal[]; source: 'ai' | 'recipes' } | null;

  if (!plan) return <Navigate to="/meals" replace />;

  async function makeList() {
    // Same path as a typed list: the parser adds up repeats ("onions" in 3 meals → 3 onions… capped at 20).
    const text = plan!.meals.flatMap((m) => m.ingredients).join(', ');
    const items = await improveUnknownItems(parseList(text, getProducts()));
    const now = new Date().toISOString();
    const list = {
      id: newId(),
      ownerId: getGuestId(),
      title: `Meal plan · ${plan!.meals.length} meals`,
      status: 'draft' as const,
      items,
      createdAt: now,
      updatedAt: now,
    };
    saveList(list);
    navigate(`/list/${list.id}/check`);
  }

  const days = [...new Set(plan.meals.map((m) => m.day))];

  return (
    <Screen>
      <TopBar label={plan.source === 'ai' ? 'Planned by AI' : 'From our recipes'} back="/meals" />
      <Title>Your week, planned</Title>

      {days.map((day) => (
        <section key={day} className="flex flex-col gap-1.5" aria-label={day}>
          <SectionLabel>{day}</SectionLabel>
          <ul className="rounded-[22px] bg-white py-1">
            {plan.meals
              .filter((m) => m.day === day)
              .map((m, i) => (
                <li key={`${m.name}-${i}`} className="flex flex-col gap-0.5 px-[18px] py-3">
                  <span className="text-base font-extrabold">{m.name}</span>
                  <span className="text-[13px] text-muted">{m.ingredients.join(', ')}</span>
                </li>
              ))}
          </ul>
        </section>
      ))}

      <BottomAction>
        <PrimaryButton onClick={makeList}>Make my shopping list</PrimaryButton>
      </BottomAction>
    </Screen>
  );
}
