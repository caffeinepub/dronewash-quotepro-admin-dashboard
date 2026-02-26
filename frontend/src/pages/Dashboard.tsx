import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Droplets, User, Save, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import FinancialMetrics from '@/components/FinancialMetrics';
import DataEntryForms from '@/components/DataEntryForms';
import JobCalendar from '@/components/JobCalendar';
import QuoteCalculator from '@/components/QuoteCalculator';
import QuotesList from '@/components/QuotesList';
import InvoiceCreation from '@/components/InvoiceCreation';
import InvoicesList from '@/components/InvoicesList';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import ReportingSection from '@/components/ReportingSection';
import MonthlyReports from '@/components/MonthlyReports';
import PricingManagement from '@/components/PricingManagement';
import COGSSettings from '@/components/COGSSettings';
import ArchivedInvestments from '@/components/ArchivedInvestments';
import FundsManagement from '@/components/FundsManagement';
import MaintenanceManagement from '@/components/MaintenanceManagement';
import ExpensesManagement from '@/components/ExpensesManagement';
import ContractsManagement from '@/components/ContractsManagement';
import LoadingPanel from '@/components/LoadingPanel';
import ErrorPanel from '@/components/ErrorPanel';
import BackupVersionsDialog from '@/components/BackupVersionsDialog';
import { useBackupData, useAllJobs, useAllExpenses, useAllQuotes, useAllInvoices, useAllFunds, useAllContracts } from '@/hooks/useQueries';
import { UserProfile, UserRole } from '../backend';

interface DashboardProps {
  onLogout: () => void;
  userProfile: UserProfile | null | undefined;
  userRole: UserRole | undefined;
}

