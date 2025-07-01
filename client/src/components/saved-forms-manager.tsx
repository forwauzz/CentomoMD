import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Trash2, Calendar, Clock, Printer, FileDown } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { exportToPDF } from "@/lib/pdf-export";
import { exportToWord } from "@/lib/word-export-simple";
import { fr, enUS } from "date-fns/locale";

interface SavedFormsManagerProps {
  language: 'fr' | 'en';
  onLoadForm?: (formData: any) => void;
  formType?: 'draft' | 'copy' | 'all';
}

const translations = {
  fr: {
    title: "Formulaires sauvegardés",
    titleDrafts: "Brouillons",
    titleCopies: "Copies sauvegardées",
    description: "Gérez vos formulaires sauvegardés temporairement",
    descriptionDrafts: "Gérez vos brouillons de formulaires",
    descriptionCopies: "Gérez vos copies de formulaires sauvegardées",
    noForms: "Aucun formulaire sauvegardé",
    noFormsDrafts: "Aucun brouillon",
    noFormsCopies: "Aucune copie sauvegardée",
    noFormsDescription: "Vous n'avez pas encore de formulaires sauvegardés.",
    noFormsDescriptionDrafts: "Vous n'avez pas encore de brouillons.",
    noFormsDescriptionCopies: "Vous n'avez pas encore de copies sauvegardées.",
    load: "Charger",
    delete: "Supprimer",
    print: "Imprimer",
    exportPdf: "Exporter PDF",
    exportWord: "Exporter Word",
    createdAt: "Créé",
    expiresIn: "Expire dans",
    expired: "Expiré",
    deleteConfirm: "Êtes-vous sûr de vouloir supprimer ce formulaire ?",
    loading: "Chargement...",
    deleting: "Suppression...",
    loadSuccess: "Formulaire chargé avec succès",
    deleteSuccess: "Formulaire supprimé avec succès",
    printSuccess: "Impression en cours...",
    exportSuccess: "Export PDF en cours...",
    exportWordSuccess: "Export Word en cours...",
    error: "Une erreur est survenue"
  },
  en: {
    title: "Saved Forms",
    titleDrafts: "Drafts",
    titleCopies: "Saved Copies",
    description: "Manage your temporarily saved forms",
    descriptionDrafts: "Manage your form drafts",
    descriptionCopies: "Manage your saved form copies",
    noForms: "No saved forms",
    noFormsDrafts: "No drafts",
    noFormsCopies: "No saved copies",
    noFormsDescription: "You don't have any saved forms yet.",
    noFormsDescriptionDrafts: "You don't have any drafts yet.",
    noFormsDescriptionCopies: "You don't have any saved copies yet.",
    load: "Load",
    delete: "Delete",
    print: "Print",
    exportPdf: "Export PDF",
    exportWord: "Export Word",
    createdAt: "Created",
    expiresIn: "Expires in",
    expired: "Expired",
    deleteConfirm: "Are you sure you want to delete this form?",
    loading: "Loading...",
    deleting: "Deleting...",
    loadSuccess: "Form loaded successfully",
    deleteSuccess: "Form deleted successfully",
    printSuccess: "Printing...",
    exportSuccess: "Exporting PDF...",
    exportWordSuccess: "Exporting Word...",
    error: "An error occurred"
  }
};

