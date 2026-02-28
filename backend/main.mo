import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Float "mo:base/Float";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Int "mo:base/Int";
import List "mo:base/List";

import AccessControl "authorization/access-control";
import Migration "migration";

import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

(with migration = Migration.run)
persistent actor class DroneWashDashboard() {
  public type CustomerInfo = {
    name : Text;
    coordinates : Text;
    town : Text;
    jobType : Text;
    additionalInfo : Text;
  };

  public type Job = {
    id : Nat;
    revenue : Float;
    date : Int;
    sector : Text;
    clientName : Text;
    customerInfo : CustomerInfo;
    cleanProfit : Float;
    costs : Float;
  };

  public type Expense = {
    id : Nat;
    amount : Float;
    category : Text;
    date : Int;
    additionalInfo : Text;
  };

  public type Service = {
    serviceType : Text;
    rate : Float;
    quantity : Float;
  };

  public type Quote = {
    id : Nat;
    sector : Text;
    services : [Service];
    basePrice : Float;
    addOns : [Text];
    volumeDiscount : Float;
    nightService : Bool;
    finalPrice : Float;
    date : Int;
    town : Text;
    subSector : ?Text;
    customerInfo : CustomerInfo;
    chargeDescription : Text;
    vatAmount : Float;
    grandTotal : Float;
  };

  public type Invoice = {
    id : Nat;
    customerName : Text;
    customerEmail : Text;
    quoteId : Nat;
    totalAmount : Float;
    date : Int;
    status : Text;
  };

  public type FinancialMetrics = {
    investmentRemaining : Float;
    totalRevenueYTD : Float;
    breakEvenProgress : Float;
    netProfit : Float;
  };

  public type FinancialMetricsDetailed = {
    investmentRemaining : Float;
    totalRevenueYTD : Float;
    breakEvenProgress : Float;
    netProfit : Float;
    revenueBreakdown : [JobRevenueEntry];
    expenseBreakdown : [ExpenseEntry];
    fundBalances : [FundBalance];
    maintenanceFundStatus : MaintenanceFundStatus;
  };

  public type JobRevenueEntry = {
    jobId : Nat;
    clientName : Text;
    revenue : Float;
    date : Int;
    sector : Text;
  };

  public type ExpenseEntry = {
    expenseId : Nat;
    amount : Float;
    category : Text;
    date : Int;
    additionalInfo : Text;
  };

  public type FundBalance = {
    fundId : Nat;
    fundType : FundType;
    name : Text;
    balance : Float;
    recentTransactions : [FundTransaction];
  };

  public type MaintenanceFundStatus = {
    fundId : ?Nat;
    balance : Float;
    totalCollected : Float;
    totalSpent : Float;
    recentEntries : [MaintenanceFundLedger];
  };

  public type UserProfile = {
    name : Text;
    email : Text;
    role : AccessControl.UserRole;
  };

  public type BackupData = {
    jobs : [Job];
    expenses : [Expense];
    quotes : [Quote];
    invoices : [Invoice];
    userProfiles : [(Principal, UserProfile)];
    serviceRates : [(Text, [(Text, Float)])];
    contracts : [Contract];
    timestamp : Int;
  };

  public type ServiceType = {
    #facadeWallCleaning;
    #fullBuildingCleaning;
    #roofCleaning;
    #solarPanelCleaning;
    #windowCleaning;
  };

  public type StandardizedService = {
    serviceType : ServiceType;
    rate : Float;
    quantity : Float;
  };

  public type AreaTier = {
    #tier1;
    #tier2;
    #tier3;
    #tier4;
  };

  public type ServiceRate = {
    serviceType : ServiceType;
    areaTier : AreaTier;
    rate : Float;
  };

  public type MonthlyReport = {
    month : Text;
    year : Nat;
    totalRevenue : Float;
    totalExpenses : Float;
    netProfit : Float;
    jobsCompleted : Nat;
    pendingInvoices : Nat;
    paidInvoices : Nat;
    vatCollected : Float;
    goalsAchieved : Nat;
    goalsMissed : Nat;
  };

  public type MonthlyGoal = {
    id : Nat;
    month : Text;
    year : Nat;
    description : Text;
    targetValue : Float;
    achieved : Bool;
    actualValue : Float;
  };

  public type InvestmentRecord = {
    id : Nat;
    startAmount : Float;
    remainingBalance : Float;
    startDate : Int;
    completionDate : ?Int;
    isArchived : Bool;
    totalExpenses : Float;
    finalStatus : Text;
  };

  public type FundType = {
    #main;
    #maintenance;
    #salaries;
    #investment;
  };

  public type Fund = {
    id : Nat;
    fundType : FundType;
    name : Text;
    balance : Float;
    createdDate : Int;
    lastUpdated : Int;
    isActive : Bool;
    spendingLimit : Float;
    approvalThreshold : Float;
  };

  public type FundTransaction = {
    id : Nat;
    fundId : Nat;
    amount : Float;
    transactionType : Text;
    date : Int;
    description : Text;
    category : Text;
    remainingBalance : Float;
    relatedExpenseId : ?Nat;
    relatedJobId : ?Nat;
    fundType : FundType;
  };

  public type FundTransfer = {
    id : Nat;
    sourceFundId : Nat;
    destinationFundId : Nat;
    amount : Float;
    date : Int;
    reason : Text;
    status : Text;
    requestedBy : Principal;
    approvedBy : ?Principal;
    approvalDate : ?Int;
  };

  public type MaintenanceExpense = {
    id : Nat;
    amount : Float;
    date : Int;
    purpose : Text;
    equipmentType : Text;
    partCategory : Text;
    receiptUrl : ?Text;
    fundId : Nat;
    fundType : FundType;
    approved : Bool;
    approvalDate : ?Int;
    createdBy : Principal;
  };

  public type MaintenanceFundLedger = {
    id : Nat;
    date : Int;
    amount : Float;
    transactionType : Text;
    purpose : Text;
    remainingBalance : Float;
    relatedJobId : ?Nat;
    relatedExpenseId : ?Nat;
    fundId : Nat;
    fundType : FundType;
  };

  public type FundAnalytics = {
    fundId : Nat;
    fundType : FundType;
    name : Text;
    totalInflow : Float;
    totalOutflow : Float;
    netBalance : Float;
    transactionCount : Nat;
    averageTransactionAmount : Float;
    spendingByCategory : [(Text, Float)];
    monthlyTrends : [(Text, Float)];
    year : Nat;
  };

  public type FundReport = {
    fundId : Nat;
    fundType : FundType;
    name : Text;
    balance : Float;
    totalInflow : Float;
    totalOutflow : Float;
    netBalance : Float;
    transactionCount : Nat;
    spendingByCategory : [(Text, Float)];
    monthlyTrends : [(Text, Float)];
    year : Nat;
    reportDate : Int;
  };

  public type FundAlert = {
    id : Nat;
    fundId : Nat;
    fundType : FundType;
    alertType : Text;
    threshold : Float;
    currentValue : Float;
    message : Text;
    createdDate : Int;
    isActive : Bool;
  };

  public type FundConfig = {
    fundType : FundType;
    name : Text;
    spendingLimit : Float;
    approvalThreshold : Float;
    isActive : Bool;
  };

  public type FundTransferRequest = {
    sourceFundId : Nat;
    destinationFundId : Nat;
    amount : Float;
    reason : Text;
  };

  public type FundSummary = {
    fundId : Nat;
    fundType : FundType;
    name : Text;
    balance : Float;
    totalInflow : Float;
    totalOutflow : Float;
    netBalance : Float;
    transactionCount : Nat;
  };

  public type FundTransactionHistory = {
    fundId : Nat;
    fundType : FundType;
    name : Text;
    transactions : [FundTransaction];
    balance : Float;
    totalInflow : Float;
    totalOutflow : Float;
    netBalance : Float;
  };

  public type FundTransferHistory = {
    fundId : Nat;
    fundType : FundType;
    name : Text;
    transfers : [FundTransfer];
    balance : Float;
    totalInflow : Float;
    totalOutflow : Float;
    netBalance : Float;
  };

  public type FundBalanceTrend = {
    fundId : Nat;
    fundType : FundType;
    name : Text;
    monthlyBalances : [(Text, Float)];
    year : Nat;
  };

  public type FundSpendingAnalysis = {
    fundId : Nat;
    fundType : FundType;
    name : Text;
    spendingByCategory : [(Text, Float)];
    monthlyTrends : [(Text, Float)];
    year : Nat;
  };

  public type FundApprovalWorkflow = {
    fundId : Nat;
    fundType : FundType;
    name : Text;
    approvalThreshold : Float;
    spendingLimit : Float;
    approvalRequired : Bool;
  };

  public type FundDashboardData = {
    fundSummaries : [FundSummary];
    fundAnalytics : [FundAnalytics];
    fundAlerts : [FundAlert];
    fundReports : [FundReport];
    fundBalanceTrends : [FundBalanceTrend];
    fundSpendingAnalysis : [FundSpendingAnalysis];
    fundApprovalWorkflows : [FundApprovalWorkflow];
  };

  public type CostBreakdown = {
    cogs : Float;
    opEx : Float;
    revenue : Float;
    profitMargin : Float;
    vanFuel : Float;
    generatorFuel : Float;
    additionalPilot : Float;
    chemicals : Float;
  };

  public type InternalQuoteView = {
    quote : Quote;
    costBreakdown : CostBreakdown;
  };

  public type InvestmentFundTransaction = {
    id : Nat;
    amount : Float;
    transactionType : Text;
    date : Int;
    description : Text;
    allocationType : Text;
    remainingBalance : Float;
    relatedExpenseId : ?Nat;
    relatedJobId : ?Nat;
  };

  public type InvestmentFund = {
    id : Nat;
    initialCapital : Float;
    currentBalance : Float;
    createdDate : Int;
    lastUpdated : Int;
    isActive : Bool;
    transactions : [InvestmentFundTransaction];
  };

  public type Goal = {
    id : Nat;
    description : Text;
    targetMetrics : Text;
    targetDate : Int;
    milestoneTracking : Text;
    achievementStatus : Text;
    progress : Float;
  };

  public type UserPreferences = {
    darkMode : Bool;
    preferredLayout : Text;
    metricFilters : [Text];
    displayPreferences : Text;
    navigationPreferences : Text;
  };

  public type Contract = {
    id : Nat;
    contractName : Text;
    clientName : Text;
    clientEmail : Text;
    clientPhone : Text;
    clientCompany : Text;
    servicesCovered : [Text];
    areaTier : Text;
    agreedPrices : [(Text, Float)];
    contractStatus : Text;
    startDate : Int;
    endDate : ?Int;
    createdDate : Int;
    lastUpdated : Int;
    createdBy : Principal;
  };

  let storage = Storage.new();
  include MixinStorage(storage);

  transient let natMap = OrderedMap.Make<Nat>(Nat.compare);
  transient let textMap = OrderedMap.Make<Text>(Text.compare);
  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);

  var jobs : OrderedMap.Map<Nat, Job> = natMap.empty<Job>();
  var expenses : OrderedMap.Map<Nat, Expense> = natMap.empty<Expense>();
  var quotes : OrderedMap.Map<Nat, Quote> = natMap.empty<Quote>();
  var invoices : OrderedMap.Map<Nat, Invoice> = natMap.empty<Invoice>();
  var userProfiles : OrderedMap.Map<Principal, UserProfile> = principalMap.empty<UserProfile>();
  var serviceRates : OrderedMap.Map<Text, OrderedMap.Map<Text, Float>> = textMap.empty<OrderedMap.Map<Text, Float>>();
  var monthlyGoals : OrderedMap.Map<Nat, MonthlyGoal> = natMap.empty<MonthlyGoal>();
  var investments : OrderedMap.Map<Nat, InvestmentRecord> = natMap.empty<InvestmentRecord>();
  var funds : OrderedMap.Map<Nat, Fund> = natMap.empty<Fund>();
  var fundTransactions : OrderedMap.Map<Nat, FundTransaction> = natMap.empty<FundTransaction>();
  var fundTransfers : OrderedMap.Map<Nat, FundTransfer> = natMap.empty<FundTransfer>();
  var maintenanceExpenses : OrderedMap.Map<Nat, MaintenanceExpense> = natMap.empty<MaintenanceExpense>();
  var maintenanceFundLedger : OrderedMap.Map<Nat, MaintenanceFundLedger> = natMap.empty<MaintenanceFundLedger>();
  var fundAlerts : OrderedMap.Map<Nat, FundAlert> = natMap.empty<FundAlert>();
  var investmentFundTransactions : OrderedMap.Map<Nat, InvestmentFundTransaction> = natMap.empty<InvestmentFundTransaction>();
  var goals : OrderedMap.Map<Nat, Goal> = natMap.empty<Goal>();
  var userPreferences : OrderedMap.Map<Principal, UserPreferences> = principalMap.empty<UserPreferences>();
  var contracts : OrderedMap.Map<Nat, Contract> = natMap.empty<Contract>();
  var nextId = 0;

  let accessControlState = AccessControl.initState();

  // Access Control Functions
  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can access profiles");
    };
    principalMap.get(userProfiles, caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own profile");
    };
    principalMap.get(userProfiles, user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  // User Preferences Management
  public shared ({ caller }) func saveUserPreferences(preferences : UserPreferences) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save preferences");
    };
    userPreferences := principalMap.put(userPreferences, caller, preferences);
  };

  public query ({ caller }) func getUserPreferences() : async ?UserPreferences {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can get preferences");
    };
    principalMap.get(userPreferences, caller);
  };

  // Helper function to get or create maintenance fund
  func getOrCreateMaintenanceFund() : Nat {
    for ((id, fund) in natMap.entries(funds)) {
      switch (fund.fundType) {
        case (#maintenance) { return id };
        case _ {};
      };
    };

    let id = nextId;
    let maintenanceFund : Fund = {
      id;
      fundType = #maintenance;
      name = "Maintenance Fund";
      balance = 0.0;
      createdDate = Time.now();
      lastUpdated = Time.now();
      isActive = true;
      spendingLimit = 100000.0;
      approvalThreshold = 5000.0;
    };
    funds := natMap.put(funds, id, maintenanceFund);
    nextId += 1;
    id;
  };

  // Helper function to get or create investment fund
  func getOrCreateInvestmentFund() : Nat {
    for ((id, fund) in natMap.entries(funds)) {
      switch (fund.fundType) {
        case (#investment) { return id };
        case _ {};
      };
    };

    let id = nextId;
    let investmentFund : Fund = {
      id;
      fundType = #investment;
      name = "Investment Fund";
      balance = 85000.0;
      createdDate = Time.now();
      lastUpdated = Time.now();
      isActive = true;
      spendingLimit = 1000000.0;
      approvalThreshold = 50000.0;
    };
    funds := natMap.put(funds, id, investmentFund);
    nextId += 1;
    id;
  };

  // Helper function to add 5% to maintenance fund from job revenue
  func addMaintenanceFundAllocation(jobId : Nat, revenue : Float) : () {
    let maintenanceFundId = getOrCreateMaintenanceFund();
    let maintenanceAmount = revenue * 0.05;

    switch (natMap.get(funds, maintenanceFundId)) {
      case (?fund) {
        let newBalance = fund.balance + maintenanceAmount;

        let updatedFund : Fund = {
          id = fund.id;
          fundType = fund.fundType;
          name = fund.name;
          balance = newBalance;
          createdDate = fund.createdDate;
          lastUpdated = Time.now();
          isActive = fund.isActive;
          spendingLimit = fund.spendingLimit;
          approvalThreshold = fund.approvalThreshold;
        };
        funds := natMap.put(funds, maintenanceFundId, updatedFund);

        let ledgerId = nextId;
        let ledgerEntry : MaintenanceFundLedger = {
          id = ledgerId;
          date = Time.now();
          amount = maintenanceAmount;
          transactionType = "inflow";
          purpose = "5% automatic collection from job revenue";
          remainingBalance = newBalance;
          relatedJobId = ?jobId;
          relatedExpenseId = null;
          fundId = maintenanceFundId;
          fundType = #maintenance;
        };
        maintenanceFundLedger := natMap.put(maintenanceFundLedger, ledgerId, ledgerEntry);
        nextId += 1;
      };
      case null {};
    };
  };

  // Reset Function - Admin only
  public shared ({ caller }) func resetMaintenanceFund() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can reset maintenance fund");
    };

    let maintenanceFundId = getOrCreateMaintenanceFund();

    switch (natMap.get(funds, maintenanceFundId)) {
      case (?fund) {
        // Reset fund balance to zero
        let updatedFund : Fund = {
          id = fund.id;
          fundType = fund.fundType;
          name = fund.name;
          balance = 0.0;
          createdDate = fund.createdDate;
          lastUpdated = Time.now();
          isActive = fund.isActive;
          spendingLimit = fund.spendingLimit;
          approvalThreshold = fund.approvalThreshold;
        };
        funds := natMap.put(funds, maintenanceFundId, updatedFund);

        // Reset maintenance expenses and fund ledger
        maintenanceExpenses := natMap.empty<MaintenanceExpense>();
        maintenanceFundLedger := natMap.empty<MaintenanceFundLedger>();

        // Remove maintenance fund transactions and alerts
        var newFundTransactions = natMap.empty<FundTransaction>();
        for ((id, tx) in natMap.entries(fundTransactions)) {
          if (tx.fundId != maintenanceFundId) {
            newFundTransactions := natMap.put(newFundTransactions, id, tx);
          };
        };
        fundTransactions := newFundTransactions;

        var newFundAlerts = natMap.empty<FundAlert>();
        for ((id, alert) in natMap.entries(fundAlerts)) {
          if (alert.fundId != maintenanceFundId) {
            newFundAlerts := natMap.put(newFundAlerts, id, alert);
          };
        };
        fundAlerts := newFundAlerts;
      };
      case null {
        Debug.trap("Maintenance fund not found");
      };
    };
  };

  // Safe Fund Reset with Cash-out - Admin only
  public shared ({ caller }) func safeResetMaintenanceFundWithCashout() : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can safely reset maintenance fund");
    };

    let maintenanceFundId = getOrCreateMaintenanceFund();

    switch (natMap.get(funds, maintenanceFundId)) {
      case (?fund) {
        let currentBalance = fund.balance;

        // Create cash-out transaction
        let cashoutTransaction : FundTransaction = {
          id = nextId;
          fundId = maintenanceFundId;
          amount = currentBalance;
          transactionType = "outflow";
          date = Time.now();
          description = "Final cash-out during safe reset";
          category = "cashout";
          remainingBalance = 0.0;
          relatedExpenseId = null;
          relatedJobId = null;
          fundType = #maintenance;
        };
        fundTransactions := natMap.put(fundTransactions, nextId, cashoutTransaction);
        nextId += 1;

        let updatedFund : Fund = {
          id = fund.id;
          fundType = fund.fundType;
          name = fund.name;
          balance = 0.0;
          createdDate = fund.createdDate;
          lastUpdated = Time.now();
          isActive = fund.isActive;
          spendingLimit = fund.spendingLimit;
          approvalThreshold = fund.approvalThreshold;
        };
        funds := natMap.put(funds, maintenanceFundId, updatedFund);

        // Reset maintenance expenses and fund ledger
        maintenanceExpenses := natMap.empty<MaintenanceExpense>();
        maintenanceFundLedger := natMap.empty<MaintenanceFundLedger>();

        var newFundAlerts = natMap.empty<FundAlert>();
        for ((id, alert) in natMap.entries(fundAlerts)) {
          if (alert.fundId != maintenanceFundId) {
            newFundAlerts := natMap.put(newFundAlerts, id, alert);
          };
        };
        fundAlerts := newFundAlerts;

        currentBalance;
      };
      case null {
        Debug.trap("Maintenance fund not found");
      };
    };
  };

  // Job CRUD Operations - Admin only for modifications, users can view
  public shared ({ caller }) func addJob(revenue : Float, date : Int, sector : Text, clientName : Text, customerInfo : CustomerInfo, cleanProfit : Float, costs : Float) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can add jobs");
    };
    let id = nextId;
    let job : Job = {
      id;
      revenue;
      date;
      sector;
      clientName;
      customerInfo;
      cleanProfit;
      costs;
    };
    jobs := natMap.put(jobs, id, job);
    nextId += 1;

    addMaintenanceFundAllocation(id, revenue);

    id;
  };

  public shared ({ caller }) func updateJob(id : Nat, revenue : Float, date : Int, sector : Text, clientName : Text, customerInfo : CustomerInfo, cleanProfit : Float, costs : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update jobs");
    };
    switch (natMap.get(jobs, id)) {
      case (?oldJob) {
        let updatedJob : Job = {
          id;
          revenue;
          date;
          sector;
          clientName;
          customerInfo;
          cleanProfit;
          costs;
        };
        jobs := natMap.put(jobs, id, updatedJob);

        if (oldJob.revenue != revenue) {
          let maintenanceFundId = getOrCreateMaintenanceFund();
          let oldMaintenanceAmount = oldJob.revenue * 0.05;
          let newMaintenanceAmount = revenue * 0.05;
          let adjustmentAmount = newMaintenanceAmount - oldMaintenanceAmount;

          switch (natMap.get(funds, maintenanceFundId)) {
            case (?fund) {
              let newBalance = fund.balance + adjustmentAmount;

              let updatedFund : Fund = {
                id = fund.id;
                fundType = fund.fundType;
                name = fund.name;
                balance = newBalance;
                createdDate = fund.createdDate;
                lastUpdated = Time.now();
                isActive = fund.isActive;
                spendingLimit = fund.spendingLimit;
                approvalThreshold = fund.approvalThreshold;
              };
              funds := natMap.put(funds, maintenanceFundId, updatedFund);

              let ledgerId = nextId;
              let transactionType = if (adjustmentAmount >= 0.0) { "inflow" } else { "outflow" };
              let ledgerEntry : MaintenanceFundLedger = {
                id = ledgerId;
                date = Time.now();
                amount = Float.abs(adjustmentAmount);
                transactionType;
                purpose = "Adjustment from job revenue update";
                remainingBalance = newBalance;
                relatedJobId = ?id;
                relatedExpenseId = null;
                fundId = maintenanceFundId;
                fundType = #maintenance;
              };
              maintenanceFundLedger := natMap.put(maintenanceFundLedger, ledgerId, ledgerEntry);
              nextId += 1;
            };
            case null {};
          };
        };
      };
      case null {
        Debug.trap("Job not found");
      };
    };
  };

  public shared ({ caller }) func deleteJob(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete jobs");
    };
    jobs := natMap.delete(jobs, id);
  };

  public query ({ caller }) func getAllJobs() : async [Job] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view jobs");
    };
    Iter.toArray(natMap.vals(jobs));
  };

  public query ({ caller }) func getJob(id : Nat) : async ?Job {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view jobs");
    };
    natMap.get(jobs, id);
  };

  // Expense CRUD Operations - Admin only for modifications, users can view
  public shared ({ caller }) func addExpense(amount : Float, category : Text, date : Int, additionalInfo : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can add expenses");
    };
    let id = nextId;
    let expense : Expense = {
      id;
      amount;
      category;
      date;
      additionalInfo;
    };
    expenses := natMap.put(expenses, id, expense);
    nextId += 1;
    id;
  };

  public shared ({ caller }) func updateExpense(id : Nat, amount : Float, category : Text, date : Int, additionalInfo : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update expenses");
    };
    switch (natMap.get(expenses, id)) {
      case (?_) {
        let updatedExpense : Expense = {
          id;
          amount;
          category;
          date;
          additionalInfo;
        };
        expenses := natMap.put(expenses, id, updatedExpense);
      };
      case null {
        Debug.trap("Expense not found");
      };
    };
  };

  public shared ({ caller }) func deleteExpense(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete expenses");
    };
    expenses := natMap.delete(expenses, id);
  };

  public query ({ caller }) func getAllExpenses() : async [Expense] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view expenses");
    };
    Iter.toArray(natMap.vals(expenses));
  };

  public query ({ caller }) func getExpense(id : Nat) : async ?Expense {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view expenses");
    };
    natMap.get(expenses, id);
  };

  // Quote CRUD Operations - Admin only for modifications, users can view
  public shared ({ caller }) func createQuote(sector : Text, services : [Service], basePrice : Float, addOns : [Text], volumeDiscount : Float, nightService : Bool, finalPrice : Float, town : Text, subSector : ?Text, customerInfo : CustomerInfo, chargeDescription : Text, vatAmount : Float, grandTotal : Float) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can create quotes");
    };
    let id = nextId;
    let quote : Quote = {
      id;
      sector;
      services;
      basePrice;
      addOns;
      volumeDiscount;
      nightService;
      finalPrice;
      date = Time.now();
      town;
      subSector;
      customerInfo;
      chargeDescription;
      vatAmount;
      grandTotal;
    };
    quotes := natMap.put(quotes, id, quote);
    nextId += 1;
    id;
  };

  public shared ({ caller }) func updateQuote(id : Nat, sector : Text, services : [Service], basePrice : Float, addOns : [Text], volumeDiscount : Float, nightService : Bool, finalPrice : Float, town : Text, subSector : ?Text, customerInfo : CustomerInfo, chargeDescription : Text, vatAmount : Float, grandTotal : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update quotes");
    };
    switch (natMap.get(quotes, id)) {
      case (?existingQuote) {
        let updatedQuote : Quote = {
          id;
          sector;
          services;
          basePrice;
          addOns;
          volumeDiscount;
          nightService;
          finalPrice;
          date = existingQuote.date;
          town;
          subSector;
          customerInfo;
          chargeDescription;
          vatAmount;
          grandTotal;
        };
        quotes := natMap.put(quotes, id, updatedQuote);
      };
      case null {
        Debug.trap("Quote not found");
      };
    };
  };

  public shared ({ caller }) func deleteQuote(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete quotes");
    };
    quotes := natMap.delete(quotes, id);
  };

  public query ({ caller }) func getAllQuotes() : async [Quote] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view quotes");
    };
    Iter.toArray(natMap.vals(quotes));
  };

  public query ({ caller }) func getQuote(id : Nat) : async ?Quote {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view quotes");
    };
    natMap.get(quotes, id);
  };

  // Internal Quote View for Admins - Admin only
  public query ({ caller }) func getInternalQuoteView(id : Nat) : async InternalQuoteView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view internal quote details");
    };

    switch (natMap.get(quotes, id)) {
      case (?quote) {
        let cogs = calculateCOGS(quote);
        let opEx = calculateOpEx(quote);
        let revenue = quote.finalPrice;
        let profitMargin = calculateProfitMargin(quote);

        let vanFuel = calculateVanFuel(quote);
        let generatorFuel = calculateGeneratorFuel(quote);
        let additionalPilot = calculateAdditionalPilot(quote);
        let chemicals = calculateChemicals(quote);

        let costBreakdown : CostBreakdown = {
          cogs;
          opEx;
          revenue;
          profitMargin;
          vanFuel;
          generatorFuel;
          additionalPilot;
          chemicals;
        };

        {
          quote;
          costBreakdown;
        };
      };
      case null {
        Debug.trap("Quote not found");
      };
    };
  };

  // Helper functions for cost calculations
  func calculateCOGS(quote : Quote) : Float {
    var total = 0.0;
    for (service in quote.services.vals()) {
      total += service.rate * service.quantity;
    };
    total;
  };

  func calculateOpEx(quote : Quote) : Float {
    0.0;
  };

  func calculateProfitMargin(quote : Quote) : Float {
    let cogs = calculateCOGS(quote);
    let opEx = calculateOpEx(quote);
    let revenue = quote.finalPrice;
    let totalCosts = cogs + opEx;
    if (revenue == 0.0) { return 0.0 };
    ((revenue - totalCosts) / revenue) * 100.0;
  };

  func calculateVanFuel(quote : Quote) : Float {
    0.0;
  };

  func calculateGeneratorFuel(quote : Quote) : Float {
    0.0;
  };

  func calculateAdditionalPilot(quote : Quote) : Float {
    0.0;
  };

  func calculateChemicals(quote : Quote) : Float {
    0.0;
  };

  // Invoice CRUD Operations - Admin only for modifications, users can view
  public shared ({ caller }) func createInvoice(customerName : Text, customerEmail : Text, quoteId : Nat, totalAmount : Float) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can create invoices");
    };
    let id = nextId;
    let invoice : Invoice = {
      id;
      customerName;
      customerEmail;
      quoteId;
      totalAmount;
      date = Time.now();
      status = "Pending";
    };
    invoices := natMap.put(invoices, id, invoice);
    nextId += 1;
    id;
  };

  public shared ({ caller }) func updateInvoice(id : Nat, customerName : Text, customerEmail : Text, quoteId : Nat, totalAmount : Float, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update invoices");
    };
    switch (natMap.get(invoices, id)) {
      case (?existingInvoice) {
        let updatedInvoice : Invoice = {
          id;
          customerName;
          customerEmail;
          quoteId;
          totalAmount;
          date = existingInvoice.date;
          status;
        };
        invoices := natMap.put(invoices, id, updatedInvoice);
      };
      case null {
        Debug.trap("Invoice not found");
      };
    };
  };

  public shared ({ caller }) func deleteInvoice(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete invoices");
    };
    invoices := natMap.delete(invoices, id);
  };

  public query ({ caller }) func getAllInvoices() : async [Invoice] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view invoices");
    };
    Iter.toArray(natMap.vals(invoices));
  };

  public query ({ caller }) func getInvoice(id : Nat) : async ?Invoice {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view invoices");
    };
    natMap.get(invoices, id);
  };

  public shared ({ caller }) func updateInvoiceStatus(invoiceId : Nat, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update invoice status");
    };
    switch (natMap.get(invoices, invoiceId)) {
      case (?invoice) {
        let updatedInvoice : Invoice = {
          id = invoice.id;
          customerName = invoice.customerName;
          customerEmail = invoice.customerEmail;
          quoteId = invoice.quoteId;
          totalAmount = invoice.totalAmount;
          date = invoice.date;
          status;
        };
        invoices := natMap.put(invoices, invoiceId, updatedInvoice);
      };
      case null {
        Debug.trap("Invoice not found");
      };
    };
  };

  // Contract CRUD Operations - Admin only for modifications, users can view
  public shared ({ caller }) func createContract(contractName : Text, clientName : Text, clientEmail : Text, clientPhone : Text, clientCompany : Text, servicesCovered : [Text], areaTier : Text, agreedPrices : [(Text, Float)], contractStatus : Text, startDate : Int, endDate : ?Int) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can create contracts");
    };
    let id = nextId;
    let contract : Contract = {
      id;
      contractName;
      clientName;
      clientEmail;
      clientPhone;
      clientCompany;
      servicesCovered;
      areaTier;
      agreedPrices;
      contractStatus;
      startDate;
      endDate;
      createdDate = Time.now();
      lastUpdated = Time.now();
      createdBy = caller;
    };
    contracts := natMap.put(contracts, id, contract);
    nextId += 1;
    id;
  };

  public shared ({ caller }) func updateContract(id : Nat, contractName : Text, clientName : Text, clientEmail : Text, clientPhone : Text, clientCompany : Text, servicesCovered : [Text], areaTier : Text, agreedPrices : [(Text, Float)], contractStatus : Text, startDate : Int, endDate : ?Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update contracts");
    };
    switch (natMap.get(contracts, id)) {
      case (?existingContract) {
        let updatedContract : Contract = {
          id;
          contractName;
          clientName;
          clientEmail;
          clientPhone;
          clientCompany;
          servicesCovered;
          areaTier;
          agreedPrices;
          contractStatus;
          startDate;
          endDate;
          createdDate = existingContract.createdDate;
          lastUpdated = Time.now();
          createdBy = existingContract.createdBy;
        };
        contracts := natMap.put(contracts, id, updatedContract);
      };
      case null {
        Debug.trap("Contract not found");
      };
    };
  };

  public shared ({ caller }) func deleteContract(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete contracts");
    };
    contracts := natMap.delete(contracts, id);
  };

  public query ({ caller }) func getAllContracts() : async [Contract] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view contracts");
    };
    Iter.toArray(natMap.vals(contracts));
  };

  public query ({ caller }) func getContract(id : Nat) : async ?Contract {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view contracts");
    };
    natMap.get(contracts, id);
  };

  public query ({ caller }) func getContractByClientName(clientName : Text) : async ?Contract {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view contracts");
    };
    for (contract in natMap.vals(contracts)) {
      if (contract.clientName == clientName) {
        return ?contract;
      };
    };
    null;
  };

  public query ({ caller }) func getActiveContracts() : async [Contract] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view contracts");
    };
    let activeContracts = Array.filter<Contract>(
      Iter.toArray(natMap.vals(contracts)),
      func(contract : Contract) : Bool {
        contract.contractStatus == "active"
      },
    );
    activeContracts;
  };

  // Service Rate Management - Admin only
  public shared ({ caller }) func setServiceRate(serviceType : Text, areaTier : Text, rate : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can set service rates");
    };

    let areaTierMap = switch (textMap.get(serviceRates, serviceType)) {
      case (?existingMap) { existingMap };
      case null { textMap.empty<Float>() };
    };

    let updatedAreaTierMap = textMap.put(areaTierMap, areaTier, rate);
    serviceRates := textMap.put(serviceRates, serviceType, updatedAreaTierMap);
  };

  public query ({ caller }) func getServiceRate(serviceType : Text, areaTier : Text) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view service rates");
    };

    switch (textMap.get(serviceRates, serviceType)) {
      case (?areaTierMap) {
        switch (textMap.get(areaTierMap, areaTier)) {
          case (?rate) { rate };
          case null { Debug.trap("Rate not found for area tier") };
        };
      };
      case null { Debug.trap("Service type not found") };
    };
  };

  public query ({ caller }) func getAllServiceRates() : async [(Text, [(Text, Float)])] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view all service rates");
    };

    let serviceRatesArray = Iter.toArray(textMap.entries(serviceRates));
    let result = Array.map<(Text, OrderedMap.Map<Text, Float>), (Text, [(Text, Float)])>(
      serviceRatesArray,
      func((serviceType, areaTierMap)) {
        (serviceType, Iter.toArray(textMap.entries(areaTierMap)));
      },
    );
    result;
  };

  // Financial Metrics and Analytics - Admin only for detailed metrics
  public query ({ caller }) func getFinancialMetrics() : async FinancialMetrics {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view financial metrics");
    };
    let investmentRemaining = calculateActiveInvestmentRemaining();
    let totalRevenueYTD = calculateTotalRevenue();
    let breakEvenProgress = Float.fromInt(natMap.size(jobs)) / 33.0;
    let netProfit = totalRevenueYTD - calculateTotalExpenses();

    {
      investmentRemaining;
      totalRevenueYTD;
      breakEvenProgress;
      netProfit;
    };
  };

  public query ({ caller }) func getFinancialMetricsDetailed() : async FinancialMetricsDetailed {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view detailed financial metrics");
    };

    let investmentRemaining = calculateActiveInvestmentRemaining();
    let totalRevenueYTD = calculateTotalRevenue();
    let breakEvenProgress = Float.fromInt(natMap.size(jobs)) / 33.0;
    let netProfit = totalRevenueYTD - calculateTotalExpenses();

    var revenueBreakdown = List.nil<JobRevenueEntry>();
    for (job in natMap.vals(jobs)) {
      let entry : JobRevenueEntry = {
        jobId = job.id;
        clientName = job.clientName;
        revenue = job.revenue;
        date = job.date;
        sector = job.sector;
      };
      revenueBreakdown := List.push(entry, revenueBreakdown);
    };

    var expenseBreakdown = List.nil<ExpenseEntry>();
    for (expense in natMap.vals(expenses)) {
      let entry : ExpenseEntry = {
        expenseId = expense.id;
        amount = expense.amount;
        category = expense.category;
        date = expense.date;
        additionalInfo = expense.additionalInfo;
      };
      expenseBreakdown := List.push(entry, expenseBreakdown);
    };

    var fundBalances = List.nil<FundBalance>();
    for (fund in natMap.vals(funds)) {
      let recentTransactions = Array.filter<FundTransaction>(
        Iter.toArray(natMap.vals(fundTransactions)),
        func(t : FundTransaction) : Bool { t.fundId == fund.id }
      );
      let limitedTransactions = if (recentTransactions.size() > 5) {
        Array.tabulate<FundTransaction>(5, func(i) { recentTransactions[i] })
      } else {
        recentTransactions
      };

      let balance : FundBalance = {
        fundId = fund.id;
        fundType = fund.fundType;
        name = fund.name;
        balance = fund.balance;
        recentTransactions = limitedTransactions;
      };
      fundBalances := List.push(balance, fundBalances);
    };

    var maintenanceFundId : ?Nat = null;
    var maintenanceBalance = 0.0;
    var totalCollected = 0.0;
    var totalSpent = 0.0;

    for ((id, fund) in natMap.entries(funds)) {
      switch (fund.fundType) {
        case (#maintenance) {
          maintenanceFundId := ?id;
          maintenanceBalance := fund.balance;
        };
        case _ {};
      };
    };

    for (entry in natMap.vals(maintenanceFundLedger)) {
      if (entry.transactionType == "inflow") {
        totalCollected += entry.amount;
      } else {
        totalSpent += entry.amount;
      };
    };

    let recentMaintenanceEntries = Array.filter<MaintenanceFundLedger>(
      Iter.toArray(natMap.vals(maintenanceFundLedger)),
      func(e : MaintenanceFundLedger) : Bool { true }
    );
    let limitedMaintenanceEntries = if (recentMaintenanceEntries.size() > 10) {
      Array.tabulate<MaintenanceFundLedger>(10, func(i) { recentMaintenanceEntries[i] })
    } else {
      recentMaintenanceEntries
    };

    let maintenanceFundStatus : MaintenanceFundStatus = {
      fundId = maintenanceFundId;
      balance = maintenanceBalance;
      totalCollected;
      totalSpent;
      recentEntries = limitedMaintenanceEntries;
    };

    {
      investmentRemaining;
      totalRevenueYTD;
      breakEvenProgress;
      netProfit;
      revenueBreakdown = List.toArray(revenueBreakdown);
      expenseBreakdown = List.toArray(expenseBreakdown);
      fundBalances = List.toArray(fundBalances);
      maintenanceFundStatus;
    };
  };

  func calculateTotalRevenue() : Float {
    var total = 0.0;
    for (job in natMap.vals(jobs)) {
      total += job.revenue;
    };
    total;
  };

  func calculateTotalExpenses() : Float {
    var total = 0.0;
    for (expense in natMap.vals(expenses)) {
      total += expense.amount;
    };
    total;
  };

  func calculateActiveInvestmentRemaining() : Float {
    var totalRemaining = 0.0;
    for (investment in natMap.vals(investments)) {
      if (not investment.isArchived) {
        totalRemaining += investment.remainingBalance;
      };
    };
    totalRemaining;
  };

  public query ({ caller }) func getMonthlyRevenue() : async [(Text, Float)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view monthly revenue");
    };
    let currentYear = 2024;
    let months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    var monthlyRevenue : OrderedMap.Map<Text, Float> = textMap.empty<Float>();

    for (month in months.vals()) {
      monthlyRevenue := textMap.put(monthlyRevenue, month, 0.0);
    };

    for (job in natMap.vals(jobs)) {
      let jobYear = currentYear;
      if (jobYear == currentYear) {
        let monthIndex = 0;
        let month = months[monthIndex];
        switch (textMap.get(monthlyRevenue, month)) {
          case (?current) {
            monthlyRevenue := textMap.put(monthlyRevenue, month, current + job.revenue);
          };
          case null {};
        };
      };
    };

    Iter.toArray(textMap.entries(monthlyRevenue));
  };

  public query ({ caller }) func getMonthlyExpenses() : async [(Text, Float)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view monthly expenses");
    };
    let currentYear = 2024;
    let months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    var monthlyExpenses : OrderedMap.Map<Text, Float> = textMap.empty<Float>();

    for (month in months.vals()) {
      monthlyExpenses := textMap.put(monthlyExpenses, month, 0.0);
    };

    for (expense in natMap.vals(expenses)) {
      let expenseYear = currentYear;
      if (expenseYear == currentYear) {
        let monthIndex = 0;
        let month = months[monthIndex];
        switch (textMap.get(monthlyExpenses, month)) {
          case (?current) {
            monthlyExpenses := textMap.put(monthlyExpenses, month, current + expense.amount);
          };
          case null {};
        };
      };
    };

    Iter.toArray(textMap.entries(monthlyExpenses));
  };

  public query ({ caller }) func getProfitProjection() : async [(Nat, Float)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view profit projection");
    };
    let currentYear = 2024;
    let currentProfit = calculateTotalRevenue() - calculateTotalExpenses();
    let projection : [(Nat, Float)] = [
      (currentYear, currentProfit),
      (currentYear + 1, currentProfit * 1.5),
      (currentYear + 2, currentProfit * 2.0),
    ];
    projection;
  };

  // Data Backup Functionality - Admin only
  public shared ({ caller }) func backupData() : async BackupData {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can perform backup");
    };

    let serviceRatesArray = Iter.toArray(textMap.entries(serviceRates));
    let serviceRatesWithArrays = Array.map<(Text, OrderedMap.Map<Text, Float>), (Text, [(Text, Float)])>(
      serviceRatesArray,
      func((serviceType, areaTierMap)) {
        (serviceType, Iter.toArray(textMap.entries(areaTierMap)));
      },
    );

    let backup : BackupData = {
      jobs = Iter.toArray(natMap.vals(jobs));
      expenses = Iter.toArray(natMap.vals(expenses));
      quotes = Iter.toArray(natMap.vals(quotes));
      invoices = Iter.toArray(natMap.vals(invoices));
      userProfiles = Iter.toArray(principalMap.entries(userProfiles));
      serviceRates = serviceRatesWithArrays;
      contracts = Iter.toArray(natMap.vals(contracts));
      timestamp = Time.now();
    };

    backup;
  };

  // Standardized Services - All users can view
  public query ({ caller }) func getStandardizedServices() : async [ServiceType] {
    [
      #facadeWallCleaning,
      #fullBuildingCleaning,
      #roofCleaning,
      #solarPanelCleaning,
      #windowCleaning,
    ];
  };

  // Monthly Reporting and Goals - Admin only for modifications, users can view
  public query ({ caller }) func getMonthlyReport(month : Text, year : Nat) : async MonthlyReport {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view monthly reports");
    };

    var totalRevenue = 0.0;
    var totalExpenses = 0.0;
    var netProfit = 0.0;
    var jobsCompleted = 0;
    var pendingInvoices = 0;
    var paidInvoices = 0;
    var vatCollected = 0.0;
    var goalsAchieved = 0;
    var goalsMissed = 0;

    for (job in natMap.vals(jobs)) {
      let jobYear = year;
      let jobMonth = month;
      if (jobYear == year and jobMonth == month) {
        totalRevenue += job.revenue;
        jobsCompleted += 1;
      };
    };

    for (expense in natMap.vals(expenses)) {
      let expenseYear = year;
      let expenseMonth = month;
      if (expenseYear == year and expenseMonth == month) {
        totalExpenses += expense.amount;
      };
    };

    for (invoice in natMap.vals(invoices)) {
      let invoiceYear = year;
      let invoiceMonth = month;
      if (invoiceYear == year and invoiceMonth == month) {
        switch (invoice.status) {
          case ("Paid") { paidInvoices += 1 };
          case ("Pending") { pendingInvoices += 1 };
          case _ {};
        };
      };
    };

    for (quote in natMap.vals(quotes)) {
      let quoteYear = year;
      let quoteMonth = month;
      if (quoteYear == year and quoteMonth == month) {
        vatCollected += quote.vatAmount;
      };
    };

    for (goal in natMap.vals(monthlyGoals)) {
      if (goal.year == year and goal.month == month) {
        if (goal.achieved) {
          goalsAchieved += 1;
        } else {
          goalsMissed += 1;
        };
      };
    };

    netProfit := totalRevenue - totalExpenses;

    {
      month;
      year;
      totalRevenue;
      totalExpenses;
      netProfit;
      jobsCompleted;
      pendingInvoices;
      paidInvoices;
      vatCollected;
      goalsAchieved;
      goalsMissed;
    };
  };

  public shared ({ caller }) func addMonthlyGoal(month : Text, year : Nat, description : Text, targetValue : Float) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can add monthly goals");
    };
    let id = nextId;
    let goal : MonthlyGoal = {
      id;
      month;
      year;
      description;
      targetValue;
      achieved = false;
      actualValue = 0.0;
    };
    monthlyGoals := natMap.put(monthlyGoals, id, goal);
    nextId += 1;
    id;
  };

  public shared ({ caller }) func updateMonthlyGoal(id : Nat, achieved : Bool, actualValue : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update monthly goals");
    };
    switch (natMap.get(monthlyGoals, id)) {
      case (?goal) {
        let updatedGoal : MonthlyGoal = {
          id = goal.id;
          month = goal.month;
          year = goal.year;
          description = goal.description;
          targetValue = goal.targetValue;
          achieved;
          actualValue;
        };
        monthlyGoals := natMap.put(monthlyGoals, id, updatedGoal);
      };
      case null {
        Debug.trap("Monthly goal not found");
      };
    };
  };

  public query ({ caller }) func getAllMonthlyGoals() : async [MonthlyGoal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view monthly goals");
    };
    Iter.toArray(natMap.vals(monthlyGoals));
  };

  public query ({ caller }) func getMonthlyGoalsByMonthYear(month : Text, year : Nat) : async [MonthlyGoal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view monthly goals");
    };
    let filteredGoals = Array.filter<MonthlyGoal>(
      Iter.toArray(natMap.vals(monthlyGoals)),
      func(goal : MonthlyGoal) : Bool {
        goal.month == month and goal.year == year
      },
    );
    filteredGoals;
  };
};