export default function Dashboard({ onLogout, userProfile, userRole }: DashboardProps) {
  const { mutate: backupData, isPending: isBackingUp } = useBackupData();
  const [activeTab, setActiveTab] = useState('overview');
  const [fundsSubTab, setFundsSubTab] = useState('operational');
  const [showBackupVersions, setShowBackupVersions] = useState(false);

  // Preload all data for better UX
  const { isLoading: jobsLoading, error: jobsError, refetch: refetchJobs } = useAllJobs();
  const { isLoading: expensesLoading, error: expensesError, refetch: refetchExpenses } = useAllExpenses();
  const { isLoading: quotesLoading, error: quotesError, refetch: refetchQuotes } = useAllQuotes();
  const { isLoading: invoicesLoading, error: invoicesError, refetch: refetchInvoices } = useAllInvoices();
  const { isLoading: fundsLoading, error: fundsError, refetch: refetchFunds } = useAllFunds();
  const { isLoading: contractsLoading, error: contractsError, refetch: refetchContracts } = useAllContracts();

  const isAdmin = userRole === UserRole.admin;
  const isViewer = userRole === UserRole.user;

  const handleBackup = () => {
    backupData(undefined, {
      onSuccess: (backupVersion) => {
        const timestamp = new Date(backupVersion.timestamp / 1000000).toLocaleString();
        toast.success('Backup completed successfully!', {
          description: `Save Version ID: ${backupVersion.saveVersionId}\nTimestamp: ${timestamp}\nStore this ID for recovery purposes.`,
          duration: 10000,
        });
      },
      onError: (error) => {
        toast.error('Backup failed', {
          description: error instanceof Error ? error.message : 'Unable to complete backup. Please try again.',
        });
      },
    });
  };

  const handleNavigateToInvestmentFund = () => {
    setActiveTab('funds');
    setFundsSubTab('investment');
  };

  const handleRetryAll = () => {
    refetchJobs();
    refetchExpenses();
    refetchQuotes();
    refetchInvoices();
    refetchFunds();
    refetchContracts();
  };

  // Show loading state if critical data is still loading
  const isInitialLoading = jobsLoading || expensesLoading || quotesLoading || invoicesLoading || fundsLoading || contractsLoading;
  const hasErrors = jobsError || expensesError || quotesError || invoicesError || fundsError || contractsError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600">
              <Droplets className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">DroneWash QuotePro</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Business Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {userProfile && (
              <div className="flex items-center gap-2 rounded-lg border bg-slate-50 dark:bg-slate-800 px-3 py-2">
                <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{userProfile.name}</span>
                <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-xs">
                  {isAdmin ? 'Admin' : 'Viewer'}
                </Badge>
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => setShowBackupVersions(true)}
              className="gap-2"
            >
              <Database className="h-4 w-4" />
              Versions
            </Button>
            <Button
              variant="default"
              onClick={handleBackup}
              disabled={isBackingUp}
              className="gap-2 bg-cyan-600 hover:bg-cyan-700"
            >
              <Save className="h-4 w-4" />
              {isBackingUp ? 'Backing up...' : 'Backup Data'}
            </Button>
            <Button variant="outline" onClick={onLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <main className="container mx-auto px-4 py-6">
        {/* Show global error if any critical data failed to load */}
        {hasErrors && (
          <div className="mb-6">
            <ErrorPanel
              title="Data Loading Error"
              error={jobsError || expensesError || quotesError || invoicesError || fundsError || contractsError || new Error('Unknown error')}
              onRetry={handleRetryAll}
            />
          </div>
        )}

        {/* Show loading state during initial data fetch */}
        {isInitialLoading && !hasErrors && (
          <div className="mb-6">
            <LoadingPanel
              title="Loading Dashboard"
              message="Fetching all your data from the blockchain. This may take a moment..."
            />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-10 gap-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="funds">Funds</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
            {isAdmin && <TabsTrigger value="settings">Settings</TabsTrigger>}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <FinancialMetrics onNavigateToInvestmentFund={handleNavigateToInvestmentFund} />
            {isAdmin && <DataEntryForms />}
            {isViewer && (
              <section className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Viewer Mode:</strong> You have read-only access to view all data. Contact an administrator to request edit permissions.
                </p>
              </section>
            )}
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            {jobsLoading ? (
              <LoadingPanel title="Jobs Calendar" message="Loading jobs data..." />
            ) : jobsError ? (
              <ErrorPanel title="Jobs Calendar" error={jobsError} onRetry={refetchJobs} />
            ) : (
              <JobCalendar />
            )}
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="space-y-6">
            {isAdmin && <QuoteCalculator />}
            {quotesLoading ? (
              <LoadingPanel title="Quotes List" message="Loading quotes data..." />
            ) : quotesError ? (
              <ErrorPanel title="Quotes List" error={quotesError} onRetry={refetchQuotes} />
            ) : (
              <QuotesList isAdmin={isAdmin} />
            )}
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            {isAdmin && <InvoiceCreation />}
            {invoicesLoading ? (
              <LoadingPanel title="Invoices List" message="Loading invoices data..." />
            ) : invoicesError ? (
              <ErrorPanel title="Invoices List" error={invoicesError} onRetry={refetchInvoices} />
            ) : (
              <InvoicesList isAdmin={isAdmin} />
            )}
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="space-y-6">
            {contractsLoading ? (
              <LoadingPanel title="Contract Management" message="Loading contracts data..." />
            ) : contractsError ? (
              <ErrorPanel title="Contract Management" error={contractsError} onRetry={refetchContracts} />
            ) : (
              <ContractsManagement isAdmin={isAdmin} />
            )}
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            {expensesLoading ? (
              <LoadingPanel title="Expenses Management" message="Loading expenses data..." />
            ) : expensesError ? (
              <ErrorPanel title="Expenses Management" error={expensesError} onRetry={refetchExpenses} />
            ) : (
              <ExpensesManagement isAdmin={isAdmin} />
            )}
          </TabsContent>

          {/* Funds Tab */}
          <TabsContent value="funds" className="space-y-6">
            {fundsLoading ? (
              <LoadingPanel title="Funds Management" message="Loading funds data..." />
            ) : fundsError ? (
              <ErrorPanel title="Funds Management" error={fundsError} onRetry={refetchFunds} />
            ) : (
              <FundsManagement isAdmin={isAdmin} activeSubTab={fundsSubTab} onSubTabChange={setFundsSubTab} />
            )}
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-6">
            <MaintenanceManagement isAdmin={isAdmin} />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <AnalyticsCharts />
            <MonthlyReports />
            <ReportingSection />
          </TabsContent>

          {/* Archived Investments Tab */}
          <TabsContent value="archived" className="space-y-6">
            <ArchivedInvestments onNavigateToInvestmentFund={handleNavigateToInvestmentFund} />
          </TabsContent>

          {/* Settings Tab - Admin Only */}
          {isAdmin && (
            <TabsContent value="settings" className="space-y-6">
              <PricingManagement />
              <COGSSettings />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-slate-900 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-slate-600 dark:text-slate-400">
          © 2025. Built with love using <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">caffeine.ai</a>
        </div>
      </footer>

      {/* Backup Versions Dialog */}
      <BackupVersionsDialog
        open={showBackupVersions}
        onClose={() => setShowBackupVersions(false)}
      />
    </div>
  );
}
