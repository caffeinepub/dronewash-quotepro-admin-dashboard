import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { DollarSign, Save } from 'lucide-react';
import { useAllServiceRates, useSetServiceRate } from '@/hooks/useQueries';

// Service types with their specific area tier ranges
const SERVICE_TYPES = [
  {
    key: 'Solar Panel Cleaning',
    label: 'Solar Panel Cleaning',
    tiers: [
      { key: 'tier1', label: '1–1,000 m²' },
      { key: 'tier2', label: '1,000–10,000 m²' },
      { key: 'tier3', label: '10,000–25,000 m²' },
      { key: 'tier4', label: 'Over 25,000 m²' },
    ],
  },
  {
    key: 'Façade/Wall Cleaning',
    label: 'Façade/Wall Cleaning',
    tiers: [
      { key: 'tier1', label: '1–500 m²' },
      { key: 'tier2', label: '500–1,000 m²' },
      { key: 'tier3', label: '1,000–2,500 m²' },
      { key: 'tier4', label: 'Over 2,500 m²' },
    ],
  },
  {
    key: 'Roof Cleaning',
    label: 'Roof Cleaning',
    tiers: [
      { key: 'tier1', label: '1–300 m²' },
      { key: 'tier2', label: '300–500 m²' },
      { key: 'tier3', label: '500–1,000 m²' },
      { key: 'tier4', label: 'Over 1,000 m²' },
    ],
  },
  {
    key: 'Full Building Cleaning',
    label: 'Full Building Cleaning',
    tiers: [
      { key: 'tier1', label: '1–500 m²' },
      { key: 'tier2', label: '500–1,000 m²' },
      { key: 'tier3', label: '1,000–2,500 m²' },
      { key: 'tier4', label: 'Over 2,500 m²' },
    ],
  },
  {
    key: 'Window Cleaning',
    label: 'Window Cleaning',
    tiers: [
      { key: 'tier1', label: '1–500 m²' },
      { key: 'tier2', label: '500–1,000 m²' },
      { key: 'tier3', label: '1,000–2,500 m²' },
      { key: 'tier4', label: 'Over 2,500 m²' },
    ],
  },
];

interface RateData {
  [serviceType: string]: {
    [areaTier: string]: number;
  };
}

export default function PricingManagement() {
  const { data: serviceRatesData, isLoading } = useAllServiceRates();
  const { mutate: setServiceRate, isPending: isSaving } = useSetServiceRate();
  
  const [rates, setRates] = useState<RateData>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (serviceRatesData) {
      const ratesMap: RateData = {};
      serviceRatesData.forEach(([serviceType, tiers]) => {
        ratesMap[serviceType] = {};
        tiers.forEach(([tier, rate]) => {
          ratesMap[serviceType][tier] = rate;
        });
      });
      setRates(ratesMap);
    }
  }, [serviceRatesData]);

  const handleRateChange = (serviceType: string, areaTier: string, value: string) => {
    // Allow empty string for clearing, otherwise parse as float
    const numValue = value === '' ? 0 : parseFloat(value);
    
    // Validate that it's a valid number and non-negative
    if (!isNaN(numValue) && numValue >= 0) {
      setRates(prev => ({
        ...prev,
        [serviceType]: {
          ...prev[serviceType],
          [areaTier]: numValue,
        },
      }));
      setHasChanges(true);
    }
  };

  const handleSaveRates = async () => {
    const updates: Array<{ serviceType: string; areaTier: string; rate: number }> = [];
    
    for (const serviceType of Object.keys(rates)) {
      for (const areaTier of Object.keys(rates[serviceType])) {
        updates.push({
          serviceType,
          areaTier,
          rate: rates[serviceType][areaTier],
        });
      }
    }

    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      try {
        await new Promise<void>((resolve, reject) => {
          setServiceRate(update, {
            onSuccess: () => {
              successCount++;
              resolve();
            },
            onError: (error) => {
              errorCount++;
              reject(error);
            },
          });
        });
      } catch (error) {
        console.error('Failed to update rate:', error);
      }
    }

    if (errorCount === 0) {
      toast.success('All rates updated successfully!', {
        description: `${successCount} rate(s) saved. Changes are now live.`,
      });
      setHasChanges(false);
    } else {
      toast.error('Some rates failed to update', {
        description: `${successCount} succeeded, ${errorCount} failed. Please try again.`,
      });
    }
  };

  const getRate = (serviceType: string, areaTier: string): number => {
    return rates[serviceType]?.[areaTier] || 0;
  };

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Pricing Management</h2>
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Pricing Management</h2>
        {hasChanges && (
          <Button
            onClick={handleSaveRates}
            disabled={isSaving}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-cyan-600" />
            Service Rate Configuration
          </CardTitle>
          <p className="text-sm text-slate-600">
            Configure customer-facing rates (€/m²) for each service type and area tier. Type rates directly into the fields below.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {SERVICE_TYPES.map((service, index) => (
            <div key={service.key}>
              {index > 0 && <Separator className="my-6" />}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">{service.label}</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {service.tiers.map((tier) => (
                    <div key={tier.key} className="space-y-2">
                      <Label htmlFor={`${service.key}-${tier.key}`} className="text-sm font-medium">
                        {tier.label}
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                        <Input
                          id={`${service.key}-${tier.key}`}
                          type="number"
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          value={getRate(service.key, tier.key)}
                          onChange={(e) => handleRateChange(service.key, tier.key, e.target.value)}
                          className="pl-7 pr-12"
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">/m²</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <Separator className="my-6" />

          <div className="rounded-lg bg-cyan-50 p-4">
            <h4 className="font-semibold text-cyan-900 mb-2">Important Notes:</h4>
            <ul className="space-y-1 text-sm text-cyan-800">
              <li>• Type rates directly into the input fields or use arrow buttons</li>
              <li>• Rates are per square meter (€/m²) for area-based services</li>
              <li>• Each service has specific area tier ranges as shown above</li>
              <li>• Changes take effect immediately for all new quotes</li>
              <li>• Existing quotes and invoices are not affected</li>
              <li>• All rates are customer-facing prices (before VAT)</li>
            </ul>
          </div>

          {hasChanges && (
            <Button
              onClick={handleSaveRates}
              disabled={isSaving}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving Changes...' : 'Save All Changes'}
            </Button>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
