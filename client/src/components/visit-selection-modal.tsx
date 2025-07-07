import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Plus, FolderOpen, Clock, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface VisitSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onNewVisit: (visitName?: string) => void;
  onSelectDraft: (draftId: number) => void;
  formTitle: string;
  language: 'fr' | 'en';
}

interface SavedForm {
  id: number;
  title: string;
  formData: any;
  formType: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

const translations = {
  fr: {
    title: "Nouvelle visite",
    subtitle: "Comment souhaitez-vous commencer?",
    newVisit: "Nouvelle visite",
    newVisitDesc: "Commencer avec un formulaire vierge",
    selectDraft: "Sélectionner un brouillon",
    selectDraftDesc: "Continuer un formulaire existant",
    noDrafts: "Aucun brouillon disponible",
    noDraftsDesc: "Vous n'avez pas de brouillons sauvegardés pour ce formulaire",
    cancel: "Annuler",
    continue: "Continuer",
    lastModified: "Modifié le",
    expires: "Expire le",
    nameVisit: "Nommer la visite",
    nameVisitDesc: "Donnez un nom à cette visite pour l'identifier plus tard",
    visitNameLabel: "Nom de la visite",
    visitNamePlaceholder: "Ex: Visite1, Controle-2024, etc.",
    startVisit: "Commencer la visite",
    back: "Retour",
    required: "Requis"
  },
  en: {
    title: "New Visit",
    subtitle: "How would you like to start?",
    newVisit: "New Visit",
    newVisitDesc: "Start with a blank form",
    selectDraft: "Select Draft",
    selectDraftDesc: "Continue an existing form",
    noDrafts: "No drafts available",
    noDraftsDesc: "You don't have any saved drafts for this form",
    cancel: "Cancel",
    continue: "Continue",
    lastModified: "Modified on",
    expires: "Expires on",
    nameVisit: "Name Visit",
    nameVisitDesc: "Give this visit a name to identify it later",
    visitNameLabel: "Visit Name",
    visitNamePlaceholder: "Ex: Visit1, Checkup-2024, etc.",
    startVisit: "Start Visit",
    back: "Back",
    required: "Required"
  }
};

export function VisitSelectionModal({
  open,
  onClose,
  onNewVisit,
  onSelectDraft,
  formTitle,
  language
}: VisitSelectionModalProps) {
  const [selectedDraft, setSelectedDraft] = useState<number | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [visitName, setVisitName] = useState('');
  const [nameError, setNameError] = useState('');
  const t = translations[language];

  // Fetch draft forms
  const { data: draftForms = [], isLoading } = useQuery({
    queryKey: ['/api/saved-forms', 'draft'],
    enabled: open,
    select: (data: SavedForm[]) => data.filter(form => form.formType === 'draft')
  });

  const handleNewVisitClick = () => {
    setShowNameInput(true);
  };

  const handleBackToSelection = () => {
    setShowNameInput(false);
    setVisitName('');
    setNameError('');
  };

  const validateVisitName = (name: string): boolean => {
    if (!name.trim()) {
      setNameError(t.required);
      return false;
    }
    // Allow alphanumeric characters, spaces, hyphens, and underscores
    const alphanumericRegex = /^[a-zA-Z0-9\s\-_àâäéèêëïîôöùûüÿç]+$/;
    if (!alphanumericRegex.test(name.trim())) {
      setNameError(language === 'fr' ? 'Utilisez seulement des lettres, chiffres, espaces, tirets et underscores' : 'Use only letters, numbers, spaces, hyphens and underscores');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleStartVisit = () => {
    if (validateVisitName(visitName)) {
      onNewVisit(visitName.trim());
      onClose();
      // Reset state
      setShowNameInput(false);
      setVisitName('');
      setNameError('');
    }
  };

  const handleSelectDraft = () => {
    if (selectedDraft) {
      onSelectDraft(selectedDraft);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {showNameInput ? t.nameVisit : t.title} - {formTitle}
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            {showNameInput ? t.nameVisitDesc : t.subtitle}
          </DialogDescription>
        </DialogHeader>

        {showNameInput ? (
          /* Visit Naming Step */
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="visitName" className="text-sm font-medium text-gray-700">
                {t.visitNameLabel} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="visitName"
                value={visitName}
                onChange={(e) => {
                  setVisitName(e.target.value);
                  if (nameError) setNameError('');
                }}
                placeholder={t.visitNamePlaceholder}
                className={nameError ? 'border-red-500' : ''}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleStartVisit();
                  }
                }}
              />
              {nameError && (
                <p className="text-sm text-red-600 mt-1">{nameError}</p>
              )}
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={handleBackToSelection}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.back}
              </Button>
              <Button 
                onClick={handleStartVisit} 
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={!visitName.trim()}
              >
                {t.startVisit}
              </Button>
            </div>
          </div>
        ) : (
          /* Main Selection Step */
          <div className="grid gap-4 py-4">
            {/* New Visit Option */}
            <Card 
              className="cursor-pointer hover:bg-gray-50 transition-colors border-2 hover:border-blue-200"
              onClick={handleNewVisitClick}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Plus className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900">{t.newVisit}</CardTitle>
                    <CardDescription className="text-gray-600">{t.newVisitDesc}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

          {/* Select Draft Option */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-900">{t.selectDraft}</CardTitle>
                  <CardDescription className="text-gray-600">{t.selectDraftDesc}</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Chargement...</div>
                </div>
              ) : draftForms.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">{t.noDrafts}</p>
                  <p className="text-gray-400 text-sm">{t.noDraftsDesc}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {draftForms.map((draft) => (
                    <div
                      key={draft.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedDraft === draft.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                      onClick={() => setSelectedDraft(draft.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 truncate">{draft.title}</h4>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {t.lastModified} {formatDate(draft.updatedAt)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {t.expires} {formatDate(draft.expiresAt)}
                            </Badge>
                          </div>
                        </div>
                        {selectedDraft === draft.id && (
                          <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center ml-2">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {draftForms.length > 0 && (
                <div className="flex gap-3 mt-4 pt-4 border-t">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    {t.cancel}
                  </Button>
                  <Button 
                    onClick={handleSelectDraft} 
                    disabled={!selectedDraft}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {t.continue}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}