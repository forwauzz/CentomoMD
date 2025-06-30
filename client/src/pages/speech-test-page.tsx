import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SpeechTestPanel } from '@/components/speech-test-panel';
import { ArrowLeft, TestTube } from 'lucide-react';
import { useLocation } from 'wouter';

export default function SpeechTestPage() {
  const [, setLocation] = useLocation();
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'en'>('fr');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TestTube className="w-6 h-6 text-blue-600" />
                <CardTitle>Test de Reconnaissance Vocale - CentomoMD</CardTitle>
              </div>
              <Button variant="outline" onClick={() => setLocation('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Langue de test:</label>
              <Select value={selectedLanguage} onValueChange={(value: 'fr' | 'en') => setSelectedLanguage(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français (fr-CA)</SelectItem>
                  <SelectItem value="en">English (en-US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Speech Test Panel */}
        <SpeechTestPanel language={selectedLanguage} />

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Instructions d'utilisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-green-700 mb-2">✓ Bonnes pratiques:</h4>
                <ul className="text-sm space-y-1 text-green-600">
                  <li>• Parlez clairement et à rythme normal</li>
                  <li>• Utilisez un microphone de bonne qualité</li>
                  <li>• Évitez les bruits de fond</li>
                  <li>• Attendez la fin de la transcription avant de continuer</li>
                  <li>• Utilisez les phrases médicales suggérées pour tester</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-orange-700 mb-2">⚠ Problèmes courants:</h4>
                <ul className="text-sm space-y-1 text-orange-600">
                  <li>• Assurez-vous d'autoriser l'accès au microphone</li>
                  <li>• Vérifiez votre connexion internet</li>
                  <li>• Utilisez Chrome ou Edge pour de meilleurs résultats</li>
                  <li>• Redémarrez le test si la reconnaissance se bloque</li>
                  <li>• Parlez fort si "no-speech" apparaît</li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">💡 Test de terminologie médicale française:</h4>
              <p className="text-sm text-blue-700">
                Ce test utilise la reconnaissance vocale fr-CA (français canadien) optimisée pour la terminologie médicale. 
                Les phrases suggérées contiennent des termes médicaux couramment utilisés dans les évaluations CNESST 
                pour valider la précision de la reconnaissance vocale française.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}