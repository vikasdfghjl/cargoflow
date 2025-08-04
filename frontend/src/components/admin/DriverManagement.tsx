import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Truck, Search, User, Phone, MapPin, Calendar, FileText } from "lucide-react";

const DriverManagement = () => {
  const drivers = [
    {
      id: "DRV001",
      name: "Rajesh Kumar",
      phone: "+91 98765 43210",
      email: "rajesh@cargoflow.com",
      licenseNumber: "MH01234567890",
      vehicleNumber: "MH01AB1234",
      vehicleType: "Truck",
      status: "available",
      totalDeliveries: 156,
      rating: 4.8,
      joinDate: "2023-01-15",
      currentLocation: "Mumbai, Maharashtra",
      documentsStatus: "verified"
    },
    {
      id: "DRV002",
      name: "Suresh Patel", 
      phone: "+91 87654 32109",
      email: "suresh@cargoflow.com",
      licenseNumber: "GJ01234567891",
      vehicleNumber: "GJ05CD5678",
      vehicleType: "Van",
      status: "on-delivery",
      totalDeliveries: 89,
      rating: 4.6,
      joinDate: "2023-03-20",
      currentLocation: "Ahmedabad, Gujarat",
      documentsStatus: "pending"
    },
    {
      id: "DRV003",
      name: "Vikram Singh",
      phone: "+91 76543 21098", 
      email: "vikram@cargoflow.com",
      licenseNumber: "DL01234567892",
      vehicleNumber: "DL08EF9012",
      vehicleType: "Motorcycle",
      status: "offline",
      totalDeliveries: 234,
      rating: 4.9,
      joinDate: "2022-11-10",
      currentLocation: "Delhi, Delhi",
      documentsStatus: "verified"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-status-success text-white';
      case 'on-delivery': return 'bg-action-primary text-white';
      case 'offline': return 'bg-neutral-500 text-white';
      default: return 'bg-neutral-300';
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-status-success text-white';
      case 'pending': return 'bg-status-warning text-white';
      case 'rejected': return 'bg-status-error text-white';
      default: return 'bg-neutral-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-transport-primary">Driver Management</h3>
          <p className="text-neutral-600">Manage drivers, vehicles, and assignments</p>
        </div>
        <Button variant="action">
          <Truck className="h-4 w-4 mr-2" />
          Add Driver
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                <Input placeholder="Search drivers..." className="pl-10" />
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="cursor-pointer">All ({drivers.length})</Badge>
              <Badge variant="outline" className="cursor-pointer">Available ({drivers.filter(d => d.status === 'available').length})</Badge>
              <Badge variant="outline" className="cursor-pointer">On Delivery ({drivers.filter(d => d.status === 'on-delivery').length})</Badge>
              <Badge variant="outline" className="cursor-pointer">Offline ({drivers.filter(d => d.status === 'offline').length})</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver Cards */}
      <div className="grid gap-6">
        {drivers.map((driver) => (
          <Card key={driver.id} className="shadow-transport">
            <CardContent className="p-6">
              <div className="grid lg:grid-cols-5 gap-6">
                {/* Driver Info */}
                <div className="lg:col-span-2">
                  <div className="flex items-start space-x-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`/placeholder-avatar-${driver.id}.jpg`} />
                      <AvatarFallback>{driver.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-transport-primary">
                          {driver.name}
                        </h4>
                        <Badge className={getStatusColor(driver.status)}>
                          {driver.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-600">ID: {driver.id}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-neutral-600">⭐ {driver.rating}</span>
                        <span className="text-xs text-neutral-400 ml-2">({driver.totalDeliveries} deliveries)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-neutral-400" />
                      {driver.phone}
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-neutral-400" />
                      {driver.currentLocation}
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-neutral-400" />
                      Joined: {new Date(driver.joinDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Vehicle & License Info */}
                <div>
                  <h5 className="font-semibold text-transport-primary mb-3">Vehicle & License</h5>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-neutral-500">Vehicle Number</span>
                      <p className="text-sm font-mono">{driver.vehicleNumber}</p>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-500">Vehicle Type</span>
                      <p className="text-sm">{driver.vehicleType}</p>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-500">License Number</span>
                      <p className="text-sm font-mono">{driver.licenseNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Documents & Stats */}
                <div>
                  <h5 className="font-semibold text-transport-primary mb-3">Status & Documents</h5>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-neutral-500">Document Status</span>
                      <div className="mt-1">
                        <Badge className={getDocumentStatusColor(driver.documentsStatus)}>
                          {driver.documentsStatus}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-500">Total Deliveries</span>
                      <p className="text-lg font-semibold text-action-primary">{driver.totalDeliveries}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    Track Location
                  </Button>
                  <Button variant="outline" size="sm">
                    View Assignments
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Documents
                  </Button>
                  <Button variant="outline" size="sm">Edit Profile</Button>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive hover:text-white">
                    Suspend
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DriverManagement;