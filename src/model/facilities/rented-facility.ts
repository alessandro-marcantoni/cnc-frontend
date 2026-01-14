import type { Payment } from "$model/payments/payment";
import type { DateValue } from "@internationalized/date";

export type BoatInfo = {
  name: string;
  lengthMeters: number;
  widthMeters: number;
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
