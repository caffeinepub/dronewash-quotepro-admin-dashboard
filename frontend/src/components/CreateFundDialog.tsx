import React, { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useCreateFund } from '@/hooks/useQueries';
import { toast } from 'sonner';

interface CreateFundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateFundDialog({ open, onOpenChange }: CreateFundDialogProps) {
  const [name, setName] = useState('');
  const [fundType, setFundType] = useState('main');
  const [spendingLimit, setSpendingLimit] = useState('100000');
  const [approvalThreshold, setApprovalThreshold] = useState('5000');
  const [initialBalance, setInitialBalance] = useState('');

  const createFund = useCreateFund();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const spendingLimitNum = parseFloat(spendingLimit);
    const approvalThresholdNum = parseFloat(approvalThreshold);
    if (isNaN(spendingLimitNum) || isNaN(approvalThresholdNum)) {
      toast.error('Please enter valid numbers for spending limit and approval threshold');
      return;
    }

    const initialBalanceNum = initialBalance.trim() !== '' ? parseFloat(initialBalance) : null;
    if (initialBalanceNum !== null && (isNaN(initialBalanceNum) || initialBalanceNum < 0)) {
      toast.error('Initial balance must be a positive number');
      return;
    }

    try {
      await createFund.mutateAsync({
        fundType,
        name,
        spendingLimit: spendingLimitNum,
        approvalThreshold: approvalThresholdNum,
        initialBalance: initialBalanceNum,
      });

      if (initialBalanceNum && initialBalanceNum > 0) {
        toast.success(`Fund created with initial balance of €${initialBalanceNum.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      } else {
        toast.success('Fund created successfully');
      }

      setName('');
      setFundType('main');
      setSpendingLimit('100000');
      setApprovalThreshold('5000');
      setInitialBalance('');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to create fund');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Fund</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cfName">Fund Name</Label>
            <Input
              id="cfName"
              placeholder="e.g. Operations Fund"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cfType">Fund Type</Label>
            <Select value={fundType} onValueChange={setFundType}>
              <SelectTrigger id="cfType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Main</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="salaries">Salaries</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cfInitialBalance">
              Initial Balance (€){' '}
              <span className="text-muted-foreground font-normal text-xs">(optional)</span>
            </Label>
            <Input
              id="cfInitialBalance"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cfSpendingLimit">Spending Limit (€)</Label>
            <Input
              id="cfSpendingLimit"
              type="number"
              min="0"
              step="0.01"
              value={spendingLimit}
              onChange={(e) => setSpendingLimit(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cfApprovalThreshold">Approval Threshold (€)</Label>
            <Input
              id="cfApprovalThreshold"
              type="number"
              min="0"
              step="0.01"
              value={approvalThreshold}
              onChange={(e) => setApprovalThreshold(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createFund.isPending}>
              {createFund.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Fund'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
