import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddInvestmentFundTransaction } from '@/hooks/useQueries';
import { toast } from 'sonner';

interface AddInvestmentTransactionDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AddInvestmentTransactionDialog({ open, onClose }: AddInvestmentTransactionDialogProps) {
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'payment' | 'allocation'>('payment');
  const [allocationType, setAllocationType] = useState('');
  const [description, setDescription] = useState('');

  const { mutate: addTransaction, isPending } = useAddInvestmentFundTransaction();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!allocationType.trim()) {
      toast.error('Please enter an allocation type');
      return;
    }

    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    addTransaction(
      {
        amount: amountNum,
        transactionType,
        description: description.trim(),
        allocationType: allocationType.trim(),
        relatedExpenseId: null,
        relatedJobId: null,
      },
      {
        onSuccess: () => {
          toast.success('Investment transaction added successfully');
          setAmount('');
          setTransactionType('payment');
          setAllocationType('');
          setDescription('');
          onClose();
        },
        onError: (error) => {
          toast.error('Failed to add investment transaction', {
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
          <DialogTitle>Add Investment Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transactionType">Transaction Type *</Label>
            <Select value={transactionType} onValueChange={(value) => setTransactionType(value as 'payment' | 'allocation')}>
              <SelectTrigger id="transactionType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="payment">Payment (Outgoing)</SelectItem>
                <SelectItem value="allocation">Allocation (Incoming)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (€) *</Label>
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
            <Label htmlFor="allocationType">Allocation Type *</Label>
            <Input
              id="allocationType"
              value={allocationType}
              onChange={(e) => setAllocationType(e.target.value)}
              placeholder="e.g., Equipment Purchase, Marketing, Operations"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the transaction..."
              rows={4}
              required
            />
          </div>

          <div className="rounded-md bg-purple-50 p-3 text-sm text-purple-900">
            <p className="font-medium">Note:</p>
            <p className="mt-1">
              The Investment Fund is isolated from other operational funds. All transactions are tracked separately 
              for investment tracking and reporting purposes.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-purple-600 hover:bg-purple-700">
              {isPending ? 'Adding...' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
