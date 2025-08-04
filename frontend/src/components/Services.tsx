import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Truck, 
  Package, 
  Clock, 
  Shield, 
  MapPin, 
  FileText, 
  BarChart3,
  Users,
  Zap,
  Globe
} from "lucide-react";

const Services = () => {
  const mainServices = [
    {
      icon: Package,
      title: "B2B Parcel Delivery",
      description: "Reliable door-to-door delivery for business parcels with real-time tracking and proof of delivery.",
      features: ["Same-day delivery", "Bulk discounts", "API integration"]
    },
    {
      icon: Truck,
      title: "Fleet Management",
      description: "Complete logistics solution with dedicated fleet management and route optimization.",
      features: ["Route optimization", "Vehicle tracking", "Driver management"]
    },
    {
      icon: Clock,
      title: "Express Services",
      description: "Time-critical deliveries with guaranteed delivery windows and priority handling.",
      features: ["2-hour express", "Next-day delivery", "Time-slot booking"]
    }
  ];

  const additionalServices = [
    {
      icon: Shield,
      title: "Insured Transport",
      description: "Comprehensive insurance coverage for high-value shipments"
    },
    {
      icon: FileText,
      title: "Documentation",
      description: "Digital invoicing, proof of delivery, and compliance reports"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Detailed insights on delivery performance and cost optimization"
    },
    {
      icon: Users,
      title: "Account Management",
      description: "Dedicated account managers for enterprise clients"
    },
    {
      icon: Zap,
      title: "API Integration",
      description: "Seamless integration with your existing business systems"
    },
    {
      icon: Globe,
      title: "Multi-City Network",
      description: "Extensive coverage across major cities and industrial hubs"
    }
  ];

  return (
    <section id="services" className="py-20 bg-background">
      <div className="container">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-transport-accent-light text-transport-primary text-sm font-medium">
            <Truck className="h-4 w-4 mr-2" />
            Our Services
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-transport-primary">
            Complete B2B Logistics Solutions
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            From small parcels to enterprise logistics, we provide comprehensive transport services 
            designed for modern businesses.
          </p>
        </div>

        {/* Main Services Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {mainServices.map((service, index) => (
            <Card key={index} className="shadow-transport hover:shadow-transport-elevated transition-smooth">
              <CardHeader>
                <div className="transport-gradient p-3 rounded-lg w-fit">
                  <service.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-transport-primary">
                  {service.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-neutral-600">
                  {service.description}
                </p>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-neutral-600">
                      <div className="h-1.5 w-1.5 bg-action-primary rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant="outline-action" className="w-full">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Services */}
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-transport-primary mb-2">
              Additional Services
            </h3>
            <p className="text-neutral-600">
              Comprehensive support services to enhance your logistics operations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalServices.map((service, index) => (
              <Card key={index} className="p-6 shadow-transport hover:shadow-transport-elevated transition-smooth">
                <div className="flex items-start space-x-4">
                  <div className="p-2 rounded-lg bg-transport-accent-light">
                    <service.icon className="h-5 w-5 text-transport-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-transport-primary mb-2">
                      {service.title}
                    </h4>
                    <p className="text-sm text-neutral-600">
                      {service.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="p-8 action-gradient text-white shadow-action">
            <div className="max-w-2xl mx-auto space-y-4">
              <h3 className="text-2xl font-bold">
                Ready to Streamline Your Logistics?
              </h3>
              <p className="text-white/90">
                Join hundreds of businesses that trust us with their delivery needs. 
                Get started with a free consultation and custom quote.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button variant="secondary" size="lg">
                  Schedule Consultation
                </Button>
                <Button variant="outline" size="lg" className="bg-white/10 border-white text-white hover:bg-white hover:text-action-primary">
                  Get Custom Quote
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Services;