import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Building, Phone, Mail, MapPin } from "lucide-react";

const CustomerManagement = () => {
  const customers = [
    {
      id: "CUST001",
      companyName: "TechCorp Solutions",
      contactPerson: "Rahul Sharma",
      email: "rahul@techcorp.com",
      phone: "+91 98765 43210",
      gst: "27AABCT1332L1ZZ",
      totalBookings: 45,
      status: "active",
      location: "Mumbai, Maharashtra"
    },
    {
      id: "CUST002", 
      companyName: "Global Imports Ltd",
      contactPerson: "Priya Patel",
      email: "priya@globalimports.com",
      phone: "+91 87654 32109",
      gst: "09AABCT1332L1YY",
      totalBookings: 23,
      status: "active",
      location: "Delhi, Delhi"
    },
    {
      id: "CUST003",
      companyName: "FastTrack Logistics",
      contactPerson: "Amit Kumar",
      email: "amit@fasttrack.com", 
      phone: "+91 76543 21098",
      gst: "19AABCT1332L1XX",
      totalBookings: 67,
      status: "inactive",
      location: "Bangalore, Karnataka"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-transport-primary">Customer Management</h3>
          <p className="text-neutral-600">Manage all business customers and their details</p>
        </div>
        <Button variant="action">
          <Users className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                <Input placeholder="Search customers..." className="pl-10" />
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="cursor-pointer">All ({customers.length})</Badge>
              <Badge variant="outline" className="cursor-pointer">Active ({customers.filter(c => c.status === 'active').length})</Badge>
              <Badge variant="outline" className="cursor-pointer">Inactive ({customers.filter(c => c.status === 'inactive').length})</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Cards */}
      <div className="grid gap-6">
        {customers.map((customer) => (
          <Card key={customer.id} className="shadow-transport">
            <CardContent className="p-6">
              <div className="grid lg:grid-cols-4 gap-6">
                {/* Company Info */}
                <div className="lg:col-span-2">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-transport-primary mb-1">
                        {customer.companyName}
                      </h4>
                      <p className="text-sm text-neutral-600">ID: {customer.id}</p>
                    </div>
                    <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                      {customer.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Building className="h-4 w-4 mr-2 text-neutral-400" />
                      <span className="font-medium mr-2">Contact:</span>
                      {customer.contactPerson}
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-neutral-400" />
                      {customer.email}
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-neutral-400" />
                      {customer.phone}
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-neutral-400" />
                      {customer.location}
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div>
                  <h5 className="font-semibold text-transport-primary mb-3">Business Details</h5>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-neutral-500">GST Number</span>
                      <p className="text-sm font-mono">{customer.gst}</p>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-500">Total Bookings</span>
                      <p className="text-lg font-semibold text-action-primary">{customer.totalBookings}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm">View Bookings</Button>
                  <Button variant="outline" size="sm">Send Invoice</Button>
                  <Button variant="outline" size="sm">Edit Details</Button>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive hover:text-white">
                    {customer.status === 'active' ? 'Deactivate' : 'Activate'}
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

export default CustomerManagement;