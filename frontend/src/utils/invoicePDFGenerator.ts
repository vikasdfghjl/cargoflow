import jsPDF from 'jspdf';
import { Invoice } from '@/lib/api';

export interface InvoicePDFOptions {
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  logoUrl?: string;
}

export class InvoicePDFGenerator {
  private pdf: jsPDF;
  private currentY: number = 0;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;

  constructor() {
    this.pdf = new jsPDF();
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.currentY = this.margin;
  }

  // Helper method to ensure invoice has all required properties
  private validateAndNormalizeInvoice(invoice: Invoice): Invoice {
    const normalizedInvoice = {
      ...invoice,
      invoiceNumber: invoice.invoiceNumber || 'N/A',
      status: invoice.status || 'draft',
      invoiceDate: invoice.invoiceDate || new Date().toISOString(),
      dueDate: invoice.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      paymentTerms: invoice.paymentTerms || 'Net 30',
      subtotal: invoice.subtotal || 0,
      taxRate: invoice.taxRate || 0,
      taxAmount: invoice.taxAmount || 0,
      discountAmount: invoice.discountAmount || 0,
      totalAmount: invoice.totalAmount || 0,
      items: invoice.items || [],
      customer: {
        _id: invoice.customer?._id || '',
        firstName: invoice.customer?.firstName || '',
        lastName: invoice.customer?.lastName || '',
        email: invoice.customer?.email || 'customer@example.com',
        companyName: invoice.customer?.companyName,
        phone: invoice.customer?.phone,
        companyAddress: invoice.customer?.companyAddress
      },
      bookings: invoice.bookings || [],
      notes: invoice.notes
    };

    return normalizedInvoice;
  }

  generateInvoicePDF(invoice: Invoice, options: InvoicePDFOptions = {}): jsPDF {
    this.currentY = this.margin;
    
    // Normalize the invoice data to handle missing properties
    const normalizedInvoice = this.validateAndNormalizeInvoice(invoice);
    
    // Company Header
    this.addCompanyHeader(options);
    
    // Invoice Title and Number
    this.addInvoiceTitle(normalizedInvoice);
    
    // Customer and Invoice Details
    this.addCustomerDetails(normalizedInvoice);
    
    // Invoice Items Table
    this.addItemsTable(normalizedInvoice);
    
    // Summary Section
    this.addSummarySection(normalizedInvoice);
    
    // Footer
    this.addFooter(normalizedInvoice, options);

    return this.pdf;
  }

  private addCompanyHeader(options: InvoicePDFOptions) {
    const companyName = options.companyName || 'Cargo Pathway Pro';
    const companyAddress = options.companyAddress || '123 Logistics Avenue\nTransport City, TC 12345';
    const companyPhone = options.companyPhone || '+1 (555) 123-4567';
    const companyEmail = options.companyEmail || 'contact@cargopathwaypro.com';

    // Company Name
    this.pdf.setFontSize(24);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(41, 128, 185); // Blue color
    this.pdf.text(companyName, this.margin, this.currentY);
    
    this.currentY += 10;
    
    // Company Details
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(100, 100, 100);
    
    const addressLines = companyAddress.split('\n');
    addressLines.forEach(line => {
      this.pdf.text(line, this.margin, this.currentY);
      this.currentY += 4;
    });
    
    this.pdf.text(`Phone: ${companyPhone}`, this.margin, this.currentY);
    this.currentY += 4;
    this.pdf.text(`Email: ${companyEmail}`, this.margin, this.currentY);
    this.currentY += 15;
  }

  private addInvoiceTitle(invoice: Invoice) {
    // Invoice Title
    this.pdf.setFontSize(28);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('INVOICE', this.pageWidth - this.margin - 50, this.margin + 20);
    
    // Invoice Number (with fallback)
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(`Invoice #: ${invoice.invoiceNumber || 'N/A'}`, this.pageWidth - this.margin - 50, this.margin + 35);
    
    this.currentY = Math.max(this.currentY, this.margin + 45);
  }

