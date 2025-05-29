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
      sections.push(`RÉSUMÉ :\n${formData.conclusionResume}`);
    }

    if (formData.conclusionDiagnostic) {
      sections.push(`DIAGNOSTIC :\n${formData.conclusionDiagnostic}`);
    }

    if (formData.conclusionDateConsolidation) {
      sections.push(`DATE DE CONSOLIDATION :\n${formData.conclusionDateConsolidation}`);
    }

    if (formData.conclusionSoinsTraitements) {
      sections.push(`NATURE, NÉCESSITÉ, SUFFISANCE, DURÉE DES SOINS OU TRAITEMENTS ADMINISTRÉS OU PRESCRITS :\n${formData.conclusionSoinsTraitements}`);
    }

    if (formData.conclusionAtteintePermanente) {
      sections.push(`EXISTENCE DE L'ATTEINTE PERMANENTE À L'INTÉGRITÉ PHYSIQUE OU PSYCHIQUE :\n${formData.conclusionAtteintePermanente}`);
    }

    if (formData.conclusionLimitationsFonctionnelles) {
      sections.push(`EXISTENCE DE LIMITATIONS FONCTIONNELLES RÉSULTANT DE LA LÉSION PROFESSIONNELLE :\n${formData.conclusionLimitationsFonctionnelles}`);
    }

    if (formData.conclusionEvaluationLimitations) {
      sections.push(`ÉVALUATION DES LIMITATIONS FONCTIONNELLES :\n${formData.conclusionEvaluationLimitations}`);
    }

    return sections.join('\n\n');
  };

  const formatConclusionTextEnglish = () => {
    const sections = [];

    if (formData.conclusionResume) {
      sections.push(`SUMMARY:\n${formData.conclusionResume}`);
    }

    if (formData.conclusionDiagnostic) {
      sections.push(`DIAGNOSIS:\n${formData.conclusionDiagnostic}`);
    }

    if (formData.conclusionDateConsolidation) {
      sections.push(`CONSOLIDATION DATE:\n${formData.conclusionDateConsolidation}`);
    }

    if (formData.conclusionSoinsTraitements) {
      sections.push(`NATURE, NECESSITY, SUFFICIENCY, DURATION OF CARE OR TREATMENTS ADMINISTERED OR PRESCRIBED:\n${formData.conclusionSoinsTraitements}`);
    }

    if (formData.conclusionAtteintePermanente) {
      sections.push(`EXISTENCE OF PERMANENT IMPAIRMENT TO PHYSICAL OR PSYCHOLOGICAL INTEGRITY:\n${formData.conclusionAtteintePermanente}`);
    }

    if (formData.conclusionLimitationsFonctionnelles) {
      sections.push(`EXISTENCE OF FUNCTIONAL LIMITATIONS RESULTING FROM THE OCCUPATIONAL INJURY:\n${formData.conclusionLimitationsFonctionnelles}`);
    }

    if (formData.conclusionEvaluationLimitations) {
      sections.push(`EVALUATION OF FUNCTIONAL LIMITATIONS:\n${formData.conclusionEvaluationLimitations}`);
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