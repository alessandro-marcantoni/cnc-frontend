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
  insurances?: Insurance[];
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
};
