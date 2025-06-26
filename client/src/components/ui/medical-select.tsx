
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MedicalSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  options?: { value: string; label: string }[];
}

export function MedicalSelect({ 
  value, 
  onValueChange, 
  placeholder = "", 
  className = "", 
  disabled = false,
  options = [
    { value: "Négatif", label: "Négatif" },
    { value: "Positif", label: "Positif" },
    { value: "Non fait", label: "Non fait" }
  ]
}: MedicalSelectProps) {
  return (
    <Select value={value || ""} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={`w-full border-0 p-1 text-center bg-transparent focus:ring-0 focus:ring-offset-0 ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
