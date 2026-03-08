import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MonthlyReport {
    jobsCompleted: bigint;
    month: string;
    goalsAchieved: bigint;
    year: bigint;
    paidInvoices: bigint;
    vatCollected: number;
    totalExpenses: number;
    goalsMissed: bigint;
    pendingInvoices: bigint;
    totalRevenue: number;
    netProfit: number;
}
export interface JobRevenueEntry {
    revenue: number;
    clientName: string;
    date: bigint;
    jobId: bigint;
    sector: string;
}
export interface UserPreferences {
    metricFilters: Array<string>;
    preferredLayout: string;
    navigationPreferences: string;
    darkMode: boolean;
    displayPreferences: string;
}
export interface Job {
    id: bigint;
    customerInfo: CustomerInfo;
    revenue: number;
    clientName: string;
    date: bigint;
    costs: number;
    sector: string;
    cleanProfit: number;
}
export interface FundBalance {
    balance: number;
    name: string;
    fundId: bigint;
    recentTransactions: Array<FundTransaction>;
    fundType: FundType;
}
export interface Quote {
    id: bigint;
    customerInfo: CustomerInfo;
    finalPrice: number;
    volumeDiscount: number;
    date: bigint;
    town: string;
    sector: string;
    subSector?: string;
    grandTotal: number;
    addOns: Array<string>;
    vatAmount: number;
    basePrice: number;
    services: Array<Service>;
    nightService: boolean;
    chargeDescription: string;
}
export interface DroneWashDashboardInterface {
    addExpense(amount: number, category: string, date: bigint, additionalInfo: string): Promise<bigint>;
    addJob(revenue: number, date: bigint, sector: string, clientName: string, customerInfo: CustomerInfo, cleanProfit: number, costs: number): Promise<bigint>;
    addMaintenanceFundInflow(amount: number, description: string): Promise<bigint>;
    addMonthlyGoal(month: string, year: bigint, description: string, targetValue: number): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    backupData(): Promise<BackupData>;
    createContract(contractName: string, clientName: string, clientEmail: string, clientPhone: string, clientCompany: string, servicesCovered: Array<string>, areaTier: string, agreedPrices: Array<[string, number]>, contractStatus: string, startDate: bigint, endDate: bigint | null): Promise<bigint>;
    createFundWithInitialBalance(fundType: FundType, name: string, spendingLimit: number, approvalThreshold: number, initialBalance: number | null): Promise<bigint>;
    createInvoice(customerName: string, customerEmail: string, quoteId: bigint, totalAmount: number): Promise<bigint>;
    createQuote(sector: string, services: Array<Service>, basePrice: number, addOns: Array<string>, volumeDiscount: number, nightService: boolean, finalPrice: number, town: string, subSector: string | null, customerInfo: CustomerInfo, chargeDescription: string, vatAmount: number, grandTotal: number): Promise<bigint>;
    deleteContract(id: bigint): Promise<void>;
    deleteExpense(id: bigint): Promise<void>;
    deleteInvoice(id: bigint): Promise<void>;
    deleteJob(id: bigint): Promise<void>;
    deleteQuote(id: bigint): Promise<void>;
    getActiveContracts(): Promise<Array<Contract>>;
    getAllContracts(): Promise<Array<Contract>>;
    getAllExpenses(): Promise<Array<Expense>>;
    getAllInvoices(): Promise<Array<Invoice>>;
    getAllJobs(): Promise<Array<Job>>;
    getAllMonthlyGoals(): Promise<Array<MonthlyGoal>>;
    getAllQuotes(): Promise<Array<Quote>>;
    getAllServiceRates(): Promise<Array<[string, Array<[string, number]>]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getContract(id: bigint): Promise<Contract | null>;
    getContractByClientName(clientName: string): Promise<Contract | null>;
    getExpense(id: bigint): Promise<Expense | null>;
    getFinancialMetrics(): Promise<FinancialMetrics>;
    getFinancialMetricsDetailed(): Promise<FinancialMetricsDetailed>;
    getInternalQuoteView(id: bigint): Promise<InternalQuoteView>;
    getInvoice(id: bigint): Promise<Invoice | null>;
    getJob(id: bigint): Promise<Job | null>;
    getMaintenanceFundBalance(): Promise<number>;
    getMonthlyExpenses(): Promise<Array<[string, number]>>;
    getMonthlyGoalsByMonthYear(month: string, year: bigint): Promise<Array<MonthlyGoal>>;
    getMonthlyReport(month: string, year: bigint): Promise<MonthlyReport>;
    getMonthlyRevenue(): Promise<Array<[string, number]>>;
    getProfitProjection(): Promise<Array<[bigint, number]>>;
    getQuote(id: bigint): Promise<Quote | null>;
    getServiceRate(serviceType: string, areaTier: string): Promise<number>;
    getStandardizedServices(): Promise<Array<ServiceType>>;
    getUserPreferences(): Promise<UserPreferences | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    resetMaintenanceFund(): Promise<void>;
    safeResetMaintenanceFundWithCashout(): Promise<number>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveUserPreferences(preferences: UserPreferences): Promise<void>;
    setServiceRate(serviceType: string, areaTier: string, rate: number): Promise<void>;
    updateContract(id: bigint, contractName: string, clientName: string, clientEmail: string, clientPhone: string, clientCompany: string, servicesCovered: Array<string>, areaTier: string, agreedPrices: Array<[string, number]>, contractStatus: string, startDate: bigint, endDate: bigint | null): Promise<void>;
    updateExpense(id: bigint, amount: number, category: string, date: bigint, additionalInfo: string): Promise<void>;
    updateInvoice(id: bigint, customerName: string, customerEmail: string, quoteId: bigint, totalAmount: number, status: string): Promise<void>;
    updateInvoiceStatus(invoiceId: bigint, status: string): Promise<void>;
    updateJob(id: bigint, revenue: number, date: bigint, sector: string, clientName: string, customerInfo: CustomerInfo, cleanProfit: number, costs: number): Promise<void>;
    updateMonthlyGoal(id: bigint, achieved: boolean, actualValue: number): Promise<void>;
    updateQuote(id: bigint, sector: string, services: Array<Service>, basePrice: number, addOns: Array<string>, volumeDiscount: number, nightService: boolean, finalPrice: number, town: string, subSector: string | null, customerInfo: CustomerInfo, chargeDescription: string, vatAmount: number, grandTotal: number): Promise<void>;
}
export interface Contract {
    id: bigint;
    endDate?: bigint;
    clientName: string;
    createdBy: Principal;
    clientEmail: string;
    clientCompany: string;
    contractName: string;
    lastUpdated: bigint;
    agreedPrices: Array<[string, number]>;
    createdDate: bigint;
    clientPhone: string;
    areaTier: string;
    servicesCovered: Array<string>;
    contractStatus: string;
    startDate: bigint;
}
export interface ExpenseEntry {
    additionalInfo: string;
    expenseId: bigint;
    date: bigint;
    category: string;
    amount: number;
}
export interface MaintenanceFundLedger {
    id: bigint;
    transactionType: string;
    date: bigint;
    relatedJobId?: bigint;
    fundId: bigint;
    fundType: FundType;
    remainingBalance: number;
    relatedExpenseId?: bigint;
    amount: number;
    purpose: string;
}
export interface Service {
    serviceType: string;
    rate: number;
    quantity: number;
}
export interface MaintenanceFundStatus {
    balance: number;
    totalCollected: number;
    fundId?: bigint;
    totalSpent: number;
    recentEntries: Array<MaintenanceFundLedger>;
}
export interface Invoice {
    id: bigint;
    customerName: string;
    status: string;
    date: bigint;
    quoteId: bigint;
    totalAmount: number;
    customerEmail: string;
}
export interface FundTransaction {
    id: bigint;
    transactionType: string;
    date: bigint;
    description: string;
    relatedJobId?: bigint;
    fundId: bigint;
    fundType: FundType;
    remainingBalance: number;
    relatedExpenseId?: bigint;
    category: string;
    amount: number;
}
export interface FinancialMetricsDetailed {
    totalRevenueYTD: number;
    expenseBreakdown: Array<ExpenseEntry>;
    breakEvenProgress: number;
    investmentRemaining: number;
    revenueBreakdown: Array<JobRevenueEntry>;
    maintenanceFundStatus: MaintenanceFundStatus;
    fundBalances: Array<FundBalance>;
    netProfit: number;
}
export interface Expense {
    id: bigint;
    additionalInfo: string;
    date: bigint;
    category: string;
    amount: number;
}
export interface MonthlyGoal {
    id: bigint;
    month: string;
    achieved: boolean;
    year: bigint;
    description: string;
    actualValue: number;
    targetValue: number;
}
export interface BackupData {
    jobs: Array<Job>;
    expenses: Array<Expense>;
    userProfiles: Array<[Principal, UserProfile]>;
    contracts: Array<Contract>;
    serviceRates: Array<[string, Array<[string, number]>]>;
    timestamp: bigint;
    invoices: Array<Invoice>;
    quotes: Array<Quote>;
}
export interface CostBreakdown {
    revenue: number;
    cogs: number;
    additionalPilot: number;
    opEx: number;
    vanFuel: number;
    chemicals: number;
    profitMargin: number;
    generatorFuel: number;
}
export interface FinancialMetrics {
    totalRevenueYTD: number;
    breakEvenProgress: number;
    investmentRemaining: number;
    netProfit: number;
}
export interface CustomerInfo {
    additionalInfo: string;
    jobType: string;
    name: string;
    town: string;
    coordinates: string;
}
export interface InternalQuoteView {
    quote: Quote;
    costBreakdown: CostBreakdown;
}
export interface UserProfile {
    name: string;
    role: UserRole;
    email: string;
}
export enum FundType {
    main = "main",
    investment = "investment",
    maintenance = "maintenance",
    salaries = "salaries"
}
export enum ServiceType {
    windowCleaning = "windowCleaning",
    solarPanelCleaning = "solarPanelCleaning",
    facadeWallCleaning = "facadeWallCleaning",
    roofCleaning = "roofCleaning",
    fullBuildingCleaning = "fullBuildingCleaning"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface extends DroneWashDashboardInterface {
}
