import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, ChevronDown, ChevronUp, Download, Eye, Trash2 } from 'lucide-react';
import { useGetAllQuotes, useDeleteQuote, useGetInternalQuoteView } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { generateQuotePDF, generateInternalQuotePDF } from '@/lib/pdfGenerator';
import type { Quote } from '../backend';

interface QuotesListProps {
  isAdmin: boolean;
}

const SECTORS: string[] = ['All', 'Residential', 'Commercial', 'Industrial', 'Government'];
const SERVICE_TYPES: string[] = ['All', 'Façade/Wall Cleaning', 'Full Building Cleaning', 'Roof Cleaning', 'Solar Panel Cleaning', 'Window Cleaning'];

export default function QuotesList({ isAdmin }: QuotesListProps) {
  const { data: quotes = [], isLoading } = useGetAllQuotes();
  const deleteQuote = useDeleteQuote();
  const getInternalView = useGetInternalQuoteView();

  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedService, setSelectedService] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);

  const formatDate = (timestamp: bigint) =>
    new Date(Number(timestamp) / 1_000_000).toLocaleDateString('en-IE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const filtered = useMemo(() => {
    return quotes.filter((q: Quote) => {
      const matchesSearch =
        q.customerInfo.name.toLowerCase().includes(search.toLowerCase()) ||
        q.town.toLowerCase().includes(search.toLowerCase()) ||
        q.sector.toLowerCase().includes(search.toLowerCase());
      const matchesSector = selectedSector === 'All' || q.sector === selectedSector;
      const matchesService =
        selectedService === 'All' ||
        q.services.some((s) => s.serviceType === selectedService);
      return matchesSearch && matchesSector && matchesService;
    });
  }, [quotes, search, selectedSector, selectedService]);

  const handleDelete = async (id: bigint) => {
    try {
      await deleteQuote.mutateAsync(id);
      toast.success('Quote deleted');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to delete quote');
    }
  };

  const handleExportCustomer = (quote: Quote) => {
    try {
      generateQuotePDF(quote);
    } catch {
      toast.error('Failed to generate PDF');
    }
  };

  const handleExportInternal = async (quoteId: bigint) => {
    try {
      const view = await getInternalView.mutateAsync(quoteId);
      generateInternalQuotePDF(view.quote, view.costBreakdown);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to generate internal PDF');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading quotes...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quotes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-3 mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sector:</span>
                <Select value={selectedSector} onValueChange={setSelectedSector}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((sector: string) => (
                      <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Service:</span>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((service: string) => (
                      <SelectItem key={service} value={service}>{service}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Showing {filtered.length} of {quotes.length} quotes
          </p>
        </CardContent>
      </Card>

      {/* Quotes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Saved Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No quotes found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Town</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead className="text-right">Final Price</TableHead>
                    <TableHead className="text-right">Grand Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((quote: Quote) => (
                    <React.Fragment key={quote.id.toString()}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          setExpandedId(
                            expandedId === quote.id.toString() ? null : quote.id.toString()
                          )
                        }
                      >
                        <TableCell className="text-sm">{formatDate(quote.date)}</TableCell>
                        <TableCell className="text-sm font-medium">{quote.customerInfo.name}</TableCell>
                        <TableCell className="text-sm">{quote.town}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{quote.sector}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {formatCurrency(quote.finalPrice)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-bold">
                          {formatCurrency(quote.grandTotal)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportCustomer(quote)}
                              title="Export customer PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExportInternal(quote.id)}
                                title="Export internal PDF"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(quote.id)}
                                disabled={deleteQuote.isPending}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedId === quote.id.toString() && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30 p-4">
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Base Price:</span>
                                  <span className="ml-2 font-medium">{formatCurrency(quote.basePrice)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">VAT:</span>
                                  <span className="ml-2 font-medium">{formatCurrency(quote.vatAmount)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Discount:</span>
                                  <span className="ml-2 font-medium">{quote.volumeDiscount}%</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Night Service:</span>
                                  <span className="ml-2 font-medium">{quote.nightService ? 'Yes' : 'No'}</span>
                                </div>
                              </div>
                              {quote.services.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Services:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {quote.services.map((s, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {s.serviceType} × {s.quantity}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {quote.chargeDescription && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Description:</p>
                                  <p className="text-sm">{quote.chargeDescription}</p>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
