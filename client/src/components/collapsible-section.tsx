import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  id?: string;
  headerActions?: React.ReactNode;
}

export function CollapsibleSection({ title, children, defaultOpen = true, id, headerActions }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card id={id} className="form-section">
      <CardHeader className="bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center flex-1 cursor-pointer hover:bg-gray-100 transition-colors -m-3 p-3 rounded"
            onClick={() => setIsOpen(!isOpen)}
          >
            <CardTitle className="text-base sm:text-lg flex-1 truncate pr-2">{title}</CardTitle>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
            )}
          </div>
          {headerActions && (
            <div className="ml-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              {headerActions}
            </div>
          )}
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="p-3 sm:p-6">
          {children}
        </CardContent>
      )}
    </Card>
  );
}