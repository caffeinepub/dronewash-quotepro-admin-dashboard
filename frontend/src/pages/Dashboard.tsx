import React, { useState, lazy, Suspense, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  FileText,
  Calculator,
  BarChart3,
  Settings,
  LogOut,
  User,
  Download,
  ChevronDown,
  Wrench,
  DollarSign,
  Calendar,
  FileCheck,
  TrendingUp,
  Wallet,
  ClipboardList,
} from 'lucide-react';
import {
  useBackupData,
  useGetAllJobs,
  useGetAllExpenses,
  useGetAllQuotes,
  useGetAllInvoices,
  useAllFunds,
  useGetAllContracts,
} from '@/hooks/useQueries';
import { toast } from 'sonner';
import type { UserProfile } from '../backend';
import { UserRole } from '../backend';
import LoadingPanel from '@/components/LoadingPanel';

const FinancialMetrics = lazy(() => import('@/components/FinancialMetrics'));
const DataEntryForms = lazy(() => import('@/components/DataEntryForms'));
const QuoteCalculator = lazy(() => import('@/components/QuoteCalculator'));
const QuotesList = lazy(() => import('@/components/QuotesList'));
const InvoiceCreation = lazy(() => import('@/components/InvoiceCreation'));
const InvoicesList = lazy(() => import('@/components/InvoicesList'));
const AnalyticsCharts = lazy(() => import('@/components/AnalyticsCharts'));
const ReportingSection = lazy(() => import('@/components/ReportingSection'));
const PricingManagement = lazy(() => import('@/components/PricingManagement'));
const MonthlyReports = lazy(() => import('@/components/MonthlyReports'));
const JobCalendar = lazy(() => import('@/components/JobCalendar'));
const KPIWidgets = lazy(() => import('@/components/KPIWidgets'));
const FundsManagement = lazy(() => import('@/components/FundsManagement'));
const MaintenanceManagement = lazy(() => import('@/components/MaintenanceManagement'));
const InvestmentFundManagement = lazy(() => import('@/components/InvestmentFundManagement'));
const ExpensesManagement = lazy(() => import('@/components/ExpensesManagement'));
const COGSSettings = lazy(() => import('@/components/COGSSettings'));
const ContractsManagement = lazy(() => import('@/components/ContractsManagement'));
const UserPreferencesDialog = lazy(() => import('@/components/UserPreferencesDialog'));
const BackupVersionsDialog = lazy(() => import('@/components/BackupVersionsDialog'));

interface DashboardProps {
  onLogout: () => void;
  userProfile: UserProfile | null;
  userRole: UserRole;
}

