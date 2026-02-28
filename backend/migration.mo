import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";

module {
  type Job = {
    id : Nat;
    revenue : Float;
    date : Int;
    sector : Text;
    clientName : Text;
    customerInfo : {
      name : Text;
      coordinates : Text;
      town : Text;
      jobType : Text;
      additionalInfo : Text;
    };
    cleanProfit : Float;
    costs : Float;
  };

  type Expense = {
    id : Nat;
    amount : Float;
    category : Text;
    date : Int;
    additionalInfo : Text;
  };

  type Service = {
    serviceType : Text;
    rate : Float;
    quantity : Float;
  };

  type Quote = {
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
    customerInfo : {
      name : Text;
      coordinates : Text;
      town : Text;
      jobType : Text;
      additionalInfo : Text;
    };
    chargeDescription : Text;
    vatAmount : Float;
    grandTotal : Float;
  };

  type Invoice = {
    id : Nat;
    customerName : Text;
    customerEmail : Text;
    quoteId : Nat;
    totalAmount : Float;
    date : Int;
    status : Text;
  };

  type UserProfile = {
    name : Text;
    email : Text;
    role : {
      #admin;
      #user;
      #guest;
    };
  };

  type Contract = {
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

  // Old state type
  type OldActor = {
    jobs : OrderedMap.Map<Nat, Job>;
    expenses : OrderedMap.Map<Nat, Expense>;
    quotes : OrderedMap.Map<Nat, Quote>;
    invoices : OrderedMap.Map<Nat, Invoice>;
    userProfiles : OrderedMap.Map<Principal, UserProfile>;
    contracts : OrderedMap.Map<Nat, Contract>;
    nextId : Nat;
    serviceRates : OrderedMap.Map<Text, OrderedMap.Map<Text, Float>>;
  };

  // New state type
  type NewActor = {
    jobs : OrderedMap.Map<Nat, Job>;
    expenses : OrderedMap.Map<Nat, Expense>;
    quotes : OrderedMap.Map<Nat, Quote>;
    invoices : OrderedMap.Map<Nat, Invoice>;
    userProfiles : OrderedMap.Map<Principal, UserProfile>;
    contracts : OrderedMap.Map<Nat, Contract>;
    nextId : Nat;
    serviceRates : OrderedMap.Map<Text, OrderedMap.Map<Text, Float>>;
  };

  // Migration function
  public func run(old : OldActor) : NewActor {
    old;
  };
};
