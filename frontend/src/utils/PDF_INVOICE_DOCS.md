# PDF Invoice Generator Documentation

## Overview
The invoice PDF generator provides professional, branded invoice documents that can be downloaded as PDF files.

## Features

### 1. Professional Invoice Layout
- Company header with branding
- Customer billing information
- Invoice details (number, dates, status)
- Itemized billing table
- Tax calculations and totals
- Payment terms and notes
- Professional footer

### 2. PDF Generation
- Uses jsPDF library for reliable PDF creation
- Clean, professional formatting
- Proper typography and spacing
- Company branding integration

### 3. Download Options
- Direct PDF download
- Preview before download
- Customizable filename format

## Usage

### Basic Download
```typescript
// Direct download
const downloadInvoice = async (invoice: Invoice) => {
  const companyOptions = {
    companyName: 'Cargo Pathway Pro',
    companyAddress: '123 Logistics Avenue\nTransport City, TC 12345',
    companyPhone: '+1 (555) 123-4567',
    companyEmail: 'billing@cargopathwaypro.com'
  };

  generateInvoicePDF(invoice, companyOptions, true);
};
```

### Preview & Download
```typescript
// Preview in dialog before download
const viewInvoiceDetails = async (invoice: Invoice) => {
  const details = await customerApi.getInvoiceDetails(invoice.id);
  setPreviewInvoice(details);
  setPreviewOpen(true);
};
```

## Invoice Data Structure
The PDF generator expects a complete Invoice object with:
- Customer information
- Invoice details (number, dates, status)
- Line items with descriptions, quantities, prices
- Tax calculations
- Payment terms and notes

## PDF Content Sections

### 1. Company Header
- Company name and branding
- Contact information
- Professional color scheme

### 2. Invoice Title & Number
- Large "INVOICE" title
- Invoice number and reference

### 3. Billing Information
- Customer details (name, email, phone, address)
- Invoice dates and payment terms
- Associated booking numbers

### 4. Items Table
- Professional table formatting
- Item descriptions, quantities, unit prices
- Line totals with proper alignment
- Alternating row colors for readability

### 5. Summary Section
- Subtotal calculations
- Tax breakdown
- Discount applications
- Final total with emphasis

### 6. Footer
- Payment status information
- Notes and terms
- Generation timestamp

## File Naming Convention
Generated PDFs use the format:
`invoice-{invoiceNumber}-{date}.pdf`

Example: `invoice-INV-001-2025-08-05.pdf`

## Error Handling
- Graceful fallbacks for missing data
- User-friendly error messages
- Loading states during generation
- Retry mechanisms for failed operations

## Browser Compatibility
- Works in all modern browsers
- No external dependencies beyond jsPDF
- Client-side generation (no server required)
