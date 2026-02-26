import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Job, Expense, Quote, Invoice, FinancialMetrics, FinancialMetricsDetailed, UserProfile, UserRole, BackupData, CustomerInfo, Service, MonthlyReport, MonthlyGoal, Fund, FundTransaction, FundTransfer, MaintenanceExpense, MaintenanceFundLedger, FundAlert, FundReport, FundAnalytics, FundType, InvestmentFund, Goal, UserPreferences, Contract } from '../backend';

// Configure default stale time (5 minutes) to prevent excessive refetching
const DEFAULT_STALE_TIME = 5 * 60 * 1000;
const METRICS_STALE_TIME = 2 * 60 * 1000; // 2 minutes for financial metrics

// Backup version storage interface
export interface BackupVersion {
  id: string;
  timestamp: number;
  data: BackupData;
  saveVersionId: string;
}

// BigInt serialization helpers
function bigIntReplacer(_key: string, value: any): any {
  if (typeof value === 'bigint') {
    return { __type: 'bigint', value: value.toString() };
  }
  return value;
}

function bigIntReviver(_key: string, value: any): any {
  if (value && typeof value === 'object' && value.__type === 'bigint') {
    return BigInt(value.value);
  }
  return value;
}

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Backend actor not available. Please check your connection.');
      try {
        return await actor.getCallerUserProfile();
      } catch (error) {
        if (error instanceof Error && error.message.includes('Unauthorized')) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: DEFAULT_STALE_TIME,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
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
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['userRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

// User Preferences
export function useGetUserPreferences() {
  const { actor, isFetching } = useActor();

  return useQuery<UserPreferences | null>({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserPreferences();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
  });
}

export function useSaveUserPreferences() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: UserPreferences) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.saveUserPreferences(preferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
  });
}

