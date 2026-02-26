import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Trash2, MapPin, User, Search, Filter, X, DollarSign, TrendingUp } from 'lucide-react';
import { useAllQuotes, useDeleteQuote } from '@/hooks/useQueries';
import { generateQuotePDF, generateInternalQuotePDF } from '@/lib/pdfGenerator';
import { toast } from 'sonner';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import type { Quote } from '../backend';

interface QuotesListProps {
  isAdmin: boolean;
}

// Van fuel costs by city (in euros)
const VAN_FUEL_BY_CITY: Record<string, number> = {
  'Limassol': 25,
  'Nicosia': 30,
  'Larnaka': 28,
  'Paphos': 35,
  'Ayia Napa': 32,
};

// COGS Constants
const GENERATOR_FUEL_RATE = 3.5; // liters per hour
const FUEL_PRICE_PER_LITER = 2.0; // euros
const ADDITIONAL_PILOT_COST = 175; // euros per job
const CHEMICALS_COST_PER_HOUR = 20; // euros per hour

// Estimate hours based on service type and area
function estimateHours(serviceType: string, area: number): number {
  const baseRate = {
    'Solar Panel Cleaning': 0.01,
    'Façade/Wall Cleaning': 0.015,
    'Roof Cleaning': 0.012,
    'Full Building Cleaning': 0.02,
    'Window Cleaning': 0.008,
  }[serviceType] || 0.01;

  const hours = area * baseRate;
  return Math.max(1, Math.round(hours * 10) / 10);
}

