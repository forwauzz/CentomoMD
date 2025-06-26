import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TestTube } from 'lucide-react';

export default function SimpleAITest() {
  const [inputText, setInputText] = useState('');
  const [processingType, setProcessingType] = useState('format');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAI = async () => {
    if (!inputText.trim() && processingType !== 'generate') return;
    
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/ai/process-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldId: processingType === 'generate' ? 'conclusion_generate' : 'test_field',
          processingType: processingType,
          formType: 'cnesst-medical',
          formData: {
            test_field: inputText,
            diagnostic_principal: 'Lombalgie chronique',
            histoire_evolution: 'Patient présente des douleurs lombaires depuis 6 mois',
            examen_attitude_marche: 'Attitude antalgique',
            limitations_fonctionnelles: 'Limitation flexion lombaire'
          },
          language: 'fr',
          contextFields: ['diagnostic_principal'],
          targetFields: processingType === 'distribute' ? [
            'examen_attitude_marche',
            'examen_inspection_palpation', 
            'examen_amplitudes_articulaires',
            'examen_force_musculaire'
          ] : undefined
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const loadSample = (sample: string) => {
    setInputText(sample);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <TestTube className="w-6 h-6" />
          Test AI Processing System
        </h1>
        <p className="text-muted-foreground">
          Test the new modular AI system with different processing types
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Configure and test AI processing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Processing Type</label>
              <Select value={processingType} onValueChange={setProcessingType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="format">Format - Clean medical text</SelectItem>
                  <SelectItem value="enhance">Enhance - Improve dictated text</SelectItem>
                  <SelectItem value="distribute">Distribute - Split into sections</SelectItem>
                  <SelectItem value="generate">Generate - Create conclusion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Input Text</label>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={processingType === 'generate' ? 'For generation, this can be empty - AI uses context' : 'Enter medical text...'}
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sample Data:</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadSample('Patient de 45 ans avec douleur lombaire chronique depuis 6 mois suite à un accident de travail. Douleur irradiante vers la jambe droite avec engourdissement.')}
                >
                  Medical History
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadSample('le patient euh il a mal au dos depuis six mois euh suite à son accident au travail')}
                >
                  Dictated Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadSample('Attitude antalgique au repos. Marche claudicante. Inspection révèle asymétrie musculaire. Palpation tension L4-L5. Amplitudes limitées flexion 60°. Force diminuée membre droit 4/5. Réflexes asymétriques. Lasègue positif 45°.')}
                >
                  Physical Exam
                </Button>
              </div>
            </div>

            <Button 
              onClick={testAI}
              disabled={loading || (!inputText.trim() && processingType !== 'generate')}
              className="w-full"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Test AI Processing
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>AI processing output</CardDescription>
          </CardHeader>
          <CardContent>
            {!result && (
              <div className="text-center py-8 text-muted-foreground">
                Select processing type and click "Test AI Processing" to see results
              </div>
            )}

            {result && result.success && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 p-3 rounded">
                  <div className="text-green-800 font-medium mb-2">✓ Success</div>
                  {result.processedData && Object.entries(result.processedData).map(([key, value]) => (
                    <div key={key} className="mb-3">
                      <div className="text-sm font-medium text-green-700 mb-1">{key}:</div>
                      <div className="bg-white p-3 rounded border text-sm">
                        {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                      </div>
                    </div>
                  ))}
                  {result.distributions && (
                    <div>
                      <div className="text-sm font-medium text-green-700 mb-1">Distributions:</div>
                      {Object.entries(result.distributions).map(([key, value]) => (
                        <div key={key} className="mb-2">
                          <div className="text-xs text-green-600">{key}:</div>
                          <div className="bg-white p-2 rounded border text-sm">{String(value)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {result && !result.success && (
              <div className="bg-red-50 border border-red-200 p-3 rounded">
                <div className="text-red-800 font-medium mb-2">✗ Error</div>
                <div className="text-red-700 text-sm">{result.error}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="space-y-2">
              <div className="font-medium">Format</div>
              <div className="text-muted-foreground">Cleans and formats medical text according to professional standards</div>
            </div>
            <div className="space-y-2">
              <div className="font-medium">Enhance</div>
              <div className="text-muted-foreground">Improves dictated text by correcting terminology and grammar</div>
            </div>
            <div className="space-y-2">
              <div className="font-medium">Distribute</div>
              <div className="text-muted-foreground">Splits examination text into appropriate subsections</div>
            </div>
            <div className="space-y-2">
              <div className="font-medium">Generate</div>
              <div className="text-muted-foreground">Creates conclusions based on examination data and context</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}