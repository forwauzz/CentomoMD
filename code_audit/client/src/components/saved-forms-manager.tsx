import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Trash2, Calendar, Clock } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { fr, enUS } from "date-fns/locale";

interface SavedFormsManagerProps {
  language: 'fr' | 'en';
  onLoadForm?: (formData: any) => void;
}

const translations = {
  fr: {
    title: "Formulaires sauvegardés",
    description: "Gérez vos formulaires sauvegardés temporairement",
    noForms: "Aucun formulaire sauvegardé",
    noFormsDescription: "Vous n'avez pas encore de formulaires sauvegardés.",
    load: "Charger",
    delete: "Supprimer",
    createdAt: "Créé",
    expiresIn: "Expire dans",
    expired: "Expiré",
    deleteConfirm: "Êtes-vous sûr de vouloir supprimer ce formulaire ?",
    loading: "Chargement...",
    deleting: "Suppression...",
    loadSuccess: "Formulaire chargé avec succès",
    deleteSuccess: "Formulaire supprimé avec succès",
    error: "Une erreur est survenue"
  },
  en: {
    title: "Saved Forms",
    description: "Manage your temporarily saved forms",
    noForms: "No saved forms",
    noFormsDescription: "You don't have any saved forms yet.",
    load: "Load",
    delete: "Delete",
    createdAt: "Created",
    expiresIn: "Expires in",
    expired: "Expired",
    deleteConfirm: "Are you sure you want to delete this form?",
    loading: "Loading...",
    deleting: "Deleting...",
    loadSuccess: "Form loaded successfully",
    deleteSuccess: "Form deleted successfully",
    error: "An error occurred"
  }
};

export function SavedFormsManager({ language, onLoadForm }: SavedFormsManagerProps) {
  const [deleteFormId, setDeleteFormId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = translations[language];
  const locale = language === 'fr' ? fr : enUS;

  const { data: savedForms = [], isLoading } = useQuery({
    queryKey: ["/api/saved-forms"],
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5" />
        <div>
          <h3 className="font-medium">{t.title}</h3>
          <p className="text-sm text-gray-500">{t.description}</p>
        </div>
      </div>

      {savedForms.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <CardTitle className="text-lg mb-2">{t.noForms}</CardTitle>
            <CardDescription>{t.noFormsDescription}</CardDescription>
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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleLoadForm(savedForm)}
                        disabled={expiration.status === 'expired'}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        {t.load}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteFormId(savedForm.id)}
                        disabled={deleteMutation.isPending}
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