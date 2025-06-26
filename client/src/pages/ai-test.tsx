import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface ProcessingResult {
  success: boolean;
  processedData?: Record<string, any>;
  error?: string;
}

export default function AITestPage() {
  const [inputText, setInputText] = useState('');
  const [processingType, setProcessingType] = useState<'format' | 'enhance' | 'distribute' | 'generate'>('format');
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [result, setResult] = useState<ProcessingResult | null>(null);

  // Test the new modular AI processing endpoint
  const processFieldMutation = useMutation({
    mutationFn: async (data: {
      fieldId: string;
      processingType: string;
      formType: string;
      formData: Record<string, any>;
      language: string;
      contextFields?: string[];
      targetFields?: string[];
      prompt?: string;
    }) => {
      return await apiRequest('/api/ai/process-field', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: (data: any) => {
      setResult(data);
    },
    onError: (error: any) => {
      setResult({
        success: false,
        error: error.message || 'Processing failed'
      });
    }
  });

  // Test the enhanced Section 8 distribution
  const distributeSection8Mutation = useMutation({
    mutationFn: async (data: {
      text: string;
      language: string;
      contextData?: Record<string, any>;
    }) => {
      return await apiRequest('/api/ai/distribute-section8', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: (data: any) => {
      setResult(data);
    },
    onError: (error: any) => {
      setResult({
        success: false,
        error: error.message || 'Distribution failed'
      });
    }
  });

  const handleProcessField = () => {
    if (!inputText.trim()) return;

    const fieldConfigs = {
      format: {
        fieldId: 'histoire_evolution',
        contextFields: ['diagnostic_principal'],
        prompt: 'Format this medical history text according to Quebec medical documentation standards.'
      },
      enhance: {
        fieldId: 'histoire_evolution_dictation',
        contextFields: ['diagnostic_principal'],
        prompt: 'Enhance this dictated medical text by correcting terminology and improving readability.'
      },
      distribute: {
        fieldId: 'examen_physique_input',
        targetFields: [
          'examen_attitude_marche',
          'examen_inspection_palpation',
          'examen_amplitudes_articulaires',
          'examen_force_musculaire',
          'examen_reflexes',
          'examen_tests_speciaux',
          'examen_membre_sain'
        ],
        contextFields: ['diagnostic_principal', 'histoire_evolution'],
        prompt: 'Distribute this physical examination description into the appropriate subsections.'
      },
      generate: {
        fieldId: 'conclusion_generate',
        contextFields: [
          'diagnostic_principal',
          'histoire_evolution',
          'examen_attitude_marche',
          'limitations_fonctionnelles'
        ],
        prompt: 'Generate a comprehensive medical conclusion for this CNESST assessment.'
      }
    };

    const config = fieldConfigs[processingType];
    
    processFieldMutation.mutate({
      fieldId: config.fieldId,
      processingType,
      formType: 'cnesst-medical',
      formData: {
        [config.fieldId]: inputText,
        diagnostic_principal: 'Lombalgie chronique',
        histoire_evolution: 'Patient présente des douleurs lombaires depuis 6 mois'
      },
      language,
      contextFields: config.contextFields,
      targetFields: (config as any).targetFields,
      prompt: config.prompt
    });
  };

  const handleDistributeSection8 = () => {
    if (!inputText.trim()) return;

    distributeSection8Mutation.mutate({
      text: inputText,
      language,
      contextData: {
        diagnostic_principal: 'Lombalgie chronique',
        histoire_evolution: 'Patient présente des douleurs lombaires depuis 6 mois'
      }
    });
  };

  const isLoading = processFieldMutation.isPending || distributeSection8Mutation.isPending;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AI Processing System Test</h1>
        <p className="text-muted-foreground">
          Test the new modular AI processing engine with different operations and configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Input Configuration</CardTitle>
            <CardDescription>
              Configure your AI processing test parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Processing Type</label>
              <Select value={processingType} onValueChange={(value: any) => setProcessingType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="format">Format - Clean up medical text</SelectItem>
                  <SelectItem value="enhance">Enhance - Improve dictated text</SelectItem>
                  <SelectItem value="distribute">Distribute - Split into sections</SelectItem>
                  <SelectItem value="generate">Generate - Create conclusion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Language</label>
              <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Input Text</label>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  processingType === 'generate' 
                    ? 'For generation, this field can be empty - the AI will use context data'
                    : 'Enter medical text to process...'
                }
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleProcessField}
                disabled={isLoading || (!inputText.trim() && processingType !== 'generate')}
                className="flex-1"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Process Field
              </Button>
              
              {processingType === 'distribute' && (
                <Button 
                  onClick={handleDistributeSection8}
                  disabled={isLoading || !inputText.trim()}
                  variant="outline"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Test Section 8 API
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Processing Results
              {result && (
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <XCircle className="w-3 h-3 mr-1" />
                  )}
                  {result.success ? 'Success' : 'Error'}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              View the AI processing output and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!result && (
              <div className="text-muted-foreground text-center py-8">
                Configure parameters and click "Process Field" to see results
              </div>
            )}

            {result && result.success && result.processedData && (
              <div className="space-y-4">
                {Object.entries(result.processedData).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {key}
                      </Badge>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <pre className="whitespace-pre-wrap text-sm">
                        {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {result && result.success && (result as any).distributions && (
              <div className="space-y-4">
                <h4 className="font-medium">Distribution Results:</h4>
                {Object.entries((result as any).distributions).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Badge variant="outline" className="text-xs">
                      {key}
                    </Badge>
                    <div className="bg-muted p-3 rounded-md">
                      <pre className="whitespace-pre-wrap text-sm">
                        {String(value)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {result && !result.success && (
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-md">
                <h4 className="font-medium text-destructive mb-2">Error</h4>
                <p className="text-sm text-destructive/80">
                  {result.error}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sample Test Data */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Sample Test Data</CardTitle>
          <CardDescription>
            Click any sample to load it into the input field
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">French Medical Text</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputText("Patient de 45 ans avec douleur lombaire chronique depuis 6 mois suite à un accident de travail. Douleur irradiante vers la jambe droite avec engourdissement. Limitation des mouvements de flexion et extension.")}
                className="w-full text-left justify-start h-auto p-2"
              >
                <span className="text-xs text-muted-foreground truncate">
                  Patient de 45 ans avec douleur lombaire chronique...
                </span>
              </Button>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Physical Examination</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputText("Attitude antalgique au repos. Marche claudicante favorisant le côté gauche. À l'inspection, asymétrie de la musculature paravertébrale. Palpation révèle tension musculaire L4-L5. Amplitudes articulaires limitées en flexion (60°) et extension (10°). Force musculaire diminuée au membre inférieur droit (4/5). Réflexes achilléens asymétriques. Test de Lasègue positif à 45° à droite.")}
                className="w-full text-left justify-start h-auto p-2"
              >
                <span className="text-xs text-muted-foreground truncate">
                  Attitude antalgique au repos. Marche claudicante...
                </span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}