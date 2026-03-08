import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  Job,
  Expense,
  Quote,
  Invoice,
  UserProfile,
  FinancialMetrics,
  FinancialMetricsDetailed,
  MaintenanceFundStatus,
  FundTransaction as BackendFundTransaction,
  Contract,
  UserPreferences,
  CustomerInfo,
  Service,
  MonthlyGoal,
  BackupData,
  InternalQuoteView,
} from '../backend';
import { UserRole } from '../backend';

// ─── Local interfaces ────────────────────────────────────────────────────────

export interface Fund {
  id: bigint;
  fundType: string;
  name: string;
  balance: number;
  createdDate: bigint;
  lastUpdated: bigint;
  isActive: boolean;
  spendingLimit: number;
  approvalThreshold: number;
}

export interface FundTransaction {
  id: bigint;
  fundId: bigint;
  amount: number;
  transactionType: string;
  date: bigint;
  description: string;
  category: string;
  remainingBalance: number;
  relatedExpenseId?: bigint;
  relatedJobId?: bigint;
  fundType: string;
}

export interface FundTransfer {
  id: bigint;
  sourceFundId: bigint;
  destinationFundId: bigint;
  amount: number;
  date: bigint;
  reason: string;
  status: string;
  requestedBy: string;
  approvedBy?: string;
  approvalDate?: bigint;
}

export interface FundAlert {
  id: bigint;
  fundId: bigint;
  fundType: string;
  alertType: string;
  threshold: number;
  currentValue: number;
  message: string;
  createdDate: bigint;
  isActive: boolean;
}

export interface MaintenanceExpense {
  id: bigint;
  amount: number;
  date: bigint;
  purpose: string;
  equipmentType: string;
  partCategory: string;
  receiptUrl?: string;
  fundId: bigint;
  fundType: string;
  approved: boolean;
  approvalDate?: bigint;
  createdBy: string;
}

export interface InvestmentFundTransaction {
  id: bigint;
  amount: number;
  transactionType: string;
  date: bigint;
  description: string;
  allocationType: string;
  remainingBalance: number;
  relatedExpenseId?: bigint;
  relatedJobId?: bigint;
}

export interface InvestmentFundData {
  id: bigint;
  balance: number;
  recentTransactions: InvestmentFundTransaction[];
}

export interface Goal {
  id: bigint;
  description: string;
  targetMetrics: string;
  targetDate: bigint;
  milestoneTracking: string;
  achievementStatus: string;
  progress: number;
}

export interface BackupVersion {
  id: string;
  timestamp: bigint;
  data: BackupData;
}

// ─── Backup localStorage helpers ─────────────────────────────────────────────

export function getBackupVersions(): BackupVersion[] {
  try {
    const raw = localStorage.getItem('droneWashBackupVersions');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((v: { id: string; timestamp: string; data: BackupData }) => ({
      ...v,
      timestamp: BigInt(v.timestamp),
    }));
  } catch {
    return [];
  }
}

export function deleteBackupVersion(id: string): void {
  try {
    const versions = getBackupVersions();
    const filtered = versions.filter((v) => v.id !== id);
    localStorage.setItem(
      'droneWashBackupVersions',
      JSON.stringify(
        filtered.map((v) => ({ ...v, timestamp: v.timestamp.toString() }))
      )
    );
  } catch {
    // ignore
  }
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

export function useGetAllJobs() {
  const { actor, isFetching } = useActor();
  return useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllJobs();
    },
    enabled: !!actor && !isFetching,
  });
}
// Alias
export const useAllJobs = useGetAllJobs;

export function useAddJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      revenue: number;
      date: bigint;
      sector: string;
      clientName: string;
      customerInfo: CustomerInfo;
      cleanProfit: number;
      costs: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addJob(
        params.revenue,
        params.date,
        params.sector,
        params.clientName,
        params.customerInfo,
        params.cleanProfit,
        params.costs
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceFundStatus'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceFundBalance'] });
    },
  });
}

