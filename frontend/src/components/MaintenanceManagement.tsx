import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wrench, TrendingUp, TrendingDown, Plus, CheckCircle2, Clock, RotateCcw } from 'lucide-react';
import { useAllMaintenanceExpenses, useAllMaintenanceFundLedgerEntries, useAllFunds } from '@/hooks/useQueries';
import AddMaintenanceExpenseDialog from './AddMaintenanceExpenseDialog';

interface MaintenanceManagementProps {
  isAdmin: boolean;
}

export default function MaintenanceManagement({ isAdmin }: MaintenanceManagementProps) {
  const { data: maintenanceExpenses, isLoading: expensesLoading } = useAllMaintenanceExpenses();
  const { data: ledgerEntries, isLoading: ledgerLoading } = useAllMaintenanceFundLedgerEntries();
  const { data: funds } = useAllFunds();

  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);

  const maintenanceFund = useMemo(() => {
    return funds?.find(f => f.fundType === 'maintenance');
  }, [funds]);

  const totalInflow = useMemo(() => {
    return ledgerEntries?.filter(e => e.transactionType === 'inflow').reduce((sum, e) => sum + e.amount, 0) || 0;
  }, [ledgerEntries]);

  const totalOutflow = useMemo(() => {
    return ledgerEntries?.filter(e => e.transactionType === 'outflow').reduce((sum, e) => sum + e.amount, 0) || 0;
  }, [ledgerEntries]);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleReset = () => {
    // Placeholder — no logic wired yet (Step 1 only)
    console.log('Reset button clicked - no logic wired yet');
  };

  if (expensesLoading || ledgerLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Maintenance Management</h2>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-slate-500">Loading maintenance data...</div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Maintenance Management</h2>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              className="gap-2"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
              Reset Fund
            </Button>
            <Button
              className="gap-2 bg-orange-600 hover:bg-orange-700"
              onClick={() => setShowAddExpenseDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Log Maintenance Expense
            </Button>
          </div>
        )}
      </div>

      {/* Maintenance Fund Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-orange-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Maintenance Fund Balance</CardTitle>
            <Wrench className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(maintenanceFund?.balance || 0)}</div>
            <p className="mt-1 text-xs text-slate-500">Current available balance</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Collections (5%)</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalInflow)}</div>
            <p className="mt-1 text-xs text-slate-500">From job revenues</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Expenses</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOutflow)}</div>
            <p className="mt-1 text-xs text-slate-500">Maintenance costs</p>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Fund Ledger */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Fund Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {!ledgerEntries || ledgerEntries.length === 0 ? (
            <div className="py-8 text-center text-slate-500">No ledger entries yet</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.slice(-20).reverse().map((entry) => (
                    <TableRow key={Number(entry.id)}>
                      <TableCell className="text-sm">{formatDate(entry.date)}</TableCell>
                      <TableCell>
                        <Badge variant={entry.transactionType === 'inflow' ? 'default' : 'secondary'} className="text-xs">
                          {entry.transactionType === 'inflow' ? (
                            <TrendingUp className="mr-1 h-3 w-3" />
                          ) : (
                            <TrendingDown className="mr-1 h-3 w-3" />
                          )}
                          {entry.transactionType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{entry.purpose}</TableCell>
                      <TableCell className={`text-right font-medium ${entry.transactionType === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.transactionType === 'inflow' ? '+' : '-'}{formatCurrency(entry.amount)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(entry.remainingBalance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {!maintenanceExpenses || maintenanceExpenses.length === 0 ? (
            <div className="py-8 text-center text-slate-500">No maintenance expenses logged yet</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Part Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceExpenses.slice(-20).reverse().map((expense) => (
                    <TableRow key={Number(expense.id)}>
                      <TableCell className="text-sm">{formatDate(expense.date)}</TableCell>
                      <TableCell className="text-sm">{expense.purpose}</TableCell>
                      <TableCell className="text-sm">{expense.equipmentType}</TableCell>
                      <TableCell className="text-sm">{expense.partCategory}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={expense.approved ? 'default' : 'secondary'} className="text-xs">
                          {expense.approved ? (
                            <>
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Approved
                            </>
                          ) : (
                            <>
                              <Clock className="mr-1 h-3 w-3" />
                              Pending
                            </>
                          )}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Maintenance Expense Dialog */}
      {maintenanceFund && (
        <AddMaintenanceExpenseDialog
          open={showAddExpenseDialog}
          onClose={() => setShowAddExpenseDialog(false)}
          maintenanceFundId={maintenanceFund.id}
        />
      )}
    </section>
  );
}
