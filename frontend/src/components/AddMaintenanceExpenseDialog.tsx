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
import { useAddMaintenanceExpense } from '@/hooks/useQueries';

interface AddMaintenanceExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EQUIPMENT_TYPES = ['Drone', 'Van', 'Generator', 'Cleaning Equipment', 'Safety Gear', 'Other'];
const PART_CATEGORIES = ['Repair', 'Replacement', 'Maintenance', 'Upgrade', 'Consumables', 'Other'];

export default function AddMaintenanceExpenseDialog({
  open,
  onOpenChange,
}: AddMaintenanceExpenseDialogProps) {
  const [amount, setAmount] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [partCategory, setPartCategory] = useState('');
  const [purpose, setPurpose] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');

  const addExpense = useAddMaintenanceExpense();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    if (!equipmentType) {
      toast.error('Please select an equipment type.');
      return;
    }
    if (!partCategory) {
      toast.error('Please select a part category.');
      return;
    }

    const additionalInfo = [
      purpose ? `Purpose: ${purpose}` : '',
      equipmentType ? `Equipment: ${equipmentType}` : '',
      partCategory ? `Category: ${partCategory}` : '',
      receiptUrl ? `Receipt: ${receiptUrl}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    try {
      await addExpense.mutateAsync({
        amount: parsedAmount,
        category: 'Maintenance',
        date: BigInt(Date.now()) * BigInt(1_000_000),
        additionalInfo,
      });
      toast.success('Maintenance expense added successfully.');
      onOpenChange(false);
      setAmount('');
      setEquipmentType('');
      setPartCategory('');
      setPurpose('');
      setReceiptUrl('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add expense';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Maintenance Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="equipmentType">Equipment Type</Label>
            <Select value={equipmentType} onValueChange={setEquipmentType}>
              <SelectTrigger id="equipmentType">
                <SelectValue placeholder="Select equipment type" />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partCategory">Part Category</Label>
            <Select value={partCategory} onValueChange={setPartCategory}>
              <SelectTrigger id="partCategory">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {PART_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose / Description</Label>
            <Textarea
              id="purpose"
              placeholder="Describe the maintenance work..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptUrl">Receipt URL (optional)</Label>
            <Input
              id="receiptUrl"
              type="url"
              placeholder="https://..."
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addExpense.isPending}>
              {addExpense.isPending ? 'Adding...' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
