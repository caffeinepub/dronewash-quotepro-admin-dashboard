import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGetMaintenanceFundStatus, useResetMaintenanceFund, useIsCallerAdmin } from '@/hooks/useQueries';
import AddMaintenanceExpenseDialog from './AddMaintenanceExpenseDialog';
import AddMaintenanceInflowDialog from './AddMaintenanceInflowDialog';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);

const formatDate = (timestamp: bigint) => {
  const date = new Date(Number(timestamp) / 1_000_000);
  return date.toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function MaintenanceManagement() {
  const { data: fundStatus, isLoading, error } = useGetMaintenanceFundStatus();
  const { data: isAdmin } = useIsCallerAdmin();
  const resetMutation = useResetMaintenanceFund();

  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showInflowDialog, setShowInflowDialog] = useState(false);

  const handleReset = async () => {
    try {
      await resetMutation.mutateAsync();
      toast.success('Maintenance fund has been reset successfully.');
    } catch (err) {
      toast.error('Failed to reset maintenance fund. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-destructive">
        Failed to load maintenance fund data. Please try again.
      </div>
    );
  }

  // Client-side safeguard: always compute balance as totalCollected - totalSpent
  const totalCollected = fundStatus?.totalCollected ?? 0;
  const totalSpent = fundStatus?.totalSpent ?? 0;
  const currentBalance = totalCollected - totalSpent;
  const recentEntries = fundStatus?.recentEntries ?? [];

  return (
    <div className="space-y-6">
      {/* Balance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(currentBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Available for maintenance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Total Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalCollected)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">5% from job revenues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalSpent)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Maintenance expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Ledger Entries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Ledger Entries</CardTitle>
            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowInflowDialog(true)}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Inflow
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowExpenseDialog(true)}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Expense
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recentEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No ledger entries yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance After</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...recentEntries]
                  .sort((a, b) => Number(b.date) - Number(a.date))
                  .map((entry) => (
                    <TableRow key={String(entry.id)}>
                      <TableCell className="text-sm">{formatDate(entry.date)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={entry.transactionType === 'inflow' ? 'default' : 'destructive'}
                          className="capitalize"
                        >
                          {entry.transactionType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {entry.purpose}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span
                          className={
                            entry.transactionType === 'inflow'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {entry.transactionType === 'inflow' ? '+' : '-'}
                          {formatCurrency(entry.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatCurrency(entry.remainingBalance)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {isAdmin && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Resetting the maintenance fund will clear the balance to zero and remove all ledger
              entries. This action cannot be undone.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Reset Fund
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Maintenance Fund?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently clear the maintenance fund balance to €0.00 and delete all
                    ledger entries. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReset}
                    disabled={resetMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {resetMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Resetting…
                      </>
                    ) : (
                      'Yes, Reset Fund'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AddMaintenanceExpenseDialog
        open={showExpenseDialog}
        onOpenChange={setShowExpenseDialog}
      />
      <AddMaintenanceInflowDialog
        open={showInflowDialog}
        onOpenChange={setShowInflowDialog}
      />
    </div>
  );
}
