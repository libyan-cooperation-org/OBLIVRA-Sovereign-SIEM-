import { Router, Route } from "@solidjs/router";
import { lazy } from "solid-js";
import { AppShell } from "./design-system/layouts/AppShell";
import { RTLProvider } from "./design-system/layouts/RTLProvider";

// Lazy-loaded pages
const OverviewDashboard = lazy(() => import("./pages/dashboard/OverviewDashboard"));
const AlertsPage = lazy(() => import("./pages/alerts/AlertsPage"));
const CasesPage = lazy(() => import("./pages/cases/CasesPage"));
const LogExplorer = lazy(() => import("./pages/explorer/LogExplorer"));
const LiveTail = lazy(() => import("./pages/livetail/LiveTail"));
const HuntingWorkspace = lazy(() => import("./pages/hunting/HuntingWorkspace"));
const MerkleExplorer = lazy(() => import("./pages/forensics/MerkleExplorer"));
const EvidenceLocker = lazy(() => import("./pages/forensics/EvidenceLocker"));
const NetflowDashboard = lazy(() => import("./pages/netflow/NetflowDashboard"));
const FIMPage = lazy(() => import("./pages/fim/FIMPage"));
const ComplianceDashboard = lazy(() => import("./pages/compliance/ComplianceDashboard"));
const AssetInventory = lazy(() => import("./pages/assets/AssetInventory"));
const DeceptionDashboard = lazy(() => import("./pages/deception/DeceptionDashboard"));
const ConstellationPage = lazy(() => import("./pages/constellation/ConstellationPage"));
const ThreatIntelPage = lazy(() => import("./pages/threat-intel/ThreatIntelPage"));
const PlaybookBuilder = lazy(() => import("./pages/playbooks/PlaybookBuilder"));
const GraphExplorer = lazy(() => import("./pages/graph/GraphExplorer"));
const APILab = lazy(() => import("./pages/api-lab/APILab"));
const RemoteShell = lazy(() => import("./pages/remote/RemoteShell"));
const SyntheticMonitoring = lazy(() => import("./pages/monitoring/SyntheticMonitoring"));
const SimulationLab = lazy(() => import("./pages/simulation/SimulationLab"));
const AppearanceSettings = lazy(() => import("./pages/settings/tabs/AppearanceSettings"));
const SecuritySettings = lazy(() => import("./pages/settings/tabs/SecuritySettings"));
const IntegrationSettings = lazy(() => import("./pages/settings/tabs/IntegrationSettings"));
const TeamSettings = lazy(() => import("./pages/settings/tabs/TeamSettings"));
const SystemSettings = lazy(() => import("./pages/settings/tabs/SystemSettings"));
const OnboardingWizard = lazy(() => import("./pages/onboarding/OnboardingWizard"));

function App() {
  return (
    <Router root={(props) => <RTLProvider><AppShell>{props.children}</AppShell></RTLProvider>}>
      <Route path="/" component={OverviewDashboard} />
      <Route path="/explorer" component={LogExplorer} />
      <Route path="/livetail" component={LiveTail} />
      <Route path="/alerts" component={AlertsPage} />
      <Route path="/cases" component={CasesPage} />
      <Route path="/hunting" component={HuntingWorkspace} />
      <Route path="/forensics">
        <Route path="/merkle" component={MerkleExplorer} />
        <Route path="/evidence" component={EvidenceLocker} />
      </Route>
      <Route path="/netflow" component={NetflowDashboard} />
      <Route path="/fim" component={FIMPage} />
      <Route path="/compliance" component={ComplianceDashboard} />
      <Route path="/assets" component={AssetInventory} />
      <Route path="/deception" component={DeceptionDashboard} />
      <Route path="/constellation" component={ConstellationPage} />
      <Route path="/threat-intel" component={ThreatIntelPage} />
      <Route path="/playbooks" component={PlaybookBuilder} />
      <Route path="/graph" component={GraphExplorer} />
      <Route path="/api-lab" component={APILab} />
      <Route path="/remote" component={RemoteShell} />
      <Route path="/monitoring" component={SyntheticMonitoring} />
      <Route path="/simulation" component={SimulationLab} />
      <Route path="/onboarding" component={OnboardingWizard} />
      <Route path="/settings">
        <Route path="/appearance" component={AppearanceSettings} />
        <Route path="/security" component={SecuritySettings} />
        <Route path="/integrations" component={IntegrationSettings} />
        <Route path="/team" component={TeamSettings} />
        <Route path="/system" component={SystemSettings} />
      </Route>
      <Route path="*">
        <div class="flex flex-col items-center justify-center h-[60vh] text-center">
          <h1 class="text-4xl font-bold mb-4 text-gradient">404</h1>
          <p class="text-secondary">This sector is currently dark or under surveillance.</p>
        </div>
      </Route>
    </Router>
  );
}

export default App;
