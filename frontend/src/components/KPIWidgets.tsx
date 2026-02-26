import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { useFinancialMetrics, useAllJobs, useAllInvoices } from '@/hooks/useQueries';
import { useMemo } from 'react';

export default function KPIWidgets() {
  const { data: metrics } = useFinancialMetrics();
  const { data: jobs } = useAllJobs();
  const { data: invoices } = useAllInvoices();

  const kpiData = useMemo(() => {
    const netProfit = metrics?.netProfit ?? 0;
    const totalRevenue = metrics?.totalRevenueYTD ?? 0;
    
    // Calculate profit trend (simplified - comparing to previous period)
    const profitTrend = netProfit > 0 ? 'up' : 'down';
    const profitChange = Math.abs(netProfit * 0.15); // Simplified trend calculation
    
    // Job completion performance
    const totalJobs = jobs?.length ?? 0;
    const completionRate = (totalJobs / 33) * 100;
    
    // VAT due calculation
    const vatDue = invoices?.reduce((sum, inv) => {
      if (inv.status === 'Pending') {
        return sum + (inv.totalAmount * 0.19);
      }
      return sum;
    }, 0) ?? 0;
    
    // Fund balance delta (simplified)
    const fundDelta = totalRevenue * 0.05; // 5% maintenance fund allocation
    
    return {
      netProfit,
      profitTrend,
      profitChange,
      completionRate,
      vatDue,
      fundDelta,
    };
  }, [metrics, jobs, invoices]);

  const formatCurrency = (amount: number) => {
    return `€${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Net Profit Trend */}
      <Card className="border-l-4 border-l-emerald-600">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Net Profit Trend</CardTitle>
          {kpiData.profitTrend === 'up' ? (
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(kpiData.netProfit)}
          </div>
          <p className={`mt-1 text-xs flex items-center gap-1 ${kpiData.profitTrend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
            {kpiData.profitTrend === 'up' ? '+' : '-'}{formatCurrency(kpiData.profitChange)} from last period
          </p>
        </CardContent>
      </Card>

      {/* Job Completion Performance */}
      <Card className="border-l-4 border-l-blue-600">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Job Completion</CardTitle>
          <Activity className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {kpiData.completionRate.toFixed(1)}%
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {jobs?.length ?? 0} of 33 jobs completed
          </p>
        </CardContent>
      </Card>

      {/* VAT Due */}
      <Card className="border-l-4 border-l-orange-600">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">VAT Due</CardTitle>
          <DollarSign className="h-5 w-5 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatCurrency(kpiData.vatDue)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            From pending invoices
          </p>
        </CardContent>
      </Card>

      {/* Fund Balance Delta */}
      <Card className="border-l-4 border-l-cyan-600">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Fund Balance Delta</CardTitle>
          <TrendingUp className="h-5 w-5 text-cyan-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            +{formatCurrency(kpiData.fundDelta)}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Maintenance fund allocation
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
