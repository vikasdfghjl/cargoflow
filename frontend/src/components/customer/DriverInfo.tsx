import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  Phone, 
  Truck, 
  MapPin, 
  Star,
  Clock,
  Package,
  MessageCircle,
  Search,
  Navigation,
  Shield,
  Award,
  Calendar
} from "lucide-react";

interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  rating: number;
  totalDeliveries: number;
  experience: string;
  status: string;
  currentLocation: string;
  vehicle: {
    number: string;
    type: string;
    model: string;
  };
  certifications: string[];
  currentBookings: Array<{
    id: string;
    from: string;
    to: string;
    status: string;
    eta: string;
  }>;
  completedBookings: Array<{
    id: string;
    from: string;
    to: string;
    completedDate: string;
    rating: number;
  }>;
}

const DriverInfo = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock driver data with associated bookings
  const drivers = [
    {
      id: "DR001",
      name: "Rajesh Kumar",
      phone: "+91 98765 43210",
      email: "rajesh.kumar@cargopath.com",
      rating: 4.8,
      totalDeliveries: 1247,
      experience: "5 years",
      status: "active",
      currentLocation: "Highway - Mumbai to Delhi",
      vehicle: {
        number: "MH12AB1234",
        type: "Truck",
        model: "Tata LPT 1613"
      },
      certifications: ["Safe Driver", "Heavy Vehicle License", "Hazmat Certified"],
      currentBookings: [
        {
          id: "CF123456789",
          from: "Mumbai, MH",
          to: "Delhi, DL",
          status: "in-transit",
          eta: "2025-08-05 11:00 AM"
        }
      ],
      completedBookings: [
        {
          id: "CF987654321",
          from: "Mumbai, MH",
          to: "Pune, MH",
          completedDate: "2025-08-01",
          rating: 5
        },
        {
          id: "CF456789123",
          from: "Delhi, DL",
          to: "Jaipur, RJ",
          completedDate: "2025-07-28",
          rating: 4
        }
      ]
    },
    {
      id: "DR002",
      name: "Vikram Singh",
      phone: "+91 87654 32109",
      email: "vikram.singh@cargopath.com",
      rating: 4.6,
      totalDeliveries: 856,
      experience: "3 years",
      status: "available",
      currentLocation: "Chennai Warehouse",
      vehicle: {
        number: "KA05CD5678",
        type: "Van",
        model: "Mahindra Bolero Pickup"
      },
      certifications: ["Safe Driver", "City Navigation Expert"],
      currentBookings: [],
      completedBookings: [
        {
          id: "CF789123456",
          from: "Bangalore, KA",
          to: "Chennai, TN",
          completedDate: "2025-08-02",
          rating: 5
        }
      ]
    },
    {
      id: "DR003",
      name: "Amit Sharma",
      phone: "+91 76543 21098",
      email: "amit.sharma@cargopath.com",
      rating: 4.9,
      totalDeliveries: 2134,
      experience: "8 years",
      status: "active",
      currentLocation: "Pune Warehouse",
      vehicle: {
        number: "MH14EF9012",
        type: "Heavy Truck",
        model: "Ashok Leyland 1620"
      },
      certifications: ["Safe Driver", "Heavy Vehicle License", "Hazmat Certified", "Senior Driver"],
      currentBookings: [
        {
          id: "CF456789123",
          from: "Pune, MH",
          to: "Hyderabad, TG",
          status: "picked-up",
          eta: "2025-08-06 2:00 PM"
        }
      ],
      completedBookings: [
        {
          id: "CF321654987",
          from: "Mumbai, MH",
          to: "Pune, MH",
          completedDate: "2025-08-03",
          rating: 5
        }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-status-success text-white";
      case "available":
        return "bg-status-info text-white";
      case "offline":
        return "bg-neutral-400 text-white";
      default:
        return "bg-neutral-400 text-white";
    }
  };

  const filteredDrivers = drivers.filter(driver => 
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.vehicle.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.currentBookings.some(booking => 
      booking.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const contactDriver = (driver: Driver) => {
    alert(`Calling ${driver.name} at ${driver.phone}`);
  };

  const sendMessage = (driver: Driver) => {
    alert(`Opening chat with ${driver.name}`);
  };

  const trackLocation = (driver: Driver) => {
    alert(`Tracking ${driver.name}'s current location: ${driver.currentLocation}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-transport-primary mb-2">Driver Information</h2>
        <p className="text-neutral-600 mb-6">View details of drivers assigned to your deliveries</p>
        
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search drivers, vehicles, or booking IDs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Drivers List */}
      <div className="grid gap-6">
        {filteredDrivers.map((driver) => (
          <Card key={driver.id} className="shadow-transport hover:shadow-transport-elevated transition-smooth">
            <CardHeader className="pb-4">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg font-semibold bg-transport-accent-light text-transport-primary">
                      {driver.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <CardTitle className="text-xl text-transport-primary">{driver.name}</CardTitle>
                      <Badge className={`${getStatusColor(driver.status)} capitalize`}>
                        {driver.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-neutral-600">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{driver.rating}</span>
                      </div>
                      <span>•</span>
                      <span>{driver.totalDeliveries} deliveries</span>
                      <span>•</span>
                      <span>{driver.experience} experience</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => contactDriver(driver)}
                    className="flex items-center space-x-2"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Call</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => sendMessage(driver)}
                    className="flex items-center space-x-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Message</span>
                  </Button>
                  <Button 
                    variant="action" 
                    size="sm"
                    onClick={() => trackLocation(driver)}
                    className="flex items-center space-x-2"
                  >
                    <Navigation className="h-4 w-4" />
                    <span>Track</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Contact and Vehicle Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-transport-primary">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm">{driver.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm">{driver.currentLocation}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-transport-primary">Vehicle Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <Truck className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm">{driver.vehicle.number} • {driver.vehicle.type}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Package className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm">{driver.vehicle.model}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Certifications */}
              <div>
                <h4 className="font-semibold text-transport-primary mb-3">Certifications</h4>
                <div className="flex flex-wrap gap-2">
                  {driver.certifications.map((cert, index) => (
                    <Badge key={index} variant="outline" className="flex items-center space-x-1">
                      <Award className="h-3 w-3" />
                      <span>{cert}</span>
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Current Bookings */}
              {driver.currentBookings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-transport-primary mb-3">Current Deliveries</h4>
                  <div className="space-y-2">
                    {driver.currentBookings.map((booking) => (
                      <div key={booking.id} className="bg-action-light p-3 rounded-lg">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <p className="font-medium text-action-primary">{booking.id}</p>
                            <p className="text-sm text-neutral-600">
                              {booking.from} → {booking.to}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-action-primary text-white mb-1">
                              {booking.status.replace('-', ' ').toUpperCase()}
                            </Badge>
                            <p className="text-sm text-neutral-600">ETA: {booking.eta}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recent Completed Deliveries */}
              <div>
                <h4 className="font-semibold text-transport-primary mb-3">Recent Completed Deliveries</h4>
                <div className="space-y-2">
                  {driver.completedBookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="bg-neutral-50 p-3 rounded-lg">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <p className="font-medium text-transport-primary">{booking.id}</p>
                          <p className="text-sm text-neutral-600">
                            {booking.from} → {booking.to}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1 mb-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{booking.rating}</span>
                          </div>
                          <p className="text-sm text-neutral-500">
                            {new Date(booking.completedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredDrivers.length === 0 && (
        <Card className="shadow-transport">
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-600 mb-2">No drivers found</h3>
            <p className="text-neutral-500">Try adjusting your search criteria or check back later</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DriverInfo;
