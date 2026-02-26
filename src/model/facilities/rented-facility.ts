import type { Payment } from "$model/payments/payment";
import type { DateValue } from "@internationalized/date";

export type Insurance = {
  provider: string;
  number: string;
  expiresAt: string;
};

export type BoatInfo = {
  name: string;
  lengthMeters: number;
  widthMeters: number;
  engineInfo?: string;
  insurances?: Insurance[];
};

export type LeerboardInfo = {
  color?: string;
  type?: string;
  lengthMeters: number;
};

export type RentedFacility = {
  id: number;
  facilityId: number;
  facilityIdentifier: string;
  facilityName: string;
  facilityTypeDescription: string;
  rentedAt: DateValue;
  expiresAt: DateValue;
  price: number;
  payment: Payment | null;
  boatInfo: BoatInfo | null;
  leerboardInfo: LeerboardInfo | null;
};
