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
  Star,
  Loader2
} from "lucide-react";
import { useDashboardStats } from '@/hooks/useDashboardStats';

const AdminAnalytics = () => {
  const { stats: dashboardStats, loading, error } = useDashboardStats();

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Calculate growth percentages (placeholder logic - you can enhance this)
  const revenueGrowth = "+12.5%"; // This could be calculated from monthly data
  const bookingsGrowth = "+8.3%"; // This could be calculated from historical data
  const customersGrowth = "+5.7%"; // This could be calculated from registration trends  
  const driversGrowth = "+15.2%"; // This could be calculated from driver onboarding

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-transport-primary" />
        <span className="ml-2 text-transport-primary">Loading dashboard statistics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-transport-primary text-white rounded hover:bg-transport-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!dashboardStats) {
    return (
      <div className="text-center p-8">
        <p className="text-neutral-500">No dashboard data available</p>
      </div>
    );
  }

  const stats = {
    totalRevenue: formatCurrency(dashboardStats.revenue.total),
    revenueGrowth,
    totalBookings: dashboardStats.bookings.total,
    bookingsGrowth,
    activeCustomers: dashboardStats.customers.active,
    customersGrowth,
    activeDrivers: dashboardStats.drivers.active,
    driversGrowth
  };

  // Mock data for sections that should remain unchanged as requested
  const recentActivity = [
    {
      type: "booking",
      message: "New booking from Sharma Enterprises",
      time: "2 minutes ago",
      amount: "₹2,450",
      trackingId: "BK001247",
      location: "Mumbai → Pune"
    },
    {
      type: "delivery",
      message: "Package delivered to TechCorp Ltd",
      time: "15 minutes ago",
      amount: "₹3,200",
      trackingId: "BK001245"
    },
    {
      type: "driver",
      message: "New driver registered: Amit Kumar",
      time: "32 minutes ago",
      location: "Delhi Region"
    },
    {
      type: "customer",
      message: "Customer feedback: 5 stars",
      time: "45 minutes ago"
    },
    {
      type: "booking",
      message: "Express delivery scheduled",
      time: "1 hour ago",
      amount: "₹5,600",
      trackingId: "BK001243",
      location: "Chennai → Bangalore"
    }
  ];

  const topPerformers = [
    {
      name: "Rajesh Singh",
      deliveries: 45,
      rating: "4.9",
      revenue: "₹18,450"
    },
    {
      name: "Amit Patel",
      deliveries: 38,
      rating: "4.8",
      revenue: "₹15,200"
    },
    {
      name: "Suresh Kumar",
      deliveries: 32,
      rating: "4.7",
      revenue: "₹12,800"
    },
    {
      name: "Mohan Lal",
      deliveries: 28,
      rating: "4.6",
      revenue: "₹11,200"
    }
  ];

  const regions = [
    {
      name: "Mumbai Metropolitan",
      bookings: 342,
      revenue: "₹85,400"
    },
    {
      name: "Delhi NCR",
      bookings: 298,
      revenue: "₹72,600"
    },
    {
      name: "Bangalore Urban",
      bookings: 256,
      revenue: "₹64,200"
    },
    {
      name: "Chennai District",
      bookings: 189,
      revenue: "₹47,300"
    },
    {
      name: "Pune Division",
      bookings: 162,
      revenue: "₹40,500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Card className="shadow-transport">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Revenue</p>
                <p className="text-2xl font-bold text-transport-primary">{stats.totalRevenue}</p>
                <Badge variant="secondary" className="text-xs bg-status-success text-white mt-2">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stats.revenueGrowth}
                </Badge>
              </div>
              <div className="p-3 bg-action-primary/10 rounded-full">
                <DollarSign className="h-6 w-6 text-action-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Bookings */}
        <Card className="shadow-transport">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Bookings</p>
                <p className="text-2xl font-bold text-transport-primary">{stats.totalBookings}</p>
                <Badge variant="secondary" className="text-xs bg-status-success text-white mt-2">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stats.bookingsGrowth}
                </Badge>
              </div>
              <div className="p-3 bg-transport-primary/10 rounded-full">
                <Package className="h-6 w-6 text-transport-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Customers */}
        <Card className="shadow-transport">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Active Customers</p>
                <p className="text-2xl font-bold text-transport-primary">{stats.activeCustomers}</p>
                <Badge variant="secondary" className="text-xs bg-status-success text-white mt-2">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stats.customersGrowth}
                </Badge>
              </div>
              <div className="p-3 bg-status-info/10 rounded-full">
                <Users className="h-6 w-6 text-status-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Drivers */}
        <Card className="shadow-transport">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Active Drivers</p>
                <p className="text-2xl font-bold text-transport-primary">{stats.activeDrivers}</p>
                <Badge variant="secondary" className="text-xs bg-status-success text-white mt-2">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stats.driversGrowth}
                </Badge>
              </div>
              <div className="p-3 bg-status-warning/10 rounded-full">
                <Truck className="h-6 w-6 text-status-warning" />
              </div>
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