  private addCustomerDetails(invoice: Invoice) {
    // Horizontal line
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;

    // Bill To section
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('BILL TO:', this.margin, this.currentY);

    // Invoice Details section
    this.pdf.text('INVOICE DETAILS:', this.pageWidth / 2, this.currentY);
    this.currentY += 8;

    // Customer Info (Left side)
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    // Handle missing customer data gracefully
    const firstName = invoice.customer?.firstName || '';
    const lastName = invoice.customer?.lastName || '';
    const customerName = firstName && lastName 
      ? `${firstName} ${lastName}` 
      : invoice.customer?.email || 'Customer';
    
    this.pdf.text(customerName, this.margin, this.currentY);
    
    if (invoice.customer?.companyName) {
      this.currentY += 4;
      this.pdf.text(invoice.customer.companyName, this.margin, this.currentY);
    }
    
    this.currentY += 4;
    this.pdf.text(invoice.customer?.email || 'No email provided', this.margin, this.currentY);
    
    if (invoice.customer?.phone) {
      this.currentY += 4;
      this.pdf.text(invoice.customer.phone, this.margin, this.currentY);
    }

    let addressLines: string[] = [];
    if (invoice.customer.companyAddress) {
      this.currentY += 4;
      addressLines = invoice.customer.companyAddress.split('\n');
      addressLines.forEach(line => {
        this.pdf.text(line, this.margin, this.currentY);
        this.currentY += 4;
      });
    }

    // Invoice Details (Right side)
    const detailsX = this.pageWidth / 2;
    let detailsY = this.currentY - (invoice.customer?.companyAddress ? addressLines.length * 4 : 0) - 8;
    
    if (invoice.customer?.companyName) detailsY -= 4;
    if (invoice.customer?.phone) detailsY -= 4;
    
    // Date handling with fallbacks
    const invoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A';
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A';
    
    this.pdf.text(`Invoice Date: ${invoiceDate}`, detailsX, detailsY);
    detailsY += 4;
    this.pdf.text(`Due Date: ${dueDate}`, detailsX, detailsY);
    detailsY += 4;
    this.pdf.text(`Status: ${(invoice.status || 'Unknown').toUpperCase()}`, detailsX, detailsY);
    detailsY += 4;
    this.pdf.text(`Payment Terms: ${invoice.paymentTerms || 'Net 30'}`, detailsX, detailsY);

    if (invoice.bookings && invoice.bookings.length > 0) {
      detailsY += 4;
      const bookingNumbers = invoice.bookings.map(b => b.bookingNumber || 'N/A').join(', ');
      this.pdf.text(`Booking(s): ${bookingNumbers}`, detailsX, detailsY);
    }

    this.currentY += 15;
  }

  private addItemsTable(invoice: Invoice) {
    // Table header
    const tableY = this.currentY;
    const rowHeight = 8;
    const colWidths = {
      description: 80,
      quantity: 25,
      unitPrice: 30,
      amount: 30
    };

    // Header background
    this.pdf.setFillColor(41, 128, 185);
    this.pdf.rect(this.margin, tableY, this.pageWidth - 2 * this.margin, rowHeight, 'F');

    // Header text
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(255, 255, 255);
    
    let currentX = this.margin + 2;
    this.pdf.text('DESCRIPTION', currentX, tableY + 5);
    currentX += colWidths.description;
    this.pdf.text('QTY', currentX, tableY + 5);
    currentX += colWidths.quantity;
    this.pdf.text('UNIT PRICE', currentX, tableY + 5);
    currentX += colWidths.unitPrice;
    this.pdf.text('AMOUNT', currentX, tableY + 5);

    this.currentY = tableY + rowHeight;

    // Table rows
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont('helvetica', 'normal');

    // Handle missing or empty items array
    const items = invoice.items || [];
    
    if (items.length === 0) {
      // Show "No items" message if items array is empty
      this.pdf.setTextColor(100, 100, 100);
      this.pdf.text('No items to display', this.margin + 2, this.currentY + 5);
      this.currentY += rowHeight;
    } else {
      items.forEach((item, index) => {
        const rowY = this.currentY;
        
        // Alternate row background
        if (index % 2 === 1) {
          this.pdf.setFillColor(245, 245, 245);
          this.pdf.rect(this.margin, rowY, this.pageWidth - 2 * this.margin, rowHeight, 'F');
        }

        currentX = this.margin + 2;
        
        // Description (truncate if too long, handle missing description)
        const maxDescLength = 50;
        const description = (item.description || 'No description').length > maxDescLength 
          ? (item.description || 'No description').substring(0, maxDescLength) + '...'
          : (item.description || 'No description');
        this.pdf.text(description, currentX, rowY + 5);
        
        currentX += colWidths.description;
        this.pdf.text((item.quantity || 0).toString(), currentX, rowY + 5);
        
        currentX += colWidths.quantity;
        this.pdf.text(`$${(item.unitPrice || 0).toFixed(2)}`, currentX, rowY + 5);
        
        currentX += colWidths.unitPrice;
        this.pdf.text(`$${(item.amount || 0).toFixed(2)}`, currentX, rowY + 5);

        this.currentY += rowHeight;
      });
    }

    // Table border
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.rect(this.margin, tableY, this.pageWidth - 2 * this.margin, this.currentY - tableY);

    this.currentY += 10;
  }

