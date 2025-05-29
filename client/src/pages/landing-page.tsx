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
            Plateforme d'Évaluation Médicale Digitale
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Solution spécialisée pour les évaluations médicales CNESST avec 
            assistance IA et documentation vocale avancée.
          </p>
          <Button 
            onClick={onShowLogin}
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          >
            Accéder à la Plateforme
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Formulaires Digitaux</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Reproduction exacte des formulaires CNESST avec validation automatique
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Mic className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Dictée Vocale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Saisie vocale directe dans les champs avec reconnaissance française
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Brain className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">IA Médicale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Formatage automatique selon les standards médicaux du Québec
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Lock className="h-12 w-12 text-red-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Sécurisé</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Accès contrôlé et données médicales protégées
              </p>
            </CardContent>
          </Card>
        </div>

        {/* About Section */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-blue-900">
              Solution Propriétaire Dr. Centomo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              CentomoMD est une plateforme d'évaluation médicale digitale spécialement 
              conçue pour optimiser les processus d'évaluation CNESST. Cette solution 
              propriétaire combine l'expertise médicale du Dr. Centomo avec les dernières 
              technologies d'assistance IA.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Fonctionnalités Principales :</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Formulaires médicaux standardisés</li>
                  <li>• Dictée vocale bilingue (FR/EN)</li>
                  <li>• Formatage IA des notes médicales</li>
                  <li>• Sauvegarde automatique</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Avantages :</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Gain de temps significatif</li>
                  <li>• Documentation structurée</li>
                  <li>• Conformité réglementaire</li>
                  <li>• Interface intuitive</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-12 border-t">
        <div className="text-center text-gray-600">
          <p>&copy; 2025 CentomoMD - Solution propriétaire Dr. Centomo</p>
          <p className="text-sm mt-2">Plateforme d'évaluation médicale digitale spécialisée</p>
        </div>
      </footer>
    </div>
  );
}