export function useUpdateJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      revenue: number;
      date: bigint;
      sector: string;
      clientName: string;
      customerInfo: CustomerInfo;
      cleanProfit: number;
      costs: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateJob(
        params.id,
        params.revenue,
        params.date,
        params.sector,
        params.clientName,
        params.customerInfo,
        params.cleanProfit,
        params.costs
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceFundStatus'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceFundBalance'] });
    },
  });
}

export function useDeleteJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteJob(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceFundStatus'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceFundBalance'] });
    },
  });
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export function useGetAllExpenses() {
  const { actor, isFetching } = useActor();
  return useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllExpenses();
    },
    enabled: !!actor && !isFetching,
  });
}
// Alias
export const useAllExpenses = useGetAllExpenses;

export function useAddExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      amount: number;
      category: string;
      date: bigint;
      additionalInfo: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addExpense(params.amount, params.category, params.date, params.additionalInfo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
    },
  });
}

export function useUpdateExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      amount: number;
      category: string;
      date: bigint;
      additionalInfo: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateExpense(params.id, params.amount, params.category, params.date, params.additionalInfo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
    },
  });
}

export function useDeleteExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteExpense(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
    },
  });
}

// ─── Quotes ──────────────────────────────────────────────────────────────────

export function useGetAllQuotes() {
  const { actor, isFetching } = useActor();
  return useQuery<Quote[]>({
    queryKey: ['quotes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllQuotes();
    },
    enabled: !!actor && !isFetching,
  });
}
// Alias
export const useAllQuotes = useGetAllQuotes;

export function useCreateQuote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      sector: string;
      services: Service[];
      basePrice: number;
      addOns: string[];
      volumeDiscount: number;
      nightService: boolean;
      finalPrice: number;
      town: string;
      subSector: string | null;
      customerInfo: CustomerInfo;
      chargeDescription: string;
      vatAmount: number;
      grandTotal: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createQuote(
        params.sector,
        params.services,
        params.basePrice,
        params.addOns,
        params.volumeDiscount,
        params.nightService,
        params.finalPrice,
        params.town,
        params.subSector,
        params.customerInfo,
        params.chargeDescription,
        params.vatAmount,
        params.grandTotal
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useUpdateQuote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      sector: string;
      services: Service[];
      basePrice: number;
      addOns: string[];
      volumeDiscount: number;
      nightService: boolean;
      finalPrice: number;
      town: string;
      subSector: string | null;
      customerInfo: CustomerInfo;
      chargeDescription: string;
      vatAmount: number;
      grandTotal: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateQuote(
        params.id,
        params.sector,
        params.services,
        params.basePrice,
        params.addOns,
        params.volumeDiscount,
        params.nightService,
        params.finalPrice,
        params.town,
        params.subSector,
        params.customerInfo,
        params.chargeDescription,
        params.vatAmount,
        params.grandTotal
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useDeleteQuote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteQuote(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useGetInternalQuoteView() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (id: bigint): Promise<InternalQuoteView> => {
      if (!actor) throw new Error('Actor not available');
      return actor.getInternalQuoteView(id);
    },
  });
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export function useGetAllInvoices() {
  const { actor, isFetching } = useActor();
  return useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllInvoices();
    },
    enabled: !!actor && !isFetching,
  });
}
// Alias
export const useAllInvoices = useGetAllInvoices;

