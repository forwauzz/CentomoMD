import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AIFormatSection8Props {
  value: string;
  onValueChange: (value: string) => void;
  language: 'fr' | 'en';
}

export function AIFormatSection8({ value, onValueChange, language }: AIFormatSection8Props) {
  const [isFormatting, setIsFormatting] = useState(false);
  const [formattedText, setFormattedText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const { toast } = useToast();

  const handleFormat = async () => {
    if (!value.trim()) {
      toast({
        title: language === 'fr' ? "Texte requis" : "Text required",
        description: language === 'fr' 
          ? "Veuillez saisir du texte à formater" 
          : "Please enter text to format",
        variant: "destructive",
      });
      return;
    }

    setIsFormatting(true);
    try {
      const response = await apiRequest('/api/format-section8', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value, language }),
      });

      const data = await response.json();
      
      if (data.formatted) {
        setFormattedText(data.formatted);
        setShowResult(true);
        toast({
          title: language === 'fr' ? "Texte formaté avec succès!" : "Text formatted successfully!",
          description: language === 'fr' 
            ? "Le texte a été structuré selon les standards médicaux." 
            : "Text has been structured according to medical standards.",
        });
      } else {
        throw new Error('No formatted text received');
      }
    } catch (error) {
      console.error('Error formatting text:', error);
      toast({
        title: language === 'fr' ? "Erreur de formatage" : "Formatting error",
        description: language === 'fr' 
          ? "Impossible de formater le texte. Veuillez réessayer." 
          : "Unable to format text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFormatting(false);
    }
  };

  const handleAccept = () => {
    onValueChange(formattedText);
    setShowResult(false);
    toast({
      title: language === 'fr' ? "Texte appliqué" : "Text applied",
      description: language === 'fr' 
        ? "Le texte formaté a été appliqué au formulaire." 
        : "Formatted text has been applied to the form.",
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedText);
      toast({
        title: language === 'fr' ? "Copié!" : "Copied!",
        description: language === 'fr' 
          ? "Texte copié dans le presse-papiers" 
          : "Text copied to clipboard",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={handleFormat}
          disabled={isFormatting}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isFormatting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          {language === 'fr' ? 'Formater avec IA' : 'Format with AI'}
        </Button>
        <span className="text-sm text-gray-600">
          {language === 'fr' 
            ? 'Structure le texte selon les standards médicaux Section 8' 
            : 'Structure text according to Section 8 medical standards'}
        </span>
      </div>

      {showResult && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              {language === 'fr' ? 'Texte Formaté par IA' : 'AI Formatted Text'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={formattedText}
              onChange={(e) => setFormattedText(e.target.value)}
              className="min-h-[300px] font-mono text-sm bg-white"
              placeholder={language === 'fr' 
                ? "Le texte formaté apparaîtra ici..." 
                : "Formatted text will appear here..."}
            />
            <div className="flex gap-2">
              <Button onClick={handleAccept} size="sm" className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                {language === 'fr' ? 'Appliquer' : 'Apply'}
              </Button>
              <Button onClick={handleCopy} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                {language === 'fr' ? 'Copier' : 'Copy'}
              </Button>
              <Button 
                onClick={() => setShowResult(false)} 
                variant="outline" 
                size="sm"
              >
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}