export default function Dashboard({ onLogout, userProfile, userRole }: DashboardProps) {
  const isAdmin = userRole === UserRole.admin;
  const [activeTab, setActiveTab] = useState('overview');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showBackupVersions, setShowBackupVersions] = useState(false);

  const backupMutation = useBackupData();
  const { data: jobs = [] } = useGetAllJobs();
  const { data: invoices = [] } = useGetAllInvoices();
  // Preload other data
  useGetAllExpenses();
  useGetAllQuotes();
  useAllFunds();
  useGetAllContracts();

  const handleBackup = useCallback(async () => {
    try {
      const backupData = await backupMutation.mutateAsync();
      const timestampMs = Number(backupData.timestamp) / 1_000_000;
      const timestamp = new Date(timestampMs).toLocaleString();
      const versionId = `backup-${Date.now()}`;

      try {
        const existing = JSON.parse(localStorage.getItem('droneWashBackupVersions') || '[]');
        existing.push({
          id: versionId,
          timestamp: backupData.timestamp.toString(),
          data: backupData,
        });
        localStorage.setItem('droneWashBackupVersions', JSON.stringify(existing));
      } catch {
        // ignore storage errors
      }

      toast.success('Backup created successfully', {
        description: `Version ID: ${versionId} | ${timestamp}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Backup failed';
      toast.error(msg);
    }
  }, [backupMutation]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'data-entry', label: 'Data Entry', icon: FileText, adminOnly: true },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'quotes', label: 'Quotes', icon: Calculator },
    { id: 'invoices', label: 'Invoices', icon: FileCheck },
    { id: 'contracts', label: 'Contracts', icon: ClipboardList },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'funds', label: 'Funds', icon: Wallet, adminOnly: true },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, adminOnly: true },
    { id: 'investment', label: 'Investment', icon: TrendingUp, adminOnly: true },
    { id: 'expenses', label: 'Expenses', icon: DollarSign, adminOnly: true },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'monthly', label: 'Monthly', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
  ].filter((tab) => !tab.adminOnly || isAdmin);

  const Spinner = () => (
    <div className="flex items-center justify-center py-12">
      <LoadingPanel message="Loading..." />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-primary-foreground font-bold text-sm">DW</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-none">DroneWash</h1>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {jobs.length} Jobs
              </Badge>
              <Badge variant="outline" className="text-xs">
                {invoices.length} Invoices
              </Badge>
            </div>

            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackup}
                disabled={backupMutation.isPending}
                className="hidden md:flex gap-2"
              >
                <Download className="h-4 w-4" />
                {backupMutation.isPending ? 'Backing up...' : 'Backup'}
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{userProfile?.name ?? 'User'}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowPreferences(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Preferences
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => setShowBackupVersions(true)}>
                    <Download className="h-4 w-4 mr-2" />
                    Backup Versions
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem onClick={handleBackup} disabled={backupMutation.isPending}>
                    <Download className="h-4 w-4 mr-2" />
                    Create Backup
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="mb-6 overflow-x-auto">
            <TabsList className="flex h-auto gap-1 bg-muted p-1 w-max">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="gap-1.5 text-xs whitespace-nowrap"
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview">
            <Suspense fallback={<Spinner />}>
              <div className="space-y-6">
                <KPIWidgets />
                <FinancialMetrics isAdmin={isAdmin} />
              </div>
            </Suspense>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="data-entry">
              <Suspense fallback={<Spinner />}>
                <DataEntryForms />
              </Suspense>
            </TabsContent>
          )}

          <TabsContent value="calendar">
            <Suspense fallback={<Spinner />}>
              <JobCalendar />
            </Suspense>
          </TabsContent>

          <TabsContent value="quotes">
            <Suspense fallback={<Spinner />}>
              <div className="space-y-6">
                {isAdmin && <QuoteCalculator />}
                <QuotesList isAdmin={isAdmin} />
              </div>
            </Suspense>
          </TabsContent>

          <TabsContent value="invoices">
            <Suspense fallback={<Spinner />}>
              <div className="space-y-6">
                {isAdmin && <InvoiceCreation />}
                <InvoicesList isAdmin={isAdmin} />
              </div>
            </Suspense>
          </TabsContent>

          <TabsContent value="contracts">
            <Suspense fallback={<Spinner />}>
              <ContractsManagement isAdmin={isAdmin} />
            </Suspense>
          </TabsContent>

          <TabsContent value="analytics">
            <Suspense fallback={<Spinner />}>
              <AnalyticsCharts />
            </Suspense>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="funds">
              <Suspense fallback={<Spinner />}>
                <FundsManagement isAdmin={isAdmin} />
              </Suspense>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="maintenance">
              <Suspense fallback={<Spinner />}>
                <MaintenanceManagement />
              </Suspense>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="investment">
              <Suspense fallback={<Spinner />}>
                <InvestmentFundManagement isAdmin={isAdmin} />
              </Suspense>
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="expenses">
              <Suspense fallback={<Spinner />}>
                <ExpensesManagement />
              </Suspense>
            </TabsContent>
          )}

          <TabsContent value="reports">
            <Suspense fallback={<Spinner />}>
              <ReportingSection />
            </Suspense>
          </TabsContent>

          <TabsContent value="monthly">
            <Suspense fallback={<Spinner />}>
              <MonthlyReports isAdmin={isAdmin} />
            </Suspense>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="settings">
              <Suspense fallback={<Spinner />}>
                <div className="space-y-6">
                  <PricingManagement />
                  <COGSSettings />
                </div>
              </Suspense>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} DroneWash Dashboard. Built with{' '}
            <span className="text-red-500">♥</span> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== 'undefined' ? window.location.hostname : 'dronewash'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>

      {/* Dialogs */}
      <Suspense fallback={null}>
        {showPreferences && (
          <UserPreferencesDialog
            open={showPreferences}
            onOpenChange={setShowPreferences}
          />
        )}
        {showBackupVersions && (
          <BackupVersionsDialog
            open={showBackupVersions}
            onOpenChange={setShowBackupVersions}
          />
        )}
      </Suspense>
    </div>
  );
}
