import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Truck, Search, User, Phone, MapPin, Calendar, FileText, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { Driver, driverApi, ApiError } from "@/lib/api";
import AddDriverDialog from "./AddDriverDialog";
import ViewAssignmentsDialog from "./ViewAssignmentsDialog";
import AssignBookingDialog from "./AssignBookingDialog";
import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

/*
 * Driver Status Management System:
 * 
 * ACTIVE → Driver is working and available for assignments
 *   ↓ Actions: "Set Inactive" (temporary break) | "Suspend Driver" (disciplinary)
 *   ⚠️ DELETE NOT ALLOWED - Must deactivate first
 *
 * INACTIVE → Driver is temporarily not working (vacation, break, etc.)
 *   ↓ Actions: "Activate" (return to work) | "Suspend Driver" (disciplinary)
 *   ✅ DELETE ALLOWED - Can be permanently removed
 *
 * SUSPENDED → Driver is blocked due to violations/complaints (admin action required)
 *   ↓ Actions: "Lift Suspension" (restore to inactive, then can be activated)
 *   ✅ DELETE ALLOWED - Can be permanently removed
 *
 * DELETE → Permanent removal from system (cannot be undone)
 *   - Only allowed for INACTIVE or SUSPENDED drivers
 *   - Active drivers must be deactivated first
 */

