import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { CivicShell } from "@/components/civic-shell";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/lib/language-context";
import { AuthProvider } from "@/lib/auth-context";
import { LoginModal } from "@/components/LoginModal";
import { Route, Router as WouterRouter, Switch, useLocation } from "wouter";

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
  return (
    <RoutedErrorBoundary>
      <CivicShell>
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
          <Route path="/partners" component={Partners} />
          <Route component={NotFound} />
        </Switch>
      </CivicShell>
    </RoutedErrorBoundary>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <LoginModal />
            <Toaster />
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
