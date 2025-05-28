import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import MedicalForm from "@/pages/medical-form";
import DictationPage from "@/pages/dictation-page";
import NotFound from "@/pages/not-found";

function Router() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  
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