const DriverManagement = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isViewAssignmentsOpen, setIsViewAssignmentsOpen] = useState(false);
  const [isAssignBookingOpen, setIsAssignBookingOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load drivers on component mount
  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await driverApi.getAllDrivers({
        page: 1,
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setDrivers(response.drivers);
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to load drivers. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDriverAdded = () => {
    loadDrivers(); // Refresh the driver list
  };

  const handleViewAssignments = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsViewAssignmentsOpen(true);
  };

  const handleAssignBooking = (driverId: string) => {
    // Close the assignments dialog first
    setIsViewAssignmentsOpen(false);
    // Find the driver and open the assign booking dialog
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
      setSelectedDriver(driver);
      setIsAssignBookingOpen(true);
    }
  };

  const handleAssignmentComplete = () => {
    // Refresh drivers list to update assignment counts
    loadDrivers();
  };

  const handleStatusUpdate = async (driverId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      await driverApi.updateDriverStatus(driverId, newStatus);
      await loadDrivers(); // Refresh the list
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to update driver status');
      }
    }
  };

  const handleDeleteClick = (driver: Driver) => {
    setDriverToDelete(driver);
    setIsDeleteDialogOpen(true);
  };

  // Check if driver can be deleted (only if inactive or suspended)
  const canDeleteDriver = (driver: Driver): { canDelete: boolean; reason?: string } => {
    if (driver.status === 'active') {
      return {
        canDelete: false,
        reason: 'Active drivers cannot be deleted. Please deactivate the driver first.'
      };
    }
    return { canDelete: true };
  };

  // Get the appropriate action to take before deletion
  const getPrerequisiteAction = (driver: Driver) => {
    if (driver.status === 'active') {
      return {
        action: () => handleStatusUpdate(driver.id, 'inactive'),
        label: 'Deactivate Driver First'
      };
    }
    return null;
  };

  const handleDeleteConfirm = async () => {
    if (!driverToDelete) return;

    try {
      setIsDeleting(true);
      setError(null);
      await driverApi.deleteDriver(driverToDelete.id);
      
      // Close dialog and refresh the list
      setIsDeleteDialogOpen(false);
      setDriverToDelete(null);
      await loadDrivers();
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to delete driver. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setDriverToDelete(null);
  };

  // Filter drivers based on search and status
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = !searchQuery || 
      driver.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery) ||
      driver.vehicle.number.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-status-success text-white';
      case 'inactive': return 'bg-amber-500 text-white';
      case 'suspended': return 'bg-destructive text-white';
      default: return 'bg-neutral-300';
    }
  };

  // Get status description for better UX
  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'active': return 'Driver is available for assignments';
      case 'inactive': return 'Driver is temporarily not working';
      case 'suspended': return 'Driver suspended - requires admin action';
      default: return 'Unknown status';
    }
  };

  const getDocumentStatusColor = (documentsStatus: string) => {
    switch (documentsStatus) {
      case 'verified': return 'bg-status-success text-white';
      case 'pending': return 'bg-status-warning text-white';
      case 'rejected': return 'bg-status-error text-white';
      default: return 'bg-neutral-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-transport-primary" />
        <span className="ml-2 text-transport-primary">Loading drivers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-transport-primary">Driver Management</h3>
          <p className="text-neutral-600">Manage drivers, vehicles, and assignments</p>
        </div>
        <Button variant="action" onClick={() => setIsAddDialogOpen(true)}>
          <Truck className="h-4 w-4 mr-2" />
          Add Driver
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                <Input 
                  placeholder="Search drivers..." 
                  className="pl-10" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Badge 
                variant={statusFilter === 'all' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setStatusFilter('all')}
              >
                All ({filteredDrivers.length})
              </Badge>
              <Badge 
                variant={statusFilter === 'active' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setStatusFilter('active')}
              >
                Active ({drivers.filter(d => d.status === 'active').length})
              </Badge>
              <Badge 
                variant={statusFilter === 'inactive' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setStatusFilter('inactive')}
              >
                Inactive ({drivers.filter(d => d.status === 'inactive').length})
              </Badge>
              <Badge 
                variant={statusFilter === 'suspended' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setStatusFilter('suspended')}
              >
                Suspended ({drivers.filter(d => d.status === 'suspended').length})
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Info Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Deletion Policy:</strong> Active drivers cannot be deleted. Please deactivate or suspend drivers before permanent deletion to ensure safety and data integrity.
        </AlertDescription>
      </Alert>

      {/* Driver Cards */}
      <div className="grid gap-6">
        {filteredDrivers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Truck className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-600 mb-2">No drivers found</h3>
              <p className="text-neutral-500">
                {drivers.length === 0 
                  ? "Get started by adding your first driver." 
                  : "Try adjusting your search or filters."
                }
              </p>
              {drivers.length === 0 && (
                <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                  Add First Driver
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredDrivers.map((driver) => (
            <Card key={driver.id} className="shadow-transport">
              <CardContent className="p-6">
                <div className="grid lg:grid-cols-5 gap-6">
                  {/* Driver Info */}
                  <div className="lg:col-span-2">
                    <div className="flex items-start space-x-4 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`/placeholder-avatar-${driver.id}.jpg`} />
                        <AvatarFallback>{driver.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-semibold text-transport-primary">
                            {driver.fullName}
                          </h4>
                          <div className="text-right">
                            <Badge className={getStatusColor(driver.status)}>
                              {driver.status}
                            </Badge>
                            <p className="text-xs text-neutral-500 mt-1">
                              {getStatusDescription(driver.status)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-neutral-600">ID: {driver.id}</p>
                        <div className="flex items-center mt-1">
                          <span className="text-sm text-neutral-600">⭐ {driver.rating.toFixed(1)}</span>
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
                        {driver.currentLocation?.address || 'Location not available'}
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-neutral-400" />
                        Joined: {new Date(driver.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Vehicle & License Info */}
                  <div>
                    <h5 className="font-semibold text-transport-primary mb-3">Vehicle & License</h5>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-neutral-500">Vehicle Number</span>
                        <p className="text-sm font-mono">{driver.vehicle.number}</p>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500">Vehicle Type</span>
                        <p className="text-sm capitalize">{driver.vehicle.type}</p>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500">Vehicle Model</span>
                        <p className="text-sm">{driver.vehicle.model}</p>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500">Capacity</span>
                        <p className="text-sm">{driver.vehicle.capacity} kg</p>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500">License Number</span>
                        <p className="text-sm font-mono">{driver.licenseNumber}</p>
                      </div>
                    </div>
                  </div>

                  {/* Experience & Availability */}
                  <div>
                    <h5 className="font-semibold text-transport-primary mb-3">Status & Experience</h5>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-neutral-500">Availability</span>
                        <div className="mt-1">
                          <Badge className={driver.availability.isAvailable ? 'bg-status-success text-white' : 'bg-neutral-500 text-white'}>
                            {driver.availability.isAvailable ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500">Experience</span>
                        <p className="text-sm">{driver.experience} years</p>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500">License Expiry</span>
                        <p className="text-sm">{new Date(driver.licenseExpiry).toLocaleDateString()}</p>
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
                    <Button variant="outline" size="sm" onClick={() => handleViewAssignments(driver)}>
                      View Assignments
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Documents
                    </Button>
                    <Button variant="outline" size="sm">Edit Profile</Button>
                    
                    {/* Status Management Buttons */}
                    {driver.status === 'active' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-amber-600 border-amber-600 hover:bg-amber-600 hover:text-white"
                          onClick={() => handleStatusUpdate(driver.id, 'inactive')}
                        >
                          Set Inactive
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                          onClick={() => handleStatusUpdate(driver.id, 'suspended')}
                        >
                          Suspend Driver
                        </Button>
                      </>
                    )}
                    
                    {driver.status === 'inactive' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                          onClick={() => handleStatusUpdate(driver.id, 'active')}
                        >
                          Activate
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                          onClick={() => handleStatusUpdate(driver.id, 'suspended')}
                        >
                          Suspend Driver
                        </Button>
                      </>
                    )}
                    
                    {driver.status === 'suspended' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
                        onClick={() => handleStatusUpdate(driver.id, 'inactive')}
                      >
                        Lift Suspension
                      </Button>
                    )}
                    
                    {/* Permanent Delete - Most Dangerous Action */}
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`w-full ${
                          driver.status === 'active' 
                            ? 'text-gray-400 border-gray-300 cursor-not-allowed' 
                            : 'text-destructive border-destructive hover:bg-destructive hover:text-white'
                        }`}
                        onClick={() => handleDeleteClick(driver)}
                        title={driver.status === 'active' ? 'Active drivers cannot be deleted' : 'Delete driver permanently'}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {driver.status === 'active' ? 'Delete (Not Allowed)' : 'Delete Permanently'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Driver Dialog */}
      <AddDriverDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onDriverAdded={handleDriverAdded}
      />

      {/* View Assignments Dialog */}
      {selectedDriver && (
        <ViewAssignmentsDialog
          isOpen={isViewAssignmentsOpen}
          onClose={() => setIsViewAssignmentsOpen(false)}
          driver={selectedDriver}
          onAssignBooking={handleAssignBooking}
        />
      )}

      {/* Assign Booking Dialog */}
      {selectedDriver && (
        <AssignBookingDialog
          isOpen={isAssignBookingOpen}
          onClose={() => setIsAssignBookingOpen(false)}
          driver={selectedDriver}
          onAssignmentComplete={handleAssignmentComplete}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {driverToDelete && (
        <ConfirmDeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title={canDeleteDriver(driverToDelete).canDelete ? "Delete Driver" : "Cannot Delete Driver"}
          description={
            canDeleteDriver(driverToDelete).canDelete 
              ? "Are you sure you want to delete this driver? This action cannot be undone and will remove all driver data from the system."
              : "This driver cannot be deleted in their current status. Please follow the required workflow first."
          }
          itemName={driverToDelete.fullName}
          isDeleting={isDeleting}
          canDelete={canDeleteDriver(driverToDelete).canDelete}
          blockReason={canDeleteDriver(driverToDelete).reason}
          onPrerequisiteAction={getPrerequisiteAction(driverToDelete)?.action}
          prerequisiteActionLabel={getPrerequisiteAction(driverToDelete)?.label}
        />
      )}
    </div>
  );
};

export default DriverManagement;