export function useCreateInvoice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      customerName: string;
      customerEmail: string;
      quoteId: bigint;
      totalAmount: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createInvoice(
        params.customerName,
        params.customerEmail,
        params.quoteId,
        params.totalAmount
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useUpdateInvoice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      customerName: string;
      customerEmail: string;
      quoteId: bigint;
      totalAmount: number;
      status: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateInvoice(
        params.id,
        params.customerName,
        params.customerEmail,
        params.quoteId,
        params.totalAmount,
        params.status
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { invoiceId: bigint; status: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateInvoiceStatus(params.invoiceId, params.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useDeleteInvoice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteInvoice(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

// ─── Financial Metrics ───────────────────────────────────────────────────────

export function useGetFinancialMetrics() {
  const { actor, isFetching } = useActor();
  return useQuery<FinancialMetrics>({
    queryKey: ['financialMetrics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getFinancialMetrics();
    },
    enabled: !!actor && !isFetching,
  });
}
// Alias
export const useFinancialMetrics = useGetFinancialMetrics;

export function useGetFinancialMetricsDetailed() {
  const { actor, isFetching } = useActor();
  return useQuery<FinancialMetricsDetailed>({
    queryKey: ['financialMetricsDetailed'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getFinancialMetricsDetailed();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Maintenance Fund ────────────────────────────────────────────────────────

/**
 * Single canonical source for the Maintenance Fund balance.
 * Uses actor.getMaintenanceFundBalance() which is computed from the ledger.
 * Both Dashboard (FinancialMetrics) and MaintenanceManagement use this same key.
 */
export function useGetMaintenanceFundBalance() {
  const { actor, isFetching } = useActor();
  return useQuery<number>({
    queryKey: ['maintenanceFundBalance'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMaintenanceFundBalance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMaintenanceFundStatus() {
  const { actor, isFetching } = useActor();
  return useQuery<MaintenanceFundStatus>({
    queryKey: ['maintenanceFundStatus'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const detailed = await actor.getFinancialMetricsDetailed();
      return detailed.maintenanceFundStatus;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddMaintenanceExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      amount: number;
      category: string;
      date: bigint;
      additionalInfo: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addExpense(params.amount, params.category, params.date, params.additionalInfo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceFundStatus'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceFundBalance'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useAddMaintenanceFundInflow() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { amount: number; description: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addMaintenanceFundInflow(params.amount, params.description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceFundStatus'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceFundBalance'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
    },
  });
}

export function useResetMaintenanceFund() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.resetMaintenanceFund();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceFundStatus'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceFundBalance'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
    },
  });
}

// ─── Funds ───────────────────────────────────────────────────────────────────

export function useGetAllFunds() {
  const { actor, isFetching } = useActor();
  return useQuery<Fund[]>({
    queryKey: ['funds'],
    queryFn: async () => {
      if (!actor) return [];
      const detailed = await actor.getFinancialMetricsDetailed();
      return detailed.fundBalances.map((fb) => ({
        id: fb.fundId,
        fundType: typeof fb.fundType === 'object' ? Object.keys(fb.fundType)[0] : String(fb.fundType),
        name: fb.name,
        balance: fb.balance,
        createdDate: BigInt(0),
        lastUpdated: BigInt(0),
        isActive: true,
        spendingLimit: 0,
        approvalThreshold: 0,
      }));
    },
    enabled: !!actor && !isFetching,
  });
}
// Alias
export const useAllFunds = useGetAllFunds;

export function useGetFundTransactions() {
  const { actor, isFetching } = useActor();
  return useQuery<FundTransaction[]>({
    queryKey: ['fundTransactions'],
    queryFn: async () => {
      if (!actor) return [];
      const detailed = await actor.getFinancialMetricsDetailed();
      const allTransactions: FundTransaction[] = [];
      for (const fb of detailed.fundBalances) {
        for (const tx of fb.recentTransactions) {
          allTransactions.push({
            id: tx.id,
            fundId: tx.fundId,
            amount: tx.amount,
            transactionType: tx.transactionType,
            date: tx.date,
            description: tx.description,
            category: tx.category,
            remainingBalance: tx.remainingBalance,
            relatedExpenseId: tx.relatedExpenseId ?? undefined,
            relatedJobId: tx.relatedJobId ?? undefined,
            fundType: typeof tx.fundType === 'object' ? Object.keys(tx.fundType)[0] : String(tx.fundType),
          });
        }
      }
      return allTransactions;
    },
    enabled: !!actor && !isFetching,
  });
}
// Alias
export const useAllFundTransactions = useGetFundTransactions;

/** Stub — backend has no fund transfers endpoint; returns empty array */
export function useGetAllFundTransfers() {
  return useQuery<FundTransfer[]>({
    queryKey: ['fundTransfers'],
    queryFn: async () => [],
  });
}
// Alias
export const useAllFundTransfers = useGetAllFundTransfers;

/** Stub — backend has no fund alerts endpoint; returns empty array */
export function useGetAllFundAlerts() {
  return useQuery<FundAlert[]>({
    queryKey: ['fundAlerts'],
    queryFn: async () => [],
  });
}
// Alias
export const useAllFundAlerts = useGetAllFundAlerts;

export function useCreateFund() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      fundType: string;
      name: string;
      spendingLimit: number;
      approvalThreshold: number;
      initialBalance?: number | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const fundTypeObj = { [params.fundType]: null } as any;
      return actor.createFundWithInitialBalance(
        fundTypeObj,
        params.name,
        params.spendingLimit,
        params.approvalThreshold,
        params.initialBalance ?? null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
      queryClient.invalidateQueries({ queryKey: ['fundTransactions'] });
    },
  });
}

export function useUpdateFund() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      fundType: string;
      name: string;
      spendingLimit: number;
      approvalThreshold: number;
      isActive: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // Backend does not expose a direct fund-update endpoint.
      // Re-create with same settings as a best-effort update (no-op for now).
      throw new Error('Direct fund update is not supported by the backend');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
    },
  });
}

/** Stub — backend has no delete-fund endpoint */
export function useDeleteFund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_id: bigint) => {
      throw new Error('Delete fund is not supported by the backend');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
    },
  });
}

export function useAddFundTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      fundId: bigint;
      amount: number;
      transactionType: string;
      description: string;
      category: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addMaintenanceFundInflow(params.amount, params.description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      queryClient.invalidateQueries({ queryKey: ['fundTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceFundStatus'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceFundBalance'] });
    },
  });
}

// ─── Investment Fund ─────────────────────────────────────────────────────────

export function useGetInvestmentFund() {
  const { actor, isFetching } = useActor();
  return useQuery<InvestmentFundData | null>({
    queryKey: ['investmentFund'],
    queryFn: async () => {
      if (!actor) return null;
      const detailed = await actor.getFinancialMetricsDetailed();
      const investmentFundBalance = detailed.fundBalances.find((fb) => {
        const ft = typeof fb.fundType === 'object' ? Object.keys(fb.fundType)[0] : String(fb.fundType);
        return ft === 'investment';
      });
      if (!investmentFundBalance) return null;
      return {
        id: investmentFundBalance.fundId,
        balance: investmentFundBalance.balance,
        recentTransactions: investmentFundBalance.recentTransactions.map((tx) => ({
          id: tx.id,
          amount: tx.amount,
          transactionType: tx.transactionType,
          date: tx.date,
          description: tx.description,
          allocationType: tx.category,
          remainingBalance: tx.remainingBalance,
          relatedExpenseId: tx.relatedExpenseId ?? undefined,
          relatedJobId: tx.relatedJobId ?? undefined,
        })),
      };
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddInvestmentTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      amount: number;
      transactionType: string;
      description: string;
      allocationType: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addMaintenanceFundInflow(params.amount, params.description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentFund'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
    },
  });
}

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();
  return useQuery<string>({
    queryKey: ['callerUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── User Preferences ────────────────────────────────────────────────────────

export function useGetUserPreferences() {
  const { actor, isFetching } = useActor();
  return useQuery<UserPreferences | null>({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserPreferences();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveUserPreferences() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (preferences: UserPreferences) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveUserPreferences(preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
  });
}

// ─── Service Rates ───────────────────────────────────────────────────────────

export function useGetAllServiceRates() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, Array<[string, number]>]>>({
    queryKey: ['serviceRates'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllServiceRates();
    },
    enabled: !!actor && !isFetching,
  });
}
// Alias
export const useAllServiceRates = useGetAllServiceRates;

export function useSetServiceRate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { serviceType: string; areaTier: string; rate: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setServiceRate(params.serviceType, params.areaTier, params.rate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceRates'] });
    },
  });
}

// ─── Monthly Goals ───────────────────────────────────────────────────────────

export function useGetAllMonthlyGoals() {
  const { actor, isFetching } = useActor();
  return useQuery<MonthlyGoal[]>({
    queryKey: ['monthlyGoals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMonthlyGoals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMonthlyGoalsByMonthYear(month: string, year: number) {
  const { actor, isFetching } = useActor();
  return useQuery<MonthlyGoal[]>({
    queryKey: ['monthlyGoals', month, year],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMonthlyGoalsByMonthYear(month, BigInt(year));
    },
    enabled: !!actor && !isFetching,
  });
}
// Alias
export const useMonthlyGoalsByMonthYear = useGetMonthlyGoalsByMonthYear;

export function useAddGoal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      month: string;
      year: number;
      description: string;
      targetValue: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addMonthlyGoal(params.month, BigInt(params.year), params.description, params.targetValue);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyGoals'] });
    },
  });
}
// Alias
export const useAddMonthlyGoal = useAddGoal;

