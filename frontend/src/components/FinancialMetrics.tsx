import { useState, useMemo, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp, Target, DollarSign, RefreshCw, Wallet, ChevronDown, ChevronUp, Edit, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFinancialMetrics, useAllFunds } from '@/hooks/useQueries';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useGetFinancialMetricsDetailed } from '@/hooks/useQueries';
import EditFundDialog from './EditFundDialog';
import AddFundTransactionDialog from './AddFundTransactionDialog';

interface FinancialMetricsProps {
  onNavigateToInvestmentFund?: () => void;
}

// Memoized metric card component for better performance
const MetricCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  borderColor, 
  onClick, 
  isExpanded, 
  subtitle 
}: { 
  title: string; 
  value: string; 
  icon: any; 
  borderColor: string; 
  onClick?: () => void; 
  isExpanded?: boolean; 
  subtitle?: string;
}) => (
  <Card 
    className={`border-l-4 ${borderColor} ${onClick ? 'cursor-pointer hover:shadow-md transition-all duration-200' : ''}`} 
    onClick={onClick}
  >
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</CardTitle>
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${borderColor.replace('border-l-', 'text-')}`} />
        {onClick && (isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
      {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </CardContent>
  </Card>
));

MetricCard.displayName = 'MetricCard';

export default function FinancialMetrics({ onNavigateToInvestmentFund }: FinancialMetricsProps) {
  const { data: metrics, isLoading, isError, error, refetch } = useFinancialMetrics();
  const { data: detailedMetrics, refetch: refetchDetailed } = useGetFinancialMetricsDetailed();
  const { data: funds } = useAllFunds();

  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [editingFund, setEditingFund] = useState<bigint | null>(null);
  const [addingTransactionToFund, setAddingTransactionToFund] = useState<bigint | null>(null);

  // Memoized fund balances calculation
  const fundBalances = useMemo(() => {
    if (!funds) return { main: 0, maintenance: 0, salaries: 0, investment: 0 };
    return {
      main: funds.find(f => f.fundType === 'main')?.balance || 0,
      maintenance: funds.find(f => f.fundType === 'maintenance')?.balance || 0,
      salaries: funds.find(f => f.fundType === 'salaries')?.balance || 0,
      investment: funds.find(f => f.fundType === 'investment')?.balance || 0,
    };
  }, [funds]);

  const mainFund = useMemo(() => {
    return funds?.find(f => f.fundType === 'main');
  }, [funds]);

  const formatDate = useCallback((timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString();
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return `€${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  const toggleCard = useCallback((cardId: string) => {
    setExpandedCard(prev => prev === cardId ? null : cardId);
  }, []);

  const handleInvestmentCardClick = useCallback(() => {
    if (onNavigateToInvestmentFund) {
      onNavigateToInvestmentFund();
    }
  }, [onNavigateToInvestmentFund]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetch(), refetchDetailed()]);
  }, [refetch, refetchDetailed]);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Financial Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Financial Overview</h2>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load financial metrics: {error instanceof Error ? error.message : 'Unknown error'}</span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  // Use Investment Fund balance from funds data for accurate display
  const investmentRemaining = fundBalances.investment;
  const totalRevenue = metrics?.totalRevenueYTD ?? 0;
  const breakEvenProgress = (metrics?.breakEvenProgress ?? 0) * 100;
  const netProfit = metrics?.netProfit ?? 0;

  const showBreakEvenAlert = breakEvenProgress < 50;
  const showInvestmentCard = investmentRemaining > 0;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Financial Overview</h2>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      {/* Alerts */}
      {showBreakEvenAlert && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Break-even progress is below 50%. Focus on acquiring more jobs to reach the 33-job target.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Investment Remaining - Only show if active */}
        {showInvestmentCard && (
          <MetricCard
            title="Investment Remaining"
            value={formatCurrency(investmentRemaining)}
            icon={DollarSign}
            borderColor="border-l-cyan-600"
            onClick={handleInvestmentCardClick}
            subtitle="Click to manage Investment Fund"
          />
        )}

        {/* Total Revenue YTD */}
        <MetricCard
          title="Total Revenue YTD"
          value={formatCurrency(totalRevenue)}
          icon={TrendingUp}
          borderColor="border-l-green-600"
          onClick={() => toggleCard('revenue')}
          isExpanded={expandedCard === 'revenue'}
          subtitle="Click to view breakdown"
        />

        {/* Break-even Progress */}
        <Card className="border-l-4 border-l-blue-600 cursor-pointer hover:shadow-md transition-all duration-200" onClick={() => toggleCard('breakeven')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Break-even Progress</CardTitle>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              {expandedCard === 'breakeven' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{breakEvenProgress.toFixed(1)}%</div>
            <Progress value={breakEvenProgress} className="mt-2" />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Target: 33 jobs</p>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <MetricCard
          title="Net Profit"
          value={formatCurrency(netProfit)}
          icon={TrendingUp}
          borderColor={netProfit >= 0 ? 'border-l-emerald-600' : 'border-l-red-600'}
          onClick={() => toggleCard('netprofit')}
          isExpanded={expandedCard === 'netprofit'}
          subtitle="Click to view breakdown"
        />
      </div>

      {/* Expanded Details */}
      {expandedCard === 'revenue' && detailedMetrics && (
        <Card className="border-2 border-green-600 animate-in slide-in-from-top-2 duration-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Revenue Breakdown</span>
              <Button variant="ghost" size="sm" onClick={() => setExpandedCard(null)}>
                <ChevronUp className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {detailedMetrics.revenueBreakdown.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-4">No revenue entries yet</p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailedMetrics.revenueBreakdown.map((entry) => (
                      <TableRow key={Number(entry.jobId)}>
                        <TableCell className="text-sm">{formatDate(entry.date)}</TableCell>
                        <TableCell className="font-medium">{entry.clientName}</TableCell>
                        <TableCell className="text-sm">{entry.sector}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">{formatCurrency(entry.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {expandedCard === 'netprofit' && detailedMetrics && (
        <Card className="border-2 border-emerald-600 animate-in slide-in-from-top-2 duration-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Net Profit Breakdown</span>
              <Button variant="ghost" size="sm" onClick={() => setExpandedCard(null)}>
                <ChevronUp className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(detailedMetrics.totalRevenueYTD)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(detailedMetrics.expenseBreakdown.reduce((sum, e) => sum + e.amount, 0))}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Expense Details</h4>
              {detailedMetrics.expenseBreakdown.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-4">No expenses yet</p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Info</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailedMetrics.expenseBreakdown.map((entry) => (
                        <TableRow key={Number(entry.expenseId)}>
                          <TableCell className="text-sm">{formatDate(entry.date)}</TableCell>
                          <TableCell className="font-medium">{entry.category}</TableCell>
                          <TableCell className="text-sm">{entry.additionalInfo || '-'}</TableCell>
                          <TableCell className="text-right font-semibold text-red-600">{formatCurrency(entry.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {expandedCard === 'breakeven' && (
        <Card className="border-2 border-blue-600 animate-in slide-in-from-top-2 duration-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Break-even Analysis</span>
              <Button variant="ghost" size="sm" onClick={() => setExpandedCard(null)}>
                <ChevronUp className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Current Progress</span>
                <span className="font-semibold">{breakEvenProgress.toFixed(1)}%</span>
              </div>
              <Progress value={breakEvenProgress} className="h-3" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">Jobs Completed</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{detailedMetrics?.revenueBreakdown.length || 0}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">Target Jobs</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">33</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You need {Math.max(0, 33 - (detailedMetrics?.revenueBreakdown.length || 0))} more jobs to reach break-even point.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Fund Balances */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Main Fund"
          value={formatCurrency(fundBalances.main)}
          icon={Wallet}
          borderColor="border-l-blue-600"
          onClick={() => toggleCard('mainfund')}
          isExpanded={expandedCard === 'mainfund'}
          subtitle="Click to manage"
        />

        <MetricCard
          title="Maintenance Fund"
          value={formatCurrency(fundBalances.maintenance)}
          icon={Wallet}
          borderColor="border-l-orange-600"
          onClick={() => toggleCard('maintenancefund')}
          isExpanded={expandedCard === 'maintenancefund'}
          subtitle="5% from each job"
        />

        <MetricCard
          title="Salaries Fund"
          value={formatCurrency(fundBalances.salaries)}
          icon={Wallet}
          borderColor="border-l-green-600"
          subtitle="Payroll reserve"
        />
      </div>

      {/* Main Fund Details */}
      {expandedCard === 'mainfund' && mainFund && detailedMetrics && (
        <Card className="border-2 border-blue-600 animate-in slide-in-from-top-2 duration-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Main Fund Management</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setEditingFund(mainFund.id); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Fund
                </Button>
                <Button variant="default" size="sm" onClick={(e) => { e.stopPropagation(); setAddingTransactionToFund(mainFund.id); }} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setExpandedCard(null)}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">Current Balance</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(mainFund.balance)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">Spending Limit</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(mainFund.spendingLimit)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">Status</p>
                <Badge variant={mainFund.isActive ? 'default' : 'secondary'}>
                  {mainFund.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Recent Transactions</h4>
              {detailedMetrics.fundBalances.find(f => f.fundType === 'main')?.recentTransactions.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-4">No transactions yet</p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailedMetrics.fundBalances.find(f => f.fundType === 'main')?.recentTransactions.map((transaction) => (
                        <TableRow key={Number(transaction.id)}>
                          <TableCell className="text-sm">{formatDate(transaction.date)}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.transactionType === 'inflow' ? 'default' : 'secondary'} className="text-xs">
                              {transaction.transactionType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{transaction.description}</TableCell>
                          <TableCell className={`text-right font-semibold ${transaction.transactionType === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.transactionType === 'inflow' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Fund Details */}
      {expandedCard === 'maintenancefund' && detailedMetrics && (
        <Card className="border-2 border-orange-600 animate-in slide-in-from-top-2 duration-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Maintenance Fund Status</span>
              <Button variant="ghost" size="sm" onClick={() => setExpandedCard(null)}>
                <ChevronUp className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">Current Balance</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(detailedMetrics.maintenanceFundStatus.balance)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(detailedMetrics.maintenanceFundStatus.totalCollected)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Spent</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(detailedMetrics.maintenanceFundStatus.totalSpent)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Recent Entries</h4>
              {detailedMetrics.maintenanceFundStatus.recentEntries.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-4">No entries yet</p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailedMetrics.maintenanceFundStatus.recentEntries.map((entry) => (
                        <TableRow key={Number(entry.id)}>
                          <TableCell className="text-sm">{formatDate(entry.date)}</TableCell>
                          <TableCell>
                            <Badge variant={entry.transactionType === 'inflow' ? 'default' : 'secondary'} className="text-xs">
                              {entry.transactionType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{entry.purpose}</TableCell>
                          <TableCell className={`text-right font-semibold ${entry.transactionType === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                            {entry.transactionType === 'inflow' ? '+' : '-'}{formatCurrency(entry.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Fund Dialog */}
      {editingFund && mainFund && (
        <EditFundDialog
          fund={mainFund}
          open={!!editingFund}
          onClose={() => setEditingFund(null)}
        />
      )}

      {/* Add Transaction Dialog */}
      {addingTransactionToFund && mainFund && (
        <AddFundTransactionDialog
          fundId={mainFund.id}
          fundName={mainFund.name}
          open={!!addingTransactionToFund}
          onClose={() => setAddingTransactionToFund(null)}
        />
      )}
    </section>
  );
}
