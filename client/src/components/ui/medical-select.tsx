
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MedicalSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MedicalSelect({ value, onValueChange, placeholder = "", className = "" }: MedicalSelectProps) {
  return (
    <Select value={value || ""} onValueChange={onValueChange}>
      <SelectTrigger className={`w-full border-0 p-1 text-center bg-transparent focus:ring-0 focus:ring-offset-0 ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Négatif">Négatif</SelectItem>
        <SelectItem value="Positif">Positif</SelectItem>
        <SelectItem value="Non fait">Non fait</SelectItem>
      </SelectContent>
    </Select>
  );
}
