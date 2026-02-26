import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, Trash2, CheckCircle2, Clock, Search, Filter, X } from 'lucide-react';
import { useAllInvoices, useAllQuotes, useDeleteInvoice, useUpdateInvoiceStatus } from '@/hooks/useQueries';
import { generateInvoicePDF } from '@/lib/pdfGenerator';
import { toast } from 'sonner';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import type { Invoice } from '../backend';

interface InvoicesListProps {
  isAdmin: boolean;
}

export default function InvoicesList({ isAdmin }: InvoicesListProps) {
  const { data: invoices, isLoading } = useAllInvoices();
  const { data: quotes } = useAllQuotes();
  const { mutate: deleteInvoice, isPending: isDeleting } = useDeleteInvoice();
  const { mutate: updateInvoiceStatus, isPending: isUpdatingStatus } = useUpdateInvoiceStatus();
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    
    return invoices.filter(invoice => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        invoice.customerName.toLowerCase().includes(searchLower) ||
        invoice.customerEmail.toLowerCase().includes(searchLower) ||
        invoice.id.toString().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const handleDownloadPDF = (invoice: Invoice) => {
    try {
      const quote = quotes?.find((q) => q.id === invoice.quoteId);
      if (!quote) {
        toast.error('Quote not found for this invoice');
        return;
      }

      generateInvoicePDF({
        id: invoice.id,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
        quote,
        totalAmount: invoice.totalAmount,
        date: new Date(Number(invoice.date) / 1000000),
      });
      toast.success('Invoice PDF downloaded successfully!');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const handleDeleteInvoice = () => {
    if (!deletingInvoice) return;
    deleteInvoice(deletingInvoice.id, {
      onSuccess: () => {
        toast.success('Invoice deleted successfully!');
        setDeletingInvoice(null);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to delete invoice');
        setDeletingInvoice(null);
      },
    });
  };

  const handleStatusToggle = (invoice: Invoice) => {
    const newStatus = invoice.status === 'Paid' ? 'Pending' : 'Paid';
    updateInvoiceStatus(
      { invoiceId: invoice.id, status: newStatus },
      {
        onSuccess: () => {
          toast.success(`Invoice marked as ${newStatus}`);
        },
        onError: (error: any) => {
          toast.error(error.message || 'Failed to update invoice status');
        },
      }
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Invoices</h2>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-slate-500">Loading invoices...</div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Invoices</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-600" />
            All Invoices
            {filteredInvoices.length !== invoices?.length && (
              <Badge variant="secondary" className="ml-2">
                {filteredInvoices.length} of {invoices?.length || 0}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by customer name, email, or invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid gap-3 md:grid-cols-2 rounded-lg border bg-slate-50 p-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Payment Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Invoices Table */}
          {!filteredInvoices || filteredInvoices.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'No invoices match your filters' 
                : 'No invoices created yet'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={Number(invoice.id)}>
                      <TableCell className="text-sm">{formatDate(invoice.date)}</TableCell>
                      <TableCell className="font-medium">{invoice.customerName}</TableCell>
                      <TableCell className="text-sm text-slate-600">{invoice.customerEmail}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {invoice.status === 'Paid' ? (
                            <Badge variant="default" className="gap-1 bg-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Paid
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                          {isAdmin && (
                            <Switch
                              checked={invoice.status === 'Paid'}
                              onCheckedChange={() => handleStatusToggle(invoice)}
                              disabled={isUpdatingStatus}
                              className="scale-75"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">€{invoice.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(invoice)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingInvoice(invoice)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {deletingInvoice && (
        <DeleteConfirmDialog
          title="Delete Invoice"
          description="Are you sure you want to delete this invoice? This action cannot be undone."
          onConfirm={handleDeleteInvoice}
          onCancel={() => setDeletingInvoice(null)}
          isDeleting={isDeleting}
        />
      )}
    </section>
  );
}
