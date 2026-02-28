import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Download, TrendingUp, Target, AlertCircle, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { useMonthlyReport, useMonthlyGoalsByMonthYear } from '@/hooks/useQueries';
import { toast } from 'sonner';
import AddGoalDialog from './AddGoalDialog';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const YEARS = [2024, 2025, 2026];

interface MonthlyReportsProps {
  isAdmin?: boolean;
}

export default function MonthlyReports({ isAdmin }: MonthlyReportsProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[currentDate.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [showAddGoalDialog, setShowAddGoalDialog] = useState(false);

  // Convert number year to bigint for the hook
  const selectedYearBigInt = BigInt(selectedYear);

  const { data: monthlyReport, isLoading: reportLoading, isError: reportError } = useMonthlyReport(selectedMonth, selectedYearBigInt);
  const { data: monthlyGoals, isLoading: goalsLoading } = useMonthlyGoalsByMonthYear(selectedMonth, selectedYearBigInt);

  const handleExportCSV = () => {
    if (!monthlyReport) return;

    const csvContent = [
      ['Monthly Report', `${selectedMonth} ${selectedYear}`],
      [],
      ['Metric', 'Value'],
      ['Total Revenue', `€${monthlyReport.totalRevenue.toFixed(2)}`],
      ['Total Expenses', `€${monthlyReport.totalExpenses.toFixed(2)}`],
      ['Net Profit', `€${monthlyReport.netProfit.toFixed(2)}`],
      ['Jobs Completed', monthlyReport.jobsCompleted.toString()],
      ['Paid Invoices', monthlyReport.paidInvoices.toString()],
      ['Pending Invoices', monthlyReport.pendingInvoices.toString()],
      ['VAT Collected', `€${monthlyReport.vatCollected.toFixed(2)}`],
      ['Goals Achieved', monthlyReport.goalsAchieved.toString()],
      ['Goals Missed', monthlyReport.goalsMissed.toString()],
      [],
      ['Goals Details'],
      ['Description', 'Target', 'Actual', 'Status'],
      ...(monthlyGoals?.map(goal => [
        goal.description,
        `€${goal.targetValue.toFixed(2)}`,
        `€${goal.actualValue.toFixed(2)}`,
        goal.achieved ? 'Achieved' : 'Missed',
      ]) || []),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-report-${selectedMonth}-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Monthly report exported successfully!');
  };

  const handlePrintReport = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  if (reportError) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Monthly Reports</h2>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load monthly report. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Monthly Reports</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={!monthlyReport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handlePrintReport} disabled={!monthlyReport}>
            <Download className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Month/Year Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-cyan-600" />
            Select Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-slate-700">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-slate-700">Year</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(val) => setSelectedYear(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-slate-500">Loading monthly report...</div>
          </CardContent>
        </Card>
      ) : monthlyReport ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Monthly Status Report — {selectedMonth} {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-600">Total Revenue</div>
                  <div className="mt-1 text-2xl font-bold text-green-600">€{monthlyReport.totalRevenue.toFixed(2)}</div>
                </div>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-600">Total Expenses</div>
                  <div className="mt-1 text-2xl font-bold text-red-600">€{monthlyReport.totalExpenses.toFixed(2)}</div>
                </div>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-600">Net Profit</div>
                  <div className={`mt-1 text-2xl font-bold ${monthlyReport.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    €{monthlyReport.netProfit.toFixed(2)}
                  </div>
                </div>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-600">Jobs Completed</div>
                  <div className="mt-1 text-2xl font-bold text-cyan-600">{monthlyReport.jobsCompleted.toString()}</div>
                </div>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-600">Paid Invoices</div>
                  <div className="mt-1 text-2xl font-bold text-green-600">{monthlyReport.paidInvoices.toString()}</div>
                </div>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-600">Pending Invoices</div>
                  <div className="mt-1 text-2xl font-bold text-orange-600">{monthlyReport.pendingInvoices.toString()}</div>
                </div>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-600">VAT Collected</div>
                  <div className="mt-1 text-2xl font-bold text-purple-600">€{monthlyReport.vatCollected.toFixed(2)}</div>
                </div>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-600">Goals Achieved</div>
                  <div className="mt-1 text-2xl font-bold text-green-600">{monthlyReport.goalsAchieved.toString()}</div>
                </div>
                <div className="rounded-lg border bg-slate-50 p-4">
                  <div className="text-sm font-medium text-slate-600">Goals Missed</div>
                  <div className="mt-1 text-2xl font-bold text-red-600">{monthlyReport.goalsMissed.toString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-cyan-600" />
                  Goals & Milestones Tracker
                </div>
                {isAdmin && (
                  <Button
                    onClick={() => setShowAddGoalDialog(true)}
                    className="gap-2 bg-cyan-600 hover:bg-cyan-700"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Goal
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {goalsLoading ? (
                <div className="py-8 text-center text-slate-500">Loading goals...</div>
              ) : !monthlyGoals || monthlyGoals.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  No goals set for {selectedMonth} {selectedYear}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Goal Description</TableHead>
                        <TableHead className="text-right">Target Value</TableHead>
                        <TableHead className="text-right">Actual Value</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyGoals.map((goal) => (
                        <TableRow key={Number(goal.id)}>
                          <TableCell className="font-medium">{goal.description}</TableCell>
                          <TableCell className="text-right">€{goal.targetValue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">€{goal.actualValue.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            {goal.achieved ? (
                              <Badge variant="default" className="gap-1 bg-green-600">
                                <CheckCircle2 className="h-3 w-3" />
                                Achieved
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                Missed
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-slate-500">
              No data available for {selectedMonth} {selectedYear}
            </div>
          </CardContent>
        </Card>
      )}

      <AddGoalDialog
        open={showAddGoalDialog}
        onOpenChange={setShowAddGoalDialog}
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
      />
    </section>
  );
}
