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
  MonthlyReport,
  MonthlyGoal,
  CustomerInfo,
  Service,
  Contract,
  UserPreferences,
  InternalQuoteView,
  BackupData,
} from '../backend';
import { UserRole } from '../backend';

// Local interfaces for fund management types
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

export interface InvestmentFund {
  id: bigint;
  initialCapital: number;
  currentBalance: number;
  createdDate: bigint;
  lastUpdated: bigint;
  isActive: boolean;
  transactions: InvestmentFundTransaction[];
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
      queryClient.invalidateQueries({ queryKey: ['fundBalances'] });
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

export function useGetFundBalances() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['fundBalances'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const detailed = await actor.getFinancialMetricsDetailed();
      return detailed.fundBalances;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMaintenanceFundStatus() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['maintenanceFundStatus'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const detailed = await actor.getFinancialMetricsDetailed();
      return detailed.maintenanceFundStatus;
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Funds (virtual - derived from financial metrics) ────────────────────────

export function useAllFunds() {
  const { actor, isFetching } = useActor();
  return useQuery<Fund[]>({
    queryKey: ['allFunds'],
    queryFn: async () => {
      if (!actor) return [];
      const detailed = await actor.getFinancialMetricsDetailed();
      return detailed.fundBalances.map((fb) => ({
        id: fb.fundId,
        fundType: fb.fundType as string,
        name: fb.name,
        balance: fb.balance,
        createdDate: BigInt(0),
        lastUpdated: BigInt(0),
        isActive: true,
        spendingLimit: 100000,
        approvalThreshold: 5000,
      }));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllFundTransactions() {
  const { actor, isFetching } = useActor();
  return useQuery<FundTransaction[]>({
    queryKey: ['allFundTransactions'],
    queryFn: async () => {
      if (!actor) return [];
      const detailed = await actor.getFinancialMetricsDetailed();
      const txs: FundTransaction[] = [];
      for (const fb of detailed.fundBalances) {
        for (const tx of fb.recentTransactions) {
          txs.push({
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
            fundType: tx.fundType as string,
          });
        }
      }
      return txs;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllFundTransfers() {
  const { actor, isFetching } = useActor();
  return useQuery<FundTransfer[]>({
    queryKey: ['allFundTransfers'],
    queryFn: async () => {
      if (!actor) return [];
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllFundAlerts() {
  const { actor, isFetching } = useActor();
  return useQuery<FundAlert[]>({
    queryKey: ['allFundAlerts'],
    queryFn: async () => {
      if (!actor) return [];
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDeleteFund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_id: bigint) => {
      // Fund deletion is not directly supported; no-op
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allFunds'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
    },
  });
}

export function useUpdateFund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: Partial<Fund> & { id: bigint }) => {
      // Fund update is not directly supported; no-op
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allFunds'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
    },
  });
}

// ─── Monthly Revenue / Expenses ──────────────────────────────────────────────

export function useGetMonthlyRevenue() {
  const { actor, isFetching } = useActor();
  return useQuery<[string, number][]>({
    queryKey: ['monthlyRevenue'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMonthlyRevenue();
    },
    enabled: !!actor && !isFetching,
  });
}
export const useMonthlyRevenue = useGetMonthlyRevenue;

export function useGetMonthlyExpenses() {
  const { actor, isFetching } = useActor();
  return useQuery<[string, number][]>({
    queryKey: ['monthlyExpenses'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMonthlyExpenses();
    },
    enabled: !!actor && !isFetching,
  });
}
export const useMonthlyExpenses = useGetMonthlyExpenses;

export function useGetProfitProjection() {
  const { actor, isFetching } = useActor();
  return useQuery<[bigint, number][]>({
    queryKey: ['profitProjection'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProfitProjection();
    },
    enabled: !!actor && !isFetching,
  });
}
export const useProfitProjection = useGetProfitProjection;

// ─── Service Rates ───────────────────────────────────────────────────────────

export function useGetAllServiceRates() {
  const { actor, isFetching } = useActor();
  return useQuery<[string, [string, number][]][]>({
    queryKey: ['serviceRates'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllServiceRates();
    },
    enabled: !!actor && !isFetching,
  });
}
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

export function useGetMonthlyGoalsByMonthYear(month: string, year: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<MonthlyGoal[]>({
    queryKey: ['monthlyGoals', month, year.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMonthlyGoalsByMonthYear(month, year);
    },
    enabled: !!actor && !isFetching && !!month,
  });
}
export const useMonthlyGoalsByMonthYear = useGetMonthlyGoalsByMonthYear;

export function useAddMonthlyGoal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      month: string;
      year: bigint;
      description: string;
      targetValue: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addMonthlyGoal(params.month, params.year, params.description, params.targetValue);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyGoals'] });
    },
  });
}

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

export function useMonthlyReport(month: string, year: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<MonthlyReport>({
    queryKey: ['monthlyReport', month, year.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMonthlyReport(month, year);
    },
    enabled: !!actor && !isFetching && !!month,
  });
}

// ─── User Role ───────────────────────────────────────────────────────────────

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();
  return useQuery<UserRole>({
    queryKey: ['callerUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
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

// ─── Fund Management ─────────────────────────────────────────────────────────

export function useCreateFund() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: {
      fundType: string;
      name: string;
      spendingLimit: number;
      approvalThreshold: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allFunds'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
    },
  });
}

export function useAddFundTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_params: {
      fundId: bigint;
      amount: number;
      transactionType: string;
      description: string;
      category: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allFundTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
    },
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
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceFundStatus'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
      queryClient.invalidateQueries({ queryKey: ['fundBalances'] });
    },
  });
}

// ─── Maintenance Fund Reset ───────────────────────────────────────────────────

export function useResetMaintenanceFund() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.resetMaintenanceFund();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceFundStatus'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
      queryClient.invalidateQueries({ queryKey: ['fundBalances'] });
      queryClient.invalidateQueries({ queryKey: ['allExpenses'] });
    },
  });
}

