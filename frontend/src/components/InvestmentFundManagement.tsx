import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Plus } from 'lucide-react';
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
import { useGetInvestmentFund } from '@/hooks/useQueries';
import AddInvestmentTransactionDialog from './AddInvestmentTransactionDialog';

interface InvestmentFundManagementProps {
  isAdmin: boolean;
}

export default function InvestmentFundManagement({ isAdmin }: InvestmentFundManagementProps) {
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const { data: investmentFund, isLoading } = useGetInvestmentFund();

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const balance = investmentFund?.balance ?? 0;
  const recentTransactions = investmentFund?.recentTransactions ?? [];

  // Calculate totals from transactions
  const totalPayments = recentTransactions
    .filter((tx) => tx.transactionType === 'inflow')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalAllocations = recentTransactions
    .filter((tx) => tx.transactionType === 'outflow')
    .reduce((sum, tx) => sum + tx.amount, 0);

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
            <p className="text-xs text-muted-foreground mt-1">Investment fund balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Total Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPayments)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total inflows</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Total Allocations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalAllocations)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total outflows</p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Transaction History</CardTitle>
          {isAdmin && (
            <Button size="sm" onClick={() => setShowAddTransaction(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Transaction
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance After</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((tx) => (
                  <TableRow key={tx.id.toString()}>
                    <TableCell className="text-sm">{formatDate(tx.date)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={tx.transactionType === 'inflow' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {tx.transactionType === 'inflow' ? '↑ Inflow' : '↓ Outflow'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      {tx.description}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      <span
                        className={tx.transactionType === 'inflow' ? 'text-green-600' : 'text-red-600'}
                      >
                        {tx.transactionType === 'inflow' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(tx.remainingBalance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <AddInvestmentTransactionDialog
          open={showAddTransaction}
          onOpenChange={setShowAddTransaction}
        />
      )}
    </div>
  );
}
