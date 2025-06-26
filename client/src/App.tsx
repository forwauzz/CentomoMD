import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import MedicalForm from "@/pages/medical-form";
import DictationPage from "@/pages/dictation-page";
import SimpleAITest from "@/pages/simple-ai-test";
import LoginPage from "@/pages/login-page";
import LandingPage from "@/pages/landing-page";
import FormSelector from "@/pages/form-selector";
import { SimpleFormContainer } from "@/components/simple-form-container";
import NotFound from "@/pages/not-found";

function Router() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [showLogin, setShowLogin] = useState(false);
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }
  
  // Show login page if explicitly requested
  if (showLogin && !isAuthenticated) {
    return <LoginPage />;
  }
  
  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return <LandingPage onShowLogin={() => setShowLogin(true)} />;
  }
  
  // User is authenticated, show the main app
  return (
    <Switch>
      <Route path="/" component={() => <MedicalForm language={language} onLanguageChange={setLanguage} />} />
      <Route path="/dictation" component={() => <DictationPage language={language} />} />
      <Route path="/forms" component={() => <FormSelector language={language} onLanguageChange={setLanguage} />} />
      <Route path="/forms/:formType">
        {(params) => (
          <SimpleFormContainer 
            formType={params.formType} 
            language={language} 
            onLanguageChange={setLanguage}
          />
        )}
      </Route>
      <Route path="/ai-test" component={SimpleAITest} />
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
