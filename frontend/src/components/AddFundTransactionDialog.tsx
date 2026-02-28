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
import { useAddFundTransaction } from '@/hooks/useQueries';
import { toast } from 'sonner';

interface AddFundTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fundId: bigint;
  fundName: string;
}

export default function AddFundTransactionDialog({
  open,
  onOpenChange,
  fundId,
  fundName,
}: AddFundTransactionDialogProps) {
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState('inflow');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const addTransaction = useAddFundTransaction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      await addTransaction.mutateAsync({
        fundId,
        amount: amountNum,
        transactionType,
        description,
        category,
      });
      toast.success('Transaction added successfully');
      setAmount('');
      setTransactionType('inflow');
      setCategory('');
      setDescription('');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to add transaction');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction — {fundName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="txType">Transaction Type</Label>
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger id="txType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inflow">Inflow</SelectItem>
                <SelectItem value="outflow">Outflow</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="txAmount">Amount (€)</Label>
            <Input
              id="txAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="txCategory">Category</Label>
            <Input
              id="txCategory"
              placeholder="e.g. Operations, Salary, Equipment"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="txDescription">Description</Label>
            <Input
              id="txDescription"
              placeholder="Transaction description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addTransaction.isPending}>
              {addTransaction.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                'Add Transaction'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
