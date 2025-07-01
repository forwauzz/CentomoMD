
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Calendar, Clock, Trash2, Download, Printer, Eye } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { exportToPDF } from "@/lib/pdf-export";
import { exportToWord } from "@/lib/word-export-simple";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const locale = language === 'fr' ? fr : enUS;
  const t = translations[language];

  // Fetch saved forms based on type
  const { data: savedForms = [], isLoading } = useQuery({
    queryKey: ["/api/saved-forms", formType],
    queryFn: async () => {
      const params = formType !== 'all' ? `?formType=${formType}` : '';
      const response = await fetch(`/api/saved-forms${params}`, { credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to fetch saved forms");
      }
      return response.json();
    },
    retry: false,
  });

  // Delete mutation
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
      queryClient.invalidateQueries({ queryKey: ["/api/saved-forms", "draft"] });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-forms", "copy"] });
      toast({
        title: t.deleteSuccess,
      });
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
    if (onLoadForm && savedForm.formData) {
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

  const handlePrint = (savedForm: any) => {
    try {
      // Create a temporary form with the saved data for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Print Form</title></head><body>');
        printWindow.document.write(`<h1>${savedForm.title}</h1>`);
        printWindow.document.write('<pre>' + JSON.stringify(savedForm.formData, null, 2) + '</pre>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
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

  const handleExportPDF = (savedForm: any) => {
    try {
      exportToPDF(savedForm.formData);
      toast({
        title: t.exportSuccess,
        description: savedForm.title,
      });
    } catch (error) {
      console.error("PDF export error:", error);
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
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleLoadForm(savedForm)}
                        disabled={expiration.status === 'expired'}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        {t.load}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrint(savedForm)}
                      >
                        <Printer className="w-3 h-3 mr-1" />
                        {t.print}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportPDF(savedForm)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        {t.exportPdf}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportWord(savedForm)}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        {t.exportWord}
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            {deleteMutation.isPending ? t.deleting : t.delete}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t.deleteConfirm}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {savedForm.title}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteForm(savedForm.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {t.delete}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
