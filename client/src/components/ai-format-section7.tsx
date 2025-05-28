import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Copy, Undo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


interface AIFormatSection7Props {
  value: string;
  onValueChange: (value: string) => void;
  language: 'fr' | 'en';
}

export function AIFormatSection7({ value, onValueChange, language }: AIFormatSection7Props) {
  const [isFormatting, setIsFormatting] = useState(false);
  const [originalText, setOriginalText] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { toast } = useToast();

  const translations = {
    fr: {
      format: "Formater avec IA",
      formatting: "Formatage en cours...",
      undo: "Annuler",
      copy: "Copier",
      suggestions: "Suggestions d'amélioration:",
      formatted: "Texte formaté avec succès!",
      error: "Erreur lors du formatage",
      enhanced: "Dictée améliorée avec succès!",
      placeholder: "Entrez le texte de la section 7 ici..."
    },
    en: {
      format: "Format with AI",
      formatting: "Formatting...",
      undo: "Undo",
      copy: "Copy",
      suggestions: "Improvement suggestions:",
      formatted: "Text formatted successfully!",
      error: "Error formatting text",
      enhanced: "Dictation enhanced successfully!",
      placeholder: "Enter section 7 text here..."
    }
  };

  const t = translations[language];

  const handleFormat = async () => {
    if (!value.trim()) return;

    setIsFormatting(true);
    setOriginalText(value);

    try {
      const response = await fetch('/api/format-section7', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: value,
          language
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to format text');
      }

      const data = await response.json();
      
      if (data.error === 'API_KEY_MISSING') {
        toast({
          title: t.error,
          description: language === 'fr'
            ? "Clé API OpenAI non configurée. Contactez l'administrateur."
            : "OpenAI API key not configured. Contact administrator.",
          variant: "destructive",
        });
        return;
      }
      
      onValueChange(data.formatted);
      
      toast({
        title: t.formatted,
        description: language === 'fr' 
          ? "Le texte a été formaté selon les standards médicaux."
          : "Text has been formatted according to medical standards.",
      });
    } catch (error) {
      console.error('Formatting error:', error);
      toast({
        title: t.error,
        description: language === 'fr'
          ? "Erreur de formatage. La clé API OpenAI pourrait être invalide."
          : "Formatting error. OpenAI API key might be invalid.",
        variant: "destructive",
      });
    } finally {
      setIsFormatting(false);
    }
  };

  const handleEnhanceDictation = async (transcript: string) => {
    if (!transcript.trim()) return transcript;

    try {
      const response = await fetch('/api/enhance-section7-dictation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          language
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to enhance dictation');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      
      toast({
        title: t.enhanced,
        description: language === 'fr'
          ? "La dictée a été améliorée et formatée."
          : "Dictation has been enhanced and formatted.",
      });

      return data.formatted;
    } catch (error) {
      console.error('Enhancement error:', error);
      return transcript;
    }
  };

  const handleUndo = () => {
    if (originalText) {
      onValueChange(originalText);
      setOriginalText("");
      setSuggestions([]);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: language === 'fr' ? "Copié!" : "Copied!",
        description: language === 'fr'
          ? "Texte copié dans le presse-papiers."
          : "Text copied to clipboard.",
      });
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end">
        {originalText && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            className="flex items-center gap-2"
          >
            <Undo className="w-4 h-4" />
            {t.undo}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          disabled={!value.trim()}
          className="flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          {t.copy}
        </Button>
        <Button
          onClick={handleFormat}
          disabled={!value.trim() || isFormatting}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isFormatting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isFormatting ? t.formatting : t.format}
        </Button>
      </div>

      <Textarea
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={t.placeholder}
        className="min-h-[300px] w-full"
        data-field-name="historiqueEvolution"
      />

      {suggestions.length > 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-700">
              {t.suggestions}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-blue-500 font-medium">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}