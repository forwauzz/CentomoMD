
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface SaveFormDialogProps {
  open: boolean;
  onClose: () => void;
  formData: any;
  language: 'fr' | 'en';
  defaultTitle?: string;
  formType?: 'draft' | 'copy';
}

const translations = {
  fr: {
    titleDraft: "Sauvegarder en brouillon",
    titleCopy: "Sauvegarder une copie",
    descriptionDraft: "Sauvegardez temporairement ce formulaire pour y accéder plus tard.",
    descriptionCopy: "Sauvegardez une copie permanente de ce formulaire complété.",
    titleLabel: "Titre du formulaire",
    titlePlaceholder: "Ex: Évaluation - Patient Smith",
    retentionLabel: "Durée de conservation (jours)",
    retentionDescription: "Le formulaire sera automatiquement supprimé après cette période (maximum 30 jours)",
    retentionDescriptionCopy: "Cette copie sera conservée indéfiniment",
    cancel: "Annuler",
    save: "Sauvegarder",
    saving: "Sauvegarde...",
    successDraft: "Brouillon sauvegardé avec succès",
    successCopy: "Copie sauvegardée avec succès",
    error: "Erreur lors de la sauvegarde"
  },
  en: {
    titleDraft: "Save as Draft",
    titleCopy: "Save Copy",
    descriptionDraft: "Temporarily save this form to access it later.",
    descriptionCopy: "Save a permanent copy of this completed form.",
    titleLabel: "Form Title",
    titlePlaceholder: "Ex: Evaluation - Patient Smith",
    retentionLabel: "Retention Period (days)",
    retentionDescription: "The form will be automatically deleted after this period (maximum 30 days)",
    retentionDescriptionCopy: "This copy will be kept indefinitely",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving...",
    successDraft: "Draft saved successfully",
    successCopy: "Copy saved successfully",
    error: "Error saving form"
  }
};

export function SaveFormDialog({ open, onClose, formData, language, defaultTitle, formType = 'draft' }: SaveFormDialogProps) {
  const [title, setTitle] = useState("");
  const [retentionDays, setRetentionDays] = useState([7]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = translations[language];

  // Set default title when dialog opens
  useEffect(() => {
    if (open) {
      if (defaultTitle) {
        setTitle(defaultTitle);
      } else {
        const baseTitle = formType === 'draft' ? (language === 'fr' ? "Brouillon" : "Draft") : (language === 'fr' ? "Copie" : "Copy");
        const dateSuffix = new Date().toLocaleDateString();
        setTitle(`${baseTitle} - ${dateSuffix}`);
      }
    }
  }, [open, defaultTitle, formType, language]);

  const saveMutation = useMutation({
    mutationFn: async (data: { title: string; formData: any; retentionDays: number; formType: string }) => {
      const response = await fetch("/api/saved-forms", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to save form");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to update counts
      queryClient.invalidateQueries({ queryKey: ["/api/saved-forms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-forms", "draft"] });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-forms", "copy"] });
      
      const successMessage = formType === 'draft' ? t.successDraft : t.successCopy;
      toast({
        title: successMessage,
        description: formType === 'draft' ? `${t.retentionLabel}: ${retentionDays[0]} ${retentionDays[0] === 1 ? 'jour' : 'jours'}` : t.retentionDescriptionCopy,
      });
      
      setTitle("");
      setRetentionDays([7]);
      onClose();
    },
    onError: (error) => {
      console.error("Save form error:", error);
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: t.error,
        description: "Le titre est requis",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      title: title.trim(),
      formData,
      retentionDays: formType === 'copy' ? 365 : retentionDays[0], // Copies kept for 1 year by default
      formType: formType
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{formType === 'draft' ? t.titleDraft : t.titleCopy}</DialogTitle>
          <DialogDescription>
            {formType === 'draft' ? t.descriptionDraft : t.descriptionCopy}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">{t.titleLabel}</Label>
            <Input
              id="title"
              placeholder={t.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>
          
          {formType === 'draft' && (
            <div className="grid gap-2">
              <Label htmlFor="retention">{t.retentionLabel}</Label>
              <div className="px-2">
                <Slider
                  id="retention"
                  min={1}
                  max={30}
                  step={1}
                  value={retentionDays}
                  onValueChange={setRetentionDays}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 jour</span>
                  <span className="font-medium">{retentionDays[0]} {retentionDays[0] === 1 ? 'jour' : 'jours'}</span>
                  <span>30 jours</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">{t.retentionDescription}</p>
            </div>
          )}

          {formType === 'copy' && (
            <div className="grid gap-2">
              <p className="text-xs text-gray-500">{t.retentionDescriptionCopy}</p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saveMutation.isPending}>
            {t.cancel}
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending || !title.trim()}>
            {saveMutation.isPending ? t.saving : t.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
