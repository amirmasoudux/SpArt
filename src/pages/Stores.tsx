import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { BottomAction, PrimaryButton, Screen, Title, TopBar } from '../components/ui';
import { IconCheck } from '../components/icons';
import { getStores } from '../lib/dataSource';
import { getMyChains, saveMyChains } from '../lib/storage';
import type { Chain } from '../types';

// "Where do you shop?" The plan then only shows offers from these supermarkets.
export default function Stores() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') ?? '/';
  const firstTime = getMyChains().length === 0;
  const [chosen, setChosen] = useState<Chain[]>(getMyChains);
  const stores = getStores();

  const toggle = (chain: Chain) =>
    setChosen((prev) => (prev.includes(chain) ? prev.filter((c) => c !== chain) : [...prev, chain]));

  function save() {
    saveMyChains(stores.map((s) => s.chain).filter((c) => chosen.includes(c)));
    navigate(next, { replace: true });
  }

  return (
    <Screen>
      {firstTime ? <p className="pt-2 text-sm font-bold text-muted">Step 1 · Your supermarkets</p> : <TopBar label="Your supermarkets" back="/" />}
      <Title>Which supermarkets can you go to?</Title>
      <p className="text-[15px] text-muted">
        Pick the ones near your home or the ones you usually go to. We suggest at least two, so we can compare their offers.
      </p>

      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Your supermarkets in Siegburg</legend>
        {stores.map((s) => {
          const on = chosen.includes(s.chain);
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(s.chain)}
              className={`flex min-h-[60px] items-center justify-between rounded-[22px] border-2 bg-white px-5 text-left transition ${
                on ? 'border-brand' : 'border-transparent'
              }`}
            >
              <span className="text-[17px] font-extrabold">{s.name}</span>
              <span
                className={`flex size-[26px] items-center justify-center rounded-[9px] ${on ? 'bg-brand text-white' : 'border-2 border-line'}`}
              >
                {on && <IconCheck className="size-3.5" />}
              </span>
            </button>
          );
        })}
      </fieldset>

      <p className="px-1.5 text-[13px] text-muted">
        {chosen.length === 1 ? 'Tip: pick one more to compare offers. ' : ''}Prospekte for Siegburg. You can change this any time on Home.
      </p>

      <BottomAction>
        <PrimaryButton onClick={save} disabled={chosen.length === 0}>
          {chosen.length === 0 ? 'Pick your supermarkets' : `Show offers from ${chosen.length} ${chosen.length === 1 ? 'supermarket' : 'supermarkets'}`}
        </PrimaryButton>
      </BottomAction>
    </Screen>
  );
}