  private addSummarySection(invoice: Invoice) {
    const summaryX = this.pageWidth - this.margin - 80;
    const lineHeight = 6;

    // Summary box background
    this.pdf.setFillColor(250, 250, 250);
    this.pdf.rect(summaryX - 5, this.currentY - 5, 85, 50, 'F');

    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');

    // Subtotal (with fallback)
    this.pdf.text('Subtotal:', summaryX, this.currentY);
    this.pdf.text(`$${(invoice.subtotal || 0).toFixed(2)}`, summaryX + 50, this.currentY);
    this.currentY += lineHeight;

    // Discount (if any)
    if ((invoice.discountAmount || 0) > 0) {
      this.pdf.text('Discount:', summaryX, this.currentY);
      this.pdf.text(`-$${(invoice.discountAmount || 0).toFixed(2)}`, summaryX + 50, this.currentY);
      this.currentY += lineHeight;
    }

    // Tax (with fallbacks)
    const taxRate = invoice.taxRate || 0;
    const taxAmount = invoice.taxAmount || 0;
    this.pdf.text(`Tax (${(taxRate * 100).toFixed(1)}%):`, summaryX, this.currentY);
    this.pdf.text(`$${taxAmount.toFixed(2)}`, summaryX + 50, this.currentY);
    this.currentY += lineHeight + 2;

    // Total line
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.line(summaryX, this.currentY, summaryX + 75, this.currentY);
    this.currentY += 3;

    // Total amount (with fallback)
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(12);
    this.pdf.text('TOTAL:', summaryX, this.currentY);
    this.pdf.text(`$${(invoice.totalAmount || 0).toFixed(2)}`, summaryX + 50, this.currentY);

    this.currentY += 20;
  }

  private addFooter(invoice: Invoice, options: InvoicePDFOptions) {
    // Notes section
    if (invoice.notes) {
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Notes:', this.margin, this.currentY);
      this.currentY += 6;
      
      this.pdf.setFont('helvetica', 'normal');
      const noteLines = this.pdf.splitTextToSize(invoice.notes, this.pageWidth - 2 * this.margin);
      this.pdf.text(noteLines, this.margin, this.currentY);
      this.currentY += noteLines.length * 4 + 10;
    }

    // Payment information
    if (invoice.status === 'paid' && invoice.paidAt) {
      this.currentY += 10;
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(34, 139, 34); // Green color
      this.pdf.text(`PAID on ${new Date(invoice.paidAt).toLocaleDateString()}`, this.margin, this.currentY);
      if (invoice.paymentMethod) {
        this.currentY += 4;
        this.pdf.text(`Payment Method: ${invoice.paymentMethod}`, this.margin, this.currentY);
      }
    }

    // Footer line
    this.currentY = this.pageHeight - 30;
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);

    // Footer text
    this.currentY += 10;
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.text('Thank you for your business!', this.margin, this.currentY);
    
    const generatedText = `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;
    this.pdf.text(generatedText, this.pageWidth - this.margin - this.pdf.getTextWidth(generatedText), this.currentY);
  }

  downloadPDF(filename: string) {
    this.pdf.save(filename);
  }

  getPDFBlob(): Blob {
    return this.pdf.output('blob');
  }

  getPDFDataUri(): string {
    return this.pdf.output('datauristring');
  }
}

// Utility function to generate and download invoice PDF
export const generateInvoicePDF = (
  invoice: Invoice, 
  options: InvoicePDFOptions = {},
  download: boolean = true
): jsPDF => {
  const generator = new InvoicePDFGenerator();
  const pdf = generator.generateInvoicePDF(invoice, options);
  
  if (download) {
    const filename = `invoice-${invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    generator.downloadPDF(filename);
  }
  
  return pdf;
};

// Utility to get PDF as blob for sending via email or API
export const getInvoicePDFBlob = (
  invoice: Invoice, 
  options: InvoicePDFOptions = {}
): Blob => {
  const generator = new InvoicePDFGenerator();
  generator.generateInvoicePDF(invoice, options);
  return generator.getPDFBlob();
};
