import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
  Package, 
  Truck, 
  DollarSign,
  MapPin,
  Clock,
  Star
} from "lucide-react";

const AdminAnalytics = () => {
  const stats = {
    totalRevenue: "₹2,45,680",
    revenueGrowth: "+12.5%",
    totalBookings: 1247,
    bookingsGrowth: "+8.3%",
    activeCustomers: 89,
    customersGrowth: "+15.2%",
    activeDrivers: 24,
    driversGrowth: "+5.1%"
  };

  const recentActivity = [
    {
      type: "booking",
      message: "New booking from TechCorp Solutions",
      time: "2 minutes ago",
      amount: "₹1,250"
    },
    {
      type: "delivery",
      message: "Package delivered by Rajesh Kumar",
      time: "15 minutes ago",
      trackingId: "CF123456789"
    },
    {
      type: "driver",
      message: "New driver Vikram Singh joined",
      time: "1 hour ago",
      location: "Delhi"
    },
    {
      type: "customer",
      message: "Global Imports Ltd upgraded to premium",
      time: "2 hours ago",
      amount: "₹5,000"
    }
  ];

  const topPerformers = [
    {
      name: "Rajesh Kumar",
      deliveries: 45,
      rating: 4.9,
      revenue: "₹23,450"
    },
    {
      name: "Suresh Patel", 
      deliveries: 38,
      rating: 4.7,
      revenue: "₹19,230"
    },
    {
      name: "Vikram Singh",
      deliveries: 42,
      rating: 4.8,
      revenue: "₹21,680"
    }
  ];

  const regions = [
    { name: "Mumbai", bookings: 345, revenue: "₹89,230" },
    { name: "Delhi", bookings: 298, revenue: "₹76,540" },
    { name: "Bangalore", bookings: 267, revenue: "₹65,890" },
    { name: "Chennai", bookings: 189, revenue: "₹45,670" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-transport-primary">Analytics & Reports</h3>
        <p className="text-neutral-600">Business insights and performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-transport">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total Revenue</p>
                <p className="text-2xl font-bold text-transport-primary">{stats.totalRevenue}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-status-success mr-1" />
                  <span className="text-sm text-status-success">{stats.revenueGrowth}</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-transport-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-transport">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Total Bookings</p>
                <p className="text-2xl font-bold text-transport-primary">{stats.totalBookings}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-status-success mr-1" />
                  <span className="text-sm text-status-success">{stats.bookingsGrowth}</span>
                </div>
              </div>
              <Package className="h-8 w-8 text-transport-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-transport">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Active Customers</p>
                <p className="text-2xl font-bold text-transport-primary">{stats.activeCustomers}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-status-success mr-1" />
                  <span className="text-sm text-status-success">{stats.customersGrowth}</span>
                </div>
              </div>
              <Users className="h-8 w-8 text-transport-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-transport">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Active Drivers</p>
                <p className="text-2xl font-bold text-transport-primary">{stats.activeDrivers}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-status-success mr-1" />
                  <span className="text-sm text-status-success">{stats.driversGrowth}</span>
                </div>
              </div>
              <Truck className="h-8 w-8 text-transport-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="shadow-transport">
          <CardHeader>
            <CardTitle className="flex items-center text-transport-primary">
              <Clock className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-neutral-50">
                  <div className={`p-1 rounded-full ${
                    activity.type === 'booking' ? 'bg-action-primary' :
                    activity.type === 'delivery' ? 'bg-status-success' :
                    activity.type === 'driver' ? 'bg-transport-primary' :
                    'bg-status-info'
                  }`}>
                    {activity.type === 'booking' && <Package className="h-3 w-3 text-white" />}
                    {activity.type === 'delivery' && <Truck className="h-3 w-3 text-white" />}
                    {activity.type === 'driver' && <Users className="h-3 w-3 text-white" />}
                    {activity.type === 'customer' && <Star className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-neutral-500">{activity.time}</p>
                    {activity.amount && (
                      <p className="text-xs font-medium text-transport-primary">{activity.amount}</p>
                    )}
                    {activity.trackingId && (
                      <p className="text-xs font-mono text-neutral-600">{activity.trackingId}</p>
                    )}
                    {activity.location && (
                      <p className="text-xs text-neutral-600">{activity.location}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Drivers */}
        <Card className="shadow-transport">
          <CardHeader>
            <CardTitle className="flex items-center text-transport-primary">
              <Star className="h-5 w-5 mr-2" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((driver, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
                  <div>
                    <p className="font-medium text-transport-primary">{driver.name}</p>
                    <div className="flex items-center space-x-2 text-xs text-neutral-600">
                      <span>{driver.deliveries} deliveries</span>
                      <span>⭐ {driver.rating}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-action-primary">{driver.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Regional Performance */}
        <Card className="shadow-transport">
          <CardHeader>
            <CardTitle className="flex items-center text-transport-primary">
              <MapPin className="h-5 w-5 mr-2" />
              Regional Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {regions.map((region, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
                  <div>
                    <p className="font-medium text-transport-primary">{region.name}</p>
                    <p className="text-xs text-neutral-600">{region.bookings} bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-action-primary">{region.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;