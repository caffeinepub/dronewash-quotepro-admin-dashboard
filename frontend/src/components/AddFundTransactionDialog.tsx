import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAddFundTransaction } from '@/hooks/useQueries';
import { toast } from 'sonner';

interface AddFundTransactionDialogProps {
  fundId: bigint;
  fundName: string;
  open: boolean;
  onClose: () => void;
}

export default function AddFundTransactionDialog({ fundId, fundName, open, onClose }: AddFundTransactionDialogProps) {
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'inflow' | 'outflow'>('inflow');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  const { mutate: addTransaction, isPending } = useAddFundTransaction();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!category.trim()) {
      toast.error('Please enter a category');
      return;
    }

    addTransaction(
      {
        fundId,
        amount: amountNum,
        transactionType,
        description: description.trim() || `${transactionType} transaction`,
        category: category.trim(),
        relatedExpenseId: null,
        relatedJobId: null,
      },
      {
        onSuccess: () => {
          toast.success('Transaction added successfully');
          setAmount('');
          setDescription('');
          setCategory('');
          onClose();
        },
        onError: (error) => {
          toast.error('Failed to add transaction', {
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
          <DialogTitle>Add Transaction to {fundName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transactionType">Transaction Type</Label>
            <Select value={transactionType} onValueChange={(value) => setTransactionType(value as 'inflow' | 'outflow')}>
              <SelectTrigger id="transactionType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inflow">Inflow (Add Funds)</SelectItem>
                <SelectItem value="outflow">Outflow (Spend Funds)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Investment, Expense, Transfer"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-cyan-600 hover:bg-cyan-700">
              {isPending ? 'Adding...' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
