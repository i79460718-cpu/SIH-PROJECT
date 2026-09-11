import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { CivicShell } from "@/components/civic-shell";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/language-context";
import { AuthProvider } from "@/lib/auth-context";
import { LoginModal } from "@/components/LoginModal";
import { Redirect, Route, Router as WouterRouter, Switch, useLocation } from "wouter";
import { DemoSessionProvider, useDemoSession, demoDestinations } from "@/lib/demo-session";

// Pages
import Home from "@/pages/home";
import ReportPage from "@/pages/report";
import IssuesPage from "@/pages/issues";
import IssueDetailPage from "@/pages/issue-detail";
import MapPage from "@/pages/map";
import AiIntelligencePage from "@/pages/ai-intelligence";
import OfficerPage from "@/pages/officer";
import DashboardPage from "@/pages/dashboard";
import Partners from "@/pages/partners";
import { lazy, Suspense, type ReactNode } from "react";
import { ProtectedRoleRoute } from "@/components/ProtectedRoleRoute";
// ... (keep other imports)

const UniversityPortal = lazy(() => import("@/pages/university-portal"));
const IndustryPortal = lazy(() => import("@/pages/industry-portal"));
const AdminPortal = lazy(() => import("@/pages/admin-portal"));
const DemoPreview = lazy(() => import("@/pages/demo-preview"));
const DemoPortal = lazy(() => import("@/pages/demo-portal"));
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20000,
      refetchOnWindowFocus: false,
    },
  },
});

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  const { demoSession } = useDemoSession();
  const [location] = useLocation();
  if (demoSession) {
    const destination = demoDestinations[demoSession.role];
    // Demo routes never mount live portals, query hooks, or the live CivicShell.
    if (location !== destination) return <Redirect to={destination} />;
    return <Suspense fallback={<div className="p-10">Loading demo workspace...</div>}><DemoPortal key={demoSession.role} /></Suspense>;
  }
  return (
    <RoutedErrorBoundary>
      <CivicShell>
        <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/dashboard" component={DashboardPage} />
            <Route path="/report" component={ReportPage} />
            <Route path="/submit" component={ReportPage} />
            <Route path="/issues" component={IssuesPage} />
            <Route path="/issues/:id" component={IssueDetailPage} />
            <Route path="/challenge/:id" component={IssueDetailPage} />
            <Route path="/map" component={MapPage} />
            <Route path="/ai-intelligence" component={AiIntelligencePage} />
            <Route path="/ai-lab" component={AiIntelligencePage} />
            <Route path="/officer" component={OfficerPage} />
            <Route path="/university">
              <ProtectedRoleRoute allowedRoles={["university_admin", "admin"]}>
                <UniversityPortal />
              </ProtectedRoleRoute>
            </Route>
            <Route path="/industry">
              <ProtectedRoleRoute allowedRoles={["industry_partner", "admin"]}>
                <IndustryPortal />
              </ProtectedRoleRoute>
            </Route>
            <Route path="/admin">
              <ProtectedRoleRoute allowedRoles={["admin"]}>
                <AdminPortal />
              </ProtectedRoleRoute>
            </Route>
            <Route path="/partners" component={Partners} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </CivicShell>
    </RoutedErrorBoundary>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <DemoSessionProvider><AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Switch>
                <Route path="/demo/:persona">{params => <Suspense fallback={<div className="p-10">Loading demo preview...</div>}><DemoPreview persona={params.persona} /></Suspense>}</Route>
                <Route><Router /></Route>
              </Switch>
              <LoginModal />
            </WouterRouter>
            <Toaster />
          </AuthProvider></DemoSessionProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
