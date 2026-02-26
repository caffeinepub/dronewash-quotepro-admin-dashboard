import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileSpreadsheet, AlertCircle, RefreshCw } from 'lucide-react';
import { useAllJobs, useAllExpenses } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { generateCashFlowCSV, generateCashFlowPDF, generateUnitEconomicsCSV } from '@/lib/reportGenerator';

export default function ReportingSection() {
  const { data: jobs, isLoading: jobsLoading, isError: jobsError, refetch: refetchJobs } = useAllJobs();
  const { data: expenses, isLoading: expensesLoading, isError: expensesError, refetch: refetchExpenses } = useAllExpenses();

  const isLoading = jobsLoading || expensesLoading;
  const hasError = jobsError || expensesError;

  const handleExportCashFlowCSV = () => {
    try {
      generateCashFlowCSV(jobs || [], expenses || []);
      toast.success('Cash flow CSV exported successfully!');
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  const handleExportCashFlowPDF = () => {
    try {
      generateCashFlowPDF(jobs || [], expenses || []);
      toast.success('Cash flow PDF exported successfully!');
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  const handleExportUnitEconomics = () => {
    try {
      generateUnitEconomicsCSV(jobs || [], expenses || []);
      toast.success('Unit economics exported successfully!');
    } catch (error) {
      toast.error('Failed to export unit economics');
    }
  };

  // Calculate unit economics
  const totalRevenue = jobs?.reduce((sum, job) => sum + job.revenue, 0) || 0;
  const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
  const jobCount = jobs?.length || 0;
  const avgRevenuePerJob = jobCount > 0 ? totalRevenue / jobCount : 0;
  const avgExpensePerJob = jobCount > 0 ? totalExpenses / jobCount : 0;
  const avgProfitPerJob = avgRevenuePerJob - avgExpensePerJob;

  if (hasError) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Reporting</h2>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load reporting data. Please check your connection and try again.</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                refetchJobs();
                refetchExpenses();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-900">Reporting</h2>
      
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Cash Flow Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-cyan-600" />
              Cash Flow Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">Export detailed cash flow data including all jobs and expenses.</p>
            <div className="flex gap-2">
              <Button 
                onClick={handleExportCashFlowCSV} 
                variant="outline" 
                className="flex-1"
                disabled={isLoading || !jobs || jobs.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button 
                onClick={handleExportCashFlowPDF} 
                variant="outline" 
                className="flex-1"
                disabled={isLoading || !jobs || jobs.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Unit Economics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              Unit Economics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">Analyze per-job economics and profitability metrics.</p>
            <Button 
              onClick={handleExportUnitEconomics} 
              variant="outline" 
              className="w-full"
              disabled={isLoading || !jobs || jobs.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Unit Economics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Unit Economics Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-slate-500">Loading data...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Total Jobs</TableCell>
                  <TableCell className="text-right">{jobCount}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Average Revenue per Job</TableCell>
                  <TableCell className="text-right">€{avgRevenuePerJob.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Average Expense per Job</TableCell>
                  <TableCell className="text-right">€{avgExpensePerJob.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Average Profit per Job</TableCell>
                  <TableCell className={`text-right font-semibold ${avgProfitPerJob >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    €{avgProfitPerJob.toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Total Revenue</TableCell>
                  <TableCell className="text-right">€{totalRevenue.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Total Expenses</TableCell>
                  <TableCell className="text-right">€{totalExpenses.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Net Profit</TableCell>
                  <TableCell className={`text-right font-bold ${(totalRevenue - totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    €{(totalRevenue - totalExpenses).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
