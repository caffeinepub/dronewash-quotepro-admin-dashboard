import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useUpdateJob } from '@/hooks/useQueries';
import type { Job } from '../backend';

interface EditJobDialogProps {
  job: Job;
  onClose: () => void;
}

export default function EditJobDialog({ job, onClose }: EditJobDialogProps) {
  const [clientName, setClientName] = useState(job.clientName);
  const [revenue, setRevenue] = useState(job.revenue.toString());
  const [date, setDate] = useState(new Date(Number(job.date) / 1000000).toISOString().split('T')[0]);
  const [sector, setSector] = useState(job.sector);

  const { mutate: updateJob, isPending } = useUpdateJob();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateTimestamp = BigInt(new Date(date).getTime() * 1000000);
    updateJob(
      { 
        id: job.id, 
        revenue: parseFloat(revenue), 
        date: dateTimestamp, 
        sector,
        clientName,
        customerInfo: job.customerInfo,
        cleanProfit: job.cleanProfit,
        costs: job.costs,
      },
      {
        onSuccess: () => {
          toast.success('Job updated successfully!');
          onClose();
        },
        onError: (error: any) => {
          toast.error(error.message || 'Failed to update job');
        },
      }
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-job-client-name">Client Name</Label>
            <Input
              id="edit-job-client-name"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-job-revenue">Revenue (€)</Label>
            <Input
              id="edit-job-revenue"
              type="number"
              step="0.01"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-job-date">Date</Label>
            <Input
              id="edit-job-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-job-sector">Sector</Label>
            <Select value={sector} onValueChange={setSector} required>
              <SelectTrigger id="edit-job-sector">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Commercial">Commercial</SelectItem>
                <SelectItem value="Residential">Residential</SelectItem>
                <SelectItem value="Industrial">Industrial</SelectItem>
                <SelectItem value="Agricultural">Agricultural</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
