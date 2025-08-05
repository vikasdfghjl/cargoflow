import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Plus, Trash2, FileText } from "lucide-react";
import { Customer, invoiceApi, adminApi, CreateInvoiceRequest, InvoiceItem, ApiError, Booking, Invoice } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onInvoiceCreated?: (invoice: Invoice) => void;
}

const InvoiceDialog: React.FC<InvoiceDialogProps> = ({
  isOpen,
  onClose,
  customer,
  onInvoiceCreated
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableBookings, setAvailableBookings] = useState<Booking[]>([]);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [invoiceData, setInvoiceData] = useState({
    dueDate: '',
    taxRate: 0,
    discountAmount: 0,
    notes: '',
    paymentTerms: 'Net 30'
  });
  const [customItems, setCustomItems] = useState<InvoiceItem[]>([]);
  const [invoiceType, setInvoiceType] = useState<'bookings' | 'custom'>('bookings');

  const fetchAvailableBookings = useCallback(async () => {
    if (!customer) return;
    
    try {
      setLoading(true);
      const response = await adminApi.getCustomerBookings(customer.id, { 
        limit: 100,
        status: 'delivered' // Only delivered bookings can be invoiced
      });
      setAvailableBookings(response.bookings);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to fetch customer bookings');
    } finally {
      setLoading(false);
    }
  }, [customer]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen && customer) {
      // Set default due date to 30 days from now
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      setInvoiceData(prev => ({
        ...prev,
        dueDate: dueDate.toISOString().split('T')[0]
      }));
      
      fetchAvailableBookings();
      setError(null);
    } else {
      // Reset form
      setSelectedBookings([]);
      setCustomItems([]);
      setAvailableBookings([]);
      setInvoiceType('bookings');
      setError(null);
    }
  }, [isOpen, customer, fetchAvailableBookings]);

  const handleBookingToggle = (bookingId: string) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId) 
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const addCustomItem = () => {
    setCustomItems(prev => [...prev, {
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0
    }]);
  };

  const updateCustomItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setCustomItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Recalculate amount if quantity or unitPrice changed
      if (field === 'quantity' || field === 'unitPrice') {
        updated[index].amount = updated[index].quantity * updated[index].unitPrice;
      }
      
      return updated;
    });
  };

  const removeCustomItem = (index: number) => {
    setCustomItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    
    if (invoiceType === 'bookings') {
      const selectedBookingItems = availableBookings.filter(booking => 
        selectedBookings.includes(booking._id)
      );
      subtotal = selectedBookingItems.reduce((sum, booking) => sum + booking.totalCost, 0);
    } else {
      subtotal = customItems.reduce((sum, item) => sum + item.amount, 0);
    }
    
    const taxAmount = (subtotal * invoiceData.taxRate) / 100;
    const totalAmount = subtotal + taxAmount - invoiceData.discountAmount;
    
    return { subtotal, taxAmount, totalAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    try {
      setLoading(true);
      setError(null);

      let items: InvoiceItem[] = [];
      
      if (invoiceType === 'bookings') {
        if (selectedBookings.length === 0) {
          setError('Please select at least one booking');
          return;
        }
        
        // Generate invoice from selected bookings
        const response = await invoiceApi.generateInvoiceFromBookings({
          customerId: customer.id,
          bookingIds: selectedBookings,
          dueDate: invoiceData.dueDate,
          taxRate: invoiceData.taxRate,
          discountAmount: invoiceData.discountAmount,
          notes: invoiceData.notes
        });
        
        onInvoiceCreated?.(response);
        onClose();
        return;
      } else {
        if (customItems.length === 0) {
          setError('Please add at least one item');
          return;
        }
        
        if (customItems.some(item => !item.description.trim())) {
          setError('All items must have a description');
          return;
        }
        
        items = customItems;
      }

      const createData: CreateInvoiceRequest = {
        customerId: customer.id,
        dueDate: invoiceData.dueDate,
        items,
        taxRate: invoiceData.taxRate,
        discountAmount: invoiceData.discountAmount,
        notes: invoiceData.notes,
        paymentTerms: invoiceData.paymentTerms
      };

      const response = await invoiceApi.createInvoice(createData);
      onInvoiceCreated?.(response);
      onClose();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, taxAmount, totalAmount } = calculateTotals();

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Create Invoice for {customer.companyName || `${customer.firstName} ${customer.lastName}`}
          </DialogTitle>
          <DialogDescription>
            Generate an invoice from delivered bookings or create a custom invoice
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <Card 
              className={`cursor-pointer transition-colors ${
                invoiceType === 'bookings' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => setInvoiceType('bookings')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">From Bookings</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-gray-600">Generate invoice from delivered bookings</p>
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-colors ${
                invoiceType === 'custom' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => setInvoiceType('custom')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Custom Invoice</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-gray-600">Create custom invoice with manual items</p>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={invoiceData.dueDate}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Select 
                value={invoiceData.paymentTerms} 
                onValueChange={(value) => setInvoiceData(prev => ({ ...prev, paymentTerms: value }))}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Net 30">Net 30</SelectItem>
                  <SelectItem value="Net 15">Net 15</SelectItem>
                  <SelectItem value="Net 7">Net 7</SelectItem>
                  <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Invoice Items */}
          {invoiceType === 'bookings' ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Select Bookings</h3>
              {loading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : availableBookings.length === 0 ? (
                <div className="text-center p-4 text-gray-500">
                  No delivered bookings available for invoicing
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableBookings.map((booking) => (
                    <div key={booking._id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <input
                        type="checkbox"
                        checked={selectedBookings.includes(booking._id)}
                        onChange={() => handleBookingToggle(booking._id)}
                        className="rounded"
                        disabled={loading}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{booking.bookingNumber}</span>
                          <Badge variant="outline">{booking.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {booking.pickupAddress.city} → {booking.deliveryAddress.city}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">${booking.totalCost}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Custom Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomItem}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              {customItems.length === 0 ? (
                <div className="text-center p-4 text-gray-500">
                  No items added. Click "Add Item" to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {customItems.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-5 gap-3">
                          <div className="col-span-2">
                            <Label htmlFor={`description-${index}`}>Description</Label>
                            <Input
                              id={`description-${index}`}
                              value={item.description}
                              onChange={(e) => updateCustomItem(index, 'description', e.target.value)}
                              placeholder="Service description"
                              disabled={loading}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`quantity-${index}`}>Qty</Label>
                            <Input
                              id={`quantity-${index}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => updateCustomItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              disabled={loading}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`unitPrice-${index}`}>Unit Price</Label>
                            <Input
                              id={`unitPrice-${index}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateCustomItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              disabled={loading}
                            />
                          </div>
                          <div className="flex items-end space-x-2">
                            <div className="flex-1">
                              <Label>Amount</Label>
                              <div className="text-lg font-semibold pt-2">${item.amount.toFixed(2)}</div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCustomItem(index)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tax and Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={invoiceData.taxRate}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountAmount">Discount Amount ($)</Label>
              <Input
                id="discountAmount"
                type="number"
                min="0"
                step="0.01"
                value={invoiceData.discountAmount}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, discountAmount: parseFloat(e.target.value) || 0 }))}
                disabled={loading}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={invoiceData.notes}
              onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Additional notes or payment instructions..."
              disabled={loading}
            />
          </div>

          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({invoiceData.taxRate}%):</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-${invoiceData.discountAmount.toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || totalAmount <= 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDialog;
