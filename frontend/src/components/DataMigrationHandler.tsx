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
      setMigrationStatus((prev) => ({ ...prev, currentItem: `Job: ${job.clientName || 'Unknown'}` }));
      try {
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
      setMigrationStatus((prev) => ({ ...prev, completed, failed }));
    }

    // Migrate expenses
    for (const expense of expenses) {
      setMigrationStatus((prev) => ({ ...prev, currentItem: `Expense: ${expense.category || 'Unknown'}` }));
      try {
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
      setMigrationStatus((prev) => ({ ...prev, completed, failed }));
    }

    // Migrate quotes
    for (const quote of quotes) {
      setMigrationStatus((prev) => ({ ...prev, currentItem: `Quote: ${quote.sector || 'Unknown'}` }));
      try {
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
            town: quote.customerInfo?.town ?? '',
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
      setMigrationStatus((prev) => ({ ...prev, completed, failed }));
    }

    // Migrate invoices
    for (const invoice of invoices) {
      setMigrationStatus((prev) => ({ ...prev, currentItem: `Invoice: ${invoice.customerName || 'Unknown'}` }));
      try {
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
      setMigrationStatus((prev) => ({ ...prev, completed, failed }));
    }

    // Migrate goals
    for (const goal of goals) {
      setMigrationStatus((prev) => ({ ...prev, currentItem: `Goal: ${goal.description || 'Unknown'}` }));
      try {
        // Encode extra fields into description since backend only supports description + targetValue
        const fullDescription = [
          goal.description ?? '',
          goal.targetMetrics ? `[Metrics: ${goal.targetMetrics}]` : '',
          goal.targetDate ? `[Target Date: ${goal.targetDate}]` : '',
          goal.milestoneTracking ? `[Milestones: ${goal.milestoneTracking}]` : '',
        ]
          .filter(Boolean)
          .join(' ');

        await addGoal.mutateAsync({
          month: goal.month ?? 'January',
          year: BigInt(goal.year ?? new Date().getFullYear()),
          description: fullDescription,
          targetValue: goal.targetValue ?? 0,
        });
        completed++;
      } catch {
        failed++;
      }
      setMigrationStatus((prev) => ({ ...prev, completed, failed }));
    }

    const finalStatus = failed === 0 ? 'done' : 'error';
    setMigrationStatus((prev) => ({ ...prev, status: finalStatus, currentItem: '' }));

    if (failed === 0) {
      toast.success(`Migration complete! ${completed} records migrated successfully.`);
      // Clear legacy data
      ['jobs', 'expenses', 'quotes', 'invoices', 'goals'].forEach((key) =>
        localStorage.removeItem(key)
      );
      setHasLegacyData(false);
      setMigrationDone(true);
      onMigrationComplete?.();
    } else {
      toast.warning(`Migration completed with ${failed} errors. ${completed} records migrated.`);
    }
  };

  if (migrationDone || !hasLegacyData) return null;

  const progress =
    migrationStatus.total > 0
      ? Math.round((migrationStatus.completed / migrationStatus.total) * 100)
      : 0;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Legacy Data Migration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Local data from a previous session was detected. Migrate it to the blockchain backend to
          preserve your records.
        </p>

        {migrationStatus.status === 'running' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{migrationStatus.currentItem}</span>
              <span className="font-medium">
                {migrationStatus.completed}/{migrationStatus.total}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {migrationStatus.status === 'done' && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            Migration completed successfully!
          </div>
        )}

        {migrationStatus.status === 'error' && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            Migration completed with {migrationStatus.failed} errors.
          </div>
        )}

        {migrationStatus.status === 'idle' && (
          <Button onClick={startMigration} size="sm" className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            Start Migration
          </Button>
        )}

        {migrationStatus.status === 'running' && (
          <Button disabled size="sm" className="w-full">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Migrating...
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
