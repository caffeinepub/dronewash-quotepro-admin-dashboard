import React, { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAddInvestmentTransaction } from '@/hooks/useQueries';

interface AddInvestmentTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ALLOCATION_TYPES = [
  'Equipment Purchase',
  'Software License',
  'Training',
  'Marketing',
  'Operations',
  'Research & Development',
  'Other',
];

export default function AddInvestmentTransactionDialog({
  open,
  onOpenChange,
}: AddInvestmentTransactionDialogProps) {
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'inflow' | 'outflow'>('outflow');
  const [allocationType, setAllocationType] = useState('');
  const [description, setDescription] = useState('');

  const addTransaction = useAddInvestmentTransaction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    if (!allocationType) {
      toast.error('Please select an allocation type.');
      return;
    }

    try {
      await addTransaction.mutateAsync({
        amount: parsedAmount,
        transactionType,
        description: description.trim(),
        allocationType,
      });
      toast.success('Investment transaction added successfully.');
      onOpenChange(false);
      setAmount('');
      setTransactionType('outflow');
      setAllocationType('');
      setDescription('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add transaction';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Investment Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transactionType">Transaction Type</Label>
            <Select
              value={transactionType}
              onValueChange={(v) => setTransactionType(v as 'inflow' | 'outflow')}
            >
              <SelectTrigger id="transactionType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inflow">Payment / Inflow</SelectItem>
                <SelectItem value="outflow">Allocation / Outflow</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allocationType">Allocation Type</Label>
            <Select value={allocationType} onValueChange={setAllocationType}>
              <SelectTrigger id="allocationType">
                <SelectValue placeholder="Select allocation type" />
              </SelectTrigger>
              <SelectContent>
                {ALLOCATION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the transaction..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addTransaction.isPending}>
              {addTransaction.isPending ? 'Adding...' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
