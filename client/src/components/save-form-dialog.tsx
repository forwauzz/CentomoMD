import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SaveFormDialogProps {
  open: boolean;
  onClose: () => void;
  formData: any;
  language: 'fr' | 'en';
  defaultTitle?: string;
}

const translations = {
  fr: {
    title: "Sauvegarder le formulaire",
    description: "Sauvegardez temporairement ce formulaire pour y accéder plus tard.",
    titleLabel: "Titre du formulaire",
    titlePlaceholder: "Ex: Évaluation - Patient Smith",
    retentionLabel: "Durée de conservation (jours)",
    retentionDescription: "Le formulaire sera automatiquement supprimé après cette période (maximum 30 jours)",
    cancel: "Annuler",
    save: "Sauvegarder",
    saving: "Sauvegarde...",
    success: "Formulaire sauvegardé avec succès",
    error: "Erreur lors de la sauvegarde"
  },
  en: {
    title: "Save Form",
    description: "Temporarily save this form to access it later.",
    titleLabel: "Form Title",
    titlePlaceholder: "Ex: Evaluation - Patient Smith",
    retentionLabel: "Retention Period (days)",
    retentionDescription: "The form will be automatically deleted after this period (maximum 30 days)",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving...",
    success: "Form saved successfully",
    error: "Error saving form"
  }
};

export function SaveFormDialog({ open, onClose, formData, language, defaultTitle }: SaveFormDialogProps) {
  const [title, setTitle] = useState("");
  const [retentionDays, setRetentionDays] = useState([7]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = translations[language];

  // Set default title when dialog opens
  useEffect(() => {
    if (open && defaultTitle) {
      setTitle(defaultTitle);
    }
  }, [open, defaultTitle]);

  const saveMutation = useMutation({
    mutationFn: async (data: { title: string; formData: any; retentionDays: number; formType?: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/saved-forms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-forms", "copy"] });
      toast({
        title: t.success,
        description: `${t.retentionLabel}: ${retentionDays[0]} ${retentionDays[0] === 1 ? 'jour' : 'jours'}`,
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
      retentionDays: retentionDays[0],
      formType: "copy"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
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