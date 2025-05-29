import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CopySection11Props {
  formData: any;
  language: 'fr' | 'en';
}

export function CopySection11({ formData, language }: CopySection11Props) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const formatConclusionText = () => {
    const sections = [];

    if (formData.conclusionResume) {
      sections.push(`Résumé :\n${formData.conclusionResume}`);
    }

    if (formData.conclusionDiagnostic) {
      sections.push(`Diagnostic :\n${formData.conclusionDiagnostic}`);
    }

    if (formData.conclusionDateConsolidation) {
      sections.push(`Date de consolidation :\n${formData.conclusionDateConsolidation}`);
    }

    if (formData.conclusionSoinsTraitements) {
      sections.push(`Nature, nécessité, suffisance, durée des soins ou traitements administrés ou prescrits :\n${formData.conclusionSoinsTraitements}`);
    }

    if (formData.conclusionAtteintePermanente) {
      sections.push(`Existence de l'atteinte permanente à l'intégrité physique ou psychique :\n${formData.conclusionAtteintePermanente}`);
    }

    if (formData.conclusionLimitationsFonctionnelles) {
      sections.push(`Existence de limitations fonctionnelles résultant de la lésion professionnelle :\n${formData.conclusionLimitationsFonctionnelles}`);
    }

    if (formData.conclusionEvaluationLimitations) {
      sections.push(`Évaluation des limitations fonctionnelles :\n${formData.conclusionEvaluationLimitations}`);
    }

    return sections.join('\n\n');
  };

  const formatConclusionTextEnglish = () => {
    const sections = [];

    if (formData.conclusionResume) {
      sections.push(`Summary:\n${formData.conclusionResume}`);
    }

    if (formData.conclusionDiagnostic) {
      sections.push(`Diagnosis:\n${formData.conclusionDiagnostic}`);
    }

    if (formData.conclusionDateConsolidation) {
      sections.push(`Consolidation Date:\n${formData.conclusionDateConsolidation}`);
    }

    if (formData.conclusionSoinsTraitements) {
      sections.push(`Nature, necessity, sufficiency, duration of care or treatments administered or prescribed:\n${formData.conclusionSoinsTraitements}`);
    }

    if (formData.conclusionAtteintePermanente) {
      sections.push(`Existence of permanent impairment to physical or psychological integrity:\n${formData.conclusionAtteintePermanente}`);
    }

    if (formData.conclusionLimitationsFonctionnelles) {
      sections.push(`Existence of functional limitations resulting from the occupational injury:\n${formData.conclusionLimitationsFonctionnelles}`);
    }

    if (formData.conclusionEvaluationLimitations) {
      sections.push(`Evaluation of functional limitations:\n${formData.conclusionEvaluationLimitations}`);
    }

    return sections.join('\n\n');
  };

  const handleCopyAll = async () => {
    const text = language === 'fr' ? formatConclusionText() : formatConclusionTextEnglish();
    
    if (!text.trim()) {
      toast({
        title: language === 'fr' ? "Aucun contenu" : "No content",
        description: language === 'fr' 
          ? "Aucune section de conclusion n'a été remplie." 
          : "No conclusion sections have been filled out.",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      toast({
        title: language === 'fr' ? "Copié !" : "Copied!",
        description: language === 'fr' 
          ? "Toutes les sections de conclusion ont été copiées dans le presse-papiers." 
          : "All conclusion sections have been copied to clipboard.",
      });

      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: language === 'fr' ? "Erreur" : "Error",
        description: language === 'fr' 
          ? "Impossible de copier dans le presse-papiers." 
          : "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const hasContent = () => {
    return (
      formData.conclusionResume ||
      formData.conclusionDiagnostic ||
      formData.conclusionDateConsolidation ||
      formData.conclusionSoinsTraitements ||
      formData.conclusionAtteintePermanente ||
      formData.conclusionLimitationsFonctionnelles ||
      formData.conclusionEvaluationLimitations
    );
  };

  if (!hasContent()) {
    return null;
  }

  return (
    <Button
      onClick={handleCopyAll}
      variant="outline"
      size="sm"
      className="w-full"
    >
      {copied ? (
        <>
          <Check className="mr-2 h-4 w-4 text-green-600" />
          {language === 'fr' ? "Copié !" : "Copied!"}
        </>
      ) : (
        <>
          <Copy className="mr-2 h-4 w-4" />
          {language === 'fr' ? "Copier toute la conclusion" : "Copy entire conclusion"}
        </>
      )}
    </Button>
  );
}