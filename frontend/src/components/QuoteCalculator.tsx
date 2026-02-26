import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Calculator, Save, Plus, X, DollarSign } from 'lucide-react';
import { useCreateQuote, useAllServiceRates } from '@/hooks/useQueries';
import type { Service, CustomerInfo } from '../backend';

// Standardized services across all sectors
const STANDARDIZED_SERVICES = [
  'Façade/Wall Cleaning',
  'Full Building Cleaning',
  'Roof Cleaning',
  'Solar Panel Cleaning',
  'Window Cleaning',
];

const COMMERCIAL_SUBSECTORS = [
  'Solar Farms',
  'Hotels',
  'High-rise buildings',
  'Infrastructure & industrial facilities',
  'Ship/Maritime / Port Facilities',
  'Building managers',
  'Municipalities',
  'Property developers',
  'School districts',
  'Church',
];

const TOWNS = ['Limassol', 'Nicosia', 'Larnaka', 'Paphos', 'Ayia Napa'];

// Van fuel costs by city (in euros) - configurable in COGS settings
const VAN_FUEL_BY_CITY: Record<string, number> = {
  'Limassol': 25,
  'Nicosia': 30,
  'Larnaka': 28,
  'Paphos': 35,
  'Ayia Napa': 32,
};

const ADD_ONS = [
  { id: 'window-cleaning', label: 'Window Cleaning', price: 200 },
  { id: 'rust-removal', label: 'Rust Removal', price: 300 },
  { id: 'pressure-wash', label: 'High-Pressure Wash', price: 150 },
  { id: 'sanitization', label: 'Sanitization', price: 250 },
];

const VOLUME_DISCOUNTS = [
  { label: '2-3 Yearly 10% OFF', minJobs: 2, maxJobs: 3, discount: 0.1 },
  { label: '4+ 15% OFF', minJobs: 4, maxJobs: null, discount: 0.15 },
];

const MINIMUM_QUOTE = 300;
const VAT_RATE = 0.19;

// COGS Constants - configurable in settings
const GENERATOR_FUEL_RATE_PER_HOUR = 7; // €7 per hour
const ADDITIONAL_PILOT_COST = 350; // €350 per job
const CHEMICALS_COST_PER_HOUR = 20; // €20 per hour

interface ServiceEntry {
  id: string;
  serviceType: string;
  area: string;
  rate: number;
}

// Service-specific area tier determination
function getAreaTier(serviceType: string, area: number): string {
  switch (serviceType) {
    case 'Solar Panel Cleaning':
      if (area <= 1000) return 'tier1';
      if (area <= 10000) return 'tier2';
      if (area <= 25000) return 'tier3';
      return 'tier4';
    
    case 'Façade/Wall Cleaning':
      if (area <= 500) return 'tier1';
      if (area <= 1000) return 'tier2';
      if (area <= 2500) return 'tier3';
      return 'tier4';
    
    case 'Roof Cleaning':
      if (area <= 300) return 'tier1';
      if (area <= 500) return 'tier2';
      if (area <= 1000) return 'tier3';
      return 'tier4';
    
    case 'Full Building Cleaning':
      if (area <= 500) return 'tier1';
      if (area <= 1000) return 'tier2';
      if (area <= 2500) return 'tier3';
      return 'tier4';
    
    case 'Window Cleaning':
      if (area <= 500) return 'tier1';
      if (area <= 1000) return 'tier2';
      if (area <= 2500) return 'tier3';
      return 'tier4';
    
    default:
      return 'tier1';
  }
}

// Calculate COGS breakdown with manual hours input
function calculateCOGSBreakdown(estimatedHours: number, town: string) {
  // Van fuel based on city
  const vanFuel = VAN_FUEL_BY_CITY[town] || 30;

  // Generator fuel: €7 per manually entered hour
  const generatorFuel = estimatedHours * GENERATOR_FUEL_RATE_PER_HOUR;

  // Additional pilot: €350 per job
  const additionalPilot = ADDITIONAL_PILOT_COST;

  // Chemicals: €20/hr
  const chemicals = estimatedHours * CHEMICALS_COST_PER_HOUR;

  // Total COGS
  const totalCOGS = vanFuel + generatorFuel + additionalPilot + chemicals;

  return {
    vanFuel,
    generatorFuel,
    additionalPilot,
    chemicals,
    totalCOGS,
    estimatedHours,
  };
}

