import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { useMonthlyRevenue, useMonthlyExpenses, useProfitProjection } from '@/hooks/useQueries';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Memoized chart component for better performance
const MemoizedBarChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" />
      <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'oklch(var(--foreground))' }} />
      <YAxis tick={{ fontSize: 12, fill: 'oklch(var(--foreground))' }} />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: 'oklch(var(--card))', 
          border: '1px solid oklch(var(--border))',
          borderRadius: '0.5rem'
        }}
      />
      <Legend />
      <Bar dataKey="revenue" fill="#0891b2" name="Revenue (€)" />
      <Bar dataKey="expenses" fill="#ef4444" name="Expenses (€)" />
    </BarChart>
  </ResponsiveContainer>
));

MemoizedBarChart.displayName = 'MemoizedBarChart';

const MemoizedLineChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" />
      <XAxis dataKey="year" tick={{ fontSize: 12, fill: 'oklch(var(--foreground))' }} />
      <YAxis tick={{ fontSize: 12, fill: 'oklch(var(--foreground))' }} />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: 'oklch(var(--card))', 
          border: '1px solid oklch(var(--border))',
          borderRadius: '0.5rem'
        }}
      />
      <Legend />
      <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Projected Profit (€)" />
    </LineChart>
  </ResponsiveContainer>
));

MemoizedLineChart.displayName = 'MemoizedLineChart';

export default function AnalyticsCharts() {
  const { data: revenueData, isLoading: revenueLoading, isError: revenueError, refetch: refetchRevenue } = useMonthlyRevenue();
  const { data: expensesData, isLoading: expensesLoading, isError: expensesError, refetch: refetchExpenses } = useMonthlyExpenses();
  const { data: projectionData, isLoading: projectionLoading, isError: projectionError, refetch: refetchProjection } = useProfitProjection();

  // Memoized data transformations
  const monthlyData = useMemo(() => {
    return revenueData?.map(([month, revenue]) => {
      const expense = expensesData?.find(([m]) => m === month)?.[1] || 0;
      return {
        month,
        revenue,
        expenses: expense,
      };
    }) || [];
  }, [revenueData, expensesData]);

  const projectionChartData = useMemo(() => {
    return projectionData?.map(([year, profit]) => ({
      year: Number(year),
      profit,
    })) || [];
  }, [projectionData]);

  const isLoading = revenueLoading || expensesLoading || projectionLoading;
  const hasError = revenueError || expensesError || projectionError;

  const handleRetryAll = () => {
    refetchRevenue();
    refetchExpenses();
    refetchProjection();
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Analytics</h2>
      
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load analytics data. Please check your connection and try again.</span>
            <Button variant="outline" size="sm" onClick={handleRetryAll}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Monthly Revenue vs Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-600" />
              Monthly Revenue vs Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <div className="text-slate-500 dark:text-slate-400">Loading chart data...</div>
              </div>
            ) : monthlyData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center">
                <div className="text-slate-500 dark:text-slate-400">No data available yet</div>
              </div>
            ) : (
              <MemoizedBarChart data={monthlyData} />
            )}
          </CardContent>
        </Card>

        {/* 3-Year Profit Projection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              3-Year Profit Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <div className="text-slate-500 dark:text-slate-400">Loading projection data...</div>
              </div>
            ) : projectionChartData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center">
                <div className="text-slate-500 dark:text-slate-400">No projection data available</div>
              </div>
            ) : (
              <MemoizedLineChart data={projectionChartData} />
            )}
            <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              <p>Assumptions: 50% growth in Year 2, 100% growth in Year 3</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
