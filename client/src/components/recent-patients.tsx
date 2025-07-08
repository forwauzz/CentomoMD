import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { User, Clock, Trash2, FileText, ChevronRight } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface RecentPatientsProps {
  language: 'fr' | 'en';
  onPatientSelect?: (patient: any) => void;
  collapsed?: boolean;
}

const translations = {
  fr: {
    title: "Patients récents",
    noPatients: "Aucun patient récent",
    lastAccessed: "Vu",
    newVisit: "Nouvelle visite",
    followUp: "Suivi",
    draft: "Brouillon",
    remove: "Retirer",
    loading: "Chargement...",
    error: "Erreur lors du chargement",
    removed: "Patient retiré de la liste",
    age: "ans"
  },
  en: {
    title: "Recent Patients",
    noPatients: "No recent patients",
    lastAccessed: "Seen",
    newVisit: "New visit",
    followUp: "Follow-up",
    draft: "Draft",
    remove: "Remove",
    loading: "Loading...",
    error: "Error loading",
    removed: "Patient removed from list",
    age: "years"
  }
};

export function RecentPatients({ language, onPatientSelect, collapsed = false }: RecentPatientsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [switchingPatient, setSwitchingPatient] = useState<number | null>(null);
  const locale = language === 'fr' ? fr : enUS;
  const t = translations[language];

  // Fetch recent patients
  const { data: recentPatients = [], isLoading, error } = useQuery({
    queryKey: ["/api/recent-patients"],
    queryFn: async () => {
      const response = await fetch("/api/recent-patients", { credentials: "include" });
      if (!response.ok) {
        throw new Error("Failed to fetch recent patients");
      }
      return response.json();
    },
  });

  // Remove patient mutation
  const removePatient = useMutation({
    mutationFn: async (patientId: number) => {
      const response = await fetch(`/api/recent-patients/${patientId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to remove patient");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recent-patients"] });
      toast({
        title: t.removed,
      });
    },
    onError: () => {
      toast({
        title: t.error,
        variant: "destructive",
      });
    },
  });

  const handlePatientSelect = (patient: any) => {
    try {
      // Set loading state for visual feedback
      setSwitchingPatient(patient.id);
      
      // Immediately navigate without waiting for any async operations
      if (patient.savedFormId) {
        // Load the saved form
        setLocation(`/forms/cnesst-medical?draft=${patient.savedFormId}`);
      } else {
        // Start new visit with patient name
        setLocation(`/forms/cnesst-medical?visit=new&name=${encodeURIComponent(patient.patientName)}`);
      }
      
      // Clear loading state after navigation
      setTimeout(() => {
        setSwitchingPatient(null);
      }, 200);
      
      // Update last accessed time in background (non-blocking)
      setTimeout(() => {
        fetch("/api/recent-patients/access", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ patientName: patient.patientName }),
        }).catch(error => {
          console.warn('Failed to update patient access time:', error);
        });
      }, 0);

      if (onPatientSelect) {
        onPatientSelect(patient);
      }
    } catch (error) {
      console.error('Error switching to patient:', error);
      setSwitchingPatient(null);
      toast({
        title: t.error,
        description: "Failed to switch to selected patient",
        variant: "destructive",
      });
    }
  };

  const getVisitTypeBadge = (visitType: string) => {
    const badgeMap = {
      new: { color: "bg-green-100 text-green-800", text: t.newVisit },
      'follow-up': { color: "bg-blue-100 text-blue-800", text: t.followUp },
      draft: { color: "bg-orange-100 text-orange-800", text: t.draft }
    };
    
    const badge = badgeMap[visitType as keyof typeof badgeMap] || badgeMap.new;
    return (
      <Badge className={`${badge.color} text-xs px-2 py-1`}>
        {badge.text}
      </Badge>
    );
  };

  if (collapsed) {
    return (
      <div className="px-2 py-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs p-2"
          onClick={() => {/* Could expand or show mini list */}}
        >
          <Clock className="w-3 h-3 mr-2" />
          {recentPatients.length > 0 ? recentPatients.length : '0'}
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="text-center text-sm text-gray-500 py-4">
            {t.loading}
          </div>
        ) : error ? (
          <div className="text-center text-sm text-red-500 py-4">
            {t.error}
          </div>
        ) : recentPatients.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-4">
            {t.noPatients}
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {recentPatients.map((patient: any) => (
                <div
                  key={patient.id}
                  className={`flex items-start justify-between p-3 rounded-lg transition-colors cursor-pointer group ${
                    switchingPatient === patient.id 
                      ? 'bg-blue-100 border border-blue-300' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => handlePatientSelect(patient)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3 h-3 text-gray-600 flex-shrink-0" />
                      <span className="font-medium text-sm truncate">
                        {patient.patientName}
                      </span>
                      <ChevronRight className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-1 mb-2">
                      {getVisitTypeBadge(patient.visitType)}
                      {patient.patientAge && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {patient.patientAge} {t.age}
                        </Badge>
                      )}
                    </div>

                    {patient.diagnosis && (
                      <div className="text-xs text-gray-600 mb-1 truncate">
                        {patient.diagnosis}
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      {t.lastAccessed} {formatDistanceToNow(new Date(patient.lastAccessedAt), { 
                        addSuffix: true, 
                        locale 
                      })}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePatient.mutate(patient.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}