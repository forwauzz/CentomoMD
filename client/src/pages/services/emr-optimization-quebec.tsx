import { RelatedServices, ServiceBreadcrumb } from "@/components/related-services";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Database, 
  Clock, 
  Shield, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Stethoscope,
  BarChart3,
  Settings,
  Zap
} from "lucide-react";

export default function EMROptimizationQuebec() {
  const benefits = [
    {
      icon: BarChart3,
      title: "40% Faster Workflows",
      description: "Streamlined EMR processes reduce patient wait times significantly"
    },
    {
      icon: Shield,
      title: "Quebec Compliance",
      description: "Full compliance with RAMQ and provincial healthcare regulations"
    },
    {
      icon: Users,
      title: "Staff Training Included",
      description: "Comprehensive training programs for all Quebec healthcare staff"
    },
    {
      icon: Zap,
      title: "24/7 Support",
      description: "Round-the-clock technical support in French and English"
    }
  ];

  const features = [
    "RAMQ integration optimization",
    "Quebec healthcare workflow analysis",
    "Bilingual EMR interface customization",
    "Provincial reporting compliance",
    "Data migration services",
    "Custom template development",
    "Staff training programs",
    "Ongoing performance monitoring"
  ];

  const stats = [
    { value: "150+", label: "Quebec Clinics Optimized" },
    { value: "40%", label: "Average Time Savings" },
    { value: "99.9%", label: "System Uptime" },
    { value: "24/7", label: "Support Coverage" }
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
          <ServiceBreadcrumb currentService="emr-optimization-quebec" />

          {/* Hero Section */}
          <section className="text-center py-12">
            <div className="max-w-3xl mx-auto">
              <Badge className="mb-4">EMR Optimization</Badge>
              <h1 className="text-4xl font-bold mb-6">
                EMR System Optimization Quebec
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Comprehensive Electronic Medical Record optimization services for Quebec healthcare providers. 
                Improve efficiency, ensure compliance, and enhance patient care delivery.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8">
                  Get Free Assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8">
                  View Case Studies
                </Button>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Benefits Grid */}
          <section className="py-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4">Why Quebec Healthcare Providers Trust Our EMR Optimization</h2>
              <p className="text-lg text-muted-foreground">
                Proven results across the province with specialized Quebec healthcare expertise
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
                    Complete EMR Optimization Services
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    Our team specializes in optimizing Electronic Medical Record systems 
                    for Quebec healthcare regulations and workflows.
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
                    <Database className="h-16 w-16 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Quebec-Specific Expertise</h3>
                    <p className="text-muted-foreground">
                      Deep understanding of RAMQ requirements and provincial healthcare standards
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Process Section */}
          <section className="py-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4">Our EMR Optimization Process</h2>
              <p className="text-lg text-muted-foreground">
                Structured approach ensuring minimal disruption to your practice
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  title: "System Assessment",
                  description: "Comprehensive analysis of your current EMR setup and Quebec compliance requirements"
                },
                {
                  step: "02",
                  title: "Custom Optimization",
                  description: "Tailored improvements based on your specific workflows and provincial standards"
                },
                {
                  step: "03",
                  title: "Training & Support",
                  description: "Staff training and ongoing support to maximize your optimized EMR system"
                }
              ].map((process, index) => (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <div className="mx-auto w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mb-4">
                      {process.step}
                    </div>
                    <CardTitle className="text-lg">{process.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{process.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-12 text-center">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Ready to Optimize Your EMR System?</CardTitle>
                <CardDescription className="text-lg">
                  Join 150+ Quebec healthcare providers who have transformed their practice efficiency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg">
                    Start Free Assessment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline">
                    Schedule Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Related Services */}
        <RelatedServices 
          currentService="emr-optimization-quebec"
          title="Explore Our Complete Healthcare Technology Suite"
          description="Comprehensive healthcare solutions designed specifically for Quebec medical professionals"
          maxServices={6}
        />
      </main>

      <SiteFooter />
    </div>
  );
}