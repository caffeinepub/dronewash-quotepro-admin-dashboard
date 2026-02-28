import OrderedMap "mo:base/OrderedMap";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Principal "mo:base/Principal";
import Float "mo:base/Float";
import Int "mo:base/Int";

module {
  type OldMainActor = {
    jobs : OrderedMap.Map<Nat, { id : Nat; revenue : Float; date : Int; sector : Text; clientName : Text; customerInfo : { name : Text; coordinates : Text; town : Text; jobType : Text; additionalInfo : Text }; cleanProfit : Float; costs : Float }>;
    expenses : OrderedMap.Map<Nat, { id : Nat; amount : Float; category : Text; date : Int; additionalInfo : Text }>;
    quotes : OrderedMap.Map<Nat, { id : Nat; sector : Text; services : [{ serviceType : Text; rate : Float; quantity : Float }]; basePrice : Float; addOns : [Text]; volumeDiscount : Float; nightService : Bool; finalPrice : Float; date : Int; town : Text; subSector : ?Text; customerInfo : { name : Text; coordinates : Text; town : Text; jobType : Text; additionalInfo : Text }; chargeDescription : Text; vatAmount : Float; grandTotal : Float }>;
    invoices : OrderedMap.Map<Nat, { id : Nat; customerName : Text; customerEmail : Text; quoteId : Nat; totalAmount : Float; date : Int; status : Text }>;
    userProfiles : OrderedMap.Map<Principal, { name : Text; email : Text; role : { #admin; #user; #guest } }>;
    serviceRates : OrderedMap.Map<Text, OrderedMap.Map<Text, Float>>;
    monthlyGoals : OrderedMap.Map<Nat, { id : Nat; month : Text; year : Nat; description : Text; targetValue : Float; achieved : Bool; actualValue : Float }>;
    investments : OrderedMap.Map<Nat, { id : Nat; startAmount : Float; remainingBalance : Float; startDate : Int; completionDate : ?Int; isArchived : Bool; totalExpenses : Float; finalStatus : Text }>;
    funds : OrderedMap.Map<Nat, { id : Nat; fundType : { #main; #maintenance; #salaries; #investment }; name : Text; balance : Float; createdDate : Int; lastUpdated : Int; isActive : Bool; spendingLimit : Float; approvalThreshold : Float }>;
    fundTransactions : OrderedMap.Map<Nat, { id : Nat; fundId : Nat; amount : Float; transactionType : Text; date : Int; description : Text; category : Text; remainingBalance : Float; relatedExpenseId : ?Nat; relatedJobId : ?Nat; fundType : { #main; #maintenance; #salaries; #investment } }>;
    fundTransfers : OrderedMap.Map<Nat, { id : Nat; sourceFundId : Nat; destinationFundId : Nat; amount : Float; date : Int; reason : Text; status : Text; requestedBy : Principal; approvedBy : ?Principal; approvalDate : ?Int }>;
    maintenanceExpenses : OrderedMap.Map<Nat, { id : Nat; amount : Float; date : Int; purpose : Text; equipmentType : Text; partCategory : Text; receiptUrl : ?Text; fundId : Nat; fundType : { #main; #maintenance; #salaries; #investment }; approved : Bool; approvalDate : ?Int; createdBy : Principal }>;
    maintenanceFundLedger : OrderedMap.Map<Nat, { id : Nat; date : Int; amount : Float; transactionType : Text; purpose : Text; remainingBalance : Float; relatedJobId : ?Nat; relatedExpenseId : ?Nat; fundId : Nat; fundType : { #main; #maintenance; #salaries; #investment } }>;
    fundAlerts : OrderedMap.Map<Nat, { id : Nat; fundId : Nat; fundType : { #main; #maintenance; #salaries; #investment }; alertType : Text; threshold : Float; currentValue : Float; message : Text; createdDate : Int; isActive : Bool }>;
    investmentFundTransactions : OrderedMap.Map<Nat, { id : Nat; amount : Float; transactionType : Text; date : Int; description : Text; allocationType : Text; remainingBalance : Float; relatedExpenseId : ?Nat; relatedJobId : ?Nat }>;
    goals : OrderedMap.Map<Nat, { id : Nat; description : Text; targetMetrics : Text; targetDate : Int; milestoneTracking : Text; achievementStatus : Text; progress : Float }>;
    userPreferences : OrderedMap.Map<Principal, { darkMode : Bool; preferredLayout : Text; metricFilters : [Text]; displayPreferences : Text; navigationPreferences : Text }>;
    contracts : OrderedMap.Map<Nat, { id : Nat; contractName : Text; clientName : Text; clientEmail : Text; clientPhone : Text; clientCompany : Text; servicesCovered : [Text]; areaTier : Text; agreedPrices : [(Text, Float)]; contractStatus : Text; startDate : Int; endDate : ?Int; createdDate : Int; lastUpdated : Int; createdBy : Principal }>;
    nextId : Nat;
  };

  type NewMainActor = {
    jobs : OrderedMap.Map<Nat, { id : Nat; revenue : Float; date : Int; sector : Text; clientName : Text; customerInfo : { name : Text; coordinates : Text; town : Text; jobType : Text; additionalInfo : Text }; cleanProfit : Float; costs : Float }>;
    expenses : OrderedMap.Map<Nat, { id : Nat; amount : Float; category : Text; date : Int; additionalInfo : Text }>;
    quotes : OrderedMap.Map<Nat, { id : Nat; sector : Text; services : [{ serviceType : Text; rate : Float; quantity : Float }]; basePrice : Float; addOns : [Text]; volumeDiscount : Float; nightService : Bool; finalPrice : Float; date : Int; town : Text; subSector : ?Text; customerInfo : { name : Text; coordinates : Text; town : Text; jobType : Text; additionalInfo : Text }; chargeDescription : Text; vatAmount : Float; grandTotal : Float }>;
    invoices : OrderedMap.Map<Nat, { id : Nat; customerName : Text; customerEmail : Text; quoteId : Nat; totalAmount : Float; date : Int; status : Text }>;
    userProfiles : OrderedMap.Map<Principal, { name : Text; email : Text; role : { #admin; #user; #guest } }>;
    serviceRates : OrderedMap.Map<Text, OrderedMap.Map<Text, Float>>;
    monthlyGoals : OrderedMap.Map<Nat, { id : Nat; month : Text; year : Nat; description : Text; targetValue : Float; achieved : Bool; actualValue : Float }>;
    investments : OrderedMap.Map<Nat, { id : Nat; startAmount : Float; remainingBalance : Float; startDate : Int; completionDate : ?Int; isArchived : Bool; totalExpenses : Float; finalStatus : Text }>;
    funds : OrderedMap.Map<Nat, { id : Nat; fundType : { #main; #maintenance; #salaries; #investment }; name : Text; createdDate : Int; lastUpdated : Int; isActive : Bool; spendingLimit : Float; approvalThreshold : Float }>;
    fundTransactions : OrderedMap.Map<Nat, { id : Nat; fundId : Nat; amount : Float; transactionType : Text; date : Int; description : Text; category : Text; remainingBalance : Float; relatedExpenseId : ?Nat; relatedJobId : ?Nat; fundType : { #main; #maintenance; #salaries; #investment } }>;
    fundTransfers : OrderedMap.Map<Nat, { id : Nat; sourceFundId : Nat; destinationFundId : Nat; amount : Float; date : Int; reason : Text; status : Text; requestedBy : Principal; approvedBy : ?Principal; approvalDate : ?Int }>;
    maintenanceExpenses : OrderedMap.Map<Nat, { id : Nat; amount : Float; date : Int; purpose : Text; equipmentType : Text; partCategory : Text; receiptUrl : ?Text; fundId : Nat; fundType : { #main; #maintenance; #salaries; #investment }; approved : Bool; approvalDate : ?Int; createdBy : Principal }>;
    maintenanceFundLedger : OrderedMap.Map<Nat, { id : Nat; date : Int; amount : Float; transactionType : Text; purpose : Text; remainingBalance : Float; relatedJobId : ?Nat; relatedExpenseId : ?Nat; fundId : Nat; fundType : { #main; #maintenance; #salaries; #investment } }>;
    fundAlerts : OrderedMap.Map<Nat, { id : Nat; fundId : Nat; fundType : { #main; #maintenance; #salaries; #investment }; alertType : Text; threshold : Float; currentValue : Float; message : Text; createdDate : Int; isActive : Bool }>;
    investmentFundTransactions : OrderedMap.Map<Nat, { id : Nat; amount : Float; transactionType : Text; date : Int; description : Text; allocationType : Text; remainingBalance : Float; relatedExpenseId : ?Nat; relatedJobId : ?Nat }>;
    goals : OrderedMap.Map<Nat, { id : Nat; description : Text; targetMetrics : Text; targetDate : Int; milestoneTracking : Text; achievementStatus : Text; progress : Float }>;
    userPreferences : OrderedMap.Map<Principal, { darkMode : Bool; preferredLayout : Text; metricFilters : [Text]; displayPreferences : Text; navigationPreferences : Text }>;
    contracts : OrderedMap.Map<Nat, { id : Nat; contractName : Text; clientName : Text; clientEmail : Text; clientPhone : Text; clientCompany : Text; servicesCovered : [Text]; areaTier : Text; agreedPrices : [(Text, Float)]; contractStatus : Text; startDate : Int; endDate : ?Int; createdDate : Int; lastUpdated : Int; createdBy : Principal }>;
    nextId : Nat;
  };

  func migrateFunds(oldFunds : OrderedMap.Map<Nat, { id : Nat; fundType : { #main; #maintenance; #salaries; #investment }; name : Text; balance : Float; createdDate : Int; lastUpdated : Int; isActive : Bool; spendingLimit : Float; approvalThreshold : Float }>) : OrderedMap.Map<Nat, { id : Nat; fundType : { #main; #maintenance; #salaries; #investment }; name : Text; createdDate : Int; lastUpdated : Int; isActive : Bool; spendingLimit : Float; approvalThreshold : Float }> {
    let fundMap = OrderedMap.Make<Nat>(Nat.compare);
    fundMap.map(
      oldFunds,
      func(_id, oldFund) {
        {
          id = oldFund.id;
          fundType = oldFund.fundType;
          name = oldFund.name;
          createdDate = oldFund.createdDate;
          lastUpdated = oldFund.lastUpdated;
          isActive = oldFund.isActive;
          spendingLimit = oldFund.spendingLimit;
          approvalThreshold = oldFund.approvalThreshold;
        };
      },
    );
  };

  public func run(old : OldMainActor) : NewMainActor {
    {
      jobs = old.jobs;
      expenses = old.expenses;
      quotes = old.quotes;
      invoices = old.invoices;
      userProfiles = old.userProfiles;
      serviceRates = old.serviceRates;
      monthlyGoals = old.monthlyGoals;
      investments = old.investments;
      funds = migrateFunds(old.funds);
      fundTransactions = old.fundTransactions;
      fundTransfers = old.fundTransfers;
      maintenanceExpenses = old.maintenanceExpenses;
      maintenanceFundLedger = old.maintenanceFundLedger;
      fundAlerts = old.fundAlerts;
      investmentFundTransactions = old.investmentFundTransactions;
      goals = old.goals;
      userPreferences = old.userPreferences;
      contracts = old.contracts;
      nextId = old.nextId;
    };
  };
};

