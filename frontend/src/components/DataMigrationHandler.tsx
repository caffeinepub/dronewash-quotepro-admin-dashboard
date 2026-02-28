import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAddJob, useAddExpense, useCreateQuote, useCreateInvoice, useAddMonthlyGoal } from '@/hooks/useQueries';

interface MigrationStatus {
  total: number;
  completed: number;
  failed: number;
  status: 'idle' | 'running' | 'done' | 'error';
  currentItem: string;
}

interface LegacyJob {
  revenue?: number;
  date?: string | number;
  sector?: string;
  clientName?: string;
  customerInfo?: {
    additionalInfo?: string;
    jobType?: string;
    name?: string;
    town?: string;
    coordinates?: string;
  };
  cleanProfit?: number;
  costs?: number;
}

interface LegacyExpense {
  amount?: number;
  category?: string;
  date?: string | number;
  additionalInfo?: string;
}

interface LegacyQuote {
  sector?: string;
  services?: Array<{ serviceType: string; rate: number; quantity: number }>;
  basePrice?: number;
  addOns?: string[];
  volumeDiscount?: number;
  nightService?: boolean;
  finalPrice?: number;
  town?: string;
  subSector?: string;
  customerInfo?: {
    additionalInfo?: string;
    jobType?: string;
    name?: string;
    town?: string;
    coordinates?: string;
  };
  chargeDescription?: string;
  vatAmount?: number;
  grandTotal?: number;
}

interface LegacyInvoice {
  customerName?: string;
  customerEmail?: string;
  quoteId?: number;
  totalAmount?: number;
}

interface LegacyGoal {
  month?: string;
  year?: number;
  description?: string;
  targetMetrics?: string;
  targetValue?: number;
  targetDate?: string;
  milestoneTracking?: string;
}

interface DataMigrationHandlerProps {
  onMigrationComplete?: () => void;
}

