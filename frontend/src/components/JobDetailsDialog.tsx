import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useUpdateJob, useGetCallerUserRole } from '@/hooks/useQueries';
import type { Job, CustomerInfo } from '../backend';
import { UserRole } from '../backend';

interface JobDetailsDialogProps {
  job: Job;
  onClose: () => void;
}

// Standardized job types across all sectors
const STANDARDIZED_JOB_TYPES = [
  'Façade/Wall Cleaning',
  'Full Building Cleaning',
  'Roof Cleaning',
  'Solar Panel Cleaning',
  'Window Cleaning',
];

export default function JobDetailsDialog({ job, onClose }: JobDetailsDialogProps) {
  const [customerName, setCustomerName] = useState(job.customerInfo.name);
  const [coordinates, setCoordinates] = useState(job.customerInfo.coordinates);
  const [town, setTown] = useState(job.customerInfo.town);
  const [jobType, setJobType] = useState(job.customerInfo.jobType);
  const [additionalInfo, setAdditionalInfo] = useState(job.customerInfo.additionalInfo);
  const [cleanProfit, setCleanProfit] = useState(job.cleanProfit.toString());
  const [costs, setCosts] = useState(job.costs.toString());

  const { mutate: updateJob, isPending } = useUpdateJob();
  const { data: userRole } = useGetCallerUserRole();

  const isAdmin = userRole === UserRole.admin;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast.error('Only admins can edit job details');
      return;
    }

    const customerInfo: CustomerInfo = {
      name: customerName,
      coordinates,
      town,
      jobType,
      additionalInfo,
    };

    updateJob(
      { 
        id: job.id, 
        revenue: job.revenue, 
        date: job.date, 
        sector: job.sector,
        clientName: job.clientName,
        customerInfo,
        cleanProfit: parseFloat(cleanProfit) || 0,
        costs: parseFloat(costs) || 0,
      },
      {
        onSuccess: () => {
          toast.success('Job details updated successfully!');
          onClose();
        },
        onError: (error: any) => {
          toast.error(error.message || 'Failed to update job details');
        },
      }
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Job Details - {job.clientName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Job Summary (Read-only) */}
          <div className="bg-slate-50 p-4 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Client Name</p>
                <p className="font-medium">{job.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Revenue</p>
                <p className="font-medium">€{job.revenue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Date</p>
                <p className="font-medium">{new Date(Number(job.date) / 1000000).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Sector</p>
                <p className="font-medium">{job.sector}</p>
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Financial Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clean-profit">Clean Profit (€)</Label>
                <Input
                  id="clean-profit"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={cleanProfit}
                  onChange={(e) => setCleanProfit(e.target.value)}
                  disabled={!isAdmin}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costs">Costs - COGS + OpEx (€)</Label>
                <Input
                  id="costs"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={costs}
                  onChange={(e) => setCosts(e.target.value)}
                  disabled={!isAdmin}
                />
              </div>
            </div>
          </div>

          {/* Customer Information (Editable) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Customer Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="customer-name">Customer Name</Label>
              <Input
                id="customer-name"
                type="text"
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coordinates">Coordinates</Label>
              <Input
                id="coordinates"
                type="text"
                placeholder="e.g., 34.6857° N, 33.0442° E"
                value={coordinates}
                onChange={(e) => setCoordinates(e.target.value)}
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="town">Town</Label>
              <Select value={town} onValueChange={setTown} disabled={!isAdmin}>
                <SelectTrigger id="town">
                  <SelectValue placeholder="Select town" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Limassol">Limassol</SelectItem>
                  <SelectItem value="Nicosia">Nicosia</SelectItem>
                  <SelectItem value="Larnaka">Larnaka</SelectItem>
                  <SelectItem value="Paphos">Paphos</SelectItem>
                  <SelectItem value="Ayia Napa">Ayia Napa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-type">Job Type</Label>
              <Select value={jobType} onValueChange={setJobType} disabled={!isAdmin}>
                <SelectTrigger id="job-type">
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  {STANDARDIZED_JOB_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional-info">Additional Information</Label>
              <Textarea
                id="additional-info"
                placeholder="Enter any additional notes or information..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={4}
                disabled={!isAdmin}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {isAdmin ? 'Cancel' : 'Close'}
            </Button>
            {isAdmin && (
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
