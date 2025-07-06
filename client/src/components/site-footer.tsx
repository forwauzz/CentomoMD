import { Link } from "wouter";
import { RelatedServicesFooter } from "@/components/related-services";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Twitter, 
  Github,
  Stethoscope
} from "lucide-react";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold">CentomoMD</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Advanced medical documentation platform powered by AI, designed for Quebec healthcare professionals.
            </p>
            <div className="flex gap-3">
              <Link href="https://linkedin.com/company/centomomd" className="text-muted-foreground hover:text-primary">
                <Linkedin className="h-4 w-4" />
              </Link>
              <Link href="https://twitter.com/centomomd" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-4 w-4" />
              </Link>
              <Link href="https://github.com/centomomd" className="text-muted-foreground hover:text-primary">
                <Github className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/about" className="text-sm text-muted-foreground hover:text-primary">
                About Us
              </Link>
              <Link href="/features" className="text-sm text-muted-foreground hover:text-primary">
                Features
              </Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary">
                Pricing
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">
                Contact
              </Link>
              <Link href="/support" className="text-sm text-muted-foreground hover:text-primary">
                Support
              </Link>
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Resources</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/documentation" className="text-sm text-muted-foreground hover:text-primary">
                Documentation
              </Link>
              <Link href="/tutorials" className="text-sm text-muted-foreground hover:text-primary">
                Tutorials
              </Link>
              <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary">
                Blog
              </Link>
              <Link href="/case-studies" className="text-sm text-muted-foreground hover:text-primary">
                Case Studies
              </Link>
              <Link href="/whitepapers" className="text-sm text-muted-foreground hover:text-primary">
                Whitepapers
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <Link href="mailto:info@centomomd.com" className="hover:text-primary">
                  info@centomomd.com
                </Link>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <Link href="tel:+1-514-xxx-xxxx" className="hover:text-primary">
                  +1 (514) xxx-xxxx
                </Link>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5" />
                <div>
                  <p>Montreal, Quebec</p>
                  <p>Canada</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Services Section */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-foreground">Healthcare Services</h4>
          <RelatedServicesFooter />
        </div>

        <Separator className="my-8" />

        {/* Legal & Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary">
              Terms of Service
            </Link>
            <Link href="/cookies" className="hover:text-primary">
              Cookie Policy
            </Link>
            <Link href="/accessibility" className="hover:text-primary">
              Accessibility
            </Link>
          </div>
          <p>
            © {currentYear} CentomoMD. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}