export default function DataMigrationHandler({ onMigrationComplete }: DataMigrationHandlerProps) {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({
    total: 0,
    completed: 0,
    failed: 0,
    status: 'idle',
    currentItem: '',
  });
  const [hasLegacyData, setHasLegacyData] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);

  const addJob = useAddJob();
  const addExpense = useAddExpense();
  const createQuote = useCreateQuote();
  const createInvoice = useCreateInvoice();
  const addGoal = useAddMonthlyGoal();

  useEffect(() => {
    checkForLegacyData();
  }, []);

  const checkForLegacyData = () => {
    const keys = ['jobs', 'expenses', 'quotes', 'invoices', 'goals'];
    const hasData = keys.some((key) => {
      const item = localStorage.getItem(key);
      if (!item) return false;
      try {
        const parsed = JSON.parse(item);
        return Array.isArray(parsed) && parsed.length > 0;
      } catch {
        return false;
      }
    });
    setHasLegacyData(hasData);
  };

  const getLegacyData = <T,>(key: string): T[] => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return [];
      const parsed = JSON.parse(item);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const toNanoseconds = (date: string | number | undefined): bigint => {
    if (!date) return BigInt(Date.now()) * BigInt(1_000_000);
    const ms = typeof date === 'string' ? new Date(date).getTime() : Number(date);
    return BigInt(isNaN(ms) ? Date.now() : ms) * BigInt(1_000_000);
  };

  const startMigration = async () => {
    const jobs = getLegacyData<LegacyJob>('jobs');
    const expenses = getLegacyData<LegacyExpense>('expenses');
    const quotes = getLegacyData<LegacyQuote>('quotes');
    const invoices = getLegacyData<LegacyInvoice>('invoices');
    const goals = getLegacyData<LegacyGoal>('goals');

    const total = jobs.length + expenses.length + quotes.length + invoices.length + goals.length;

    if (total === 0) {
      toast.info('No legacy data found to migrate.');
      return;
    }

    setMigrationStatus({ total, completed: 0, failed: 0, status: 'running', currentItem: '' });

    let completed = 0;
    let failed = 0;

    // Migrate jobs
    for (const job of jobs) {
      try {
        setMigrationStatus(prev => ({ ...prev, currentItem: `Job: ${job.clientName || 'Unknown'}` }));
        await addJob.mutateAsync({
          revenue: job.revenue ?? 0,
          date: toNanoseconds(job.date),
          sector: job.sector ?? 'Unknown',
          clientName: job.clientName ?? 'Unknown',
          customerInfo: {
            additionalInfo: job.customerInfo?.additionalInfo ?? '',
            jobType: job.customerInfo?.jobType ?? '',
            name: job.customerInfo?.name ?? job.clientName ?? '',
            town: job.customerInfo?.town ?? '',
            coordinates: job.customerInfo?.coordinates ?? '',
          },
          cleanProfit: job.cleanProfit ?? 0,
          costs: job.costs ?? 0,
        });
        completed++;
      } catch {
        failed++;
      }
      setMigrationStatus(prev => ({ ...prev, completed, failed }));
    }

    // Migrate expenses
    for (const expense of expenses) {
      try {
        setMigrationStatus(prev => ({ ...prev, currentItem: `Expense: ${expense.category || 'Unknown'}` }));
        await addExpense.mutateAsync({
          amount: expense.amount ?? 0,
          category: expense.category ?? 'Other',
          date: toNanoseconds(expense.date),
          additionalInfo: expense.additionalInfo ?? '',
        });
        completed++;
      } catch {
        failed++;
      }
      setMigrationStatus(prev => ({ ...prev, completed, failed }));
    }

    // Migrate quotes
    for (const quote of quotes) {
      try {
        setMigrationStatus(prev => ({ ...prev, currentItem: `Quote: ${quote.sector || 'Unknown'}` }));
        await createQuote.mutateAsync({
          sector: quote.sector ?? 'Unknown',
          services: quote.services ?? [],
          basePrice: quote.basePrice ?? 0,
          addOns: quote.addOns ?? [],
          volumeDiscount: quote.volumeDiscount ?? 0,
          nightService: quote.nightService ?? false,
          finalPrice: quote.finalPrice ?? 0,
          town: quote.town ?? '',
          subSector: quote.subSector ?? null,
          customerInfo: {
            additionalInfo: quote.customerInfo?.additionalInfo ?? '',
            jobType: quote.customerInfo?.jobType ?? '',
            name: quote.customerInfo?.name ?? '',
            town: quote.customerInfo?.town ?? quote.town ?? '',
            coordinates: quote.customerInfo?.coordinates ?? '',
          },
          chargeDescription: quote.chargeDescription ?? '',
          vatAmount: quote.vatAmount ?? 0,
          grandTotal: quote.grandTotal ?? 0,
        });
        completed++;
      } catch {
        failed++;
      }
      setMigrationStatus(prev => ({ ...prev, completed, failed }));
    }

    // Migrate invoices
    for (const invoice of invoices) {
      try {
        setMigrationStatus(prev => ({ ...prev, currentItem: `Invoice: ${invoice.customerName || 'Unknown'}` }));
        await createInvoice.mutateAsync({
          customerName: invoice.customerName ?? 'Unknown',
          customerEmail: invoice.customerEmail ?? '',
          quoteId: BigInt(invoice.quoteId ?? 0),
          totalAmount: invoice.totalAmount ?? 0,
        });
        completed++;
      } catch {
        failed++;
      }
      setMigrationStatus(prev => ({ ...prev, completed, failed }));
    }

    // Migrate goals
    for (const goal of goals) {
      try {
        setMigrationStatus(prev => ({ ...prev, currentItem: `Goal: ${goal.description || 'Unknown'}` }));
        await addGoal.mutateAsync({
          month: goal.month ?? 'January',
          year: goal.year ?? new Date().getFullYear(), // pass as number; hook converts to BigInt
          description: goal.description ?? '',
          targetValue: goal.targetValue ?? 0,
        });
        completed++;
      } catch {
        failed++;
      }
      setMigrationStatus(prev => ({ ...prev, completed, failed }));
    }

    const finalStatus = failed === 0 ? 'done' : completed > 0 ? 'done' : 'error';
    setMigrationStatus(prev => ({ ...prev, status: finalStatus, currentItem: '' }));
    setMigrationDone(true);

    if (completed > 0) {
      // Clear migrated localStorage keys
      ['jobs', 'expenses', 'quotes', 'invoices', 'goals'].forEach(key => {
        localStorage.removeItem(key);
      });
      toast.success(`Migration complete: ${completed} items migrated${failed > 0 ? `, ${failed} failed` : ''}.`);
    } else {
      toast.error('Migration failed. No items were migrated.');
    }
  };

  const handleDismiss = () => {
    onMigrationComplete?.();
  };

  if (!hasLegacyData && migrationStatus.status === 'idle') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-cyan-600" />
            Data Migration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {migrationStatus.status === 'idle' && (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Legacy data detected in your browser. Would you like to migrate it to the blockchain backend?
              </p>
              <div className="flex gap-3">
                <Button onClick={startMigration} className="flex-1">
                  Start Migration
                </Button>
                <Button variant="outline" onClick={handleDismiss}>
                  Skip
                </Button>
              </div>
            </>
          )}

          {migrationStatus.status === 'running' && (
            <>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Migrating: {migrationStatus.currentItem}</span>
              </div>
              <Progress
                value={migrationStatus.total > 0 ? (migrationStatus.completed / migrationStatus.total) * 100 : 0}
              />
              <p className="text-xs text-slate-500">
                {migrationStatus.completed} / {migrationStatus.total} items
                {migrationStatus.failed > 0 && ` (${migrationStatus.failed} failed)`}
              </p>
            </>
          )}

          {(migrationStatus.status === 'done' || migrationStatus.status === 'error') && (
            <>
              <div className="flex items-center gap-2">
                {migrationStatus.status === 'done' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {migrationStatus.status === 'done' ? 'Migration Complete' : 'Migration Failed'}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {migrationStatus.completed} items migrated successfully
                {migrationStatus.failed > 0 && `, ${migrationStatus.failed} items failed`}.
              </p>
              <Button onClick={handleDismiss} className="w-full">
                Continue to Dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
