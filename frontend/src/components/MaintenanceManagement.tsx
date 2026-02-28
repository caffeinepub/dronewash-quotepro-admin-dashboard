import React, { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw, Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGetMaintenanceFundStatus, useResetMaintenanceFund } from '@/hooks/useQueries';
import AddMaintenanceExpenseDialog from './AddMaintenanceExpenseDialog';

interface MaintenanceManagementProps {
  isAdmin: boolean;
}

export default function MaintenanceManagement({ isAdmin }: MaintenanceManagementProps) {
  const [showAddExpense, setShowAddExpense] = useState(false);

  const { data: fundStatus, isLoading } = useGetMaintenanceFundStatus();
  const resetMutation = useResetMaintenanceFund();

  const handleReset = async () => {
    try {
      await resetMutation.mutateAsync();
      toast.success('Maintenance fund has been reset successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`Reset failed: ${message}`);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);

  const formatDate = (timestamp: bigint) => {
    const ms = Number(timestamp) / 1_000_000;
    return new Date(ms).toLocaleDateString('en-IE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-primary mr-2" />
        <span className="text-muted-foreground">Loading maintenance fund...</span>
      </div>
    );
  }

  const balance = fundStatus?.balance ?? 0;
  const totalCollected = fundStatus?.totalCollected ?? 0;
  const totalSpent = fundStatus?.totalSpent ?? 0;
  const recentEntries = fundStatus?.recentEntries ?? [];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatCurrency(balance)}</p>
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
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</p>
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
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSpent)}</p>
            <p className="text-xs text-muted-foreground mt-1">Maintenance expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Ledger Entries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Ledger Entries</CardTitle>
          {isAdmin && (
            <Button size="sm" onClick={() => setShowAddExpense(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Expense
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {recentEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No ledger entries yet.</p>
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
                {recentEntries.map((entry) => (
                  <TableRow key={entry.id.toString()}>
                    <TableCell className="text-sm">{formatDate(entry.date)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={entry.transactionType === 'inflow' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {entry.transactionType === 'inflow' ? '↑ Inflow' : '↓ Outflow'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{entry.purpose}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      <span className={entry.transactionType === 'inflow' ? 'text-green-600' : 'text-red-600'}>
                        {entry.transactionType === 'inflow' ? '+' : '-'}
                        {formatCurrency(entry.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(entry.remainingBalance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Admin Danger Zone */}
      {isAdmin && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Resetting the maintenance fund will clear the balance to zero and remove all ledger
              entries. This action cannot be undone.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={resetMutation.isPending}>
                  {resetMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Reset Fund
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Maintenance Fund?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently reset the maintenance fund balance to €0.00 and clear all
                    ledger entries. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReset}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Reset Fund
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Add Expense Dialog */}
      {isAdmin && (
        <AddMaintenanceExpenseDialog
          open={showAddExpense}
          onOpenChange={setShowAddExpense}
        />
      )}
    </div>
  );
}
