import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateFund } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { FundType } from '../backend';

interface CreateFundDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateFundDialog({ open, onClose }: CreateFundDialogProps) {
  const [fundType, setFundType] = useState<FundType>(FundType.main);
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [spendingLimit, setSpendingLimit] = useState('');
  const [approvalThreshold, setApprovalThreshold] = useState('');

  const { mutate: createFund, isPending } = useCreateFund();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const initialBalanceNum = parseFloat(initialBalance);
    const spendingLimitNum = parseFloat(spendingLimit);
    const approvalThresholdNum = parseFloat(approvalThreshold);

    if (!name.trim()) {
      toast.error('Please enter a fund name');
      return;
    }

    if (isNaN(initialBalanceNum) || initialBalanceNum < 0) {
      toast.error('Please enter a valid initial balance');
      return;
    }

    if (isNaN(spendingLimitNum) || spendingLimitNum <= 0) {
      toast.error('Please enter a valid spending limit');
      return;
    }

    if (isNaN(approvalThresholdNum) || approvalThresholdNum <= 0) {
      toast.error('Please enter a valid approval threshold');
      return;
    }

    createFund(
      {
        fundType,
        name: name.trim(),
        initialBalance: initialBalanceNum,
        spendingLimit: spendingLimitNum,
        approvalThreshold: approvalThresholdNum,
      },
      {
        onSuccess: () => {
          toast.success('Fund created successfully');
          setName('');
          setInitialBalance('');
          setSpendingLimit('');
          setApprovalThreshold('');
          setFundType(FundType.main);
          onClose();
        },
        onError: (error) => {
          toast.error('Failed to create fund', {
            description: error instanceof Error ? error.message : 'Unknown error',
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Fund</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fundType">Fund Type</Label>
            <Select value={fundType} onValueChange={(value) => setFundType(value as FundType)}>
              <SelectTrigger id="fundType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FundType.main}>Main Fund</SelectItem>
                <SelectItem value={FundType.maintenance}>Maintenance Fund</SelectItem>
                <SelectItem value={FundType.salaries}>Salaries Fund</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Fund Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Emergency Fund, Equipment Fund"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialBalance">Initial Balance (€) *</Label>
            <Input
              id="initialBalance"
              type="number"
              step="0.01"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="spendingLimit">Spending Limit (€) *</Label>
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
              <Label htmlFor="approvalThreshold">Approval Threshold (€) *</Label>
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
          </div>

          <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
            <p className="font-medium">Note:</p>
            <p className="mt-1">
              The spending limit sets the maximum amount that can be spent from this fund. 
              The approval threshold determines when transactions require additional approval.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-cyan-600 hover:bg-cyan-700">
              {isPending ? 'Creating...' : 'Create Fund'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
