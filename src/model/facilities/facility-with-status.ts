export type FacilityWithStatus = {
  id: number;
  facilityTypeId: number;
  identifier: string;
  facilityTypeName: string;
  facilityTypeDescription: string;
  suggestedPrice: number;
  isRented: boolean;
  expiresAt?: string;
  rentedByMemberId?: number;
  rentedByMemberFirstName?: string;
  rentedByMemberLastName?: string;
};
