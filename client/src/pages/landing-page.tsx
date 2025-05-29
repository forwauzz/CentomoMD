import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Mic, Brain, Lock } from "lucide-react";

interface LandingPageProps {
  onShowLogin: () => void;
}

export default function LandingPage({ onShowLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-blue-900">CentomoMD</h1>
            <Badge variant="secondary" className="ml-2">Propriétaire</Badge>
          </div>
          <Button onClick={onShowLogin} variant="outline">
            Connexion
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
            Évaluations Médicales CNESST
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Accès sécurisé aux formulaires d'évaluation médicale
          </p>
          <Button 
            onClick={onShowLogin}
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          >
            Connexion
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-12 border-t">
        <div className="text-center text-gray-600">
          <p>&copy; 2025 CentomoMD</p>
        </div>
      </footer>
    </div>
  );
}