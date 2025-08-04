import { useState } from "react";
import TrackingSection from "@/components/TrackingSection";
import CustomerManagement from "@/components/admin/CustomerManagement";
import DriverManagement from "@/components/admin/DriverManagement";
import BookingOverview from "@/components/admin/BookingOverview";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Package, 
  MapPin, 
  BarChart3 
} from "lucide-react";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "bookings", label: "Bookings", icon: Package },
    { id: "customers", label: "Customers", icon: Users },
    { id: "drivers", label: "Drivers", icon: Truck },
    { id: "tracking", label: "Tracking", icon: MapPin },
    { id: "analytics", label: "Analytics", icon: BarChart3 }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "customers":
        return <CustomerManagement />;
      case "drivers":
        return <DriverManagement />;
      case "bookings":
        return <BookingOverview />;
      case "tracking":
        return <TrackingSection />;
      case "analytics":
        return <AdminAnalytics />;
      default:
        return <AdminAnalytics />;
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
                  Admin Dashboard
                </h1>
                <p className="text-lg text-neutral-600">
                  Comprehensive business management and analytics
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

export default AdminDashboard;