export default function QuoteCalculator() {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [chargeDescription, setChargeDescription] = useState('');
  const [sector, setSector] = useState('');
  const [subSector, setSubSector] = useState('');
  const [town, setTown] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  
  const [services, setServices] = useState<ServiceEntry[]>([
    { id: '1', serviceType: '', area: '', rate: 0 }
  ]);
  
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [volumeJobs, setVolumeJobs] = useState('1');
  const [nightService, setNightService] = useState(false);
  
  const [subtotal, setSubtotal] = useState(0);
  const [vatAmount, setVatAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [cogsBreakdown, setCogsBreakdown] = useState<ReturnType<typeof calculateCOGSBreakdown> | null>(null);

  const { mutate: createQuote, isPending: isCreating } = useCreateQuote();
  const { data: serviceRatesData, isLoading: ratesLoading } = useAllServiceRates();

  const showSubSectorSelector = sector === 'Commercial';

  // Convert backend rates data to a lookup map
  const ratesMap = new Map<string, number>();
  if (serviceRatesData) {
    serviceRatesData.forEach(([serviceType, tiers]) => {
      tiers.forEach(([tier, rate]) => {
        ratesMap.set(`${serviceType}:${tier}`, rate);
      });
    });
  }

  useEffect(() => {
    calculatePrice();
  }, [services, selectedAddOns, volumeJobs, nightService, serviceRatesData, town, estimatedHours]);

  const calculateServiceRate = (service: ServiceEntry): number => {
    if (!service.serviceType || !service.area) return 0;
    
    const area = parseFloat(service.area) || 0;
    if (area <= 0) return 0;

    const areaTier = getAreaTier(service.serviceType, area);
    const rateKey = `${service.serviceType}:${areaTier}`;
    const baseRate = ratesMap.get(rateKey) || 0;

    // Calculate total based on area
    const price = baseRate * area;

    return Math.round(price * 100) / 100;
  };

  const calculatePrice = () => {
    // Sum all service rates
    let price = services.reduce((total, service) => {
      return total + calculateServiceRate(service);
    }, 0);

    // Add-ons
    const addOnPrice = selectedAddOns.reduce((total, addOnId) => {
      const addOn = ADD_ONS.find((a) => a.id === addOnId);
      return total + (addOn?.price || 0);
    }, 0);
    price += addOnPrice;

    // Volume discount
    const jobs = parseInt(volumeJobs) || 1;
    let discount = 0;
    for (const tier of VOLUME_DISCOUNTS) {
      if (jobs >= tier.minJobs && (tier.maxJobs === null || jobs <= tier.maxJobs)) {
        discount = tier.discount;
      }
    }
    price *= 1 - discount;

    // Night service (20% premium)
    if (nightService) {
      price *= 1.2;
    }

    // Apply minimum
    price = Math.max(price, MINIMUM_QUOTE);

    const sub = Math.round(price * 100) / 100;
    const vat = Math.round(sub * VAT_RATE * 100) / 100;
    const total = Math.round((sub + vat) * 100) / 100;

    setSubtotal(sub);
    setVatAmount(vat);
    setGrandTotal(total);

    // Calculate COGS breakdown if town and estimated hours are provided
    if (town && estimatedHours) {
      const hours = parseFloat(estimatedHours) || 0;
      if (hours > 0) {
        const breakdown = calculateCOGSBreakdown(hours, town);
        setCogsBreakdown(breakdown);
      } else {
        setCogsBreakdown(null);
      }
    } else {
      setCogsBreakdown(null);
    }
  };

  const addService = () => {
    if (services.length >= 3) {
      toast.error('Maximum 3 services allowed');
      return;
    }
    setServices([...services, { id: Date.now().toString(), serviceType: '', area: '', rate: 0 }]);
  };

  const removeService = (id: string) => {
    if (services.length === 1) {
      toast.error('At least one service is required');
      return;
    }
    setServices(services.filter(s => s.id !== id));
  };

  const updateService = (id: string, updates: Partial<ServiceEntry>) => {
    setServices(services.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleSaveQuote = () => {
    if (!customerName || !sector || !town) {
      toast.error('Please fill in customer name, sector, and town');
      return;
    }

    if (showSubSectorSelector && !subSector) {
      toast.error('Please select a commercial sub-sector');
      return;
    }

    if (!estimatedHours || parseFloat(estimatedHours) <= 0) {
      toast.error('Please enter estimated hours for the job');
      return;
    }

    const validServices = services.filter(s => s.serviceType && s.area);
    if (validServices.length === 0) {
      toast.error('Please add at least one service with area');
      return;
    }

    const jobs = parseInt(volumeJobs) || 1;
    let volumeDiscount = 0;
    for (const tier of VOLUME_DISCOUNTS) {
      if (jobs >= tier.minJobs && (tier.maxJobs === null || jobs <= tier.maxJobs)) {
        volumeDiscount = tier.discount;
      }
    }

    const backendServices: Service[] = validServices.map(s => ({
      serviceType: s.serviceType,
      rate: calculateServiceRate(s),
      quantity: parseFloat(s.area) || 0,
    }));

    const customerInfo: CustomerInfo = {
      name: customerName,
      coordinates: customerEmail,
      town: customerPhone,
      jobType: validServices[0].serviceType,
      additionalInfo: chargeDescription,
    };

    createQuote(
      {
        sector,
        services: backendServices,
        basePrice: subtotal,
        addOns: selectedAddOns.map((id) => ADD_ONS.find((a) => a.id === id)?.label || ''),
        volumeDiscount,
        nightService,
        finalPrice: subtotal,
        town,
        subSector: showSubSectorSelector ? subSector : null,
        customerInfo,
        chargeDescription,
        vatAmount,
        grandTotal,
      },
      {
        onSuccess: () => {
          toast.success('Quote saved successfully!');
          // Reset form
          setCustomerName('');
          setCustomerEmail('');
          setCustomerPhone('');
          setChargeDescription('');
          setSector('');
          setSubSector('');
          setTown('');
          setEstimatedHours('');
          setServices([{ id: '1', serviceType: '', area: '', rate: 0 }]);
          setSelectedAddOns([]);
          setVolumeJobs('1');
          setNightService(false);
          setCogsBreakdown(null);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : 'Failed to save quote');
        },
      }
    );
  };

  if (ratesLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Quote Calculator</h2>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-slate-600">Loading pricing data...</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">Quote Calculator</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-cyan-600" />
            Calculate Service Quote
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Customer Information</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Customer Name *</Label>
                <Input
                  id="customer-name"
                  type="text"
                  placeholder="John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-email">Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  placeholder="john@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Phone</Label>
                <Input
                  id="customer-phone"
                  type="tel"
                  placeholder="+357 99 123456"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="charge-description">Charge Description</Label>
              <Textarea
                id="charge-description"
                placeholder="Describe the service charge..."
                value={chargeDescription}
                onChange={(e) => setChargeDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="sector">Sector *</Label>
              <Select
                value={sector}
                onValueChange={(value) => {
                  setSector(value);
                  setSubSector('');
                }}
              >
                <SelectTrigger id="sector">
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Residential">Residential</SelectItem>
                  <SelectItem value="Industrial">Industrial</SelectItem>
                  <SelectItem value="Agricultural">Agricultural</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showSubSectorSelector && (
              <div className="space-y-2">
                <Label htmlFor="sub-sector">Commercial Sub-Sector *</Label>
                <Select value={subSector} onValueChange={setSubSector}>
                  <SelectTrigger id="sub-sector">
                    <SelectValue placeholder="Select sub-sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMERCIAL_SUBSECTORS.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="town">Town *</Label>
              <Select value={town} onValueChange={setTown}>
                <SelectTrigger id="town">
                  <SelectValue placeholder="Select town" />
                </SelectTrigger>
                <SelectContent>
                  {TOWNS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated-hours">Estimated Hours *</Label>
              <Input
                id="estimated-hours"
                type="number"
                step="0.5"
                min="0"
                placeholder="e.g., 4.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
              />
              <p className="text-xs text-slate-500">Manual entry for COGS calculation</p>
            </div>
          </div>

          <Separator />

          {/* Services */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Services</h3>
              {services.length < 3 && (
                <Button type="button" variant="outline" size="sm" onClick={addService}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Service
                </Button>
              )}
            </div>

            {services.map((service, index) => {
              const rate = calculateServiceRate(service);

              return (
                <Card key={service.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Service {index + 1}</h4>
                      {services.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(service.id)}
                          className="h-8 w-8 p-0 text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Service Type</Label>
                        <Select
                          value={service.serviceType}
                          onValueChange={(value) => {
                            updateService(service.id, { serviceType: value });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent>
                            {STANDARDIZED_SERVICES.map((svc) => (
                              <SelectItem key={svc} value={svc}>
                                {svc}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Area (m²)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="0"
                          value={service.area}
                          onChange={(e) => {
                            updateService(service.id, { area: e.target.value });
                          }}
                        />
                      </div>
                    </div>

                    {rate > 0 && (
                      <div className="bg-cyan-50 p-3 rounded-md space-y-1">
                        <p className="text-sm font-medium text-cyan-900">
                          Service Rate: €{rate.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <Separator />

          {/* Add-ons */}
          <div className="space-y-3">
            <Label>Add-on Services</Label>
            <div className="grid gap-3 md:grid-cols-2">
              {ADD_ONS.map((addOn) => (
                <div key={addOn.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={addOn.id}
                    checked={selectedAddOns.includes(addOn.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedAddOns([...selectedAddOns, addOn.id]);
                      } else {
                        setSelectedAddOns(selectedAddOns.filter((id) => id !== addOn.id));
                      }
                    }}
                  />
                  <Label htmlFor={addOn.id} className="cursor-pointer font-normal">
                    {addOn.label} (+€{addOn.price})
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Volume Discount */}
          <div className="space-y-2">
            <Label htmlFor="volume-jobs">Number of Jobs (Volume Discount)</Label>
            <Input
              id="volume-jobs"
              type="number"
              min="1"
              value={volumeJobs}
              onChange={(e) => setVolumeJobs(e.target.value)}
            />
            <div className="text-xs text-slate-500">
              {VOLUME_DISCOUNTS.map((tier) => (
                <div key={tier.label}>{tier.label}</div>
              ))}
            </div>
          </div>

          {/* Service Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="night-service" className="cursor-pointer">
                  Night Service
                </Label>
                <p className="text-xs text-slate-500">+20% premium</p>
              </div>
              <Switch id="night-service" checked={nightService} onCheckedChange={setNightService} />
            </div>
          </div>

          <Separator />

          {/* COGS Breakdown (Internal View) */}
          {cogsBreakdown && (
            <>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                  Internal Cost Analysis (COGS)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-white p-2 rounded">
                    <p className="text-xs text-slate-600">Van Fuel ({town})</p>
                    <p className="font-semibold text-slate-900">€{cogsBreakdown.vanFuel.toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <p className="text-xs text-slate-600">Generator Fuel</p>
                    <p className="font-semibold text-slate-900">€{cogsBreakdown.generatorFuel.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">{cogsBreakdown.estimatedHours}h × €7/h</p>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <p className="text-xs text-slate-600">Additional Pilot</p>
                    <p className="font-semibold text-slate-900">€{cogsBreakdown.additionalPilot.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">€350 per job</p>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <p className="text-xs text-slate-600">Chemicals</p>
                    <p className="font-semibold text-slate-900">€{cogsBreakdown.chemicals.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">{cogsBreakdown.estimatedHours}h × €20/h</p>
                  </div>
                  <div className="bg-amber-100 p-2 rounded col-span-2 md:col-span-1">
                    <p className="text-xs text-amber-800 font-medium">Total COGS</p>
                    <p className="font-bold text-amber-900">€{cogsBreakdown.totalCOGS.toFixed(2)}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">Estimated Profit:</span>
                    <span className="font-semibold text-green-600">
                      €{(subtotal - cogsBreakdown.totalCOGS).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-700">Profit Margin:</span>
                    <span className="font-semibold text-cyan-600">
                      {subtotal > 0 ? (((subtotal - cogsBreakdown.totalCOGS) / subtotal) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Price Summary */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900">Price Summary</h3>
            
            {/* Service Breakdown */}
            {services.filter(s => s.serviceType && s.area).length > 0 && (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-slate-700">Services:</p>
                {services.filter(s => s.serviceType && s.area).map((service) => {
                  const rate = calculateServiceRate(service);
                  return (
                    <div key={service.id} className="flex justify-between text-slate-600 pl-4">
                      <span>{service.serviceType} ({service.area} m²)</span>
                      <span>€{rate.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="rounded-lg bg-slate-50 p-4 space-y-2">
              <div className="flex items-center justify-between text-slate-700">
                <span>Subtotal:</span>
                <span className="font-semibold">€{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>VAT (19%):</span>
                <span className="font-semibold">€{vatAmount.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-slate-900">Grand Total:</span>
                <span className="text-2xl font-bold text-cyan-600">€{grandTotal.toLocaleString()}</span>
              </div>
            </div>
            {subtotal === MINIMUM_QUOTE && (
              <p className="text-xs text-slate-500">Minimum quote applied</p>
            )}
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveQuote}
            className="w-full bg-cyan-600 hover:bg-cyan-700"
            disabled={isCreating || !customerName || !sector || !town || !estimatedHours || (showSubSectorSelector && !subSector)}
          >
            <Save className="mr-2 h-4 w-4" />
            {isCreating ? 'Saving...' : 'Save Quote'}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
