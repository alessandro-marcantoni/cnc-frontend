import type { RentedFacility } from "$model/facilities/rented-facility";
import type { FacilityType } from "$model/facilities/facility-type";
import type { FacilityWithStatus } from "$model/facilities/facility-with-status";

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

/**
 * Fetch facility catalog (all available facility types) from the API
 */
export async function fetchFacilitiesCatalog(): Promise<FacilityType[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1.0/facilities/catalog`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch facilities catalog: ${response.statusText}`,
    );
  }

  const data = await response.json();

  // Transform API response to FacilityType type
  const facilityTypes: FacilityType[] = data.map((facility: any) => ({
    id: facility.id,
    name: facility.name,
    description: facility.description,
    suggestedPrice: facility.suggestedPrice,
  }));

  return facilityTypes;
}

/**
 * Fetch facilities by facility type ID from the API
 */
export async function fetchFacilitiesByType(
  facilityTypeId: number,
): Promise<FacilityWithStatus[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1.0/facilities?facility_type_id=${facilityTypeId}`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch facilities by type: ${response.statusText}`,
    );
  }

  const data = await response.json();

  // Transform API response to FacilityWithStatus type
  const facilities: FacilityWithStatus[] = data.map((facility: any) => ({
    id: facility.id,
    facilityTypeId: facility.facilityTypeId,
    identifier: facility.identifier,
    facilityTypeName: facility.facilityTypeName,
    facilityTypeDescription: facility.facilityTypeDescription,
    suggestedPrice: facility.suggestedPrice,
    isRented: facility.isRented,
    expiresAt: facility.expiresAt,
  }));

  return facilities;
}

/**
 * Fetch rented facilities for a specific member from the API
 */
export async function fetchRentedFacilities(
  memberId: number,
): Promise<RentedFacility[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1.0/facilities/rented?member_id=${memberId}`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch rented facilities: ${response.statusText}`,
    );
  }

  const data = await response.json();

  // Transform API response to RentedFacility type
  const rentedFacilities: RentedFacility[] = data.map((facility: any) => ({
    id: facility.id,
    facilityId: facility.facilityId,
    facilityIdentifier: facility.facilityIdentifier,
    facilityName: facility.facilityName,
    facilityTypeDescription: facility.facilityTypeDescription,
    rentedAt: new Date(facility.rentedAt),
    expiresAt: new Date(facility.expiresAt),
    payment: facility.payment
      ? {
          amount: facility.payment.amount,
          currency: facility.payment.currency,
          paidAt: facility.payment.paidAt,
          paymentMethod: facility.payment.paymentMethod,
          transactionRef: facility.payment.transactionRef,
        }
      : null,
    boatInfo: facility.boatInfo
      ? {
          name: facility.boatInfo.name,
          lengthMeters: facility.boatInfo.lengthMeters,
          widthMeters: facility.boatInfo.widthMeters,
        }
      : null,
  }));

  return rentedFacilities;
}
