import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  MapPin, 
  Calendar, 
  Truck, 
  DollarSign, 
  Loader2,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { adminApi, Booking, Customer, ApiError } from "@/lib/api";

interface CustomerBookingsDialogProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

const CustomerBookingsDialog: React.FC<CustomerBookingsDialogProps> = ({
  customer,
  isOpen,
  onClose
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBookings: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const fetchBookings = async (page = 1) => {
    if (!customer) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await adminApi.getCustomerBookings(customer.id, {
        page,
        limit: 5,
      });
      
      setBookings(response.bookings);
      setPagination(response.pagination);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to fetch customer bookings');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && customer) {
      fetchBookings();
    } else {
      setBookings([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalBookings: 0,
        hasNextPage: false,
        hasPrevPage: false
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, customer]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in_transit':
      case 'picked_up':
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bookings for {customer?.companyName || `${customer?.firstName} ${customer?.lastName}`}
          </DialogTitle>
          <DialogDescription>
            View all bookings made by this customer
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading bookings...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
            <Button 
              onClick={() => fetchBookings(pagination.currentPage)} 
              className="mt-2"
              variant="outline"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">This customer hasn't made any bookings yet.</p>
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking._id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {booking.bookingNumber}
                    </CardTitle>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Pickup Address */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <MapPin className="h-4 w-4 text-green-600" />
                        Pickup Address
                      </div>
                      <div className="bg-green-50 p-3 rounded-md">
                        <p className="font-medium">{booking.pickupAddress.contactName}</p>
                        <p className="text-sm text-gray-600">{booking.pickupAddress.address}</p>
                        <p className="text-sm text-gray-600">
                          {booking.pickupAddress.city}, {booking.pickupAddress.postalCode}
                        </p>
                        <p className="text-sm text-gray-600">{booking.pickupAddress.phone}</p>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <MapPin className="h-4 w-4 text-red-600" />
                        Delivery Address
                      </div>
                      <div className="bg-red-50 p-3 rounded-md">
                        <p className="font-medium">{booking.deliveryAddress.contactName}</p>
                        <p className="text-sm text-gray-600">{booking.deliveryAddress.address}</p>
                        <p className="text-sm text-gray-600">
                          {booking.deliveryAddress.city}, {booking.deliveryAddress.postalCode}
                        </p>
                        <p className="text-sm text-gray-600">{booking.deliveryAddress.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="grid md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Package</p>
                        <p className="text-sm font-medium">{booking.packageType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Service</p>
                        <p className="text-sm font-medium">{booking.serviceType.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Pickup Date</p>
                        <p className="text-sm font-medium">
                          {formatDate(booking.pickupDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Total Cost</p>
                        <p className="text-sm font-medium">₹{booking.totalCost}</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                    <span>Weight: {booking.weight} kg</span>
                    <span>Created: {formatDate(booking.createdAt)}</span>
                    {booking.trackingNumber && (
                      <span>Tracking: {booking.trackingNumber}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.currentPage} of {pagination.totalPages}
                  ({pagination.totalBookings} total bookings)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchBookings(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchBookings(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomerBookingsDialog;
