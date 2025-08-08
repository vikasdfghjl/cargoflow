import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, 
  Search, 
  Clock, 
  CheckCircle, 
  Truck, 
  AlertCircle,
  MapPin,
  Calendar,
  DollarSign,
  RefreshCw,
  User,
  Phone,
  Eye,
  Edit,
  UserCheck
} from "lucide-react";
import { bookingApi, type AdminBookingsResponse, type Booking } from "@/lib/api";
import ChangeDriverDialog from "./ChangeDriverDialog";

interface BookingStats {
  totalBookings: Array<{ count: number }>;
  todayBookings: Array<{ count: number }>;
  statusCounts: Array<{ _id: string; count: number }>;
  monthlyRevenue: Array<{ _id: null; total: number }>;
}

const BookingOverview = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBookings: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedBookingForDriverChange, setSelectedBookingForDriverChange] = useState<Booking | null>(null);
  const [isChangeDriverDialogOpen, setIsChangeDriverDialogOpen] = useState(false);

  // Fetch bookings from API using the centralized API service
  const fetchBookings = async (page = 1, status = 'all') => {
    try {
      setLoading(true);
      setError(null);
      
      const response: AdminBookingsResponse = await bookingApi.getAllBookings({
        page,
        limit: 20,
        status: status !== 'all' ? status : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      setBookings(response.bookings);
      setPagination(response.pagination);
      if (response.statistics) {
        setStats(response.statistics);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeDriver = (booking: Booking) => {
    setSelectedBookingForDriverChange(booking);
    setIsChangeDriverDialogOpen(true);
  };

  const handleDriverChanged = () => {
    // Refresh bookings data after driver change
    fetchBookings(pagination.currentPage, statusFilter);
  };

  // Update booking status
  const updateBookingStatus = async (bookingId: string, newStatus: string, driverId?: string) => {
    try {
      setUpdating(bookingId);
      setError(null);

      const response = await fetch(`http://localhost:5000/api/v1/bookings/admin/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ 
          status: newStatus,
          ...(driverId && { driverId })
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh bookings to show updated status
        await fetchBookings(pagination.currentPage, statusFilter);
      } else {
        throw new Error(result.message || 'Failed to update booking status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking status');
      console.error('Error updating booking status:', err);
    } finally {
      setUpdating(null);
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    fetchBookings(newPage, statusFilter);
  };

  useEffect(() => {
    fetchBookings(1, statusFilter);
  }, [statusFilter]);

  // Filter bookings based on search term
  const filteredBookings = bookings.filter(booking => 
    booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (booking.trackingNumber && booking.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    `${booking.customerId.firstName} ${booking.customerId.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.customerId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.pickupAddress.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.deliveryAddress.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to get stats values safely
  const getStatsValue = (statArray: Array<{ count: number }> | undefined): number => {
    return statArray && statArray.length > 0 ? statArray[0].count : 0;
  };

  const getStatusCount = (status: string): number => {
    if (!stats?.statusCounts) return 0;
    const statusStat = stats.statusCounts.find(s => s._id === status);
    return statusStat ? statusStat.count : 0;
  };

  const getTotalRevenue = (): number => {
    if (!stats?.monthlyRevenue || stats.monthlyRevenue.length === 0) return 0;
    return stats.monthlyRevenue[0].total || 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'picked_up': return 'bg-purple-100 text-purple-800';
      case 'in_transit': return 'bg-orange-100 text-orange-800';
      case 'out_for_delivery': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'picked_up': return <Package className="h-4 w-4" />;
      case 'in_transit': return <Truck className="h-4 w-4" />;
      case 'out_for_delivery': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading bookings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-32">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <span className="ml-2 text-red-600">{error}</span>
              <Button 
                onClick={() => fetchBookings(pagination.currentPage, statusFilter)}
                variant="outline" 
                size="sm" 
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatsValue(stats.totalBookings)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatsValue(stats.todayBookings)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStatusCount('pending')}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(getTotalRevenue())}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by booking number, tracking ID, customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              // Reset to page 1 when changing filter
              fetchBookings(1, value);
            }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="picked_up">Picked Up</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={() => fetchBookings(pagination.currentPage, statusFilter)}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No bookings found</p>
                {searchTerm && (
                  <p className="text-sm text-gray-500 mt-2">
                    Try adjusting your search criteria
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking._id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Booking Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">{booking.bookingNumber}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Tracking: {booking.trackingNumber || 'Not assigned'}
                    </p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(booking.status)}
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-2">
                    <p className="font-medium">
                      {`${booking.customerId.firstName} ${booking.customerId.lastName}`}
                    </p>
                    <p className="text-sm text-gray-600">{booking.customerId.email}</p>
                    <p className="text-sm text-gray-600">
                      Weight: {booking.weight}kg • {booking.serviceType.replace('_', ' ')}
                    </p>
                  </div>

                  {/* Route Info */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">From</p>
                        <p className="text-sm text-gray-600">
                          {booking.pickupAddress.city}, {booking.pickupAddress.postalCode}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">To</p>
                        <p className="text-sm text-gray-600">
                          {booking.deliveryAddress.city}, {booking.deliveryAddress.postalCode}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">{formatCurrency(booking.totalCost)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{formatDate(booking.createdAt)}</span>
                    </div>

                    {/* Driver Assignment Information */}
                    {booking.driverId && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-blue-900 flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            Package Assigned To
                          </h4>
                          <div className="text-xs space-y-1">
                            <p className="text-blue-800">
                              <strong>Driver:</strong> {booking.driverId.firstName} {booking.driverId.lastName}
                            </p>
                            <p className="text-blue-800">
                              <strong>Vehicle:</strong> {booking.driverId.vehicle?.number} ({booking.driverId.vehicle?.type})
                            </p>
                            <p className="text-blue-800">
                              <strong>Driver ID:</strong> {booking.driverId.licenseNumber}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChangeDriver(booking)}
                            className="mt-2 h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                          >
                            Change
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {booking.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateBookingStatus(booking._id, 'confirmed')}
                          disabled={updating === booking._id}
                        >
                          {updating === booking._id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            'Confirm'
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBookingStatus(booking._id, 'cancelled')}
                          disabled={updating === booking._id}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                    
                    {booking.status === 'confirmed' && (
                      <Button
                        size="sm"
                        onClick={() => updateBookingStatus(booking._id, 'picked_up')}
                        disabled={updating === booking._id}
                      >
                        {updating === booking._id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          'Mark Picked Up'
                        )}
                      </Button>
                    )}
                    
                    {booking.status === 'picked_up' && (
                      <Button
                        size="sm"
                        onClick={() => updateBookingStatus(booking._id, 'in_transit')}
                        disabled={updating === booking._id}
                      >
                        {updating === booking._id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          'In Transit'
                        )}
                      </Button>
                    )}
                    
                    {booking.status === 'in_transit' && (
                      <Button
                        size="sm"
                        onClick={() => updateBookingStatus(booking._id, 'out_for_delivery')}
                        disabled={updating === booking._id}
                      >
                        {updating === booking._id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          'Out for Delivery'
                        )}
                      </Button>
                    )}
                    
                    {booking.status === 'out_for_delivery' && (
                      <Button
                        size="sm"
                        onClick={() => updateBookingStatus(booking._id, 'delivered')}
                        disabled={updating === booking._id}
                      >
                        {updating === booking._id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          'Mark Delivered'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages} • Total: {pagination.totalBookings} bookings
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Change Driver Dialog */}
      <ChangeDriverDialog
        isOpen={isChangeDriverDialogOpen}
        onClose={() => {
          setIsChangeDriverDialogOpen(false);
          setSelectedBookingForDriverChange(null);
        }}
        booking={selectedBookingForDriverChange}
        onDriverChanged={handleDriverChanged}
      />
    </div>
  );
};

export default BookingOverview;