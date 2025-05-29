import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import MedicalForm from "@/pages/medical-form";
import DictationPage from "@/pages/dictation-page";
import LoginPage from "@/pages/login-page";
import LandingPage from "@/pages/landing-page";
import NotFound from "@/pages/not-found";

function Router() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [showLogin, setShowLogin] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }
  
  if (showLogin) {
    return <LoginPage />;
  }
  
  if (!isAuthenticated) {
    return <LandingPage onShowLogin={() => setShowLogin(true)} />;
  }
  
  return (
    <Switch>
      <Route path="/" component={() => <MedicalForm language={language} onLanguageChange={setLanguage} />} />
      <Route path="/dictation" component={() => <DictationPage language={language} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
