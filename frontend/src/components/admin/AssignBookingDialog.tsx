import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  MapPin,
  Calendar,
  Package,
  Truck,
  User,
  AlertCircle,
  Loader2,
  Search,
} from 'lucide-react';
import { Driver, Booking, driverApi, bookingApi, ApiError } from '@/lib/api';

interface AssignBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver;
  onAssignmentComplete: () => void;
}

const AssignBookingDialog: React.FC<AssignBookingDialogProps> = ({
  isOpen,
  onClose,
  driver,
  onAssignmentComplete,
}) => {
  const [availableBookings, setAvailableBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadAvailableBookings();
    }
  }, [isOpen]);

  const loadAvailableBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get all bookings that are confirmed but not assigned to any driver
      const response = await bookingApi.getAllBookings({
        page: 1,
        limit: 50,
        status: 'confirmed',
      });
      
      // Filter out bookings that already have a driver
      const unassignedBookings = response.bookings.filter(booking => !booking.driverId);
      setAvailableBookings(unassignedBookings);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load available bookings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssignBooking = async (bookingId: string) => {
    try {
      setAssigning(bookingId);
      setError(null);
      await driverApi.assignDriverToBooking(driver.id, bookingId);
      onAssignmentComplete();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to assign booking');
      }
    } finally {
      setAssigning(null);
    }
  };

  const filteredBookings = availableBookings.filter(booking => 
    booking.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.customerId.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.customerId.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.pickupAddress.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.deliveryAddress.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getServiceTypeColor = (serviceType: string) => {
    switch (serviceType) {
      case 'same_day':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'express':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'standard':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-transport-primary" />
            Assign Booking to {driver.fullName}
          </DialogTitle>
          <DialogDescription>
            Select a confirmed booking to assign to this driver (only confirmed bookings are available for assignment)
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
          <Input
            placeholder="Search confirmed bookings by number, customer, or address..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-transport-primary" />
            <span className="ml-2">Loading available bookings...</span>
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-600 mb-2">
                No available confirmed bookings
              </h3>
              <p className="text-neutral-500">
                {availableBookings.length === 0
                  ? "There are no confirmed bookings ready for assignment at the moment."
                  : "No confirmed bookings match your search criteria."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredBookings.map((booking) => (
              <Card key={booking._id} className="border border-gray-200 hover:border-transport-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-semibold">Booking #{booking.bookingNumber}</h4>
                        <p className="text-sm text-neutral-600">
                          {booking.customerId.firstName} {booking.customerId.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getServiceTypeColor(booking.serviceType)}>
                        {booking.serviceType.replace('_', ' ')}
                      </Badge>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        ✓ Confirmed
                      </Badge>
                      <Badge variant="outline">
                        {booking.weight} kg
                      </Badge>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                        <div>
                          <span className="text-xs font-medium text-green-600">PICKUP</span>
                          <p className="text-sm text-neutral-700">{booking.pickupAddress.address}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-red-600 mt-0.5" />
                        <div>
                          <span className="text-xs font-medium text-red-600">DELIVERY</span>
                          <p className="text-sm text-neutral-700">{booking.deliveryAddress.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-neutral-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(booking.pickupDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        {booking.packageType}
                      </div>
                      <div className="font-semibold text-transport-primary">
                        ${booking.totalCost}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAssignBooking(booking._id)}
                      disabled={assigning === booking._id}
                      className="bg-transport-primary hover:bg-transport-primary/90"
                    >
                      {assigning === booking._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Assign'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignBookingDialog;
