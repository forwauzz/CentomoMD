import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trash2, Download, Upload, Plus, Settings, Lock, FileText, Quote, Wrench, FlaskConical, Stethoscope, Pill } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  loadVerbatimCommands, 
  saveVerbatimCommands, 
  validateVerbatimCommand,
  exportVerbatimCommands,
  importVerbatimCommands,
  getCommandsByCategory,
  getCategoryDisplayName,
  type VerbatimCommand 
} from "@/utils/verbatim-commands";

interface VerbatimCommandsManagerProps {
  language: 'fr' | 'en';
}

export function VerbatimCommandsManager({ language }: VerbatimCommandsManagerProps) {
  const [commands, setCommands] = useState<VerbatimCommand[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newCommand, setNewCommand] = useState<VerbatimCommand>({ 
    trigger: '', 
    endTrigger: '', 
    category: '', 
    description: '',
    language: language
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const t = language === 'fr' ? {
    title: "Commandes Verbatim",
    manage: "Gérer les commandes verbatim",
    addNew: "Nouvelle commande",
    trigger: "Déclencheur",
    endTrigger: "Fin (optionnel)",
    category: "Catégorie",
    description: "Description",
    language: "Langue",
    save: "Sauvegarder",
    cancel: "Annuler",
    delete: "Supprimer",
    export: "Exporter",
    import: "Importer",
    edit: "Modifier",
    triggerPlaceholder: "ex: rapport radiologique",
    endTriggerPlaceholder: "ex: fin rapport",
    categoryPlaceholder: "ex: radiology, quotes, technical",
    descriptionPlaceholder: "Description de la commande verbatim...",
    noCommands: "Aucune commande configurée",
    commandSaved: "Commande sauvegardée",
    commandDeleted: "Commande supprimée",
    exportSuccess: "Commandes exportées",
    importSuccess: "Commandes importées",
    importError: "Erreur d'importation",
    validationError: "Erreur de validation",
    howItWorks: "Comment ça marche",
    instructions: "Pendant la dictée, prononcez le déclencheur pour commencer le mode verbatim, puis la phrase de fin pour terminer.",
    customTriggers: "Déclencheurs personnalisés",
    defaultEnd: "Utilise 'fin [déclencheur]' par défaut",
    categories: {
      radiology: "Radiologie",
      quotes: "Citations",
      technical: "Technique",
      lab: "Laboratoire",
      diagnosis: "Diagnostic",
      prescription: "Prescription",
      medical: "Médical",
      other: "Autre"
    }
  } : {
    title: "Verbatim Commands",
    manage: "Manage Verbatim Commands",
    addNew: "New Command",
    trigger: "Trigger",
    endTrigger: "End Trigger (optional)",
    category: "Category",
    description: "Description",
    language: "Language",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    export: "Export",
    import: "Import",
    edit: "Edit",
    triggerPlaceholder: "e.g., radiology report",
    endTriggerPlaceholder: "e.g., end report",
    categoryPlaceholder: "e.g., radiology, quotes, technical",
    descriptionPlaceholder: "Description of verbatim command...",
    noCommands: "No commands configured",
    commandSaved: "Command saved",
    commandDeleted: "Command deleted",
    exportSuccess: "Commands exported",
    importSuccess: "Commands imported",
    importError: "Import error",
    validationError: "Validation error",
    howItWorks: "How it works",
    instructions: "During dictation, speak the trigger phrase to start verbatim mode, then the end phrase to finish.",
    customTriggers: "Custom Triggers",
    defaultEnd: "Uses 'end [trigger]' by default",
    categories: {
      radiology: "Radiology",
      quotes: "Quotes",
      technical: "Technical",
      lab: "Laboratory",
      diagnosis: "Diagnosis",
      prescription: "Prescription",
      medical: "Medical",
      other: "Other"
    }
  };

  const categoryIcons = {
    radiology: FileText,
    quotes: Quote,
    technical: Wrench,
    lab: FlaskConical,
    diagnosis: Stethoscope,
    prescription: Pill,
    medical: Lock,
    other: Settings
  };

  useEffect(() => {
    setCommands(loadVerbatimCommands());
  }, []);

  const resetForm = () => {
    setNewCommand({ 
      trigger: '', 
      endTrigger: '', 
      category: '', 
      description: '',
      language: language
    });
    setEditingIndex(null);
  };

  const handleSaveCommand = () => {
    const validation = validateVerbatimCommand(newCommand, commands);
    if (!validation.isValid) {
      toast({
        title: t.validationError,
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    if (!newCommand.trigger.trim()) {
      toast({
        title: t.validationError,
        description: language === 'fr' ? "Le déclencheur est requis" : "Trigger is required",
        variant: "destructive"
      });
      return;
    }

    const commandToSave = {
      ...newCommand,
      created: newCommand.created || new Date().toISOString(),
      endTrigger: newCommand.endTrigger || `fin ${newCommand.trigger}` // Default end trigger
    };

    let updatedCommands: VerbatimCommand[];
    if (editingIndex !== null) {
      updatedCommands = [...commands];
      updatedCommands[editingIndex] = commandToSave;
    } else {
      updatedCommands = [...commands, commandToSave];
    }

    setCommands(updatedCommands);
    saveVerbatimCommands(updatedCommands);
    resetForm();
    
    toast({
      title: t.commandSaved,
      description: language === 'fr' 
        ? `"${commandToSave.trigger}" a été sauvegardé` 
        : `"${commandToSave.trigger}" has been saved`
    });
  };

  const handleDeleteCommand = (index: number) => {
    const updatedCommands = commands.filter((_, i) => i !== index);
    setCommands(updatedCommands);
    saveVerbatimCommands(updatedCommands);
    
    toast({
      title: t.commandDeleted,
      description: language === 'fr' 
        ? "La commande a été supprimée" 
        : "Command has been deleted"
    });
  };

  const handleEditCommand = (index: number) => {
    setNewCommand(commands[index]);
    setEditingIndex(index);
  };

  const handleExport = () => {
    try {
      const exportData = exportVerbatimCommands(commands);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `verbatim-commands-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: t.exportSuccess,
        description: language === 'fr' 
          ? "Fichier téléchargé avec succès" 
          : "File downloaded successfully"
      });
    } catch (error) {
      toast({
        title: t.exportSuccess,
        description: language === 'fr' 
          ? "Erreur lors de l'exportation" 
          : "Error during export",
        variant: "destructive"
      });
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedCommands = importVerbatimCommands(e.target?.result as string);
        setCommands(importedCommands);
        saveVerbatimCommands(importedCommands);
        
        toast({
          title: t.importSuccess,
          description: language === 'fr' 
            ? `${importedCommands.length} commandes importées` 
            : `${importedCommands.length} commands imported`
        });
      } catch (error) {
        toast({
          title: t.importError,
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  const commandsByCategory = getCommandsByCategory(commands);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Lock className="h-4 w-4 mr-2" />
          {t.manage}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t.title}
          </DialogTitle>
          <DialogDescription>
            {t.instructions}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {/* Commands List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t.customTriggers}</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={commands.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t.export}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('import-input')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t.import}
                </Button>
                <input
                  id="import-input"
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              {commands.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t.noCommands}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(commandsByCategory).map(([category, categoryCommands]) => {
                    const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || Settings;
                    return (
                      <Card key={category}>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <IconComponent className="h-4 w-4" />
                            {getCategoryDisplayName(category, language)}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {categoryCommands.map((command, index) => {
                            const globalIndex = commands.findIndex(c => c === command);
                            return (
                              <div key={globalIndex} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      "{command.trigger}"
                                    </Badge>
                                    {command.endTrigger && (
                                      <>
                                        <span className="text-xs text-muted-foreground">→</span>
                                        <Badge variant="outline" className="text-xs">
                                          "{command.endTrigger}"
                                        </Badge>
                                      </>
                                    )}
                                  </div>
                                  {command.description && (
                                    <p className="text-sm text-muted-foreground truncate">
                                      {command.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1 ml-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditCommand(globalIndex)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Settings className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteCommand(globalIndex)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Add/Edit Form */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingIndex !== null ? t.edit : t.addNew}
              </h3>
              {editingIndex !== null && (
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  {t.cancel}
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trigger">{t.trigger}</Label>
                <Input
                  id="trigger"
                  value={newCommand.trigger}
                  onChange={(e) => setNewCommand(prev => ({ ...prev, trigger: e.target.value }))}
                  placeholder={t.triggerPlaceholder}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTrigger">{t.endTrigger}</Label>
                <Input
                  id="endTrigger"
                  value={newCommand.endTrigger}
                  onChange={(e) => setNewCommand(prev => ({ ...prev, endTrigger: e.target.value }))}
                  placeholder={t.endTriggerPlaceholder}
                />
                <p className="text-xs text-muted-foreground">{t.defaultEnd}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{t.category}</Label>
                <Select
                  value={newCommand.category}
                  onValueChange={(value) => setNewCommand(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.categoryPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(t.categories).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t.description}</Label>
                <Textarea
                  id="description"
                  value={newCommand.description}
                  onChange={(e) => setNewCommand(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t.descriptionPlaceholder}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">{t.language}</Label>
                <Select
                  value={newCommand.language}
                  onValueChange={(value) => setNewCommand(prev => ({ ...prev, language: value as 'fr' | 'en' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleSaveCommand}
                className="w-full"
                disabled={!newCommand.trigger.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t.save}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}