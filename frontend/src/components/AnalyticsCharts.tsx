import React, { useMemo, memo } from 'react';
import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import { useGetMonthlyRevenue, useGetMonthlyExpenses, useGetProfitProjection } from '@/hooks/useQueries';

const MemoizedBarChart = memo(function MemoizedBarChart({
  data,
}: {
  data: { month: string; revenue: number; expenses: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${v}`} />
        <Tooltip formatter={(value: number) => [`€${value.toFixed(2)}`, '']} />
        <Legend />
        <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
});

const MemoizedLineChart = memo(function MemoizedLineChart({
  data,
}: {
  data: { year: string; profit: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${v}`} />
        <Tooltip formatter={(value: number) => [`€${value.toFixed(2)}`, 'Projected Profit']} />
        <Legend />
        <Line
          type="monotone"
          dataKey="profit"
          name="Projected Profit"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

export default function AnalyticsCharts() {
  const {
    data: monthlyRevenue,
    isLoading: revenueLoading,
    isError: revenueError,
    refetch: refetchRevenue,
  } = useGetMonthlyRevenue();

  const {
    data: monthlyExpenses,
    isLoading: expensesLoading,
    isError: expensesError,
    refetch: refetchExpenses,
  } = useGetMonthlyExpenses();

  const {
    data: profitProjection,
    isLoading: projectionLoading,
    isError: projectionError,
    refetch: refetchProjection,
  } = useGetProfitProjection();

  const barChartData = useMemo(() => {
    if (!monthlyRevenue || !monthlyExpenses) return [];
    const revenueMap = new Map(monthlyRevenue);
    const expensesMap = new Map(monthlyExpenses);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return months.map((month) => ({
      month: month.slice(0, 3),
      revenue: revenueMap.get(month) ?? 0,
      expenses: expensesMap.get(month) ?? 0,
    }));
  }, [monthlyRevenue, monthlyExpenses]);

  const lineChartData = useMemo(() => {
    if (!profitProjection) return [];
    return profitProjection.map(([year, profit]) => ({
      year: year.toString(),
      profit,
    }));
  }, [profitProjection]);

  const isBarLoading = revenueLoading || expensesLoading;
  const isBarError = revenueError || expensesError;

  return (
    <div className="space-y-6">
      {/* Revenue vs Expenses Bar Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Revenue vs Expenses (Monthly)</CardTitle>
          {isBarError && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                refetchRevenue();
                refetchExpenses();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isBarLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : isBarError ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <p>Failed to load chart data.</p>
            </div>
          ) : barChartData.every((d) => d.revenue === 0 && d.expenses === 0) ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <p>No data available yet. Add jobs and expenses to see the chart.</p>
            </div>
          ) : (
            <MemoizedBarChart data={barChartData} />
          )}
        </CardContent>
      </Card>

      {/* Profit Projection Line Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">3-Year Profit Projection</CardTitle>
          {projectionError && (
            <Button size="sm" variant="outline" onClick={() => refetchProjection()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {projectionLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : projectionError ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <p>Failed to load projection data.</p>
            </div>
          ) : lineChartData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <p>No projection data available.</p>
            </div>
          ) : (
            <MemoizedLineChart data={lineChartData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
