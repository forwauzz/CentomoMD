import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormInput, FileText, Stethoscope, ArrowRight, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@shared/translations';

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
  const { t } = useTranslation(language);

  // Available form types with metadata
  const availableForms = [
    {
      id: 'cnesst-medical',
      title: t('formSelector.miTemplate'),
      description: t('formSelector.miTemplateDescription'),
      icon: Stethoscope,
      category: 'medical',
      features: ['AI Enhancement', 'Voice Dictation', 'PDF Export']
    }
  ];

  const handleFormSelect = (formId: string) => {
    // Route CNESST form to the dedicated medical form page
    if (formId === 'cnesst') {
      setLocation('/medical-form');
    } else {
      setLocation(`/forms/${formId}`);
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
        title: t('auth.logoutSuccess'),
        description: t('auth.logoutSuccess'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('auth.logoutError'),
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
                {t('formSelector.title')}
              </h1>
              <p className="text-gray-600">
                {t('formSelector.description')}
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
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
          {availableForms.map((form) => {
            const Icon = form.icon;
            const title = form.title;
            const description = form.description;

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
    </div>
  );
}