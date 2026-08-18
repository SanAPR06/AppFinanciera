import { useEffect, useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { AuthGate } from './components/AuthGate';
import { ToastHost } from './components/ToastHost';
import { Onboarding } from './components/Onboarding';
import { useFinanceStore } from './store/useFinanceStore';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient';
import { useTheme } from './lib/useTheme';

const ONBOARDING_KEY = 'finanzas-onboarding-seen';

function App() {
  const loadRemote = useFinanceStore((s) => s.loadRemote);
  const runRecurringGeneration = useFinanceStore((s) => s.runRecurringGeneration);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem(ONBOARDING_KEY)
  );
  useTheme();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      runRecurringGeneration();
      return;
    }
    loadRemote();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') loadRemote();
    });
    return () => sub.subscription.unsubscribe();
  }, [loadRemote, runRecurringGeneration]);

  function finishOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  }

  return (
    <div className="min-h-screen bg-pure-white dark:bg-off-black-ink">
      {showOnboarding ? (
        <Onboarding onFinish={finishOnboarding} />
      ) : (
        <AuthGate>
          <Dashboard />
        </AuthGate>
      )}
      <ToastHost />
    </div>
  );
}

export default App;