export function SavedFormsManager({ language, onLoadForm, formType = 'all' }: SavedFormsManagerProps) {
  const [deleteFormId, setDeleteFormId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = translations[language];
  const locale = language === 'fr' ? fr : enUS;

  const { data: savedForms = [], isLoading } = useQuery({
    queryKey: formType === 'all' ? ["/api/saved-forms"] : ["/api/saved-forms", formType],
    queryFn: () => {
      const url = formType === 'all' 
        ? "/api/saved-forms" 
        : `/api/saved-forms?formType=${formType}`;
      return fetch(url, { credentials: "include" }).then(res => res.json());
    },
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/saved-forms/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to delete form");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-forms"] });
      toast({
        title: t.deleteSuccess,
      });
      setDeleteFormId(null);
    },
    onError: (error) => {
      console.error("Delete form error:", error);
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleLoadForm = (savedForm: any) => {
    if (onLoadForm) {
      onLoadForm(savedForm.formData);
      toast({
        title: t.loadSuccess,
        description: savedForm.title,
      });
    }
  };

  const handleDeleteForm = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handlePrintForm = (savedForm: any) => {
    try {
      exportToPDF(savedForm.formData);
      toast({
        title: t.printSuccess,
        description: savedForm.title,
      });
    } catch (error) {
      console.error("Print error:", error);
      toast({
        title: t.error,
        description: "Failed to print form",
        variant: "destructive",
      });
    }
  };

  const handleExportPdf = (savedForm: any) => {
    try {
      exportToPDF(savedForm.formData);
      toast({
        title: t.exportSuccess,
        description: savedForm.title,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: t.error,
        description: "Failed to export PDF",
        variant: "destructive",
      });
    }
  };

  const handleExportWord = (savedForm: any) => {
    try {
      const filename = `${savedForm.title.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
      exportToWord(savedForm.formData, filename);
      toast({
        title: t.exportWordSuccess,
        description: savedForm.title,
      });
    } catch (error) {
      console.error("Word export error:", error);
      toast({
        title: t.error,
        description: "Failed to export Word document",
        variant: "destructive",
      });
    }
  };

  const getExpirationStatus = (expiresAt: string) => {
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    
    if (expirationDate <= now) {
      return { status: 'expired', text: t.expired, variant: 'destructive' as const };
    }
    
    const timeRemaining = formatDistanceToNow(expirationDate, { locale });
    return { 
      status: 'active', 
      text: `${t.expiresIn} ${timeRemaining}`, 
      variant: 'secondary' as const 
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-sm text-gray-500">{t.loading}</div>
      </div>
    );
  }

  // Get dynamic title and description based on formType
  const getTitle = () => {
    if (formType === 'draft') return t.titleDrafts;
    if (formType === 'copy') return t.titleCopies;
    return t.title;
  };

  const getDescription = () => {
    if (formType === 'draft') return t.descriptionDrafts;
    if (formType === 'copy') return t.descriptionCopies;
    return t.description;
  };

  const getNoFormsTitle = () => {
    if (formType === 'draft') return t.noFormsDrafts;
    if (formType === 'copy') return t.noFormsCopies;
    return t.noForms;
  };

  const getNoFormsDescription = () => {
    if (formType === 'draft') return t.noFormsDescriptionDrafts;
    if (formType === 'copy') return t.noFormsDescriptionCopies;
    return t.noFormsDescription;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5" />
        <div>
          <h3 className="font-medium">{getTitle()}</h3>
          <p className="text-sm text-gray-500">{getDescription()}</p>
        </div>
      </div>

      {savedForms.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <CardTitle className="text-lg mb-2">{getNoFormsTitle()}</CardTitle>
            <CardDescription>{getNoFormsDescription()}</CardDescription>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {savedForms.map((savedForm: any) => {
              const expiration = getExpirationStatus(savedForm.expiresAt);
              return (
                <Card key={savedForm.id} className={expiration.status === 'expired' ? 'opacity-60' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{savedForm.title}</CardTitle>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {t.createdAt} {format(new Date(savedForm.createdAt), 'dd/MM/yyyy', { locale })}
                          </div>
                        </div>
                      </div>
                      <Badge variant={expiration.variant} className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {expiration.text}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => handleLoadForm(savedForm)}
                        disabled={expiration.status === 'expired'}
                        className="flex-1 min-w-[80px]"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        {t.load}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintForm(savedForm)}
                        disabled={expiration.status === 'expired'}
                        className="flex-1 min-w-[80px]"
                      >
                        <Printer className="w-4 h-4 mr-1" />
                        {t.print}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportPdf(savedForm)}
                        disabled={expiration.status === 'expired'}
                        className="flex-1 min-w-[80px]"
                      >
                        <FileDown className="w-4 h-4 mr-1" />
                        {t.exportPdf}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportWord(savedForm)}
                        disabled={expiration.status === 'expired'}
                        className="flex-1 min-w-[80px]"
                      >
                        <FileDown className="w-4 h-4 mr-1" />
                        {t.exportWord}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteFormId(savedForm.id)}
                        disabled={deleteMutation.isPending}
                        className="px-3"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteFormId !== null} onOpenChange={() => setDeleteFormId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteConfirm}</DialogTitle>
            <DialogDescription>
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteFormId(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteFormId && handleDeleteForm(deleteFormId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t.deleting : t.delete}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}