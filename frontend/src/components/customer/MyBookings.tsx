import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Package, 
  MapPin, 
  Clock, 
  User, 
  Phone,
  FileText,
  Eye,
  Download,
  Search,
  Filter,
  Truck,
  CheckCircle,
  AlertCircle,
  Loader
} from "lucide-react";
import { bookingApi, type BookingsResponse } from "@/lib/api";
import type { Booking } from "@/types/booking";

const MyBookings = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBookings: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch bookings from API
  const fetchBookings = async (page = 1, status = statusFilter) => {
    try {
      setLoading(true);
      setError(null);
      
      const response: BookingsResponse = await bookingApi.getMyBookings({
        page,
        limit: 10,
        status: status !== 'all' ? status : undefined,
      });
      
      setBookings(response.bookings);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load bookings on component mount and when status filter changes
  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response: BookingsResponse = await bookingApi.getMyBookings({
          page: 1,
          limit: 10,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        });
        
        setBookings(response.bookings);
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [statusFilter]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    fetchBookings(newPage, statusFilter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-status-success text-white";
      case "in_transit":
        return "bg-action-primary text-white";
      case "picked_up":
        return "bg-status-info text-white";
      case "confirmed":
        return "bg-status-warning text-white";
      case "out_for_delivery":
        return "bg-orange-500 text-white";
      default:
        return "bg-neutral-400 text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "in_transit":
      case "out_for_delivery":
        return <Truck className="h-4 w-4" />;
      case "picked_up":
        return <Package className="h-4 w-4" />;
      case "confirmed":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatAddress = (address: Booking['pickupAddress'] | Booking['deliveryAddress']) => {
    return `${address.city}, ${address.postalCode}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatWeight = (weight: number) => {
    return `${weight} kg`;
  };

  const formatCost = (cost: number) => {
    return `₹${cost}`;
  };

  // Client-side filtering for search functionality
  const filteredBookings = bookings.filter(booking => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      booking.bookingNumber.toLowerCase().includes(searchLower) ||
      booking.pickupAddress.city.toLowerCase().includes(searchLower) ||
      booking.deliveryAddress.city.toLowerCase().includes(searchLower) ||
      booking.packageType.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div>
          <h2 className="text-2xl font-bold text-transport-primary">My Bookings</h2>
          <p className="text-neutral-600">Manage and track all your parcel bookings</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="picked_up">Picked Up</option>
            <option value="in_transit">In Transit</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="shadow-transport">
          <CardContent className="text-center py-12">
            <Loader className="h-8 w-8 text-transport-primary mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-neutral-600 mb-2">Loading bookings...</h3>
            <p className="text-neutral-500">Please wait while we fetch your bookings</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="shadow-transport">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Bookings</h3>
            <p className="text-neutral-500 mb-4">{error}</p>
            <Button onClick={() => fetchBookings(1, statusFilter)} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bookings List */}
      {!loading && !error && (
        <div className="grid gap-6">
          {filteredBookings.map((booking) => (
            <Card key={booking._id} className="shadow-transport hover:shadow-transport-elevated transition-smooth">
              <CardHeader className="pb-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="transport-gradient p-2 rounded-lg">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-transport-primary">{booking.bookingNumber}</CardTitle>
                      <p className="text-sm text-neutral-600">Booked on {formatDate(booking.createdAt)}</p>
                    </div>
                  </div>
                  
                  <Badge className={`${getStatusColor(booking.status)} flex items-center space-x-1`}>
                    {getStatusIcon(booking.status)}
                    <span className="capitalize">{booking.status.replace('_', ' ')}</span>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Route Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-transport-primary" />
                      <div>
                        <p className="text-sm font-medium text-transport-primary">From</p>
                        <p className="text-sm text-neutral-600">{formatAddress(booking.pickupAddress)}</p>
                        <p className="text-xs text-neutral-500">{booking.pickupAddress.contactName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-action-primary" />
                      <div>
                        <p className="text-sm font-medium text-transport-primary">To</p>
                        <p className="text-sm text-neutral-600">{formatAddress(booking.deliveryAddress)}</p>
                        <p className="text-xs text-neutral-500">{booking.deliveryAddress.contactName}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Package className="h-4 w-4 text-transport-primary" />
                      <div>
                        <p className="text-sm font-medium text-transport-primary">Package Details</p>
                        <p className="text-sm text-neutral-600 capitalize">{booking.packageType} • {formatWeight(booking.weight)}</p>
                        {booking.dimensions && (
                          <p className="text-xs text-neutral-500">
                            {booking.dimensions.length}×{booking.dimensions.width}×{booking.dimensions.height} cm
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-transport-primary" />
                      <div>
                        <p className="text-sm font-medium text-transport-primary">Delivery Schedule</p>
                        <p className="text-sm text-neutral-600">Pickup: {formatDate(booking.pickupDate)}</p>
                        {booking.estimatedDeliveryDate && (
                          <p className="text-xs text-neutral-500">Est. Delivery: {formatDate(booking.estimatedDeliveryDate)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Driver Information */}
                <div className="bg-neutral-50 p-4 rounded-lg">
                  {booking.driverId ? (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-transport-accent-light rounded-lg">
                          <User className="h-4 w-4 text-transport-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-transport-primary">
                            Driver: {booking.driverId.firstName} {booking.driverId.lastName}
                          </p>
                          <p className="text-xs text-neutral-600">Assigned to your booking</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm text-neutral-600">{booking.driverId.phone}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-neutral-200 rounded-lg">
                        <User className="h-4 w-4 text-neutral-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-600">Driver Assignment</p>
                        <p className="text-xs text-neutral-500">Driver will be assigned soon</p>
                      </div>
                    </div>
                  )}
                  
                  {booking.trackingNumber && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-neutral-600">
                        <span className="font-medium">Tracking Number:</span> {booking.trackingNumber}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Special Instructions */}
                {booking.specialInstructions && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Special Instructions:</span> {booking.specialInstructions}
                    </p>
                  </div>
                )}
                
                {/* Cost and Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-neutral-600">Total Cost</p>
                    <p className="text-xl font-bold text-action-primary">{formatCost(booking.totalCost)}</p>
                    {booking.insurance && booking.insuranceValue && (
                      <p className="text-xs text-neutral-500">Insured for {formatCost(booking.insuranceValue)}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </Button>
                    {booking.status === 'delivered' && (
                      <Button variant="outline" size="sm" className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>View Invoice</span>
                      </Button>
                    )}
                    <Button variant="action" size="sm" className="flex items-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
          >
            Previous
          </Button>
          
          <span className="text-sm text-neutral-600">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
          >
            Next
          </Button>
        </div>
      )}
      
      {/* Empty State */}
      {!loading && !error && filteredBookings.length === 0 && bookings.length === 0 && (
        <Card className="shadow-transport">
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-600 mb-2">No bookings found</h3>
            <p className="text-neutral-500 mb-4">You haven't made any bookings yet. Start by creating your first booking!</p>
            <Button variant="action" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Create New Booking</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No Search Results */}
      {!loading && !error && filteredBookings.length === 0 && bookings.length > 0 && (
        <Card className="shadow-transport">
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-600 mb-2">No matching bookings</h3>
            <p className="text-neutral-500">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyBookings;