// Backup Data with Version Management
export function useBackupData() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (): Promise<BackupVersion> => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      const data = await actor.backupData();
      
      // Generate unique save version ID
      const saveVersionId = `SAVE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const backupVersion: BackupVersion = {
        id: saveVersionId,
        timestamp: Number(data.timestamp),
        data,
        saveVersionId,
      };

      // Store in localStorage for version history with BigInt serialization
      const existingBackups = getBackupVersions();
      const updatedBackups = [...existingBackups, backupVersion].slice(-20); // Keep last 20 backups
      
      try {
        const serialized = JSON.stringify(updatedBackups, bigIntReplacer);
        localStorage.setItem('backupVersions', serialized);
      } catch (error) {
        console.error('Failed to serialize backup:', error);
        throw new Error('Failed to save backup: Serialization error');
      }

      return backupVersion;
    },
  });
}

// Get all backup versions from localStorage
export function getBackupVersions(): BackupVersion[] {
  try {
    const stored = localStorage.getItem('backupVersions');
    if (!stored) return [];
    return JSON.parse(stored, bigIntReviver);
  } catch (error) {
    console.error('Failed to parse backup versions:', error);
    return [];
  }
}

// Delete a specific backup version
export function deleteBackupVersion(id: string): void {
  try {
    const versions = getBackupVersions();
    const filtered = versions.filter(v => v.id !== id);
    const serialized = JSON.stringify(filtered, bigIntReplacer);
    localStorage.setItem('backupVersions', serialized);
  } catch (error) {
    console.error('Failed to delete backup version:', error);
    throw new Error('Failed to delete backup version');
  }
}

// Service Rate Management
export function useAllServiceRates() {
  const { actor, isFetching } = useActor();

  return useQuery<[string, [string, number][]][]>({
    queryKey: ['serviceRates'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllServiceRates();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useSetServiceRate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceType, areaTier, rate }: { serviceType: string; areaTier: string; rate: number }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.setServiceRate(serviceType, areaTier, rate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceRates'] });
    },
  });
}

export function useGetServiceRate() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ serviceType, areaTier }: { serviceType: string; areaTier: string }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.getServiceRate(serviceType, areaTier);
    },
  });
}

// Financial Metrics with optimized caching
export function useFinancialMetrics() {
  const { actor, isFetching } = useActor();

  return useQuery<FinancialMetrics>({
    queryKey: ['financialMetrics'],
    queryFn: async () => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.getFinancialMetrics();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: METRICS_STALE_TIME,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

export function useGetFinancialMetricsDetailed() {
  const { actor, isFetching } = useActor();

  return useQuery<FinancialMetricsDetailed>({
    queryKey: ['financialMetricsDetailed'],
    queryFn: async () => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.getFinancialMetricsDetailed();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: METRICS_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

// Jobs with optimized invalidation
export function useAllJobs() {
  const { actor, isFetching } = useActor();

  return useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllJobs();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useAddJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      revenue, 
      date, 
      sector, 
      clientName, 
      customerInfo,
      cleanProfit,
      costs,
    }: { 
      revenue: number; 
      date: bigint; 
      sector: string; 
      clientName: string; 
      customerInfo: CustomerInfo;
      cleanProfit: number;
      costs: number;
    }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.addJob(revenue, date, sector, clientName, customerInfo, cleanProfit, costs);
    },
    onSuccess: () => {
      // Batch invalidations for better performance
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyRevenue'] });
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      queryClient.invalidateQueries({ queryKey: ['fundTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceFundLedger'] });
    },
  });
}

export function useUpdateJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      revenue, 
      date, 
      sector, 
      clientName, 
      customerInfo,
      cleanProfit,
      costs,
    }: { 
      id: bigint; 
      revenue: number; 
      date: bigint; 
      sector: string; 
      clientName: string; 
      customerInfo: CustomerInfo;
      cleanProfit: number;
      costs: number;
    }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.updateJob(id, revenue, date, sector, clientName, customerInfo, cleanProfit, costs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyRevenue'] });
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceFundLedger'] });
    },
  });
}

export function useDeleteJob() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.deleteJob(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyRevenue'] });
    },
  });
}

// Expenses
export function useAllExpenses() {
  const { actor, isFetching } = useActor();

  return useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllExpenses();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useAddExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, category, date, additionalInfo }: { amount: number; category: string; date: bigint; additionalInfo: string }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.addExpense(amount, category, date, additionalInfo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyExpenses'] });
    },
  });
}

export function useUpdateExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, amount, category, date, additionalInfo }: { id: bigint; amount: number; category: string; date: bigint; additionalInfo: string }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.updateExpense(id, amount, category, date, additionalInfo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyExpenses'] });
    },
  });
}

export function useDeleteExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.deleteExpense(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyExpenses'] });
    },
  });
}

// Quotes
export function useAllQuotes() {
  const { actor, isFetching } = useActor();

  return useQuery<Quote[]>({
    queryKey: ['quotes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllQuotes();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useCreateQuote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sector,
      services,
      basePrice,
      addOns,
      volumeDiscount,
      nightService,
      finalPrice,
      town,
      subSector,
      customerInfo,
      chargeDescription,
      vatAmount,
      grandTotal,
    }: {
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
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.createQuote(sector, services, basePrice, addOns, volumeDiscount, nightService, finalPrice, town, subSector, customerInfo, chargeDescription, vatAmount, grandTotal);
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
    mutationFn: async ({
      id,
      sector,
      services,
      basePrice,
      addOns,
      volumeDiscount,
      nightService,
      finalPrice,
      town,
      subSector,
      customerInfo,
      chargeDescription,
      vatAmount,
      grandTotal,
    }: {
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
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.updateQuote(id, sector, services, basePrice, addOns, volumeDiscount, nightService, finalPrice, town, subSector, customerInfo, chargeDescription, vatAmount, grandTotal);
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
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.deleteQuote(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

// Invoices
export function useAllInvoices() {
  const { actor, isFetching } = useActor();

  return useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllInvoices();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useCreateInvoice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerName,
      customerEmail,
      quoteId,
      totalAmount,
    }: {
      customerName: string;
      customerEmail: string;
      quoteId: bigint;
      totalAmount: number;
    }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.createInvoice(customerName, customerEmail, quoteId, totalAmount);
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
    mutationFn: async ({
      id,
      customerName,
      customerEmail,
      quoteId,
      totalAmount,
      status,
    }: {
      id: bigint;
      customerName: string;
      customerEmail: string;
      quoteId: bigint;
      totalAmount: number;
      status: string;
    }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.updateInvoice(id, customerName, customerEmail, quoteId, totalAmount, status);
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
    mutationFn: async ({ invoiceId, status }: { invoiceId: bigint; status: string }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.updateInvoiceStatus(invoiceId, status);
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
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.deleteInvoice(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

// Contracts
export function useAllContracts() {
  const { actor, isFetching } = useActor();

  return useQuery<Contract[]>({
    queryKey: ['contracts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllContracts();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useGetContract(id: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Contract | null>({
    queryKey: ['contract', id?.toString()],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getContract(id);
    },
    enabled: !!actor && !isFetching && !!id,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
  });
}

export function useGetContractByClientName(clientName: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Contract | null>({
    queryKey: ['contractByClient', clientName],
    queryFn: async () => {
      if (!actor || !clientName) return null;
      return actor.getContractByClientName(clientName);
    },
    enabled: !!actor && !isFetching && !!clientName,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
  });
}

export function useCreateContract() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractName,
      clientName,
      clientEmail,
      clientPhone,
      clientCompany,
      servicesCovered,
      areaTier,
      agreedPrices,
      contractStatus,
      startDate,
      endDate,
    }: {
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
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.createContract(contractName, clientName, clientEmail, clientPhone, clientCompany, servicesCovered, areaTier, agreedPrices, contractStatus, startDate, endDate);
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
    mutationFn: async ({
      id,
      contractName,
      clientName,
      clientEmail,
      clientPhone,
      clientCompany,
      servicesCovered,
      areaTier,
      agreedPrices,
      contractStatus,
      startDate,
      endDate,
    }: {
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
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.updateContract(id, contractName, clientName, clientEmail, clientPhone, clientCompany, servicesCovered, areaTier, agreedPrices, contractStatus, startDate, endDate);
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
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.deleteContract(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

// Analytics with optimized caching
export function useMonthlyRevenue() {
  const { actor, isFetching } = useActor();

  return useQuery<[string, number][]>({
    queryKey: ['monthlyRevenue'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMonthlyRevenue();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: METRICS_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useMonthlyExpenses() {
  const { actor, isFetching } = useActor();

  return useQuery<[string, number][]>({
    queryKey: ['monthlyExpenses'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMonthlyExpenses();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: METRICS_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useProfitProjection() {
  const { actor, isFetching } = useActor();

  return useQuery<[bigint, number][]>({
    queryKey: ['profitProjection'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProfitProjection();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

// Monthly Reports
export function useMonthlyReport(month: string, year: number) {
  const { actor, isFetching } = useActor();

  return useQuery<MonthlyReport>({
    queryKey: ['monthlyReport', month, year],
    queryFn: async () => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.getMonthlyReport(month, BigInt(year));
    },
    enabled: !!actor && !isFetching && !!month && !!year,
    retry: 3,
    staleTime: METRICS_STALE_TIME,
  });
}

// Monthly Goals
export function useAllMonthlyGoals() {
  const { actor, isFetching } = useActor();

  return useQuery<MonthlyGoal[]>({
    queryKey: ['monthlyGoals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMonthlyGoals();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useMonthlyGoalsByMonthYear(month: string, year: number) {
  const { actor, isFetching } = useActor();

  return useQuery<MonthlyGoal[]>({
    queryKey: ['monthlyGoals', month, year],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMonthlyGoalsByMonthYear(month, BigInt(year));
    },
    enabled: !!actor && !isFetching && !!month && !!year,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
  });
}

export function useAddMonthlyGoal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ month, year, description, targetValue }: { month: string; year: number; description: string; targetValue: number }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.addMonthlyGoal(month, BigInt(year), description, targetValue);
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
    mutationFn: async ({ id, achieved, actualValue }: { id: bigint; achieved: boolean; actualValue: number }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.updateMonthlyGoal(id, achieved, actualValue);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyGoals'] });
    },
  });
}

// Goals Management
export function useAllGoals() {
  const { actor, isFetching } = useActor();

  return useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllGoals();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useAddGoal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ description, targetMetrics, targetDate, milestoneTracking }: { description: string; targetMetrics: string; targetDate: bigint; milestoneTracking: string }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.addGoal(description, targetMetrics, targetDate, milestoneTracking);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useUpdateGoal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, achievementStatus, progress }: { id: bigint; achievementStatus: string; progress: number }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.updateGoal(id, achievementStatus, progress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useDeleteGoal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.deleteGoal(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

// Investment Fund Management
export function useInvestmentFund() {
  const { actor, isFetching } = useActor();

  return useQuery<InvestmentFund>({
    queryKey: ['investmentFund'],
    queryFn: async () => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.getInvestmentFund();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useAddInvestmentFundTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, transactionType, description, allocationType, relatedExpenseId, relatedJobId }: { amount: number; transactionType: string; description: string; allocationType: string; relatedExpenseId: bigint | null; relatedJobId: bigint | null }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.addInvestmentFundTransaction(amount, transactionType, description, allocationType, relatedExpenseId, relatedJobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investmentFund'] });
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
    },
  });
}

// Fund Management
export function useAllFunds() {
  const { actor, isFetching } = useActor();

  return useQuery<Fund[]>({
    queryKey: ['funds'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFunds();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useCreateFund() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fundType, name, initialBalance, spendingLimit, approvalThreshold }: { fundType: FundType; name: string; initialBalance: number; spendingLimit: number; approvalThreshold: number }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.createFund(fundType, name, initialBalance, spendingLimit, approvalThreshold);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
    },
  });
}

export function useUpdateFund() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, balance, isActive, spendingLimit, approvalThreshold }: { id: bigint; name: string; balance: number; isActive: boolean; spendingLimit: number; approvalThreshold: number }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.updateFund(id, name, balance, isActive, spendingLimit, approvalThreshold);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
    },
  });
}

export function useDeleteFund() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.deleteFund(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
    },
  });
}

// Fund Transactions
export function useAllFundTransactions() {
  const { actor, isFetching } = useActor();

  return useQuery<FundTransaction[]>({
    queryKey: ['fundTransactions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFundTransactions();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useFundTransactionsByFundId(fundId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<FundTransaction[]>({
    queryKey: ['fundTransactions', fundId?.toString()],
    queryFn: async () => {
      if (!actor || !fundId) return [];
      return actor.getFundTransactionsByFundId(fundId);
    },
    enabled: !!actor && !isFetching && !!fundId,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
  });
}

export function useAddFundTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fundId, amount, transactionType, description, category, relatedExpenseId, relatedJobId }: { fundId: bigint; amount: number; transactionType: string; description: string; category: string; relatedExpenseId: bigint | null; relatedJobId: bigint | null }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.addFundTransaction(fundId, amount, transactionType, description, category, relatedExpenseId, relatedJobId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fundTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
    },
  });
}

// Fund Transfers
export function useAllFundTransfers() {
  const { actor, isFetching } = useActor();

  return useQuery<FundTransfer[]>({
    queryKey: ['fundTransfers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFundTransfers();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useCreateFundTransfer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sourceFundId, destinationFundId, amount, reason }: { sourceFundId: bigint; destinationFundId: bigint; amount: number; reason: string }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.createFundTransfer(sourceFundId, destinationFundId, amount, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fundTransfers'] });
      queryClient.invalidateQueries({ queryKey: ['funds'] });
    },
  });
}

export function useApproveFundTransfer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, approve }: { id: bigint; approve: boolean }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.approveFundTransfer(id, approve);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fundTransfers'] });
      queryClient.invalidateQueries({ queryKey: ['funds'] });
    },
  });
}

// Maintenance Expenses
export function useAllMaintenanceExpenses() {
  const { actor, isFetching } = useActor();

  return useQuery<MaintenanceExpense[]>({
    queryKey: ['maintenanceExpenses'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMaintenanceExpenses();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useAddMaintenanceExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, purpose, equipmentType, partCategory, receiptUrl, fundId }: { amount: number; purpose: string; equipmentType: string; partCategory: string; receiptUrl: string | null; fundId: bigint }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.addMaintenanceExpense(amount, purpose, equipmentType, partCategory, receiptUrl, fundId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceExpenses'] });
    },
  });
}

export function useApproveMaintenanceExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, approve }: { id: bigint; approve: boolean }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.approveMaintenanceExpense(id, approve);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceExpenses'] });
    },
  });
}

// Maintenance Fund Ledger
export function useAllMaintenanceFundLedgerEntries() {
  const { actor, isFetching } = useActor();

  return useQuery<MaintenanceFundLedger[]>({
    queryKey: ['maintenanceFundLedger'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMaintenanceFundLedgerEntries();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useMaintenanceFundLedgerEntriesByFundId(fundId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<MaintenanceFundLedger[]>({
    queryKey: ['maintenanceFundLedger', fundId?.toString()],
    queryFn: async () => {
      if (!actor || !fundId) return [];
      return actor.getMaintenanceFundLedgerEntriesByFundId(fundId);
    },
    enabled: !!actor && !isFetching && !!fundId,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
  });
}

export function useAddMaintenanceFundLedgerEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, transactionType, purpose, fundId, relatedJobId, relatedExpenseId }: { amount: number; transactionType: string; purpose: string; fundId: bigint; relatedJobId: bigint | null; relatedExpenseId: bigint | null }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.addMaintenanceFundLedgerEntry(amount, transactionType, purpose, fundId, relatedJobId, relatedExpenseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceFundLedger'] });
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetricsDetailed'] });
    },
  });
}

// Fund Analytics
export function useFundAnalytics(fundId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<FundAnalytics>({
    queryKey: ['fundAnalytics', fundId?.toString()],
    queryFn: async () => {
      if (!actor || !fundId) throw new Error('Backend actor or fundId not available');
      return actor.getFundAnalytics(fundId);
    },
    enabled: !!actor && !isFetching && !!fundId,
    retry: 3,
    staleTime: METRICS_STALE_TIME,
  });
}

export function useAllFundReports() {
  const { actor, isFetching } = useActor();

  return useQuery<FundReport[]>({
    queryKey: ['fundReports'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFundReports();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: METRICS_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

// Fund Alerts
export function useAllFundAlerts() {
  const { actor, isFetching } = useActor();

  return useQuery<FundAlert[]>({
    queryKey: ['fundAlerts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFundAlerts();
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useFundAlertsByFundId(fundId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<FundAlert[]>({
    queryKey: ['fundAlerts', fundId?.toString()],
    queryFn: async () => {
      if (!actor || !fundId) return [];
      return actor.getFundAlertsByFundId(fundId);
    },
    enabled: !!actor && !isFetching && !!fundId,
    retry: 3,
    staleTime: DEFAULT_STALE_TIME,
  });
}

export function useCreateFundAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fundId, alertType, threshold, currentValue, message }: { fundId: bigint; alertType: string; threshold: number; currentValue: number; message: string }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.createFundAlert(fundId, alertType, threshold, currentValue, message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fundAlerts'] });
    },
  });
}

export function useUpdateFundAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: bigint; isActive: boolean }) => {
      if (!actor) throw new Error('Backend actor not initialized. Please check your connection.');
      return actor.updateFundAlert(id, isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fundAlerts'] });
    },
  });
}