export default function QuotesList({ isAdmin }: QuotesListProps) {
  const { data: quotes, isLoading } = useAllQuotes();
  const { mutate: deleteQuote, isPending: isDeleting } = useDeleteQuote();
  const [deletingQuote, setDeletingQuote] = useState<Quote | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique sectors and services for filters
  const sectors = useMemo(() => {
    if (!quotes) return [];
    return Array.from(new Set(quotes.map(q => q.sector)));
  }, [quotes]);

  const services = useMemo(() => {
    if (!quotes) return [];
    const allServices = quotes.flatMap(q => q.services.map(s => s.serviceType));
    return Array.from(new Set(allServices));
  }, [quotes]);

  // Filter quotes
  const filteredQuotes = useMemo(() => {
    if (!quotes) return [];
    
    return quotes.filter(quote => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        quote.customerInfo.name.toLowerCase().includes(searchLower) ||
        quote.chargeDescription.toLowerCase().includes(searchLower) ||
        quote.services.some(s => s.serviceType.toLowerCase().includes(searchLower));

      // Sector filter
      const matchesSector = sectorFilter === 'all' || quote.sector === sectorFilter;

      // Service filter
      const matchesService = serviceFilter === 'all' || 
        quote.services.some(s => s.serviceType === serviceFilter);

      return matchesSearch && matchesSector && matchesService;
    });
  }, [quotes, searchTerm, sectorFilter, serviceFilter]);

  // Calculate internal cost breakdown for a quote
  const calculateCostBreakdown = (quote: Quote) => {
    // Van fuel based on city
    const vanFuel = VAN_FUEL_BY_CITY[quote.town] || 30;

    // Calculate total estimated hours from all services
    const totalHours = quote.services.reduce((sum, service) => {
      return sum + estimateHours(service.serviceType, service.quantity);
    }, 0);

    // Generator fuel: 3.5L/hr at €2/L
    const generatorFuel = totalHours * GENERATOR_FUEL_RATE * FUEL_PRICE_PER_LITER;

    // Additional pilot: €175 per job
    const additionalPilot = ADDITIONAL_PILOT_COST;

    // Chemicals: €20/hr
    const chemicals = totalHours * CHEMICALS_COST_PER_HOUR;

    // Total COGS
    const cogs = vanFuel + generatorFuel + additionalPilot + chemicals;
    
    // OpEx: Estimated operational expenses (15% of COGS)
    const opEx = cogs * 0.15;
    
    // Revenue is the final price
    const revenue = quote.finalPrice;
    
    // Profit margin
    const totalCosts = cogs + opEx;
    const profitMargin = revenue > 0 ? ((revenue - totalCosts) / revenue) * 100 : 0;
    
    return {
      cogs,
      opEx,
      revenue,
      profitMargin,
      totalCosts,
      netProfit: revenue - totalCosts,
      vanFuel,
      generatorFuel,
      additionalPilot,
      chemicals,
      estimatedHours: totalHours,
    };
  };

  const handleDownloadCustomerPDF = (quote: Quote) => {
    try {
      generateQuotePDF(quote);
      toast.success('Customer quote PDF downloaded successfully!');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const handleDownloadInternalPDF = (quote: Quote) => {
    try {
      const costBreakdown = calculateCostBreakdown(quote);
      generateInternalQuotePDF(quote, costBreakdown);
      toast.success('Internal quote PDF downloaded successfully!');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const handleDeleteQuote = () => {
    if (!deletingQuote) return;
    deleteQuote(deletingQuote.id, {
      onSuccess: () => {
        toast.success('Quote deleted successfully!');
        setDeletingQuote(null);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to delete quote');
        setDeletingQuote(null);
      },
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSectorFilter('all');
    setServiceFilter('all');
  };

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Saved Quotes</h2>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-slate-500">Loading quotes...</div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Saved Quotes</h2>
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
            Recent Quotes
            {filteredQuotes.length !== quotes?.length && (
              <Badge variant="secondary" className="ml-2">
                {filteredQuotes.length} of {quotes?.length || 0}
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
                placeholder="Search by customer name, description, or service..."
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
              <div className="grid gap-3 md:grid-cols-3 rounded-lg border bg-slate-50 p-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Sector</label>
                  <Select value={sectorFilter} onValueChange={setSectorFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sectors</SelectItem>
                      {sectors.map(sector => (
                        <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Service Type</label>
                  <Select value={serviceFilter} onValueChange={setServiceFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      {services.map(service => (
                        <SelectItem key={service} value={service}>{service}</SelectItem>
                      ))}
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

          {/* Quotes List */}
          {!filteredQuotes || filteredQuotes.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              {searchTerm || sectorFilter !== 'all' || serviceFilter !== 'all' 
                ? 'No quotes match your filters' 
                : 'No quotes saved yet'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuotes.map((quote) => {
                const costBreakdown = isAdmin ? calculateCostBreakdown(quote) : null;
                
                return (
                  <div 
                    key={Number(quote.id)} 
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setViewingQuote(quote)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {quote.customerInfo.name && (
                          <div className="flex items-center gap-1 text-slate-900 font-semibold">
                            <User className="h-4 w-4" />
                            {quote.customerInfo.name}
                          </div>
                        )}
                        <Badge variant="outline">{quote.sector}</Badge>
                        {quote.subSector && (
                          <Badge variant="secondary" className="text-xs">
                            {quote.subSector}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {quote.town}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-600">
                        <span>{quote.services.length} service(s)</span>
                        {quote.volumeDiscount > 0 && <span>• Discount: {(quote.volumeDiscount * 100).toFixed(0)}%</span>}
                        {quote.nightService && <span>• Night Service</span>}
                      </div>
                      {isAdmin && costBreakdown && (
                        <div className="mt-2 flex gap-3 text-xs">
                          <span className="text-slate-600">
                            <DollarSign className="inline h-3 w-3" /> COGS: €{costBreakdown.cogs.toFixed(2)}
                          </span>
                          <span className="text-slate-600">
                            <DollarSign className="inline h-3 w-3" /> Profit: €{costBreakdown.netProfit.toFixed(2)}
                          </span>
                          <span className="text-slate-600">
                            <TrendingUp className="inline h-3 w-3" /> Margin: {costBreakdown.profitMargin.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Grand Total</div>
                        <div className="text-2xl font-bold text-cyan-600">€{quote.grandTotal.toLocaleString()}</div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadCustomerPDF(quote);
                        }}
                        title="Download Customer PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingQuote(quote);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quote Details Dialog */}
      {viewingQuote && (
        <Dialog open onOpenChange={() => setViewingQuote(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Quote Details</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue={isAdmin ? "internal" : "customer"} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                {isAdmin && (
                  <TabsTrigger value="internal">Internal View</TabsTrigger>
                )}
                <TabsTrigger value="customer">Customer View</TabsTrigger>
              </TabsList>
              
              {/* Internal View (Admin Only) */}
              {isAdmin && (
                <TabsContent value="internal" className="space-y-4 mt-4">
                  {(() => {
                    const costBreakdown = calculateCostBreakdown(viewingQuote);
                    
                    return (
                      <>
                        {/* Cost Breakdown Summary */}
                        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-lg border border-cyan-200">
                          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-cyan-600" />
                            Internal Cost Analysis
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-slate-600">COGS</p>
                              <p className="text-lg font-bold text-slate-900">€{costBreakdown.cogs.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600">OpEx</p>
                              <p className="text-lg font-bold text-slate-900">€{costBreakdown.opEx.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600">Net Profit</p>
                              <p className="text-lg font-bold text-green-600">€{costBreakdown.netProfit.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600">Margin</p>
                              <p className="text-lg font-bold text-cyan-600">{costBreakdown.profitMargin.toFixed(1)}%</p>
                            </div>
                          </div>
                        </div>

                        {/* COGS Component Breakdown */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-slate-900">COGS Breakdown</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="p-3 bg-slate-50 rounded">
                              <p className="text-xs text-slate-600">Van Fuel ({viewingQuote.town})</p>
                              <p className="font-semibold text-slate-900">€{costBreakdown.vanFuel.toFixed(2)}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded">
                              <p className="text-xs text-slate-600">Generator Fuel</p>
                              <p className="font-semibold text-slate-900">€{costBreakdown.generatorFuel.toFixed(2)}</p>
                              <p className="text-xs text-slate-500">{costBreakdown.estimatedHours}h × 3.5L/h × €2/L</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded">
                              <p className="text-xs text-slate-600">Additional Pilot</p>
                              <p className="font-semibold text-slate-900">€{costBreakdown.additionalPilot.toFixed(2)}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded">
                              <p className="text-xs text-slate-600">Chemicals</p>
                              <p className="font-semibold text-slate-900">€{costBreakdown.chemicals.toFixed(2)}</p>
                              <p className="text-xs text-slate-500">{costBreakdown.estimatedHours}h × €20/h</p>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Breakdown */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-slate-900">Full Expense Breakdown</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between p-2 bg-slate-50 rounded">
                              <span className="text-slate-600">Cost of Goods Sold (COGS)</span>
                              <span className="font-semibold">€{costBreakdown.cogs.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-slate-50 rounded">
                              <span className="text-slate-600">Operational Expenses (OpEx)</span>
                              <span className="font-semibold">€{costBreakdown.opEx.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between p-2 bg-cyan-50 rounded">
                              <span className="font-semibold text-slate-900">Total Costs</span>
                              <span className="font-bold text-slate-900">€{costBreakdown.totalCosts.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-slate-50 rounded">
                              <span className="text-slate-600">Revenue</span>
                              <span className="font-semibold">€{costBreakdown.revenue.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between p-2 bg-green-50 rounded">
                              <span className="font-semibold text-green-900">Net Profit</span>
                              <span className="font-bold text-green-600">€{costBreakdown.netProfit.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Export Options */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleDownloadInternalPDF(viewingQuote)}
                            className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Internal PDF
                          </Button>
                          <Button
                            onClick={() => handleDownloadCustomerPDF(viewingQuote)}
                            variant="outline"
                            className="flex-1"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Customer PDF
                          </Button>
                        </div>
                      </>
                    );
                  })()}
                </TabsContent>
              )}
              
              {/* Customer View */}
              <TabsContent value="customer" className="space-y-4 mt-4">
                {/* Customer Information */}
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <h3 className="font-semibold text-slate-900">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Name</p>
                      <p className="font-medium">{viewingQuote.customerInfo.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Email</p>
                      <p className="font-medium">{viewingQuote.customerInfo.coordinates || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Phone</p>
                      <p className="font-medium">{viewingQuote.customerInfo.town || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Quote Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900">Quote Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Sector</p>
                      <p className="font-medium">{viewingQuote.sector}</p>
                    </div>
                    {viewingQuote.subSector && (
                      <div>
                        <p className="text-slate-600">Sub-Sector</p>
                        <p className="font-medium">{viewingQuote.subSector}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-600">Town</p>
                      <p className="font-medium">{viewingQuote.town}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Date</p>
                      <p className="font-medium">{new Date(Number(viewingQuote.date) / 1000000).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {viewingQuote.chargeDescription && (
                    <div>
                      <p className="text-slate-600 text-sm">Charge Description</p>
                      <p className="font-medium text-sm">{viewingQuote.chargeDescription}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Services */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900">Services</h3>
                  {viewingQuote.services.map((service, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-md">
                      <div>
                        <p className="font-medium">{service.serviceType}</p>
                        <p className="text-xs text-slate-600">Quantity: {service.quantity} m²</p>
                      </div>
                      <p className="font-semibold text-cyan-600">€{service.rate.toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {/* Add-ons */}
                {viewingQuote.addOns.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-900">Add-ons</h3>
                    <div className="flex flex-wrap gap-2">
                      {viewingQuote.addOns.map((addOn, index) => (
                        <Badge key={index} variant="secondary">{addOn}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Options */}
                <div className="space-y-2 text-sm">
                  {viewingQuote.volumeDiscount > 0 && (
                    <p className="text-slate-600">Volume Discount: {(viewingQuote.volumeDiscount * 100).toFixed(0)}%</p>
                  )}
                  {viewingQuote.nightService && (
                    <p className="text-slate-600">Night Service: Yes (+20%)</p>
                  )}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900">Price Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-medium">€{viewingQuote.finalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">VAT (19%)</span>
                      <span className="font-medium">€{viewingQuote.vatAmount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold text-slate-900">Grand Total</span>
                      <span className="font-bold text-cyan-600">€{viewingQuote.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Export Button */}
                <Button
                  onClick={() => handleDownloadCustomerPDF(viewingQuote)}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Customer PDF
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {deletingQuote && (
        <DeleteConfirmDialog
          title="Delete Quote"
          description="Are you sure you want to delete this quote? This action cannot be undone."
          onConfirm={handleDeleteQuote}
          onCancel={() => setDeletingQuote(null)}
          isDeleting={isDeleting}
        />
      )}
    </section>
  );
}
