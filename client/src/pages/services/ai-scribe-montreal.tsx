import { RelatedServices, ServiceBreadcrumb } from "@/components/related-services";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Brain, 
  Clock, 
  Shield, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Stethoscope,
  FileText,
  Zap
} from "lucide-react";

export default function AIScribeMontreal() {
  const benefits = [
    {
      icon: Clock,
      title: "Save 2-3 Hours Daily",
      description: "Reduce documentation time by 70% with AI-powered transcription"
    },
    {
      icon: Shield,
      title: "HIPAA Compliant",
      description: "Enterprise-grade security meeting Quebec healthcare standards"
    },
    {
      icon: Users,
      title: "Team Integration",
      description: "Seamless integration with existing Montreal healthcare workflows"
    },
    {
      icon: Zap,
      title: "Instant Processing",
      description: "Real-time transcription with medical terminology accuracy"
    }
  ];

  const features = [
    "French & English medical dictation",
    "Quebec medical terminology database",
    "Integration with Montreal health networks",
    "RAMQ compliance standards",
    "24/7 technical support in French",
    "Custom workflow implementation"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">CentomoMD</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/services" className="text-sm text-muted-foreground hover:text-primary">
                Services
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <div className="container mx-auto px-4 py-8">
          <ServiceBreadcrumb currentService="ai-scribe-montreal" />

          {/* Hero Section */}
          <section className="text-center py-12">
            <div className="max-w-3xl mx-auto">
              <Badge className="mb-4">AI Medical Solutions</Badge>
              <h1 className="text-4xl font-bold mb-6">
                AI Medical Scribe Implementation Montreal
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Revolutionary AI-powered medical documentation for Montreal healthcare providers. 
                Reduce documentation time by 70% while maintaining Quebec medical standards.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8">
                  Get Free Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Schedule Consultation
                </Button>
              </div>
            </div>
          </section>

          {/* Benefits Grid */}
          <section className="py-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4">Why Montreal Healthcare Providers Choose Our AI Scribe</h2>
              <p className="text-lg text-muted-foreground">
                Trusted by leading medical practices across Montreal
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <Card key={index} className="text-center">
                    <CardHeader>
                      <div className="mx-auto p-3 bg-primary/10 rounded-lg w-fit">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{benefit.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{benefit.description}</CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Features Section */}
          <section className="py-12 bg-muted/30 rounded-lg">
            <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-6">
                    Comprehensive AI Medical Documentation
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    Our AI scribe technology is specifically trained on Quebec medical terminology 
                    and Montreal healthcare workflows.
                  </p>
                  <div className="space-y-3">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-8">
                  <div className="text-center">
                    <Brain className="h-16 w-16 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">AI-Powered Accuracy</h3>
                    <p className="text-muted-foreground">
                      95% accuracy rate with Quebec medical terminology
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-12 text-center">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Ready to Transform Your Practice?</CardTitle>
                <CardDescription className="text-lg">
                  Join Montreal healthcare providers saving hours daily with AI medical scribing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline">
                    Contact Sales Team
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Related Services */}
        <RelatedServices 
          currentService="ai-scribe-montreal"
          title="Explore Our Healthcare Technology Solutions"
          description="Complete suite of AI-powered healthcare solutions for Quebec medical professionals"
          maxServices={6}
        />
      </main>

      <SiteFooter />
    </div>
  );
}