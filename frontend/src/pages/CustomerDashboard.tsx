import { useState } from "react";
import TrackingSection from "@/components/TrackingSection";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MyBookings from "@/components/customer/MyBookings";
import InvoiceManager from "@/components/customer/InvoiceManager"
import DriverInfo from "@/components/customer/DriverInfo";
import NewBooking from "@/components/customer/NewBooking";
import AddressManager from "@/components/customer/AddressManager";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Plus, 
  FileText, 
  MapPin, 
  User,
  BarChart3,
  Home
} from "lucide-react";

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState("bookings");

  const tabs = [
    { id: "bookings", label: "My Bookings", icon: Package },
    { id: "new-booking", label: "New Booking", icon: Plus },
    { id: "tracking", label: "Track Orders", icon: MapPin },
    { id: "addresses", label: "Addresses", icon: Home },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "drivers", label: "Driver Info", icon: User }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "bookings":
        return <MyBookings />;
      case "new-booking":
        return <NewBooking />;
      case "tracking":
        return <TrackingSection />;
      case "addresses":
        return <AddressManager />;
      case "invoices":
        return <InvoiceManager />;
      case "drivers":
        return <DriverInfo />;
      default:
        return <MyBookings />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="py-8 bg-neutral-50">
          <div className="container">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl lg:text-4xl font-bold text-transport-primary mb-4">
                  Customer Dashboard
                </h1>
                <p className="text-lg text-neutral-600">
                  Manage your bookings and track your deliveries
                </p>
              </div>

              {/* Navigation Tabs */}
              <Card className="mb-8 shadow-transport">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <Button
                          key={tab.id}
                          variant={activeTab === tab.id ? "action" : "outline"}
                          size="sm"
                          onClick={() => setActiveTab(tab.id)}
                          className="flex items-center space-x-2"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{tab.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Content Area */}
              <div className="min-h-[600px]">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CustomerDashboard;