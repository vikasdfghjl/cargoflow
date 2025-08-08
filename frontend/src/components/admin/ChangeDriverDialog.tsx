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
  Truck,
  User,
  AlertCircle,
  Loader2,
  Search,
  Phone,
  MapPin,
} from 'lucide-react';
import { Driver, Booking, driverApi, bookingApi, ApiError } from '@/lib/api';

interface ChangeDriverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onDriverChanged: () => void;
}

const ChangeDriverDialog: React.FC<ChangeDriverDialogProps> = ({
  isOpen,
  onClose,
  booking,
  onDriverChanged,
}) => {
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadAvailableDrivers();
    }
  }, [isOpen]);

  const loadAvailableDrivers = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get active drivers
      const response = await driverApi.getAllDrivers({
        page: 1,
        limit: 50,
        status: 'active',
        sortBy: 'fullName',
        sortOrder: 'asc'
      });
      setAvailableDrivers(response.drivers);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load available drivers');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangeDriver = async (newDriverId: string) => {
    if (!booking) return;
    
    try {
      setChanging(newDriverId);
      setError(null);

      // Assign the new driver to the booking
      await driverApi.assignDriverToBooking(newDriverId, booking._id);

      // Refresh the available drivers list to show updated delivery counts
      await loadAvailableDrivers();
      
      onDriverChanged();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to change driver');
      }
    } finally {
      setChanging(null);
    }
  };

  const filteredDrivers = availableDrivers.filter(driver => 
    driver.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.phone.includes(searchQuery) ||
    driver.vehicle.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-status-success text-white';
      case 'inactive': return 'bg-neutral-500 text-white';
      case 'suspended': return 'bg-status-error text-white';
      default: return 'bg-neutral-300';
    }
  };

  // Don't render if no booking is selected
  if (!booking) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-transport-primary" />
            Change Driver for Booking #{booking.bookingNumber}
          </DialogTitle>
          <DialogDescription>
            Select a new driver to assign to this booking
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Current Driver Info */}
        {booking.driverId && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Currently Assigned Driver</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="font-medium">{booking.driverId.firstName} {booking.driverId.lastName}</p>
                  <p className="text-sm text-neutral-600">ID: {booking.driverId._id}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" />
                    {booking.driverId.phone}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4" />
                    {booking.driverId.vehicle ? 
                      `${booking.driverId.vehicle.number} (${booking.driverId.vehicle.type})` : 
                      'Vehicle info not available'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
          <Input
            placeholder="Search drivers by name, phone, or vehicle number..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-transport-primary" />
            <span className="ml-2">Loading available drivers...</span>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Truck className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-600 mb-2">
                No drivers available
              </h3>
              <p className="text-neutral-500">
                {availableDrivers.length === 0
                  ? "There are no active drivers at the moment."
                  : "No drivers match your search criteria."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredDrivers.map((driver) => (
              <Card key={driver.id} className="border border-gray-200 hover:border-transport-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="grid md:grid-cols-4 gap-4 flex-1">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-transport-primary" />
                          <h4 className="font-semibold">{driver.fullName}</h4>
                        </div>
                        <p className="text-sm text-neutral-600">ID: {driver.id}</p>
                        <div className="mt-1">
                          <Badge className={getStatusColor(driver.status)}>
                            {driver.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Phone className="h-4 w-4 text-neutral-400" />
                          <span className="text-sm">{driver.phone}</span>
                        </div>
                        <p className="text-sm text-neutral-600">
                          Experience: {driver.experience} years
                        </p>
                        <p className="text-sm text-neutral-600">
                          Rating: ⭐ {driver.rating.toFixed(1)}
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Truck className="h-4 w-4 text-neutral-400" />
                          <span className="text-sm font-mono">{driver.vehicle.number}</span>
                        </div>
                        <p className="text-sm text-neutral-600">
                          {driver.vehicle.type} - {driver.vehicle.model}
                        </p>
                        <p className="text-sm text-neutral-600">
                          Capacity: {driver.vehicle.capacity} kg
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-neutral-400" />
                          <Badge className={driver.availability.isAvailable ? 'bg-status-success text-white' : 'bg-neutral-500 text-white'}>
                            {driver.availability.isAvailable ? 'Available' : 'Busy'}
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-600">
                          Total: {driver.totalDeliveries} deliveries
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleChangeDriver(driver.id)}
                      disabled={changing === driver.id || booking.driverId?._id === driver.id}
                      className="bg-transport-primary hover:bg-transport-primary/90 ml-4"
                    >
                      {changing === driver.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : booking.driverId?._id === driver.id ? (
                        'Current'
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

export default ChangeDriverDialog;
