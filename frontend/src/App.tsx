import { Router, Route } from "@solidjs/router";
import { lazy } from "solid-js";
import { AppShell } from "./design-system/layouts/AppShell";

const AppearanceSettings = lazy(() => import("./pages/settings/tabs/AppearanceSettings"));
const OnboardingWizard = lazy(() => import("./pages/onboarding/OnboardingWizard"));

function App() {
  return (
    <Router root={AppShell}>
      <Route path="/" component={() => <div class="text-2xl font-bold">Welcome to OBLIVRA</div>} />
      <Route path="/onboarding" component={OnboardingWizard} />
      <Route path="/settings">
        <Route path="/appearance" component={AppearanceSettings} />
      </Route>
      <Route path="*">
        <div class="flex flex-col items-center justify-center h-[60vh] text-center">
          <h1 class="text-4xl font-bold mb-4">404</h1>
          <p class="text-secondary">This sector is currently dark.</p>
        </div>
      </Route>
    </Router>
  );
}

export default App;
