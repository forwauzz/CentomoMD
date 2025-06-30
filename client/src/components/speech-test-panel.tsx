import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface SpeechTestPanelProps {
  language: 'fr' | 'en';
}

export function SpeechTestPanel({ language }: SpeechTestPanelProps) {
  const [testResults, setTestResults] = useState<string[]>([]);
  
  const {
    isListening,
    transcript,
    interimTranscript, 
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition({
    language: language === 'fr' ? 'fr-CA' : 'en-US',
    continuous: true,
    interimResults: true
  });

  const translations = {
    fr: {
      title: 'Test de Reconnaissance Vocale Française',
      status: 'Statut',
      supported: 'Supporté',
      notSupported: 'Non Supporté',
      listening: 'En écoute',
      stopped: 'Arrêté',
      startTest: 'Commencer le test',
      stopTest: 'Arrêter le test',
      clearTest: 'Effacer',
      liveTranscript: 'Transcription en direct',
      finalTranscript: 'Transcription finale',
      testPhrases: 'Phrases de test suggérées:',
      medicalPhrases: [
        'Le patient présente une douleur lombaire chronique',
        'Antécédents médicaux sans particularité notable',
        'Examen clinique révèle une limitation fonctionnelle',
        'Traitement conservateur avec physiothérapie recommandé',
        'Consolidation attendue dans six semaines'
      ],
      instructions: 'Essayez de dire une des phrases médicales ci-dessus pour tester la reconnaissance française.'
    },
    en: {
      title: 'French Speech Recognition Test',
      status: 'Status',
      supported: 'Supported',
      notSupported: 'Not Supported',
      listening: 'Listening',
      stopped: 'Stopped',
      startTest: 'Start Test',
      stopTest: 'Stop Test',
      clearTest: 'Clear',
      liveTranscript: 'Live Transcript',
      finalTranscript: 'Final Transcript',
      testPhrases: 'Suggested test phrases:',
      medicalPhrases: [
        'The patient presents chronic lower back pain',
        'Medical history unremarkable',
        'Clinical examination reveals functional limitation',
        'Conservative treatment with physiotherapy recommended',
        'Consolidation expected in six weeks'
      ],
      instructions: 'Try saying one of the medical phrases above to test recognition.'
    }
  };

  const t = translations[language];

  useEffect(() => {
    if (transcript) {
      setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${transcript}`]);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  const handleClearResults = () => {
    setTestResults([]);
    resetTranscript();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSupported ? <Volume2 className="w-5 h-5 text-green-600" /> : <VolumeX className="w-5 h-5 text-red-600" />}
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Panel */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">{t.status}:</label>
            <div className="flex gap-2 mt-1">
              <Badge variant={isSupported ? "default" : "destructive"}>
                {isSupported ? t.supported : t.notSupported}
              </Badge>
              <Badge variant={isListening ? "default" : "secondary"}>
                {isListening ? t.listening : t.stopped}
              </Badge>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Langue:</label>
            <div className="mt-1">
              <Badge variant="outline">
                {language === 'fr' ? 'Français (fr-CA)' : 'English (en-US)'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => {
              if (isListening) {
                stopListening();
              } else {
                startListening();
              }
            }}
            disabled={!isSupported}
            className={isListening ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
          >
            {isListening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
            {isListening ? t.stopTest : t.startTest}
          </Button>
          <Button variant="outline" onClick={handleClearResults}>
            {t.clearTest}
          </Button>
        </div>

        {/* Live Transcript Display */}
        {isListening && (
          <div className="space-y-2">
            <div>
              <label className="text-sm font-medium text-blue-600">{t.liveTranscript}:</label>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md min-h-[50px]">
                <span className="text-blue-800 italic">
                  {interimTranscript || (language === 'fr' ? 'En attente de parole...' : 'Waiting for speech...')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Final Transcript Results */}
        <div>
          <label className="text-sm font-medium">{t.finalTranscript}:</label>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md min-h-[100px] max-h-[200px] overflow-y-auto">
            {testResults.length > 0 ? (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm">{result}</div>
                ))}
              </div>
            ) : (
              <span className="text-gray-500 italic">
                {language === 'fr' ? 'Aucune transcription encore...' : 'No transcripts yet...'}
              </span>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        )}

        {/* Test Phrases */}
        <div>
          <label className="text-sm font-medium">{t.testPhrases}</label>
          <div className="mt-2 space-y-1">
            {t.medicalPhrases.map((phrase, index) => (
              <div key={index} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                "{phrase}"
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">{t.instructions}</p>
        </div>
      </CardContent>
    </Card>
  );
}