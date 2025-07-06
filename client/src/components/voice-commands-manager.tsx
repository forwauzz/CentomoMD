import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Download, Upload, Plus, Settings, Mic2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  loadVoiceCommands, 
  saveVoiceCommands, 
  validateCommandTrigger,
  exportVoiceCommands,
  importVoiceCommands,
  type VoiceCommand 
} from "@/utils/voice-commands";

interface VoiceCommandsManagerProps {
  language: 'fr' | 'en';
}

export function VoiceCommandsManager({ language }: VoiceCommandsManagerProps) {
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newCommand, setNewCommand] = useState({ trigger: '', replacement: '', category: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const t = language === 'fr' ? {
    title: "Commandes vocales",
    manage: "Gérer les commandes",
    addNew: "Nouvelle commande",
    trigger: "Phrase déclencheuse",
    replacement: "Texte de remplacement",
    category: "Catégorie",
    save: "Sauvegarder",
    cancel: "Annuler",
    delete: "Supprimer",
    export: "Exporter",
    import: "Importer",
    edit: "Modifier",
    triggerPlaceholder: "ex: insert physical exam",
    replacementPlaceholder: "Texte médical complet qui remplacera la commande...",
    categoryPlaceholder: "ex: examination, vitals, instructions",
    noCommands: "Aucune commande configurée",
    commandSaved: "Commande sauvegardée",
    commandDeleted: "Commande supprimée",
    exportSuccess: "Commandes exportées",
    importSuccess: "Commandes importées",
    importError: "Erreur d'importation",
    validationError: "Erreur de validation",
    howItWorks: "Comment ça marche",
    instructions: "Pendant la dictée, prononcez la phrase déclencheuse et elle sera automatiquement remplacée par le texte complet."
  } : {
    title: "Voice Commands",
    manage: "Manage Commands",
    addNew: "New Command",
    trigger: "Trigger Phrase",
    replacement: "Replacement Text",
    category: "Category",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    export: "Export",
    import: "Import",
    edit: "Edit",
    triggerPlaceholder: "e.g., insert physical exam",
    replacementPlaceholder: "Complete medical text that will replace the command...",
    categoryPlaceholder: "e.g., examination, vitals, instructions",
    noCommands: "No commands configured",
    commandSaved: "Command saved",
    commandDeleted: "Command deleted",
    exportSuccess: "Commands exported",
    importSuccess: "Commands imported",
    importError: "Import error",
    validationError: "Validation error",
    howItWorks: "How it works",
    instructions: "During dictation, speak the trigger phrase and it will be automatically replaced with the full text."
  };

  useEffect(() => {
    setCommands(loadVoiceCommands());
  }, []);

  const handleSaveCommand = () => {
    const validation = validateCommandTrigger(newCommand.trigger, commands);
    if (!validation.isValid) {
      toast({
        title: t.validationError,
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    if (!newCommand.replacement.trim()) {
      toast({
        title: t.validationError,
        description: language === 'fr' ? "Le texte de remplacement est requis" : "Replacement text is required",
        variant: "destructive"
      });
      return;
    }

    const command: VoiceCommand = {
      trigger: newCommand.trigger.trim(),
      replacement: newCommand.replacement.trim(),
      category: newCommand.category.trim() || undefined,
      created: new Date().toISOString()
    };

    let updatedCommands;
    if (editingIndex !== null) {
      updatedCommands = [...commands];
      updatedCommands[editingIndex] = command;
    } else {
      updatedCommands = [...commands, command];
    }

    setCommands(updatedCommands);
    saveVoiceCommands(updatedCommands);
    
    setNewCommand({ trigger: '', replacement: '', category: '' });
    setEditingIndex(null);
    
    toast({
      title: t.commandSaved,
      description: language === 'fr' ? `Commande "${command.trigger}" ajoutée` : `Command "${command.trigger}" added`
    });
  };

  const handleEditCommand = (index: number) => {
    const command = commands[index];
    setNewCommand({
      trigger: command.trigger,
      replacement: command.replacement,
      category: command.category || ''
    });
    setEditingIndex(index);
  };

  const handleDeleteCommand = (index: number) => {
    const updatedCommands = commands.filter((_, i) => i !== index);
    setCommands(updatedCommands);
    saveVoiceCommands(updatedCommands);
    
    toast({
      title: t.commandDeleted,
      description: language === 'fr' ? "Commande supprimée avec succès" : "Command deleted successfully"
    });
  };

  const handleExport = () => {
    const dataStr = exportVoiceCommands();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'voice-commands.json';
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: t.exportSuccess,
      description: language === 'fr' ? "Fichier téléchargé" : "File downloaded"
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = importVoiceCommands(content);
      
      if (result.success) {
        setCommands(loadVoiceCommands());
        toast({
          title: t.importSuccess,
          description: language === 'fr' 
            ? `${result.count} commandes importées` 
            : `${result.count} commands imported`
        });
      } else {
        toast({
          title: t.importError,
          description: result.error,
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Mic2 className="h-4 w-4" />
          <Settings className="h-4 w-4" />
          {t.manage}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic2 className="h-5 w-5" />
            {t.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Commands List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{language === 'fr' ? 'Commandes configurées' : 'Configured Commands'}</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-1" />
                  {t.export}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <label>
                    <Upload className="h-4 w-4 mr-1" />
                    {t.import}
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {commands.length === 0 ? (
                  <Card>
                    <CardContent className="p-4 text-center text-gray-500">
                      {t.noCommands}
                    </CardContent>
                  </Card>
                ) : (
                  commands.map((command, index) => (
                    <Card key={index} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {command.trigger}
                          </Badge>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditCommand(index)}
                            >
                              {t.edit}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteCommand(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {command.replacement}
                        </p>
                        {command.category && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {command.category}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          
          {/* Add/Edit Form */}
          <div className="space-y-4">
            <h3 className="font-medium">
              {editingIndex !== null ? t.edit : t.addNew}
            </h3>
            
            {/* How it works info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-medium text-blue-800 mb-2">{t.howItWorks}</h4>
                <p className="text-sm text-blue-700">{t.instructions}</p>
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="trigger">{t.trigger}</Label>
                <Input
                  id="trigger"
                  value={newCommand.trigger}
                  onChange={(e) => setNewCommand({ ...newCommand, trigger: e.target.value })}
                  placeholder={t.triggerPlaceholder}
                />
              </div>
              
              <div>
                <Label htmlFor="replacement">{t.replacement}</Label>
                <Textarea
                  id="replacement"
                  value={newCommand.replacement}
                  onChange={(e) => setNewCommand({ ...newCommand, replacement: e.target.value })}
                  placeholder={t.replacementPlaceholder}
                  rows={6}
                />
              </div>
              
              <div>
                <Label htmlFor="category">{t.category} {language === 'fr' ? '(optionnel)' : '(optional)'}</Label>
                <Input
                  id="category"
                  value={newCommand.category}
                  onChange={(e) => setNewCommand({ ...newCommand, category: e.target.value })}
                  placeholder={t.categoryPlaceholder}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSaveCommand} className="flex-1">
                  <Plus className="h-4 w-4 mr-1" />
                  {t.save}
                </Button>
                {editingIndex !== null && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setNewCommand({ trigger: '', replacement: '', category: '' });
                      setEditingIndex(null);
                    }}
                  >
                    {t.cancel}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}