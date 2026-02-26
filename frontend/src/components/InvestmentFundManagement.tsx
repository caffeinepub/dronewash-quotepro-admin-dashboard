import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, TrendingUp, TrendingDown, Plus, AlertCircle } from 'lucide-react';
import { useInvestmentFund } from '@/hooks/useQueries';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AddInvestmentTransactionDialog from './AddInvestmentTransactionDialog';

interface InvestmentFundManagementProps {
  isAdmin: boolean;
}

export default function InvestmentFundManagement({ isAdmin }: InvestmentFundManagementProps) {
  const { data: investmentFund, isLoading, isError } = useInvestmentFund();
  const [showAddTransactionDialog, setShowAddTransactionDialog] = useState(false);

  const totalPayments = useMemo(() => {
    if (!investmentFund) return 0;
    return investmentFund.transactions
      .filter(t => t.transactionType === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [investmentFund]);

  const totalAllocations = useMemo(() => {
    if (!investmentFund) return 0;
    return investmentFund.transactions
      .filter(t => t.transactionType === 'allocation')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [investmentFund]);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Investment Fund</h2>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-slate-500">Loading investment fund...</div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (isError || !investmentFund) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Investment Fund</h2>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load investment fund. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Investment Fund</h2>
        {isAdmin && (
          <Button 
            onClick={() => setShowAddTransactionDialog(true)}
            className="gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        )}
      </div>

      {/* Investment Fund Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Initial Capital</CardTitle>
            <Wallet className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(investmentFund.initialCapital)}</div>
            <p className="mt-1 text-xs text-slate-500">Starting amount</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Current Balance</CardTitle>
            <Wallet className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(investmentFund.currentBalance)}</div>
            <p className="mt-1 text-xs text-slate-500">Available funds</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Payments</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalPayments)}</div>
            <p className="mt-1 text-xs text-slate-500">Outgoing funds</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Allocations</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalAllocations)}</div>
            <p className="mt-1 text-xs text-slate-500">Allocated funds</p>
          </CardContent>
        </Card>
      </div>

      {/* Fund Status */}
      <Card>
        <CardHeader>
          <CardTitle>Fund Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-slate-600">Status</p>
              <Badge variant={investmentFund.isActive ? 'default' : 'secondary'} className="text-sm">
                {investmentFund.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-600">Created Date</p>
              <p className="text-sm font-medium">{formatDate(investmentFund.createdDate)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-600">Last Updated</p>
              <p className="text-sm font-medium">{formatDate(investmentFund.lastUpdated)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {investmentFund.transactions.length === 0 ? (
            <div className="py-8 text-center text-slate-500">No transactions yet</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Allocation Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investmentFund.transactions
                    .sort((a, b) => Number(b.date - a.date))
                    .map((transaction) => (
                      <TableRow key={Number(transaction.id)}>
                        <TableCell className="text-sm">{formatDate(transaction.date)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={transaction.transactionType === 'allocation' ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {transaction.transactionType === 'allocation' ? (
                              <TrendingUp className="mr-1 h-3 w-3" />
                            ) : (
                              <TrendingDown className="mr-1 h-3 w-3" />
                            )}
                            {transaction.transactionType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{transaction.allocationType}</TableCell>
                        <TableCell className="text-sm max-w-xs truncate" title={transaction.description}>
                          {transaction.description}
                        </TableCell>
                        <TableCell 
                          className={`text-right font-medium ${
                            transaction.transactionType === 'allocation' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.transactionType === 'allocation' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(transaction.remainingBalance)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Transaction Dialog */}
      <AddInvestmentTransactionDialog
        open={showAddTransactionDialog}
        onClose={() => setShowAddTransactionDialog(false)}
      />
    </section>
  );
}
