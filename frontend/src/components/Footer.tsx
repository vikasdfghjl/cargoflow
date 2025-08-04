import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Truck, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram 
} from "lucide-react";

const Footer = () => {
  const quickLinks = [
    "About Us",
    "Our Services", 
    "Pricing",
    "Track Package",
    "Contact Us"
  ];

  const services = [
    "B2B Delivery",
    "Express Services",
    "Fleet Management", 
    "Bulk Shipping",
    "API Integration"
  ];

  const support = [
    "Help Center",
    "Documentation",
    "Live Chat",
    "Report Issue",
    "Service Status"
  ];

  const legal = [
    "Privacy Policy",
    "Terms of Service",
    "Cookie Policy",
    "Refund Policy"
  ];

  return (
    <footer className="bg-transport-primary text-white">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="container py-12">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <h3 className="text-2xl font-bold">Stay Updated</h3>
            <p className="text-white/80">
              Get the latest updates on logistics trends and special offers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input 
                placeholder="Enter your email" 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
              <Button variant="action" className="sm:w-auto w-full">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container py-16">
        <div className="grid lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-2 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center space-x-2">
              <div className="action-gradient p-2 rounded-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">CargoFlow</h1>
                <p className="text-sm text-white/80">Professional Transport</p>
              </div>
            </div>
            
            <p className="text-white/80 max-w-sm">
              Leading B2B logistics platform connecting businesses with reliable, 
              fast, and secure parcel delivery services across India.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-action-primary" />
                <span className="text-sm">+91 1800-123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-action-primary" />
                <span className="text-sm">business@cargoflow.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-action-primary" />
                <span className="text-sm">Mumbai, Maharashtra, India</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="hover:bg-white/10">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-white/10">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-white/10">
                <Linkedin className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-white/10">
                <Instagram className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a 
                    href="#" 
                    className="text-white/80 hover:text-action-primary transition-smooth text-sm"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Services</h4>
            <ul className="space-y-2">
              {services.map((service, index) => (
                <li key={index}>
                  <a 
                    href="#" 
                    className="text-white/80 hover:text-action-primary transition-smooth text-sm"
                  >
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Support</h4>
            <ul className="space-y-2">
              {support.map((item, index) => (
                <li key={index}>
                  <a 
                    href="#" 
                    className="text-white/80 hover:text-action-primary transition-smooth text-sm"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Legal</h4>
            <ul className="space-y-2">
              {legal.map((item, index) => (
                <li key={index}>
                  <a 
                    href="#" 
                    className="text-white/80 hover:text-action-primary transition-smooth text-sm"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-white/60 text-sm">
              © 2024 CargoFlow. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <span className="text-white/60">Powered by</span>
              <span className="text-action-primary font-medium">Advanced Logistics Technology</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;