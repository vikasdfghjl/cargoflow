import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Building, Phone, Mail, MapPin, Loader2, AlertCircle } from "lucide-react";
import { adminApi, Customer, ApiError, Invoice } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import CustomerBookingsDialog from "./CustomerBookingsDialog";
import EditCustomerDialog from "./EditCustomerDialog";
import InvoiceDialog from "./InvoiceDialog";

const CustomerManagement = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCustomers: 0,
    hasNext: false,
    hasPrev: false
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isBookingsDialogOpen, setIsBookingsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);

  // Fetch customers function
  const fetchCustomers = async (page = 1, search = "", status?: 'active' | 'inactive') => {
    try {
      setLoading(true);
      setError(null);
      
      const params: {
        page: number;
        limit: number;
        sortBy: string;
        sortOrder: 'desc';
        search?: string;
        status?: 'active' | 'inactive';
      } = {
        page,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (status) {
        params.status = status;
      }

      const response = await adminApi.getAllCustomers(params);
      setCustomers(response.customers);
      setPagination(response.pagination);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to fetch customers');
      }
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (user?.userType === 'admin') {
      fetchCustomers();
    }
  }, [user]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchCustomers(1, value, statusFilter === 'all' ? undefined : statusFilter);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Handle status filter
  const handleStatusFilter = (status: 'all' | 'active' | 'inactive') => {
    setStatusFilter(status);
    fetchCustomers(1, searchTerm, status === 'all' ? undefined : status);
  };

  // Handle customer status toggle
  const handleToggleCustomerStatus = async (customerId: string, currentStatus: boolean) => {
    try {
      await adminApi.updateCustomerStatus(customerId, !currentStatus);
      // Refresh the current page
      fetchCustomers(pagination.currentPage, searchTerm, statusFilter === 'all' ? undefined : statusFilter);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to update customer status');
      }
      console.error('Error updating customer status:', err);
    }
  };

  // Handle view bookings
  const handleViewBookings = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsBookingsDialogOpen(true);
  };

  // Handle close bookings dialog
  const handleCloseBookingsDialog = () => {
    setIsBookingsDialogOpen(false);
    setSelectedCustomer(null);
  };

  // Handle edit customer
  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };

  // Handle close edit dialog
  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedCustomer(null);
  };

  // Handle customer updated
  const handleCustomerUpdated = (updatedCustomer: Customer) => {
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === updatedCustomer.id ? updatedCustomer : customer
      )
    );
  };

  // Handle send invoice
  const handleSendInvoice = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsInvoiceDialogOpen(true);
  };

  // Handle close invoice dialog
  const handleCloseInvoiceDialog = () => {
    setIsInvoiceDialogOpen(false);
    setSelectedCustomer(null);
  };

  // Handle invoice created
  const handleInvoiceCreated = (invoice: Invoice) => {
    // You can add success notification here if needed
    console.log('Invoice created successfully:', invoice);
    // Optionally refresh customer data or show a success message
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    fetchCustomers(page, searchTerm, statusFilter === 'all' ? undefined : statusFilter);
  };

  if (loading && customers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading customers...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && customers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Error Loading Customers</h3>
              <p className="text-gray-600">{error}</p>
              <Button 
                onClick={() => fetchCustomers()} 
                className="mt-4"
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                <Input 
                  placeholder="Search customers..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Badge 
                variant={statusFilter === 'all' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => handleStatusFilter('all')}
              >
                All ({pagination.totalCustomers})
              </Badge>
              <Badge 
                variant={statusFilter === 'active' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => handleStatusFilter('active')}
              >
                Active ({customers.filter(c => c.isActive).length})
              </Badge>
              <Badge 
                variant={statusFilter === 'inactive' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => handleStatusFilter('inactive')}
              >
                Inactive ({customers.filter(c => !c.isActive).length})
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading indicator for pagination */}
      {loading && customers.length > 0 && (
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

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
                        {customer.companyName || `${customer.firstName} ${customer.lastName}`}
                      </h4>
                      <p className="text-sm text-neutral-600">ID: {customer.id}</p>
                    </div>
                    <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Building className="h-4 w-4 mr-2 text-neutral-400" />
                      <span className="font-medium mr-2">Contact:</span>
                      {customer.firstName} {customer.lastName}
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-neutral-400" />
                      {customer.email}
                    </div>
                    {customer.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2 text-neutral-400" />
                        {customer.phone}
                      </div>
                    )}
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-neutral-400" />
                      Joined {new Date(customer.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div>
                  <h5 className="font-semibold text-transport-primary mb-3">Business Details</h5>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-neutral-500">Company</span>
                      <p className="text-sm">{customer.companyName || 'Individual'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-500">Total Bookings</span>
                      <p className="text-lg font-semibold text-action-primary">{customer.totalBookings}</p>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-500">Active Bookings</span>
                      <p className="text-sm font-semibold text-blue-600">{customer.activeBookings}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewBookings(customer)}
                  >
                    View Bookings
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSendInvoice(customer)}
                  >
                    Send Invoice
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditCustomer(customer)}
                  >
                    Edit Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={customer.isActive ? "text-destructive border-destructive hover:bg-destructive hover:text-white" : "text-green-600 border-green-600 hover:bg-green-600 hover:text-white"}
                    onClick={() => handleToggleCustomerStatus(customer.id, customer.isActive)}
                  >
                    {customer.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {pagination.currentPage} of {pagination.totalPages} 
            ({pagination.totalCustomers} total customers)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {customers.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Get started by adding your first customer'
            }
          </p>
        </div>
      )}
      
      {/* Customer Bookings Dialog */}
      <CustomerBookingsDialog 
        customer={selectedCustomer}
        isOpen={isBookingsDialogOpen}
        onClose={handleCloseBookingsDialog}
      />

      {/* Edit Customer Dialog */}
      <EditCustomerDialog 
        customer={selectedCustomer}
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        onCustomerUpdated={handleCustomerUpdated}
      />

      {/* Invoice Dialog */}
      <InvoiceDialog 
        customer={selectedCustomer}
        isOpen={isInvoiceDialogOpen}
        onClose={handleCloseInvoiceDialog}
        onInvoiceCreated={handleInvoiceCreated}
      />
    </div>
  );
};

export default CustomerManagement;