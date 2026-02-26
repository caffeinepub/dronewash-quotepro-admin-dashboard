import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileText, Download } from 'lucide-react';
import { useAllQuotes, useCreateInvoice } from '@/hooks/useQueries';
import { generateInvoicePDF } from '@/lib/pdfGenerator';

export default function InvoiceCreation() {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedQuoteId, setSelectedQuoteId] = useState('');

  const { data: quotes } = useAllQuotes();
  const { mutate: createInvoice, isPending: isCreating } = useCreateInvoice();

  const selectedQuote = quotes?.find((q) => q.id.toString() === selectedQuoteId);

  // Helper function to parse sector and sub-sector
  const parseSector = (sectorString: string) => {
    if (sectorString.startsWith('Commercial - ')) {
      const subSector = sectorString.replace('Commercial - ', '');
      return { sector: 'Commercial', subSector };
    }
    return { sector: sectorString, subSector: null };
  };

  // Helper function to get service types from services array
  const getServiceTypes = (quote: typeof selectedQuote) => {
    if (!quote || !quote.services || quote.services.length === 0) return 'N/A';
    return quote.services.map(s => s.serviceType).join(', ');
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !selectedQuoteId) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!selectedQuote) {
      toast.error('Selected quote not found');
      return;
    }

    createInvoice(
      {
        customerName,
        customerEmail,
        quoteId: BigInt(selectedQuoteId),
        totalAmount: selectedQuote.finalPrice,
      },
      {
        onSuccess: (invoiceId) => {
          toast.success('Invoice created successfully!');

          // Generate and download PDF with proper service data
          try {
            generateInvoicePDF({
              id: invoiceId,
              customerName,
              customerEmail,
              quote: selectedQuote,
              totalAmount: selectedQuote.finalPrice,
              date: new Date(),
            });
            toast.success('Invoice PDF downloaded!');
          } catch (error) {
            console.error('PDF generation error:', error);
            toast.error('Failed to generate invoice PDF');
          }

          // Reset form
          setCustomerName('');
          setCustomerEmail('');
          setSelectedQuoteId('');
        },
        onError: (error) => {
          console.error('Invoice creation error:', error);
          toast.error('Failed to create invoice');
        },
      }
    );
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">Invoice Creation</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-600" />
            Create Customer Invoice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input
                  id="customer-name"
                  placeholder="John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-email">Customer Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  placeholder="john@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote-select">Select Quote</Label>
              <Select value={selectedQuoteId} onValueChange={setSelectedQuoteId} required>
                <SelectTrigger id="quote-select">
                  <SelectValue placeholder="Choose a quote" />
                </SelectTrigger>
                <SelectContent>
                  {quotes?.map((quote) => {
                    const { sector, subSector } = parseSector(quote.sector);
                    const serviceTypes = getServiceTypes(quote);
                    return (
                      <SelectItem key={Number(quote.id)} value={quote.id.toString()}>
                        {sector}
                        {subSector && ` - ${subSector}`} - {serviceTypes} (€{quote.finalPrice.toFixed(2)})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedQuote && (() => {
              const { sector, subSector } = parseSector(selectedQuote.sector);
              const serviceTypes = getServiceTypes(selectedQuote);
              return (
                <div className="rounded-lg border bg-slate-50 p-4">
                  <h4 className="mb-2 font-semibold text-slate-900">Invoice Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Service(s):</span>
                      <span className="font-medium">{serviceTypes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Sector:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{sector}</span>
                        {subSector && (
                          <Badge variant="secondary" className="text-xs">
                            {subSector}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {selectedQuote.addOns.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Add-ons:</span>
                        <span className="font-medium">{selectedQuote.addOns.join(', ')}</span>
                      </div>
                    )}
                    <div className="mt-2 flex justify-between border-t pt-2">
                      <span className="font-semibold text-slate-900">Total Amount:</span>
                      <span className="text-xl font-bold text-cyan-600">
                        €{selectedQuote.finalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={isCreating}>
              <Download className="mr-2 h-4 w-4" />
              {isCreating ? 'Creating...' : 'Create & Download Invoice'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
