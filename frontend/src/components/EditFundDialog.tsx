import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateFund, Fund } from '@/hooks/useQueries';

interface EditFundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fund: Fund | null;
}

export default function EditFundDialog({ open, onOpenChange, fund }: EditFundDialogProps) {
  const [name, setName] = useState('');
  const [spendingLimit, setSpendingLimit] = useState('');
  const [approvalThreshold, setApprovalThreshold] = useState('');

  const updateFund = useUpdateFund();

  useEffect(() => {
    if (fund) {
      setName(fund.name);
      setSpendingLimit(fund.spendingLimit.toString());
      setApprovalThreshold(fund.approvalThreshold.toString());
    }
  }, [fund]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fund) return;

    const parsedSpendingLimit = parseFloat(spendingLimit);
    const parsedApprovalThreshold = parseFloat(approvalThreshold);

    if (isNaN(parsedSpendingLimit) || parsedSpendingLimit < 0) {
      toast.error('Please enter a valid spending limit.');
      return;
    }
    if (isNaN(parsedApprovalThreshold) || parsedApprovalThreshold < 0) {
      toast.error('Please enter a valid approval threshold.');
      return;
    }

    try {
      await updateFund.mutateAsync({
        id: fund.id,
        fundType: fund.fundType,
        name,
        spendingLimit: parsedSpendingLimit,
        approvalThreshold: parsedApprovalThreshold,
        isActive: fund.isActive,
      });
      toast.success('Fund updated successfully.');
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update fund';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Fund</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fundName">Fund Name</Label>
            <Input
              id="fundName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fund name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="spendingLimit">Spending Limit (€)</Label>
            <Input
              id="spendingLimit"
              type="number"
              step="0.01"
              min="0"
              value={spendingLimit}
              onChange={(e) => setSpendingLimit(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="approvalThreshold">Approval Threshold (€)</Label>
            <Input
              id="approvalThreshold"
              type="number"
              step="0.01"
              min="0"
              value={approvalThreshold}
              onChange={(e) => setApprovalThreshold(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateFund.isPending}>
              {updateFund.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
