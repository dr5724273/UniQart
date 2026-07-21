export type Role = "buyer" | "lister" | "admin";

export type User = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: "active" | "suspended";
};

export type VehicleListing = {
  _id: string;
  ownerId: string;
  vehicleType: "car" | "bike";
  brand: string;
  model: string;
  year: number;
  city: string;
  pricePerDay: number;
  securityDeposit: number;
  images: string[];
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  termsAndConditions?: string;
};

export type FinanceOffer = {
  _id: string;
  lenderId: { _id: string; name: string } | string;
  totalAmount: number;
  minLoan: number;
  maxLoan: number;
  interestRate: number;
  durationMonths: number[];
  collateralRequired: "vehicle" | "property" | "gold" | "other";
  terms: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
};

export type Booking = {
  _id: string;
  vehicleId: any;
  buyerId: any;
  listerId: any;
  pickupDate: string;
  returnDate: string;
  address: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
};

export type LoanRequest = {
  _id: string;
  financeOfferId: any;
  buyerId: any;
  lenderId: any;
  requestedAmount: number;
  durationMonths: number;
  employmentStatus: string;
  monthlyIncome: number;
  collateralType: "vehicle" | "property" | "gold" | "other";
  collateralDescription: string;
  documents: string[];
  status: "pending" | "approved" | "rejected";
  internalNotes?: string;
};
