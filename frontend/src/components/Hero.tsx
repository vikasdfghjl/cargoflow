import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Truck, Clock, Shield, MapPin, Package, Users } from "lucide-react";

const Hero = () => {
  const features = [
    {
      icon: Clock,
      title: "Real-time Tracking",
      description: "Monitor your deliveries live"
    },
    {
      icon: Shield,
      title: "Secure Transport",
      description: "Insured & protected cargo"
    },
    {
      icon: MapPin,
      title: "Wide Coverage",
      description: "Pan-India delivery network"
    }
  ];

  const stats = [
    { value: "10,000+", label: "Deliveries Completed" },
    { value: "500+", label: "Business Partners" },
    { value: "99.5%", label: "On-time Delivery" },
    { value: "24/7", label: "Customer Support" }
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-neutral-50 to-transport-accent-light py-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-action-light text-action-primary text-sm font-medium">
                <Package className="h-4 w-4 mr-2" />
                Professional B2B Transport Solutions
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-transport-primary leading-tight">
                Reliable Cargo
                <span className="block text-action-primary">Delivery Network</span>
              </h1>
              
              <p className="text-lg text-neutral-600 max-w-lg">
                Connect your business with our nationwide logistics network. 
                Fast, secure, and trackable parcel delivery services designed for B2B operations.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="action" 
                size="lg" 
                className="text-base"
                onClick={() => window.location.href = '/signin'}
              >
                Get Started Today
              </Button>
              <Button 
                variant="outline-action" 
                size="lg" 
                className="text-base"
                onClick={() => window.location.href = '/signin'}
              >
                Access Your Account
              </Button>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-transport-accent-light">
                    <feature.icon className="h-5 w-5 text-transport-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-transport-primary">{feature.title}</p>
                    <p className="text-xs text-neutral-500">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative">
            {/* Main Card */}
            <Card className="p-6 shadow-transport-elevated bg-white">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-transport-primary">Quick Quote</h3>
                  <div className="transport-gradient p-2 rounded-lg">
                    <Truck className="h-5 w-5 text-white" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-700">From</label>
                      <div className="mt-1 p-3 border rounded-md bg-neutral-50">
                        <p className="text-sm text-neutral-600">Mumbai, MH</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-neutral-700">To</label>
                      <div className="mt-1 p-3 border rounded-md bg-neutral-50">
                        <p className="text-sm text-neutral-600">Delhi, DL</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-neutral-700">Package Details</label>
                    <div className="mt-1 p-3 border rounded-md bg-neutral-50">
                      <p className="text-sm text-neutral-600">2kg • Electronics • Express</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-action-light rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-action-primary">Estimated Cost</p>
                      <p className="text-2xl font-bold text-action-primary">₹450</p>
                    </div>
                    <Button 
                      variant="action"
                      onClick={() => window.location.href = '/signin'}
                    >
                      Sign In to Book
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 p-3 bg-status-success text-white rounded-lg shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live Tracking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 pt-12 border-t">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl font-bold text-transport-primary">{stat.value}</p>
                <p className="text-sm text-neutral-600 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;