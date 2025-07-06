import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Stethoscope, 
  Brain, 
  FileText, 
  Mic, 
  Database, 
  Settings, 
  Users, 
  Shield,
  ArrowRight,
  MapPin
} from "lucide-react";

interface ServiceCard {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  location: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  category: 'ai' | 'integration' | 'optimization' | 'compliance';
}

const services: ServiceCard[] = [
  {
    id: 'ai-scribe-montreal',
    title: 'AI Medical Scribe Implementation',
    description: 'Advanced AI-powered medical documentation solutions for Montreal healthcare providers',
    keywords: ['AI Medical Scribe', 'Montreal Healthcare', 'Medical Documentation AI'],
    location: 'Montreal, QC',
    icon: Brain,
    href: '/services/ai-scribe-montreal',
    category: 'ai'
  },
  {
    id: 'emr-optimization-quebec',
    title: 'EMR System Optimization',
    description: 'Comprehensive Electronic Medical Record optimization services across Quebec',
    keywords: ['EMR Optimization', 'Quebec Healthcare', 'Electronic Medical Records'],
    location: 'Quebec Province',
    icon: Database,
    href: '/services/emr-optimization-quebec',
    category: 'optimization'
  },
  {
    id: 'voice-dictation-quebec',
    title: 'Medical Voice Dictation Systems',
    description: 'Professional voice-to-text solutions for Quebec medical professionals',
    keywords: ['Medical Voice Dictation', 'Quebec Healthcare', 'Speech Recognition'],
    location: 'Quebec Province',
    icon: Mic,
    href: '/services/voice-dictation-quebec',
    category: 'ai'
  },
  {
    id: 'healthcare-integration-montreal',
    title: 'Healthcare System Integration',
    description: 'Seamless integration solutions for Montreal healthcare networks',
    keywords: ['Healthcare Integration', 'Montreal Medical', 'System Integration'],
    location: 'Montreal, QC',
    icon: Settings,
    href: '/services/healthcare-integration-montreal',
    category: 'integration'
  },
  {
    id: 'clinical-workflow-optimization',
    title: 'Clinical Workflow Optimization',
    description: 'Streamline clinical processes with AI-enhanced workflow solutions',
    keywords: ['Clinical Workflow', 'Healthcare Optimization', 'Medical Process'],
    location: 'Quebec Province',
    icon: FileText,
    href: '/services/clinical-workflow-optimization',
    category: 'optimization'
  },
  {
    id: 'healthcare-compliance-quebec',
    title: 'Healthcare Compliance Solutions',
    description: 'Ensure regulatory compliance with Quebec healthcare standards',
    keywords: ['Healthcare Compliance', 'Quebec Regulations', 'Medical Standards'],
    location: 'Quebec Province',
    icon: Shield,
    href: '/services/healthcare-compliance-quebec',
    category: 'compliance'
  },
  {
    id: 'telemedicine-platform-montreal',
    title: 'Telemedicine Platform Development',
    description: 'Custom telemedicine solutions for Montreal healthcare providers',
    keywords: ['Telemedicine Platform', 'Montreal Healthcare', 'Remote Care'],
    location: 'Montreal, QC',
    icon: Users,
    href: '/services/telemedicine-platform-montreal',
    category: 'integration'
  },
  {
    id: 'medical-ai-consulting',
    title: 'Medical AI Consulting Services',
    description: 'Expert consultation on AI implementation in healthcare settings',
    keywords: ['Medical AI Consulting', 'Healthcare AI', 'AI Implementation'],
    location: 'Quebec Province',
    icon: Stethoscope,
    href: '/services/medical-ai-consulting',
    category: 'ai'
  }
];

const categoryColors = {
  ai: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  integration: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  optimization: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  compliance: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
};

const categoryLabels = {
  ai: 'AI Solutions',
  integration: 'System Integration',
  optimization: 'Process Optimization',
  compliance: 'Compliance & Standards'
};

interface RelatedServicesProps {
  currentService?: string;
  title?: string;
  description?: string;
  maxServices?: number;
  showCategories?: boolean;
}

export function RelatedServices({ 
  currentService, 
  title = "Related Healthcare Services",
  description = "Explore our comprehensive range of healthcare technology solutions",
  maxServices = 8,
  showCategories = true
}: RelatedServicesProps) {
  // Filter out current service if specified
  const filteredServices = services
    .filter(service => service.id !== currentService)
    .slice(0, maxServices);

  return (
    <section className="py-12 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredServices.map((service) => {
            const IconComponent = service.icon;
            
            return (
              <Card key={service.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    {showCategories && (
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${categoryColors[service.category]}`}
                      >
                        {categoryLabels[service.category]}
                      </Badge>
                    )}
                  </div>
                  
                  <CardTitle className="text-lg leading-tight">
                    <Link 
                      href={service.href}
                      className="hover:text-primary transition-colors"
                    >
                      {service.title}
                    </Link>
                  </CardTitle>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {service.location}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <CardDescription className="text-sm mb-4 line-clamp-3">
                    {service.description}
                  </CardDescription>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {service.keywords.slice(0, 2).map((keyword, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  
                  <Link 
                    href={service.href}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
                  >
                    Learn More
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-2">
              Need Custom Healthcare Solutions?
            </h3>
            <p className="text-muted-foreground mb-4">
              Our team specializes in tailored healthcare technology implementations across Quebec.
            </p>
            <Link 
              href="/contact"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Get Custom Quote
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// Compact version for footer
export function RelatedServicesFooter() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {services.slice(0, 8).map((service) => (
        <Link 
          key={service.id}
          href={service.href}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          {service.title}
        </Link>
      ))}
    </div>
  );
}

// Service navigation breadcrumb
export function ServiceBreadcrumb({ currentService }: { currentService: string }) {
  const service = services.find(s => s.id === currentService);
  
  if (!service) return null;
  
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
      <Link href="/" className="hover:text-primary">Home</Link>
      <span>/</span>
      <Link href="/services" className="hover:text-primary">Services</Link>
      <span>/</span>
      <span className="text-foreground">{service.title}</span>
    </nav>
  );
}