import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Database, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAddJob, useAddExpense, useCreateQuote, useCreateInvoice, useAddGoal } from '@/hooks/useQueries';
import type { CustomerInfo, Service } from '../backend';

interface DataMigrationHandlerProps {
  onComplete: () => void;
}

interface MigrationStatus {
  total: number;
  completed: number;
  failed: number;
  currentItem: string;
}

export default function DataMigrationHandler({ onComplete }: DataMigrationHandlerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [status, setStatus] = useState<MigrationStatus>({
    total: 0,
    completed: 0,
    failed: 0,
    currentItem: '',
  });
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const { mutateAsync: addJob } = useAddJob();
  const { mutateAsync: addExpense } = useAddExpense();
  const { mutateAsync: createQuote } = useCreateQuote();
  const { mutateAsync: createInvoice } = useCreateInvoice();
  const { mutateAsync: addGoal } = useAddGoal();

  useEffect(() => {
    // Count total items to migrate
    const total = countLocalStorageItems();
    setStatus(prev => ({ ...prev, total }));
  }, []);

  const countLocalStorageItems = (): number => {
    let count = 0;
    const keys = ['jobs', 'expenses', 'quotes', 'invoices', 'goals'];
    keys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            count += parsed.length;
          }
        } catch {
          // Ignore parse errors
        }
      }
    });
    return count;
  };

  const migrateData = async () => {
    setIsMigrating(true);
    const newErrors: string[] = [];

    try {
      // Migrate Jobs
      const jobsData = localStorage.getItem('jobs');
      if (jobsData) {
        try {
          const jobs = JSON.parse(jobsData);
          if (Array.isArray(jobs)) {
            for (const job of jobs) {
              setStatus(prev => ({ ...prev, currentItem: `Migrating job: ${job.clientName || 'Unknown'}` }));
              try {
                const customerInfo: CustomerInfo = {
                  name: job.customerInfo?.name || '',
                  coordinates: job.customerInfo?.coordinates || '',
                  town: job.customerInfo?.town || '',
                  jobType: job.customerInfo?.jobType || '',
                  additionalInfo: job.customerInfo?.additionalInfo || '',
                };
                await addJob({
                  revenue: job.revenue || 0,
                  date: BigInt(job.date || Date.now() * 1000000),
                  sector: job.sector || 'Commercial',
                  clientName: job.clientName || 'Unknown',
                  customerInfo,
                  cleanProfit: job.cleanProfit || 0,
                  costs: job.costs || 0,
                });
                setStatus(prev => ({ ...prev, completed: prev.completed + 1 }));
              } catch (error) {
                newErrors.push(`Failed to migrate job: ${error instanceof Error ? error.message : 'Unknown error'}`);
                setStatus(prev => ({ ...prev, failed: prev.failed + 1 }));
              }
            }
          }
        } catch (error) {
          newErrors.push(`Failed to parse jobs data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Migrate Expenses
      const expensesData = localStorage.getItem('expenses');
      if (expensesData) {
        try {
          const expenses = JSON.parse(expensesData);
          if (Array.isArray(expenses)) {
            for (const expense of expenses) {
              setStatus(prev => ({ ...prev, currentItem: `Migrating expense: ${expense.category || 'Unknown'}` }));
              try {
                await addExpense({
                  amount: expense.amount || 0,
                  category: expense.category || 'Other',
                  date: BigInt(expense.date || Date.now() * 1000000),
                  additionalInfo: expense.additionalInfo || '',
                });
                setStatus(prev => ({ ...prev, completed: prev.completed + 1 }));
              } catch (error) {
                newErrors.push(`Failed to migrate expense: ${error instanceof Error ? error.message : 'Unknown error'}`);
                setStatus(prev => ({ ...prev, failed: prev.failed + 1 }));
              }
            }
          }
        } catch (error) {
          newErrors.push(`Failed to parse expenses data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Migrate Quotes
      const quotesData = localStorage.getItem('quotes');
      if (quotesData) {
        try {
          const quotes = JSON.parse(quotesData);
          if (Array.isArray(quotes)) {
            for (const quote of quotes) {
              setStatus(prev => ({ ...prev, currentItem: `Migrating quote: ${quote.customerInfo?.name || 'Unknown'}` }));
              try {
                const services: Service[] = quote.services || [];
                const customerInfo: CustomerInfo = {
                  name: quote.customerInfo?.name || '',
                  coordinates: quote.customerInfo?.coordinates || '',
                  town: quote.customerInfo?.town || '',
                  jobType: quote.customerInfo?.jobType || '',
                  additionalInfo: quote.customerInfo?.additionalInfo || '',
                };
                await createQuote({
                  sector: quote.sector || 'Commercial',
                  services,
                  basePrice: quote.basePrice || 0,
                  addOns: quote.addOns || [],
                  volumeDiscount: quote.volumeDiscount || 0,
                  nightService: quote.nightService || false,
                  finalPrice: quote.finalPrice || 0,
                  town: quote.town || 'Limassol',
                  subSector: quote.subSector || null,
                  customerInfo,
                  chargeDescription: quote.chargeDescription || '',
                  vatAmount: quote.vatAmount || 0,
                  grandTotal: quote.grandTotal || 0,
                });
                setStatus(prev => ({ ...prev, completed: prev.completed + 1 }));
              } catch (error) {
                newErrors.push(`Failed to migrate quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
                setStatus(prev => ({ ...prev, failed: prev.failed + 1 }));
              }
            }
          }
        } catch (error) {
          newErrors.push(`Failed to parse quotes data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Migrate Invoices
      const invoicesData = localStorage.getItem('invoices');
      if (invoicesData) {
        try {
          const invoices = JSON.parse(invoicesData);
          if (Array.isArray(invoices)) {
            for (const invoice of invoices) {
              setStatus(prev => ({ ...prev, currentItem: `Migrating invoice: ${invoice.customerName || 'Unknown'}` }));
              try {
                await createInvoice({
                  customerName: invoice.customerName || 'Unknown',
                  customerEmail: invoice.customerEmail || '',
                  quoteId: BigInt(invoice.quoteId || 0),
                  totalAmount: invoice.totalAmount || 0,
                });
                setStatus(prev => ({ ...prev, completed: prev.completed + 1 }));
              } catch (error) {
                newErrors.push(`Failed to migrate invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
                setStatus(prev => ({ ...prev, failed: prev.failed + 1 }));
              }
            }
          }
        } catch (error) {
          newErrors.push(`Failed to parse invoices data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Migrate Goals
      const goalsData = localStorage.getItem('goals');
      if (goalsData) {
        try {
          const goals = JSON.parse(goalsData);
          if (Array.isArray(goals)) {
            for (const goal of goals) {
              setStatus(prev => ({ ...prev, currentItem: `Migrating goal: ${goal.description || 'Unknown'}` }));
              try {
                await addGoal({
                  description: goal.description || '',
                  targetMetrics: goal.targetMetrics || '',
                  targetDate: BigInt(goal.targetDate || Date.now() * 1000000),
                  milestoneTracking: goal.milestoneTracking || '',
                });
                setStatus(prev => ({ ...prev, completed: prev.completed + 1 }));
              } catch (error) {
                newErrors.push(`Failed to migrate goal: ${error instanceof Error ? error.message : 'Unknown error'}`);
                setStatus(prev => ({ ...prev, failed: prev.failed + 1 }));
              }
            }
          }
        } catch (error) {
          newErrors.push(`Failed to parse goals data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setErrors(newErrors);
      setMigrationComplete(true);

      // Clear localStorage after successful migration
      if (newErrors.length === 0) {
        ['jobs', 'expenses', 'quotes', 'invoices', 'goals'].forEach(key => {
          localStorage.removeItem(key);
        });
        toast.success('Data migration completed successfully!', {
          description: `${status.completed} items migrated to the blockchain.`,
        });
      } else {
        toast.warning('Data migration completed with errors', {
          description: `${status.completed} items migrated, ${newErrors.length} failed.`,
        });
      }
    } catch (error) {
      toast.error('Data migration failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleClose = () => {
    if (migrationComplete || !isMigrating) {
      setIsOpen(false);
      onComplete();
    }
  };

  const handleSkip = () => {
    // Clear localStorage without migrating
    ['jobs', 'expenses', 'quotes', 'invoices', 'goals'].forEach(key => {
      localStorage.removeItem(key);
    });
    toast.info('Data migration skipped', {
      description: 'Local data has been cleared.',
    });
    handleClose();
  };

  if (status.total === 0) {
    return null;
  }

  const progress = status.total > 0 ? ((status.completed + status.failed) / status.total) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-cyan-600" />
            Data Migration
          </DialogTitle>
          <DialogDescription>
            We found {status.total} item{status.total !== 1 ? 's' : ''} in local storage that can be migrated to the blockchain for permanent storage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isMigrating && !migrationComplete && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will transfer your local data to the Internet Computer blockchain, ensuring it's permanently stored and accessible from any device.
              </AlertDescription>
            </Alert>
          )}

          {isMigrating && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{status.currentItem}</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-slate-500">
                <span>Progress: {status.completed + status.failed} / {status.total}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          )}

          {migrationComplete && (
            <div className="space-y-3">
              <Alert className={errors.length === 0 ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}>
                {errors.length === 0 ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-900">
                      Migration completed successfully! All {status.completed} items have been transferred to the blockchain.
                    </AlertDescription>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-900">
                      Migration completed with {errors.length} error{errors.length !== 1 ? 's' : ''}. {status.completed} items were successfully migrated.
                    </AlertDescription>
                  </>
                )}
              </Alert>

              {errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-md border bg-slate-50 p-2">
                  <p className="text-xs font-semibold text-slate-700 mb-1">Errors:</p>
                  {errors.map((error, index) => (
                    <p key={index} className="text-xs text-red-600 mb-1">{error}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {!isMigrating && !migrationComplete && (
              <>
                <Button onClick={migrateData} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                  <Database className="h-4 w-4 mr-2" />
                  Migrate Data
                </Button>
                <Button onClick={handleSkip} variant="outline" className="flex-1">
                  Skip
                </Button>
              </>
            )}
            {migrationComplete && (
              <Button onClick={handleClose} className="w-full">
                Continue to Dashboard
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