export function useUpdateMonthlyGoal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: bigint; achieved: boolean; actualValue: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateMonthlyGoal(params.id, params.achieved, params.actualValue);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyGoals'] });
    },
  });
}

// ─── Monthly Report ──────────────────────────────────────────────────────────

export function useMonthlyReport(month: string, year: number) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['monthlyReport', month, year],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMonthlyReport(month, BigInt(year));
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Contracts ───────────────────────────────────────────────────────────────

export function useGetAllContracts() {
  const { actor, isFetching } = useActor();
  return useQuery<Contract[]>({
    queryKey: ['contracts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllContracts();
    },
    enabled: !!actor && !isFetching,
  });
}
// Alias
export const useAllContracts = useGetAllContracts;

export function useCreateContract() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      contractName: string;
      clientName: string;
      clientEmail: string;
      clientPhone: string;
      clientCompany: string;
      servicesCovered: string[];
      areaTier: string;
      agreedPrices: [string, number][];
      contractStatus: string;
      startDate: bigint;
      endDate: bigint | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createContract(
        params.contractName,
        params.clientName,
        params.clientEmail,
        params.clientPhone,
        params.clientCompany,
        params.servicesCovered,
        params.areaTier,
        params.agreedPrices,
        params.contractStatus,
        params.startDate,
        params.endDate
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

export function useUpdateContract() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      contractName: string;
      clientName: string;
      clientEmail: string;
      clientPhone: string;
      clientCompany: string;
      servicesCovered: string[];
      areaTier: string;
      agreedPrices: [string, number][];
      contractStatus: string;
      startDate: bigint;
      endDate: bigint | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateContract(
        params.id,
        params.contractName,
        params.clientName,
        params.clientEmail,
        params.clientPhone,
        params.clientCompany,
        params.servicesCovered,
        params.areaTier,
        params.agreedPrices,
        params.contractStatus,
        params.startDate,
        params.endDate
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

export function useDeleteContract() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteContract(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

// ─── Backup ──────────────────────────────────────────────────────────────────

export function useBackupData() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (): Promise<BackupData> => {
      if (!actor) throw new Error('Actor not available');
      return actor.backupData();
    },
  });
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export function useGetMonthlyRevenue() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, number]>>({
    queryKey: ['monthlyRevenue'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMonthlyRevenue();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMonthlyExpenses() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, number]>>({
    queryKey: ['monthlyExpenses'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMonthlyExpenses();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProfitProjection() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[bigint, number]>>({
    queryKey: ['profitProjection'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProfitProjection();
    },
    enabled: !!actor && !isFetching,
  });
}
