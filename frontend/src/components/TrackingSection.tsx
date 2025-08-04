import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Loader
} from "lucide-react";

const TrackingSection = () => {
  const [trackingId, setTrackingId] = useState("");

  // Mock tracking data
  const trackingSteps = [
    {
      status: "completed",
      title: "Order Confirmed",
      description: "Your booking has been confirmed and assigned",
      time: "Today, 9:00 AM",
      location: "Mumbai Warehouse"
    },
    {
      status: "completed", 
      title: "Package Picked Up",
      description: "Package collected from origin location",
      time: "Today, 10:30 AM",
      location: "Mumbai, Maharashtra"
    },
    {
      status: "current",
      title: "In Transit",
      description: "Package is on the way to destination",
      time: "Today, 2:15 PM",
      location: "Highway - Mumbai to Delhi"
    },
    {
      status: "pending",
      title: "Out for Delivery",
      description: "Package will be delivered soon",
      time: "Expected: Tomorrow, 11:00 AM",
      location: "Delhi Hub"
    },
    {
      status: "pending",
      title: "Delivered",
      description: "Package delivered to recipient",
      time: "Expected: Tomorrow, 12:00 PM",
      location: "Delhi, Delhi"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-status-success" />;
      case "current":
        return <Loader className="h-5 w-5 text-action-primary animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-neutral-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-status-success";
      case "current":
        return "bg-action-primary";
      default:
        return "bg-neutral-300";
    }
  };

  return (
    <section id="tracking" className="py-20 bg-neutral-50">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-transport-accent-light text-transport-primary text-sm font-medium">
              <Package className="h-4 w-4 mr-2" />
              Real-time Tracking
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-transport-primary">
              Track Your Delivery
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Enter your tracking ID to get real-time updates on your package location and delivery status.
            </p>
          </div>

          {/* Tracking Input */}
          <Card className="mb-8 shadow-transport">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Enter tracking ID (e.g., CF123456789)"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    className="text-lg h-12"
                  />
                </div>
                <Button variant="action" size="lg" className="sm:w-auto w-full">
                  <Search className="h-5 w-5 mr-2" />
                  Track Package
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Results */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Package Info */}
            <Card className="shadow-transport">
              <CardHeader>
                <CardTitle className="flex items-center text-transport-primary">
                  <Package className="h-5 w-5 mr-2" />
                  Package Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-neutral-700">Tracking ID</p>
                  <p className="text-lg font-mono">CF123456789</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-700">Service Type</p>
                  <Badge variant="secondary">Express Delivery</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-700">Weight</p>
                  <p>2.5 kg</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-700">Current Status</p>
                  <Badge className="bg-action-primary text-white">In Transit</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Tracking Timeline */}
            <div className="lg:col-span-2">
              <Card className="shadow-transport">
                <CardHeader>
                  <CardTitle className="flex items-center text-transport-primary">
                    <MapPin className="h-5 w-5 mr-2" />
                    Tracking Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {trackingSteps.map((step, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        {/* Timeline Dot */}
                        <div className="flex flex-col items-center">
                          <div className={`p-1 rounded-full ${getStatusColor(step.status)}`}>
                            {getStatusIcon(step.status)}
                          </div>
                          {index < trackingSteps.length - 1 && (
                            <div className={`w-0.5 h-12 mt-2 ${
                              step.status === 'completed' ? 'bg-status-success' : 'bg-neutral-300'
                            }`}></div>
                          )}
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 pb-6">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`font-semibold ${
                              step.status === 'current' ? 'text-action-primary' : 'text-transport-primary'
                            }`}>
                              {step.title}
                            </h4>
                            <span className="text-sm text-neutral-500">{step.time}</span>
                          </div>
                          <p className="text-sm text-neutral-600 mb-2">{step.description}</p>
                          <div className="flex items-center text-xs text-neutral-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            {step.location}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <Card className="p-6 bg-status-info/10 border-status-info/20">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-status-info mt-0.5" />
                <div>
                  <h4 className="font-semibold text-status-info mb-1">Delivery Information</h4>
                  <p className="text-sm text-neutral-600">
                    Your package will be delivered between 10:00 AM - 2:00 PM tomorrow. 
                    Please ensure someone is available to receive it.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start space-x-3">
                <Truck className="h-5 w-5 text-transport-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-transport-primary mb-1">Driver Information</h4>
                  <p className="text-sm text-neutral-600 mb-2">
                    Driver: Rajesh Kumar<br />
                    Vehicle: MH01AB1234<br />
                    Contact: +91 98765 43210
                  </p>
                  <Button variant="outline" size="sm">
                    Contact Driver
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrackingSection;