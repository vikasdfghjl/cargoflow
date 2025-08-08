import React, { useState, useEffect, useCallback } from 'react';
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
import {
  MapPin,
  Calendar,
  Package,
  Truck,
  Clock,
  User,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Driver, Booking, driverApi, ApiError } from '@/lib/api';

interface ViewAssignmentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver;
  onAssignBooking: (driverId: string) => void;
}

const ViewAssignmentsDialog: React.FC<ViewAssignmentsDialogProps> = ({
  isOpen,
  onClose,
  driver,
  onAssignBooking,
}) => {
  const [assignments, setAssignments] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDriverAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await driverApi.getDriverBookings(driver.id);
      // Ensure response is an array
      if (Array.isArray(response)) {
        setAssignments(response);
      } else {
        console.error('API response is not an array:', response);
        setAssignments([]);
        setError('Invalid response format from server');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load driver assignments');
      }
      setAssignments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [driver.id]);

  useEffect(() => {
    if (isOpen && driver.id) {
      loadDriverAssignments();
    }
  }, [isOpen, driver.id, loadDriverAssignments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'picked_up':
        return 'bg-blue-500 text-white';
      case 'in_transit':
      case 'out_for_delivery':
        return 'bg-amber-500 text-white';
      case 'delivered':
        return 'bg-green-500 text-white';
      case 'pending':
      case 'confirmed':
        return 'bg-gray-500 text-white';
      case 'cancelled':
      case 'failed':
        return 'bg-red-500 text-white';
      default:
        return 'bg-neutral-300 text-black';
    }
  };

  const currentDelivery = Array.isArray(assignments) ? assignments.find(
    (assignment) => assignment.status === 'in_transit' || assignment.status === 'picked_up' || assignment.status === 'out_for_delivery'
  ) : null;

  const upcomingAssignments = Array.isArray(assignments) ? assignments.filter(
    (assignment) => assignment.status === 'pending' || assignment.status === 'confirmed'
  ) : [];

  const completedAssignments = Array.isArray(assignments) ? assignments.filter(
    (assignment) => assignment.status === 'delivered'
  ) : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-transport-primary" />
            Assignments for {driver.fullName}
          </DialogTitle>
          <DialogDescription>
            View current and upcoming deliveries for this driver
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-transport-primary" />
            <span className="ml-2">Loading assignments...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Driver Status Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-transport-primary">
                      {Array.isArray(assignments) ? assignments.length : 0}
                    </div>
                    <div className="text-sm text-neutral-600">Total Assignments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {currentDelivery ? 1 : 0}
                    </div>
                    <div className="text-sm text-neutral-600">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {upcomingAssignments.length}
                    </div>
                    <div className="text-sm text-neutral-600">Upcoming</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {completedAssignments.length}
                    </div>
                    <div className="text-sm text-neutral-600">Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Delivery */}
            {currentDelivery ? (
              <div>
                <h3 className="text-lg font-semibold text-transport-primary mb-3">
                  Current Delivery
                </h3>
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">Booking #{currentDelivery.bookingNumber}</h4>
                          <Badge className={getStatusColor(currentDelivery.status)}>
                            {currentDelivery.status.replace('-', ' ')}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-neutral-400" />
                            Customer: {currentDelivery.customerId.firstName} {currentDelivery.customerId.lastName}
                          </div>
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2 text-neutral-400" />
                            Weight: {currentDelivery.weight} kg
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-neutral-400" />
                            Pickup: {new Date(currentDelivery.pickupDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">From:</span>
                            <p className="text-neutral-600">{currentDelivery.pickupAddress.address}</p>
                          </div>
                          <div>
                            <span className="font-medium">To:</span>
                            <p className="text-neutral-600">{currentDelivery.deliveryAddress.address}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {/* Upcoming Assignments */}
            {upcomingAssignments.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-transport-primary mb-3">
                  Upcoming Assignments ({upcomingAssignments.length})
                </h3>
                <div className="space-y-3">
                  {upcomingAssignments.slice(0, 3).map((assignment) => (
                    <Card key={assignment._id} className="border-l-4 border-l-amber-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">Booking #{assignment.bookingNumber}</h4>
                          <div className="flex gap-2">
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                              {assignment.serviceType} service
                            </Badge>
                            <Badge className={getStatusColor(assignment.status)}>
                              {assignment.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Customer:</span>
                            <p className="text-neutral-600">{assignment.customerId.firstName} {assignment.customerId.lastName}</p>
                          </div>
                          <div>
                            <span className="font-medium">Pickup Date:</span>
                            <p className="text-neutral-600">
                              {new Date(assignment.pickupDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Weight:</span>
                            <p className="text-neutral-600">{assignment.weight} kg</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {upcomingAssignments.length > 3 && (
                    <p className="text-sm text-neutral-500 text-center">
                      And {upcomingAssignments.length - 3} more upcoming assignments...
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            {/* No Assignments State */}
            {!Array.isArray(assignments) || assignments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-600 mb-2">
                    No assignments yet
                  </h3>
                  <p className="text-neutral-500 mb-4">
                    This driver doesn't have any assignments. Assign a booking to get started.
                  </p>
                  <Button
                    onClick={() => onAssignBooking(driver.id)}
                    className="bg-transport-primary hover:bg-transport-primary/90"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Assign Booking
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Assign More Button */
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => onAssignBooking(driver.id)}
                  className="border-transport-primary text-transport-primary hover:bg-transport-primary hover:text-white"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Assign More Bookings
                </Button>
              </div>
            )}

            {/* Recent Completed Assignments */}
            {completedAssignments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-transport-primary mb-3">
                  Recently Completed ({completedAssignments.slice(0, 3).length})
                </h3>
                <div className="space-y-2">
                  {completedAssignments.slice(0, 3).map((assignment) => (
                    <Card key={assignment._id} className="border-l-4 border-l-green-500">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div>
                              <h4 className="font-medium">Booking #{assignment.bookingNumber}</h4>
                              <p className="text-sm text-neutral-600">{assignment.customerId.firstName} {assignment.customerId.lastName}</p>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <Badge className={getStatusColor(assignment.status)}>
                              {assignment.status.replace('_', ' ')}
                            </Badge>
                            <p className="text-neutral-500 mt-1">
                              {assignment.deliveredAt ? new Date(assignment.deliveredAt).toLocaleDateString() : new Date(assignment.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewAssignmentsDialog;
