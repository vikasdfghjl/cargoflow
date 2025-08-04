import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  DollarSign,
  Package,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Printer
} from "lucide-react";

interface Invoice {
  id: string;
  bookingId: string;
  date: string;
  dueDate: string;
  amount: string;
  status: string;
  packageDetails: {
    from: string;
    to: string;
    type: string;
    weight: string;
  };
  tax: string;
  subtotal: string;
  paymentMethod: string;
  paymentDate: string | null;
}

const InvoiceManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Mock invoice data
  const invoices = [
    {
      id: "INV-2025-001",
      bookingId: "CF123456789",
      date: "2025-08-03",
      dueDate: "2025-08-10",
      amount: "₹450",
      status: "paid",
      packageDetails: {
        from: "Mumbai, MH",
        to: "Delhi, DL",
        type: "Electronics",
        weight: "2.5 kg"
      },
      tax: "₹81",
      subtotal: "₹369",
      paymentMethod: "Online Payment",
      paymentDate: "2025-08-03"
    },
    {
      id: "INV-2025-002",
      bookingId: "CF987654321",
      date: "2025-08-01",
      dueDate: "2025-08-08",
      amount: "₹180",
      status: "paid",
      packageDetails: {
        from: "Bangalore, KA",
        to: "Chennai, TN",
        type: "Documents",
        weight: "0.5 kg"
      },
      tax: "₹32",
      subtotal: "₹148",
      paymentMethod: "Bank Transfer",
      paymentDate: "2025-08-01"
    },
    {
      id: "INV-2025-003",
      bookingId: "CF456789123",
      date: "2025-08-04",
      dueDate: "2025-08-11",
      amount: "₹850",
      status: "pending",
      packageDetails: {
        from: "Pune, MH",
        to: "Hyderabad, TG",
        type: "Machinery Parts",
        weight: "15 kg"
      },
      tax: "₹153",
      subtotal: "₹697",
      paymentMethod: "Pending",
      paymentDate: null
    },
    {
      id: "INV-2025-004",
      bookingId: "CF789123456",
      date: "2025-08-04",
      dueDate: "2025-08-11",
      amount: "₹320",
      status: "overdue",
      packageDetails: {
        from: "Kolkata, WB",
        to: "Bhubaneswar, OD",
        type: "Textile Samples",
        weight: "3 kg"
      },
      tax: "₹58",
      subtotal: "₹262",
      paymentMethod: "Pending",
      paymentDate: null
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-status-success text-white";
      case "pending":
        return "bg-status-warning text-white";
      case "overdue":
        return "bg-status-error text-white";
      default:
        return "bg-neutral-400 text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.bookingId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    const matchesDate = dateFilter === "all" || 
                       (dateFilter === "this-month" && new Date(invoice.date).getMonth() === new Date().getMonth());
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalAmount = filteredInvoices.reduce((sum, invoice) => {
    return sum + parseFloat(invoice.amount.replace('₹', ''));
  }, 0);

  const paidAmount = filteredInvoices
    .filter(invoice => invoice.status === "paid")
    .reduce((sum, invoice) => {
      return sum + parseFloat(invoice.amount.replace('₹', ''));
    }, 0);

  const pendingAmount = filteredInvoices
    .filter(invoice => invoice.status !== "paid")
    .reduce((sum, invoice) => {
      return sum + parseFloat(invoice.amount.replace('₹', ''));
    }, 0);

  const downloadInvoice = (invoiceId: string) => {
    // Mock download functionality
    console.log(`Downloading invoice ${invoiceId}`);
    alert(`Downloading invoice ${invoiceId}...`);
  };

  const viewInvoiceDetails = (invoice: Invoice) => {
    // Mock view functionality
    console.log("Viewing invoice:", invoice);
    alert(`Opening detailed view for ${invoice.id}`);
  };

  const printInvoice = (invoiceId: string) => {
    // Mock print functionality
    console.log(`Printing invoice ${invoiceId}`);
    alert(`Printing invoice ${invoiceId}...`);
  };

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div>
        <h2 className="text-2xl font-bold text-transport-primary mb-2">Invoice Management</h2>
        <p className="text-neutral-600 mb-6">View, download, and manage all your invoices</p>
        
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="shadow-transport">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Total Amount</p>
                  <p className="text-xl font-bold text-transport-primary">₹{totalAmount.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-transport-accent-light rounded-lg">
                  <DollarSign className="h-5 w-5 text-transport-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-transport">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Paid Amount</p>
                  <p className="text-xl font-bold text-status-success">₹{paidAmount.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-status-success bg-opacity-10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-status-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-transport">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Pending Amount</p>
                  <p className="text-xl font-bold text-status-warning">₹{pendingAmount.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-status-warning bg-opacity-10 rounded-lg">
                  <Clock className="h-5 w-5 text-status-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-transport">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search invoices..."
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
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
              
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background text-sm"
              >
                <option value="all">All Time</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="this-year">This Year</option>
              </select>
            </div>
            
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export All</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <div className="grid gap-4">
        {filteredInvoices.map((invoice) => (
          <Card key={invoice.id} className="shadow-transport hover:shadow-transport-elevated transition-smooth">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                {/* Invoice Info */}
                <div className="flex items-center space-x-4 flex-grow">
                  <div className="p-3 bg-transport-accent-light rounded-lg">
                    <FileText className="h-5 w-5 text-transport-primary" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-transport-primary">{invoice.id}</h3>
                      <Badge className={`${getStatusColor(invoice.status)} flex items-center space-x-1`}>
                        {getStatusIcon(invoice.status)}
                        <span className="capitalize">{invoice.status}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-600">Booking: {invoice.bookingId}</p>
                    <div className="flex items-center space-x-4 text-sm text-neutral-500">
                      <span>Date: {new Date(invoice.date).toLocaleDateString()}</span>
                      <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Package Details */}
                <div className="hidden md:block space-y-1 text-sm">
                  <p className="font-medium text-transport-primary">
                    {invoice.packageDetails.from} → {invoice.packageDetails.to}
                  </p>
                  <p className="text-neutral-600">
                    {invoice.packageDetails.type} • {invoice.packageDetails.weight}
                  </p>
                </div>
                
                {/* Amount and Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-action-primary">{invoice.amount}</p>
                    <p className="text-sm text-neutral-500">
                      {invoice.status === "paid" && invoice.paymentDate 
                        ? `Paid on ${new Date(invoice.paymentDate).toLocaleDateString()}`
                        : "Payment pending"}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => viewInvoiceDetails(invoice)}
                      className="flex items-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => downloadInvoice(invoice.id)}
                      className="flex items-center space-x-1"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => printInvoice(invoice.id)}
                      className="flex items-center space-x-1"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Print</span>
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Mobile Package Details */}
              <div className="md:hidden mt-4 pt-4 border-t">
                <div className="flex items-center space-x-2 text-sm">
                  <Package className="h-4 w-4 text-transport-primary" />
                  <span className="font-medium">
                    {invoice.packageDetails.from} → {invoice.packageDetails.to}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 mt-1">
                  {invoice.packageDetails.type} • {invoice.packageDetails.weight}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredInvoices.length === 0 && (
        <Card className="shadow-transport">
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-600 mb-2">No invoices found</h3>
            <p className="text-neutral-500">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InvoiceManager;
