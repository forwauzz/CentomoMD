import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormInput, FileText, Stethoscope, ArrowRight, LogOut, User, TestTube, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { VisitSelectionModal } from '@/components/visit-selection-modal';
import { useQuery } from '@tanstack/react-query';

interface FormSelectorProps {
  language?: 'fr' | 'en';
  onLanguageChange?: (language: 'fr' | 'en') => void;
}

export default function FormSelector({ 
  language = 'fr',
  onLanguageChange 
}: FormSelectorProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState<string | null>(null);

  // Available form types with metadata
  const availableForms = [
    {
      id: 'cnesst-medical',
      title: {
        fr: 'MI Template',
        en: 'MI Template'
      },
      description: {
        fr: 'Modèle d\'évaluation médicale complet avec IA intégrée',
        en: 'Complete medical evaluation template with integrated AI'
      },
      icon: Stethoscope,
      category: 'medical',
      features: ['AI Enhancement', 'Voice Dictation', 'PDF Export']
    }
  ];

  const handleFormSelect = (formId: string) => {
    // Show visit selection modal for all forms
    setSelectedForm(formId);
    setShowVisitModal(true);
  };

  const handleNewVisit = (visitName?: string) => {
    const nameParam = visitName ? `&name=${encodeURIComponent(visitName)}` : '';
    if (selectedForm === 'cnesst-medical') {
      // Route to medical form with new visit parameter
      setLocation(`/forms/cnesst-medical?visit=new${nameParam}`);
    } else {
      setLocation(`/forms/${selectedForm}?visit=new${nameParam}`);
    }
  };

  const handleSelectDraft = (draftId: number) => {
    if (selectedForm === 'cnesst-medical') {
      // Route to medical form with draft parameter
      setLocation(`/forms/cnesst-medical?draft=${draftId}`);
    } else {
      setLocation(`/forms/${selectedForm}?draft=${draftId}`);
    }
  };

  const handleLanguageChange = (newLanguage: 'fr' | 'en') => {
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: language === 'fr' ? "Déconnexion réussie" : "Logout successful",
        description: language === 'fr' ? "Vous avez été déconnecté avec succès." : "You have been logged out successfully.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: language === 'fr' ? "Erreur lors de la déconnexion." : "Error during logout.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 mb-2">
                {language === 'fr' ? 'Sélection de formulaire' : 'Form Selection'}
              </h1>
              <p className="text-gray-600">
                {language === 'fr' 
                  ? 'Choisissez le type de formulaire que vous souhaitez utiliser'
                  : 'Choose the type of form you want to use'
                }
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Speech Test Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/speech-test')}
                className="flex items-center space-x-1 text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                <TestTube className="w-4 h-4" />
                <span>{language === 'fr' ? 'Test Vocal' : 'Speech Test'}</span>
              </Button>

              {/* User Info & Logout */}
              {user && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{user.username || user.email}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center space-x-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{language === 'fr' ? 'Déconnexion' : 'Logout'}</span>
                  </Button>
                </div>
              )}

              {/* Language Toggle */}
              {onLanguageChange && (
                <div className="flex space-x-2">
                  <Button
                    variant={language === 'fr' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLanguageChange('fr')}
                  >
                    Français
                  </Button>
                  <Button
                    variant={language === 'en' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLanguageChange('en')}
                  >
                    English
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* System Logs Card for Admin Users */}
          {user?.role === 'admin' && (
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50"
              onClick={() => setLocation('/system-logs')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Zap className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-yellow-800">
                      {language === 'fr' ? 'Journaux Système' : 'System Logs'}
                    </CardTitle>
                    <CardDescription className="text-yellow-700">
                      {language === 'fr' 
                        ? 'Rechercher les incidents et erreurs historiques'
                        : 'Search historical incidents and errors'
                      }
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-yellow-700">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    {language === 'fr' ? 'Recherche par date' : 'Search by date'}
                  </div>
                  <div className="flex items-center text-sm text-yellow-700">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    {language === 'fr' ? 'Filtres par niveau d\'erreur' : 'Filter by error level'}
                  </div>
                  <div className="flex items-center text-sm text-yellow-700">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    {language === 'fr' ? 'Audit médical complet' : 'Complete medical audit'}
                  </div>
                </div>
                <div className="mt-4 text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                  {language === 'fr' ? 'Accès administrateur requis' : 'Admin access required'}
                </div>
              </CardContent>
            </Card>
          )}

          {availableForms.map((form) => {
            const Icon = form.icon;
            const title = language === 'fr' ? form.title.fr : form.title.en;
            const description = language === 'fr' ? form.description.fr : form.description.en;

            return (
              <Card 
                key={form.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-blue-300"
                onClick={() => handleFormSelect(form.id)}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg text-blue-900">
                        {title}
                      </CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    {description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {/* Features */}
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium text-gray-700">
                      {language === 'fr' ? 'Fonctionnalités:' : 'Features:'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {form.features.map((feature, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className="w-full flex items-center justify-center space-x-2"
                    onClick={() => handleFormSelect(form.id)}
                  >
                    <span>
                      {language === 'fr' ? 'Ouvrir le formulaire' : 'Open Form'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Statistics */}
        <div className="mt-12 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-900">{availableForms.length}</div>
              <div className="text-sm text-gray-600">
                {language === 'fr' ? 'Formulaires disponibles' : 'Available Forms'}
              </div>
            </div>
            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700">100%</div>
              <div className="text-sm text-gray-600">
                {language === 'fr' ? 'Compatibilité IA' : 'AI Compatible'}
              </div>
            </div>
            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-700">2</div>
              <div className="text-sm text-gray-600">
                {language === 'fr' ? 'Langues supportées' : 'Supported Languages'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visit Selection Modal */}
      {selectedForm && (
        <VisitSelectionModal
          open={showVisitModal}
          onClose={() => {
            setShowVisitModal(false);
            setSelectedForm(null);
          }}
          onNewVisit={handleNewVisit}
          onSelectDraft={handleSelectDraft}
          formTitle={availableForms.find(f => f.id === selectedForm)?.title[language] || ''}
          language={language}
        />
      )}
    </div>
  );
}