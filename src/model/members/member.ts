import type { Payment } from "$model/payments/payment";
import type { DateValue } from "@internationalized/date";

export type Member = {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: DateValue;
  membershipNumber: number;
  membershipStatus: MembershipStatus;
  membershipPaid: boolean;
  hasUnpaidFacilities: boolean;
};

export type Address = {
  country: string;
  city: string;
  zipCode: string;
  street: string;
  number: string;
};

export type PhoneNumber = {
  number: string;
};

export type Membership = {
  id: number;
  number: number;
  status: MembershipStatus;
  validFrom: DateValue;
  expiresAt: DateValue;
  periodId: number;
  price: number;
  payment: Payment | null;
};

export type MembershipStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "SUSPENDED"
  | "EXCLUDED"
  | "NONE";