// ─── Investment Fund ─────────────────────────────────────────────────────────

export function useGetInvestmentFund() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['investmentFund'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const detailed = await actor.getFinancialMetricsDetailed();
      const investmentFundBalance = detailed.fundBalances.find(
        (fb) => fb.fundType === 'investment'
      );
      return investmentFundBalance ?? null;
    },
    enabled: !!actor && !isFetching,
  });
}
export const useInvestmentFund = useGetInvestmentFund;

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
      return actor.addExpense(
        params.amount,
        params.allocationType || 'Investment',
        BigInt(Date.now()) * BigInt(1_000_000),
        params.description
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentFund'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
export const useAddInvestmentFundTransaction = useAddInvestmentTransaction;

// ─── Backup ──────────────────────────────────────────────────────────────────

export function useBackupData() {
  const { actor } = useActor();
  return useMutation<BackupData, Error, void>({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.backupData();
    },
  });
}

// Backup versions are stored in localStorage
export function getBackupVersions(): BackupVersion[] {
  try {
    const stored = localStorage.getItem('backupVersions');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((v: { id: string; timestamp: string; data: BackupData }) => ({
        ...v,
        timestamp: BigInt(v.timestamp),
      }));
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveBackupVersion(data: BackupData): BackupVersion {
  const version: BackupVersion = {
    id: `backup-${Date.now()}`,
    timestamp: data.timestamp,
    data,
  };
  const versions = getBackupVersions();
  versions.unshift(version);
  // Keep only last 10 backups
  const trimmed = versions.slice(0, 10);
  localStorage.setItem(
    'backupVersions',
    JSON.stringify(trimmed.map((v) => ({ ...v, timestamp: v.timestamp.toString() })))
  );
  return version;
}

export function deleteBackupVersion(id: string): void {
  const versions = getBackupVersions().filter((v) => v.id !== id);
  localStorage.setItem(
    'backupVersions',
    JSON.stringify(versions.map((v) => ({ ...v, timestamp: v.timestamp.toString() })))
  );
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export function useGetAllGoals() {
  const { actor, isFetching } = useActor();
  return useQuery<MonthlyGoal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMonthlyGoals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddGoal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      month: string;
      year: bigint;
      description: string;
      targetValue: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addMonthlyGoal(params.month, params.year, params.description, params.targetValue);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyGoals'] });
    },
  });
}

export function useUpdateGoal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: bigint; achieved: boolean; actualValue: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateMonthlyGoal(params.id, params.achieved, params.actualValue);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyGoals'] });
    },
  });
}

// ─── COGS Settings ───────────────────────────────────────────────────────────

export function useGetCOGSSettings() {
  return useQuery({
    queryKey: ['cogsSettings'],
    queryFn: async () => {
      const stored = localStorage.getItem('cogsSettings');
      if (stored) {
        return JSON.parse(stored);
      }
      return {
        vanFuelRates: {} as Record<string, number>,
        generatorFuelRate: 7,
        additionalPilotFee: 350,
        chemicalsCostPerHour: 0,
      };
    },
  });
}

export function useSaveCOGSSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: {
      vanFuelRates: Record<string, number>;
      generatorFuelRate: number;
      additionalPilotFee: number;
      chemicalsCostPerHour: number;
    }) => {
      localStorage.setItem('cogsSettings', JSON.stringify(settings));
      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cogsSettings'] });
    },
  });
}
