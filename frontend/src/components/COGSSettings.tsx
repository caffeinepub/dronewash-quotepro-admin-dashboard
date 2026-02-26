import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Settings, Save } from 'lucide-react';

// COGS Configuration Component
export default function COGSSettings() {
  // Van Fuel rates by city
  const [vanFuelRates, setVanFuelRates] = useState({
    'Limassol': 25,
    'Nicosia': 30,
    'Larnaka': 28,
    'Paphos': 35,
    'Ayia Napa': 32,
  });

  // Other COGS parameters
  const [generatorFuelRate, setGeneratorFuelRate] = useState(7); // €7 per hour
  const [additionalPilotFee, setAdditionalPilotFee] = useState(350); // €350 per job
  const [chemicalsCostPerHour, setChemicalsCostPerHour] = useState(20); // €20 per hour

  const [hasChanges, setHasChanges] = useState(false);

  const handleVanFuelChange = (city: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setVanFuelRates(prev => ({ ...prev, [city]: numValue }));
    setHasChanges(true);
  };

  const handleSaveSettings = () => {
    // In a real implementation, these would be saved to backend
    // For now, we'll store them in localStorage as a temporary solution
    localStorage.setItem('cogsSettings', JSON.stringify({
      vanFuelRates,
      generatorFuelRate,
      additionalPilotFee,
      chemicalsCostPerHour,
    }));

    toast.success('COGS settings saved successfully!', {
      description: 'All cost parameters have been updated and will be used in future quote calculations.',
    });
    setHasChanges(false);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">COGS Configuration</h2>
        {hasChanges && (
          <Button
            onClick={handleSaveSettings}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-cyan-600" />
            Cost of Goods Sold (COGS) Parameters
          </CardTitle>
          <p className="text-sm text-slate-600">
            Configure operational cost parameters used in quote calculations and internal cost analysis.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Van Fuel Rates by City */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Van Fuel Rates by City</h3>
            <p className="text-sm text-slate-600">Set the standard van fuel cost for each city (in euros per job).</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(vanFuelRates).map(([city, rate]) => (
                <div key={city} className="space-y-2">
                  <Label htmlFor={`van-fuel-${city}`}>{city}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                    <Input
                      id={`van-fuel-${city}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={rate}
                      onChange={(e) => handleVanFuelChange(city, e.target.value)}
                      className="pl-7"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Generator Fuel Rate */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Generator Fuel Rate</h3>
            <p className="text-sm text-slate-600">Cost per hour of generator operation.</p>
            <div className="max-w-xs space-y-2">
              <Label htmlFor="generator-fuel-rate">Rate per Hour</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                <Input
                  id="generator-fuel-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={generatorFuelRate}
                  onChange={(e) => {
                    setGeneratorFuelRate(parseFloat(e.target.value) || 0);
                    setHasChanges(true);
                  }}
                  className="pl-7 pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">/hour</span>
              </div>
              <p className="text-xs text-slate-500">Currently: €{generatorFuelRate}/hour</p>
            </div>
          </div>

          <Separator />

          {/* Additional Pilot Fee */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Additional Pilot Fee</h3>
            <p className="text-sm text-slate-600">Fixed cost per job for additional pilot services.</p>
            <div className="max-w-xs space-y-2">
              <Label htmlFor="additional-pilot-fee">Fee per Job</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                <Input
                  id="additional-pilot-fee"
                  type="number"
                  step="1"
                  min="0"
                  value={additionalPilotFee}
                  onChange={(e) => {
                    setAdditionalPilotFee(parseFloat(e.target.value) || 0);
                    setHasChanges(true);
                  }}
                  className="pl-7 pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">/job</span>
              </div>
              <p className="text-xs text-slate-500">Currently: €{additionalPilotFee} per job</p>
            </div>
          </div>

          <Separator />

          {/* Chemicals Cost */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Chemicals Cost</h3>
            <p className="text-sm text-slate-600">Cost of chemicals per hour of operation.</p>
            <div className="max-w-xs space-y-2">
              <Label htmlFor="chemicals-cost">Cost per Hour</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                <Input
                  id="chemicals-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={chemicalsCostPerHour}
                  onChange={(e) => {
                    setChemicalsCostPerHour(parseFloat(e.target.value) || 0);
                    setHasChanges(true);
                  }}
                  className="pl-7 pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">/hour</span>
              </div>
              <p className="text-xs text-slate-500">Currently: €{chemicalsCostPerHour}/hour</p>
            </div>
          </div>

          <Separator />

          {/* Summary */}
          <div className="rounded-lg bg-cyan-50 p-4">
            <h4 className="font-semibold text-cyan-900 mb-2">Current COGS Configuration Summary</h4>
            <div className="space-y-1 text-sm text-cyan-800">
              <p>• Van Fuel: City-specific rates (€{Math.min(...Object.values(vanFuelRates))} - €{Math.max(...Object.values(vanFuelRates))})</p>
              <p>• Generator Fuel: €{generatorFuelRate} per hour</p>
              <p>• Additional Pilot: €{additionalPilotFee} per job</p>
              <p>• Chemicals: €{chemicalsCostPerHour} per hour</p>
            </div>
            <p className="text-xs text-cyan-700 mt-3">
              These parameters are used to calculate internal costs for all quotes. Changes will apply to new quotes only.
            </p>
          </div>

          {hasChanges && (
            <Button
              onClick={handleSaveSettings}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              <Save className="mr-2 h-4 w-4" />
              Save All COGS Settings
            </Button>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
