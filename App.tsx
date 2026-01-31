
import React from 'react';
import SprayFoamCalculator from './components/SprayFoamCalculator';
import { CalculatorProvider } from './context/CalculatorContext';

import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { ReloadPrompt } from './components/ReloadPrompt';

function App() {
  return (
    <div className="min-h-[100dvh] bg-slate-50 py-8">
      <CalculatorProvider>
        <SprayFoamCalculator />
        <PWAInstallPrompt />
        <ReloadPrompt />
      </CalculatorProvider>
    </div>
  );
}

export default App;
