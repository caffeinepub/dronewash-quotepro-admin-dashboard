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
export interface MaintenanceExpense {
    id: bigint;
    receiptUrl?: string;
    date: bigint;
    createdBy: Principal;
    partCategory: string;
    equipmentType: string;
    fundId: bigint;
    approvalDate?: bigint;
    fundType: FundType;
    approved: boolean;
    amount: number;
    purpose: string;
}
export interface FundTransfer {
    id: bigint;
    status: string;
    date: bigint;
    approvedBy?: Principal;
    sourceFundId: bigint;
    approvalDate?: bigint;
    destinationFundId: bigint;
    amount: number;
    requestedBy: Principal;
    reason: string;
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
export interface FundAnalytics {
    name: string;
    year: bigint;
    totalInflow: number;
    fundId: bigint;
    totalOutflow: number;
    fundType: FundType;
    monthlyTrends: Array<[string, number]>;
    netBalance: number;
    averageTransactionAmount: number;
    spendingByCategory: Array<[string, number]>;
    transactionCount: bigint;
}
export interface InvestmentFundTransaction {
    id: bigint;
    allocationType: string;
    transactionType: string;
    date: bigint;
    description: string;
    relatedJobId?: bigint;
    remainingBalance: number;
    relatedExpenseId?: bigint;
    amount: number;
}
export interface InvestmentFund {
    id: bigint;
    currentBalance: number;
    lastUpdated: bigint;
    createdDate: bigint;
    isActive: boolean;
    initialCapital: number;
    transactions: Array<InvestmentFundTransaction>;
}
export interface ExpenseEntry {
    additionalInfo: string;
    expenseId: bigint;
    date: bigint;
    category: string;
    amount: number;
}
export interface DroneWashDashboardInterface {
    addExpense(amount: number, category: string, date: bigint, additionalInfo: string): Promise<bigint>;
    addFundTransaction(fundId: bigint, amount: number, transactionType: string, description: string, category: string, relatedExpenseId: bigint | null, relatedJobId: bigint | null): Promise<bigint>;
    addGoal(description: string, targetMetrics: string, targetDate: bigint, milestoneTracking: string): Promise<bigint>;
    addInvestmentFundTransaction(amount: number, transactionType: string, description: string, allocationType: string, relatedExpenseId: bigint | null, relatedJobId: bigint | null): Promise<bigint>;
    addJob(revenue: number, date: bigint, sector: string, clientName: string, customerInfo: CustomerInfo, cleanProfit: number, costs: number): Promise<bigint>;
    addMaintenanceExpense(amount: number, purpose: string, equipmentType: string, partCategory: string, receiptUrl: string | null, fundId: bigint): Promise<bigint>;
    addMaintenanceFundLedgerEntry(amount: number, transactionType: string, purpose: string, fundId: bigint, relatedJobId: bigint | null, relatedExpenseId: bigint | null): Promise<bigint>;
    addMonthlyGoal(month: string, year: bigint, description: string, targetValue: number): Promise<bigint>;
    approveFundTransfer(id: bigint, approve: boolean): Promise<void>;
    approveMaintenanceExpense(id: bigint, approve: boolean): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    backupData(): Promise<BackupData>;
    createContract(contractName: string, clientName: string, clientEmail: string, clientPhone: string, clientCompany: string, servicesCovered: Array<string>, areaTier: string, agreedPrices: Array<[string, number]>, contractStatus: string, startDate: bigint, endDate: bigint | null): Promise<bigint>;
    createFund(fundType: FundType, name: string, initialBalance: number, spendingLimit: number, approvalThreshold: number): Promise<bigint>;
    createFundAlert(fundId: bigint, alertType: string, threshold: number, currentValue: number, message: string): Promise<bigint>;
    createFundTransfer(sourceFundId: bigint, destinationFundId: bigint, amount: number, reason: string): Promise<bigint>;
    createInvoice(customerName: string, customerEmail: string, quoteId: bigint, totalAmount: number): Promise<bigint>;
    createQuote(sector: string, services: Array<Service>, basePrice: number, addOns: Array<string>, volumeDiscount: number, nightService: boolean, finalPrice: number, town: string, subSector: string | null, customerInfo: CustomerInfo, chargeDescription: string, vatAmount: number, grandTotal: number): Promise<bigint>;
    deleteContract(id: bigint): Promise<void>;
    deleteExpense(id: bigint): Promise<void>;
    deleteFund(id: bigint): Promise<void>;
    deleteGoal(id: bigint): Promise<void>;
    deleteInvoice(id: bigint): Promise<void>;
    deleteJob(id: bigint): Promise<void>;
    deleteQuote(id: bigint): Promise<void>;
    getActiveContracts(): Promise<Array<Contract>>;
    getAllContracts(): Promise<Array<Contract>>;
    getAllExpenses(): Promise<Array<Expense>>;
    getAllFundAlerts(): Promise<Array<FundAlert>>;
    getAllFundReports(): Promise<Array<FundReport>>;
    getAllFundTransactions(): Promise<Array<FundTransaction>>;
    getAllFundTransfers(): Promise<Array<FundTransfer>>;
    getAllFunds(): Promise<Array<Fund>>;
    getAllGoals(): Promise<Array<Goal>>;
    getAllInvestmentFundTransactions(): Promise<Array<InvestmentFundTransaction>>;
    getAllInvoices(): Promise<Array<Invoice>>;
    getAllJobs(): Promise<Array<Job>>;
    getAllMaintenanceExpenses(): Promise<Array<MaintenanceExpense>>;
    getAllMaintenanceFundLedgerEntries(): Promise<Array<MaintenanceFundLedger>>;
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
    getFund(id: bigint): Promise<Fund | null>;
    getFundAlertsByFundId(fundId: bigint): Promise<Array<FundAlert>>;
    getFundAnalytics(fundId: bigint): Promise<FundAnalytics>;
    getFundReport(fundId: bigint): Promise<FundReport>;
    getFundTransactionsByFundId(fundId: bigint): Promise<Array<FundTransaction>>;
    getFundTransfer(id: bigint): Promise<FundTransfer | null>;
    getGoal(id: bigint): Promise<Goal | null>;
    getInternalQuoteView(id: bigint): Promise<InternalQuoteView>;
    getInvestmentFund(): Promise<InvestmentFund>;
    getInvoice(id: bigint): Promise<Invoice | null>;
    getJob(id: bigint): Promise<Job | null>;
    getMaintenanceExpense(id: bigint): Promise<MaintenanceExpense | null>;
    getMaintenanceFundLedgerEntriesByFundId(fundId: bigint): Promise<Array<MaintenanceFundLedger>>;
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
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveUserPreferences(preferences: UserPreferences): Promise<void>;
    setServiceRate(serviceType: string, areaTier: string, rate: number): Promise<void>;
    updateContract(id: bigint, contractName: string, clientName: string, clientEmail: string, clientPhone: string, clientCompany: string, servicesCovered: Array<string>, areaTier: string, agreedPrices: Array<[string, number]>, contractStatus: string, startDate: bigint, endDate: bigint | null): Promise<void>;
    updateExpense(id: bigint, amount: number, category: string, date: bigint, additionalInfo: string): Promise<void>;
    updateFund(id: bigint, name: string, balance: number, isActive: boolean, spendingLimit: number, approvalThreshold: number): Promise<void>;
    updateFundAlert(id: bigint, isActive: boolean): Promise<void>;
    updateGoal(id: bigint, achievementStatus: string, progress: number): Promise<void>;
    updateInvoice(id: bigint, customerName: string, customerEmail: string, quoteId: bigint, totalAmount: number, status: string): Promise<void>;
    updateInvoiceStatus(invoiceId: bigint, status: string): Promise<void>;
    updateJob(id: bigint, revenue: number, date: bigint, sector: string, clientName: string, customerInfo: CustomerInfo, cleanProfit: number, costs: number): Promise<void>;
    updateMonthlyGoal(id: bigint, achieved: boolean, actualValue: number): Promise<void>;
    updateQuote(id: bigint, sector: string, services: Array<Service>, basePrice: number, addOns: Array<string>, volumeDiscount: number, nightService: boolean, finalPrice: number, town: string, subSector: string | null, customerInfo: CustomerInfo, chargeDescription: string, vatAmount: number, grandTotal: number): Promise<void>;
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
export interface FundReport {
    balance: number;
    name: string;
    year: bigint;
    totalInflow: number;
    fundId: bigint;
    reportDate: bigint;
    totalOutflow: number;
    fundType: FundType;
    monthlyTrends: Array<[string, number]>;
    netBalance: number;
    spendingByCategory: Array<[string, number]>;
    transactionCount: bigint;
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
export interface FundAlert {
    id: bigint;
    alertType: string;
    threshold: number;
    createdDate: bigint;
    isActive: boolean;
    fundId: bigint;
    currentValue: number;
    fundType: FundType;
    message: string;
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
export interface Fund {
    id: bigint;
    balance: number;
    name: string;
    lastUpdated: bigint;
    createdDate: bigint;
    isActive: boolean;
    spendingLimit: number;
    fundType: FundType;
    approvalThreshold: number;
}
export interface UserProfile {
    name: string;
    role: UserRole;
    email: string;
}
export interface Goal {
    id: bigint;
    milestoneTracking: string;
    description: string;
    targetMetrics: string;
    achievementStatus: string;
    progress: number;
    targetDate: bigint;
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
