import type { Payment } from "$model/payments/payment";

export type RentedFacility = {
  id: number;
  facilityIdentifier: string;
  facilityName: string;
  rentedAt: Date;
  expiresAt: Date;
  payment: Payment | null;
};
