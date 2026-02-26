import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useUpdateFund } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { Fund } from '../backend';

interface EditFundDialogProps {
  fund: Fund;
  open: boolean;
  onClose: () => void;
}

export default function EditFundDialog({ fund, open, onClose }: EditFundDialogProps) {
  const [name, setName] = useState(fund.name);
  const [balance, setBalance] = useState(fund.balance.toString());
  const [spendingLimit, setSpendingLimit] = useState(fund.spendingLimit.toString());
  const [approvalThreshold, setApprovalThreshold] = useState(fund.approvalThreshold.toString());
  const [isActive, setIsActive] = useState(fund.isActive);

  const { mutate: updateFund, isPending } = useUpdateFund();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const balanceNum = parseFloat(balance);
    const spendingLimitNum = parseFloat(spendingLimit);
    const approvalThresholdNum = parseFloat(approvalThreshold);

    if (isNaN(balanceNum) || isNaN(spendingLimitNum) || isNaN(approvalThresholdNum)) {
      toast.error('Please enter valid numbers');
      return;
    }

    updateFund(
      {
        id: fund.id,
        name,
        balance: balanceNum,
        isActive,
        spendingLimit: spendingLimitNum,
        approvalThreshold: approvalThresholdNum,
      },
      {
        onSuccess: () => {
          toast.success('Fund updated successfully');
          onClose();
        },
        onError: (error) => {
          toast.error('Failed to update fund', {
            description: error instanceof Error ? error.message : 'Unknown error',
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Fund</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Fund Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fund name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Current Balance (€)</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="spendingLimit">Spending Limit (€)</Label>
            <Input
              id="spendingLimit"
              type="number"
              step="0.01"
              value={spendingLimit}
              onChange={(e) => setSpendingLimit(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="approvalThreshold">Approval Threshold (€)</Label>
            <Input
              id="approvalThreshold"
              type="number"
              step="0.01"
              value={approvalThreshold}
              onChange={(e) => setApprovalThreshold(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Fund Active</Label>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-cyan-600 hover:bg-cyan-700">
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
