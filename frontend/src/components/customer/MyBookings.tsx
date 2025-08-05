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
  Loader,
  Loader2,
  Trash2
} from "lucide-react";
import { bookingApi, customerApi, type BookingsResponse, type Invoice } from "@/lib/api";
import type { Booking } from "@/types/booking";
import { generateInvoicePDF } from "@/utils/invoicePDFGenerator";
import InvoicePreviewDialog from "./InvoicePreviewDialog";

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

  // New state for button functionalities
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);

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

  // View booking details
  const viewBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  // View invoice for a booking
  const viewInvoice = async (booking: Booking) => {
    try {
      // First get all customer invoices
      const invoicesResponse = await customerApi.getMyInvoices();
      
      // Find invoice that contains this booking ID
      const invoice = invoicesResponse.invoices.find(inv => 
        inv.bookings && inv.bookings.some(bookingData => bookingData._id === booking._id)
      );
      
      if (invoice) {
        // Get full invoice details
        const fullInvoice = await customerApi.getInvoiceDetails(invoice.id);
        setPreviewInvoice(fullInvoice);
        setPreviewOpen(true);
      } else {
        setError('No invoice found for this booking');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Failed to fetch invoice details');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Download booking document or invoice
  const downloadDocument = async (booking: Booking) => {
    try {
      setDownloadingId(booking._id);
      
      if (booking.status === 'delivered') {
        // Try to download invoice if booking is delivered
        const invoicesResponse = await customerApi.getMyInvoices();
        const invoice = invoicesResponse.invoices.find(inv => 
          inv.bookings && inv.bookings.some(bookingData => bookingData._id === booking._id)
        );
        
        if (invoice) {
          const fullInvoice = await customerApi.getInvoiceDetails(invoice.id);
          
          // Company information for the PDF header
          const companyOptions = {
            companyName: 'Cargo Pathway Pro',
            companyAddress: '123 Logistics Avenue\nTransport City, TC 12345\nUnited States',
            companyPhone: '+1 (555) 123-4567',
            companyEmail: 'billing@cargopathwaypro.com'
          };

          // Generate and download PDF
          generateInvoicePDF(fullInvoice, companyOptions, true);
        } else {
          // Generate booking receipt if no invoice found
          generateBookingReceipt(booking);
        }
      } else {
        // Generate booking receipt for non-delivered bookings
        generateBookingReceipt(booking);
      }
      
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Failed to generate document. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setDownloadingId(null);
    }
  };

  // Generate a simple booking receipt (placeholder - you may want to create a proper PDF generator)
  const generateBookingReceipt = (booking: Booking) => {
    const content = `
BOOKING RECEIPT
===================
Booking Number: ${booking.bookingNumber}
Date: ${formatDate(booking.createdAt)}
Status: ${booking.status.toUpperCase()}

PICKUP ADDRESS:
${booking.pickupAddress.contactName}
${booking.pickupAddress.address}
${booking.pickupAddress.city}
Phone: ${booking.pickupAddress.phone}

DELIVERY ADDRESS:
${booking.deliveryAddress.contactName}
${booking.deliveryAddress.address}
${booking.deliveryAddress.city}
Phone: ${booking.deliveryAddress.phone}

PACKAGE DETAILS:
Type: ${booking.packageType}
Weight: ${booking.weight} kg
Service: ${booking.serviceType}
${booking.insurance ? `Insurance: ₹${booking.insuranceValue}` : ''}

TOTAL COST: ₹${booking.totalCost}

${booking.specialInstructions ? `Special Instructions: ${booking.specialInstructions}` : ''}
    `;

    // Create and download text file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-${booking.bookingNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle delete booking request
  const handleDeleteBooking = (booking: Booking) => {
    setBookingToDelete(booking);
    setShowDeleteConfirm(true);
  };

  // Confirm delete booking
  const confirmDeleteBooking = async () => {
    if (!bookingToDelete) return;
    
    try {
      setDeletingId(bookingToDelete._id);
      await bookingApi.deleteBooking(bookingToDelete._id);
      
      // Refresh bookings list
      await fetchBookings(pagination.currentPage, statusFilter);
      
      setShowDeleteConfirm(false);
      setBookingToDelete(null);
      
      // Show success message briefly
      setError(null);
      const successMessage = `Booking ${bookingToDelete.bookingNumber} deleted successfully`;
      setError(successMessage);
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error('Error deleting booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete booking');
      setTimeout(() => setError(null), 5000);
    } finally {
      setDeletingId(null);
    }
  };

  // Cancel delete booking
  const cancelDeleteBooking = () => {
    setShowDeleteConfirm(false);
    setBookingToDelete(null);
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center space-x-2"
                      onClick={() => viewBookingDetails(booking)}
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </Button>
                    {booking.status === 'delivered' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center space-x-2"
                        onClick={() => viewInvoice(booking)}
                      >
                        <FileText className="h-4 w-4" />
                        <span>View Invoice</span>
                      </Button>
                    )}
                    {booking.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center space-x-2 text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => handleDeleteBooking(booking)}
                        disabled={deletingId === booking._id}
                      >
                        {deletingId === booking._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span>{deletingId === booking._id ? 'Deleting...' : 'Delete'}</span>
                      </Button>
                    )}
                    <Button 
                      variant="action" 
                      size="sm" 
                      className="flex items-center space-x-2"
                      onClick={() => downloadDocument(booking)}
                      disabled={downloadingId === booking._id}
                    >
                      {downloadingId === booking._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span>{downloadingId === booking._id ? 'Generating...' : 'Download'}</span>
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
      
      {/* Booking Details Dialog */}
      {showBookingDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Booking Details</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBookingDetails(false)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Booking Information */}
                <div>
                  <h3 className="font-semibold mb-2">Booking Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-neutral-600">Booking Number:</span>
                      <p className="font-medium">{selectedBooking.bookingNumber}</p>
                    </div>
                    <div>
                      <span className="text-neutral-600">Status:</span>
                      <Badge className={getStatusColor(selectedBooking.status)}>
                        {selectedBooking.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-neutral-600">Service Type:</span>
                      <p className="font-medium">{selectedBooking.serviceType}</p>
                    </div>
                    <div>
                      <span className="text-neutral-600">Package Type:</span>
                      <p className="font-medium">{selectedBooking.packageType}</p>
                    </div>
                    <div>
                      <span className="text-neutral-600">Weight:</span>
                      <p className="font-medium">{formatWeight(selectedBooking.weight)}</p>
                    </div>
                    <div>
                      <span className="text-neutral-600">Total Cost:</span>
                      <p className="font-medium text-action-primary">{formatCost(selectedBooking.totalCost)}</p>
                    </div>
                  </div>
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Pickup Address</h3>
                    <div className="bg-neutral-50 p-3 rounded text-sm">
                      <p className="font-medium">{selectedBooking.pickupAddress.contactName}</p>
                      <p>{selectedBooking.pickupAddress.address}</p>
                      <p>{selectedBooking.pickupAddress.city}</p>
                      <p>Phone: {selectedBooking.pickupAddress.phone}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Delivery Address</h3>
                    <div className="bg-neutral-50 p-3 rounded text-sm">
                      <p className="font-medium">{selectedBooking.deliveryAddress.contactName}</p>
                      <p>{selectedBooking.deliveryAddress.address}</p>
                      <p>{selectedBooking.deliveryAddress.city}</p>
                      <p>Phone: {selectedBooking.deliveryAddress.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Special Instructions */}
                {selectedBooking.specialInstructions && (
                  <div>
                    <h3 className="font-semibold mb-2">Special Instructions</h3>
                    <p className="text-sm bg-neutral-50 p-3 rounded">{selectedBooking.specialInstructions}</p>
                  </div>
                )}

                {/* Insurance */}
                {selectedBooking.insurance && (
                  <div>
                    <h3 className="font-semibold mb-2">Insurance</h3>
                    <p className="text-sm">Insured for {formatCost(selectedBooking.insuranceValue || 0)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview Dialog */}
      <InvoicePreviewDialog
        invoice={previewInvoice}
        isOpen={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewInvoice(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && bookingToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Delete Booking</h2>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete this booking?
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-900">
                  Booking: {bookingToDelete.bookingNumber}
                </p>
                <p className="text-sm text-gray-600">
                  From: {bookingToDelete.pickupAddress.city} → To: {bookingToDelete.deliveryAddress.city}
                </p>
                <p className="text-sm text-gray-600">
                  Cost: {formatCost(bookingToDelete.totalCost)}
                </p>
              </div>
              <p className="text-red-600 text-sm mt-2">
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={cancelDeleteBooking}
                disabled={deletingId === bookingToDelete._id}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteBooking}
                disabled={deletingId === bookingToDelete._id}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deletingId === bookingToDelete._id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Booking
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
