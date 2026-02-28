import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, AlertTriangle, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useAllFunds,
  useAllFundTransactions,
  useAllFundTransfers,
  useAllFundAlerts,
  useDeleteFund,
  Fund,
} from '@/hooks/useQueries';
import CreateFundDialog from './CreateFundDialog';
import EditFundDialog from './EditFundDialog';
import AddFundTransactionDialog from './AddFundTransactionDialog';

interface FundsManagementProps {
  isAdmin: boolean;
}

interface AddTransactionTarget {
  fundId: bigint;
  fundName: string;
}

export default function FundsManagement({ isAdmin }: FundsManagementProps) {
  const [showCreateFund, setShowCreateFund] = useState(false);
  const [editingFund, setEditingFund] = useState<Fund | null>(null);
  const [addTransactionTarget, setAddTransactionTarget] = useState<AddTransactionTarget | null>(null);

  const { data: funds = [], isLoading: fundsLoading } = useAllFunds();
  const { data: transactions = [] } = useAllFundTransactions();
  const { data: transfers = [] } = useAllFundTransfers();
  const { data: alerts = [] } = useAllFundAlerts();
  const deleteFund = useDeleteFund();

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

  const getFundTypeBadgeVariant = (fundType: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (fundType) {
      case 'main': return 'default';
      case 'maintenance': return 'secondary';
      case 'investment': return 'outline';
      case 'salaries': return 'destructive';
      default: return 'outline';
    }
  };

  const activeAlerts = alerts.filter((a) => a.isActive);

  if (fundsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {activeAlerts.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              Active Alerts ({activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {activeAlerts.map((alert) => (
                <li key={alert.id.toString()} className="text-sm text-yellow-700 dark:text-yellow-300">
                  • {alert.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
          </TabsList>
          {isAdmin && (
            <Button size="sm" onClick={() => setShowCreateFund(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New Fund
            </Button>
          )}
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {funds.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10 text-muted-foreground">
                <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No funds created yet.</p>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => setShowCreateFund(true)}
                  >
                    Create First Fund
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {funds.map((fund) => (
                <Card key={fund.id.toString()}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{fund.name}</CardTitle>
                        <Badge
                          variant={getFundTypeBadgeVariant(fund.fundType)}
                          className="mt-1 text-xs"
                        >
                          {fund.fundType}
                        </Badge>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setEditingFund(fund)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => deleteFund.mutate(fund.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(fund.balance)}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="block">Spending Limit</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(fund.spendingLimit)}
                        </span>
                      </div>
                      <div>
                        <span className="block">Approval Threshold</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(fund.approvalThreshold)}
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 w-full"
                        onClick={() =>
                          setAddTransactionTarget({ fundId: fund.id, fundName: fund.name })
                        }
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Transaction
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardContent className="pt-4">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Fund</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => {
                      const fund = funds.find((f) => f.id === tx.fundId);
                      return (
                        <TableRow key={tx.id.toString()}>
                          <TableCell className="text-sm">{formatDate(tx.date)}</TableCell>
                          <TableCell className="text-sm">{fund?.name ?? 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={tx.transactionType === 'inflow' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {tx.transactionType === 'inflow' ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {tx.transactionType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{tx.category}</TableCell>
                          <TableCell className="text-sm max-w-[150px] truncate">
                            {tx.description}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            <span
                              className={
                                tx.transactionType === 'inflow' ? 'text-green-600' : 'text-red-600'
                              }
                            >
                              {tx.transactionType === 'inflow' ? '+' : '-'}
                              {formatCurrency(tx.amount)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatCurrency(tx.remainingBalance)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transfers Tab */}
        <TabsContent value="transfers">
          <Card>
            <CardContent className="pt-4">
              {transfers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transfers yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.map((transfer) => {
                      const sourceFund = funds.find((f) => f.id === transfer.sourceFundId);
                      const destFund = funds.find((f) => f.id === transfer.destinationFundId);
                      return (
                        <TableRow key={transfer.id.toString()}>
                          <TableCell className="text-sm">{formatDate(transfer.date)}</TableCell>
                          <TableCell className="text-sm">{sourceFund?.name ?? 'Unknown'}</TableCell>
                          <TableCell className="text-sm">{destFund?.name ?? 'Unknown'}</TableCell>
                          <TableCell className="text-sm max-w-[150px] truncate">
                            {transfer.reason}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {transfer.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {formatCurrency(transfer.amount)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateFundDialog open={showCreateFund} onOpenChange={setShowCreateFund} />
      <EditFundDialog
        open={!!editingFund}
        onOpenChange={(o) => { if (!o) setEditingFund(null); }}
        fund={editingFund}
      />
      {addTransactionTarget !== null && (
        <AddFundTransactionDialog
          open={true}
          onOpenChange={(o) => { if (!o) setAddTransactionTarget(null); }}
          fundId={addTransactionTarget.fundId}
          fundName={addTransactionTarget.fundName}
        />
      )}
    </div>
  );
}
