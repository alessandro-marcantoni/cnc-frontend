import type { Payment } from "$model/payments/payment";
import type { DateValue } from "@internationalized/date";

export type Member = {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: DateValue;
  email: string;
  addresses: Address[];
  phoneNumbers: PhoneNumber[];
  membership: Membership;
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
  payment: Payment | null;
};

export type MembershipStatus =
  | "ACTIVE"
  | "UNPAID"
  | "EXCLUSION_DELIBERATED"
  | "EXCLUDED";
