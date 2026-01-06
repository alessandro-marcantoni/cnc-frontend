import type { Payment } from "$model/payments/payment";

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
  rentedAt: Date;
  expiresAt: Date;
  payment: Payment | null;
  boatInfo: BoatInfo | null;
};
