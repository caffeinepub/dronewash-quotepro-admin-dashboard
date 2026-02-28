import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAddMaintenanceFundInflow } from '@/hooks/useQueries';

interface AddMaintenanceInflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddMaintenanceInflowDialog({
  open,
  onOpenChange,
}: AddMaintenanceInflowDialogProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const addInflow = useAddMaintenanceFundInflow();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid positive amount.');
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter a description.');
      return;
    }

    try {
      await addInflow.mutateAsync({ amount: parsedAmount, description: description.trim() });
      toast.success('Inflow added to maintenance fund successfully.');
      setAmount('');
      setDescription('');
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to add inflow. Please try again.');
    }
  };

  const handleClose = () => {
    if (!addInflow.isPending) {
      setAmount('');
      setDescription('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Maintenance Fund Inflow</DialogTitle>
          <DialogDescription>
            Manually add funds to the maintenance fund balance.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inflow-amount">Amount (€)</Label>
            <Input
              id="inflow-amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={addInflow.isPending}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inflow-description">Description</Label>
            <Input
              id="inflow-description"
              type="text"
              placeholder="e.g. Manual capital injection"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={addInflow.isPending}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={addInflow.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addInflow.isPending}>
              {addInflow.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding…
                </>
              ) : (
                'Add Inflow'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
