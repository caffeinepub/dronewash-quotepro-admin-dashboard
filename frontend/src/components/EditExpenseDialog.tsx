import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useUpdateExpense } from '@/hooks/useQueries';
import type { Expense } from '../backend';

interface EditExpenseDialogProps {
  expense: Expense;
  onClose: () => void;
}

export default function EditExpenseDialog({ expense, onClose }: EditExpenseDialogProps) {
  const [amount, setAmount] = useState(expense.amount.toString());
  const [date, setDate] = useState(new Date(Number(expense.date) / 1000000).toISOString().split('T')[0]);
  const [category, setCategory] = useState(expense.category);
  const [additionalInfo, setAdditionalInfo] = useState(expense.additionalInfo || '');

  const { mutate: updateExpense, isPending } = useUpdateExpense();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dateTimestamp = BigInt(new Date(date).getTime() * 1000000);
    
    updateExpense(
      { id: expense.id, amount: parseFloat(amount), category, date: dateTimestamp, additionalInfo },
      {
        onSuccess: () => {
          toast.success('Expense updated successfully!');
          onClose();
        },
        onError: (error: any) => {
          toast.error(error.message || 'Failed to update expense');
        },
      }
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-expense-amount">Amount (€)</Label>
            <Input
              id="edit-expense-amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-expense-date">Date</Label>
            <Input
              id="edit-expense-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-expense-category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger id="edit-expense-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Equipment">Equipment</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Fuel">Fuel</SelectItem>
                <SelectItem value="Insurance">Insurance</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-expense-additional-info">Additional Information</Label>
            <Input
              id="edit-expense-additional-info"
              type="text"
              placeholder="Optional notes or details..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
            />
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
