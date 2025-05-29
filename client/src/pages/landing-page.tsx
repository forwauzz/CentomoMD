import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Mic, Brain, Lock } from "lucide-react";

interface LandingPageProps {
  onShowLogin: () => void;
}

export default function LandingPage({ onShowLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Minimalist Header */}
      <header className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-2xl">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">CentomoMD</h1>
          </div>
        </div>
      </header>

      {/* Centered Hero Section */}
      <main className="relative z-10 flex items-center justify-center min-h-[70vh]">
        <div className="text-center max-w-2xl mx-auto px-4">
          {/* Main card with 3D effect */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20 shadow-2xl transform hover:scale-105 transition-all duration-300">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/20 rounded-2xl mb-6 shadow-lg">
                <Lock className="h-10 w-10 text-blue-300" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Évaluations Médicales
                <span className="block text-blue-300">CNESST</span>
              </h2>
              <p className="text-xl text-blue-100 mb-10 opacity-90">
                Accès sécurisé aux formulaires d'évaluation médicale
              </p>
            </div>

            {/* 3D Login Button */}
            <Button 
              onClick={onShowLogin}
              size="lg" 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-12 py-4 text-lg font-semibold rounded-2xl shadow-2xl transform hover:scale-105 hover:shadow-blue-500/25 transition-all duration-300 border-0"
            >
              <div className="flex items-center space-x-2">
                <span>Connexion</span>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </Button>
          </div>
        </div>
      </main>

      {/* Floating Footer */}
      <footer className="relative z-10 text-center pb-8">
        <div className="text-blue-200/60 text-sm">
          © 2025 CentomoMD
        </div>
      </footer>
    </div>
  );
}