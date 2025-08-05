import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Eye, X } from 'lucide-react';
import { Invoice } from '@/lib/api';
import { generateInvoicePDF, InvoicePDFOptions } from '@/utils/invoicePDFGenerator';

interface InvoicePreviewDialogProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (invoice: Invoice) => void;
}

const InvoicePreviewDialog: React.FC<InvoicePreviewDialogProps> = ({
  invoice,
  isOpen,
  onClose,
  onDownload
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const generatePreview = React.useCallback(async () => {
    if (!invoice) return;

    try {
      setIsGenerating(true);
      
      // Debug: Log the invoice structure to understand what we're working with
      console.log('Invoice data for PDF generation:', {
        invoiceNumber: invoice.invoiceNumber,
        customer: invoice.customer,
        items: invoice.items,
        totalAmount: invoice.totalAmount
      });
      
      const companyOptions: InvoicePDFOptions = {
        companyName: 'Cargo Pathway Pro',
        companyAddress: '123 Logistics Avenue\nTransport City, TC 12345\nUnited States',
        companyPhone: '+1 (555) 123-4567',
        companyEmail: 'billing@cargopathwaypro.com'
      };

      const pdf = generateInvoicePDF(invoice, companyOptions, false);
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      console.error('Invoice data that caused the error:', invoice);
    } finally {
      setIsGenerating(false);
    }
  }, [invoice]);

  React.useEffect(() => {
    if (isOpen && invoice && !pdfUrl) {
      generatePreview();
    }
  }, [isOpen, invoice, pdfUrl, generatePreview]);

  const handleDownload = () => {
    if (invoice && onDownload) {
      onDownload(invoice);
    }
  };

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    onClose();
  };

  React.useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Invoice Preview - {invoice.invoiceNumber}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
          {isGenerating ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Generating PDF preview...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full min-h-[600px]"
              title={`Invoice ${invoice.invoiceNumber} Preview`}
            />
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <p className="text-gray-600 mb-4">Failed to generate PDF preview</p>
                <Button onClick={generatePreview} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              Status: <span className="font-medium capitalize">{invoice.status}</span> | 
              Amount: <span className="font-medium">${invoice.totalAmount.toFixed(2)}</span>
            </div>
            <div>
              Due: {new Date(invoice.dueDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoicePreviewDialog;
