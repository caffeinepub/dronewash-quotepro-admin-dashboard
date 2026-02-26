import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAddMaintenanceExpense, useAddMaintenanceFundLedgerEntry, useAllFunds } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface AddMaintenanceExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  maintenanceFundId: bigint;
}

export default function AddMaintenanceExpenseDialog({ 
  open, 
  onClose, 
  maintenanceFundId 
}: AddMaintenanceExpenseDialogProps) {
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [partCategory, setPartCategory] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');

  const queryClient = useQueryClient();
  const { data: funds } = useAllFunds();
  const { mutate: addExpense, isPending: isAddingExpense } = useAddMaintenanceExpense();
  const { mutate: addLedgerEntry, isPending: isAddingLedger } = useAddMaintenanceFundLedgerEntry();

  const isPending = isAddingExpense || isAddingLedger;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!purpose.trim()) {
      toast.error('Please enter a purpose');
      return;
    }

    if (!equipmentType.trim()) {
      toast.error('Please enter equipment type');
      return;
    }

    if (!partCategory.trim()) {
      toast.error('Please enter part category');
      return;
    }

    // Get current maintenance fund balance
    const maintenanceFund = funds?.find(f => f.id === maintenanceFundId);
    if (!maintenanceFund) {
      toast.error('Maintenance fund not found');
      return;
    }

    if (maintenanceFund.balance < amountNum) {
      toast.error('Insufficient funds', {
        description: `Available balance: €${maintenanceFund.balance.toFixed(2)}`,
      });
      return;
    }

    // First add the maintenance expense
    addExpense(
      {
        amount: amountNum,
        purpose: purpose.trim(),
        equipmentType: equipmentType.trim(),
        partCategory: partCategory.trim(),
        receiptUrl: receiptUrl.trim() || null,
        fundId: maintenanceFundId,
      },
      {
        onSuccess: (expenseId) => {
          // Then add the ledger entry to update the fund balance
          addLedgerEntry(
            {
              amount: amountNum,
              transactionType: 'outflow',
              purpose: `Maintenance: ${purpose.trim()}`,
              fundId: maintenanceFundId,
              relatedJobId: null,
              relatedExpenseId: expenseId,
            },
            {
              onSuccess: () => {
                // Invalidate all related queries to ensure real-time updates
                queryClient.invalidateQueries({ queryKey: ['maintenanceExpenses'] });
                queryClient.invalidateQueries({ queryKey: ['maintenanceFundLedger'] });
                queryClient.invalidateQueries({ queryKey: ['funds'] });
                queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
                queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
                
                toast.success('Maintenance expense logged successfully', {
                  description: `€${amountNum.toFixed(2)} deducted from Maintenance Fund`,
                });
                
                // Reset form
                setAmount('');
                setPurpose('');
                setEquipmentType('');
                setPartCategory('');
                setReceiptUrl('');
                onClose();
              },
              onError: (error) => {
                toast.error('Failed to update fund balance', {
                  description: error instanceof Error ? error.message : 'Unknown error',
                });
              },
            }
          );
        },
        onError: (error) => {
          toast.error('Failed to log maintenance expense', {
            description: error instanceof Error ? error.message : 'Unknown error',
          });
        },
      }
    );
  };

  const handleClose = () => {
    if (!isPending) {
      setAmount('');
      setPurpose('');
      setEquipmentType('');
      setPartCategory('');
      setReceiptUrl('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Log Maintenance Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (€) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose / Description *</Label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Describe the maintenance work performed"
              rows={3}
              required
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="equipmentType">Equipment / Part *</Label>
              <Input
                id="equipmentType"
                value={equipmentType}
                onChange={(e) => setEquipmentType(e.target.value)}
                placeholder="e.g., Drone, Battery, Propeller"
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partCategory">Part Category *</Label>
              <Input
                id="partCategory"
                value={partCategory}
                onChange={(e) => setPartCategory(e.target.value)}
                placeholder="e.g., Replacement, Repair, Upgrade"
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptUrl">Receipt URL (Optional)</Label>
            <Input
              id="receiptUrl"
              type="url"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="https://..."
              disabled={isPending}
            />
            <p className="text-xs text-slate-500">Link to digital receipt or documentation</p>
          </div>

          <div className="rounded-md bg-orange-50 p-3 text-sm text-orange-900">
            <p className="font-medium">Note:</p>
            <p className="mt-1">
              This expense will be deducted from the Maintenance Fund balance and will be reflected immediately in both the Maintenance tab and Overview panel.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-orange-600 hover:bg-orange-700">
              {isPending ? 'Logging...' : 'Log Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
