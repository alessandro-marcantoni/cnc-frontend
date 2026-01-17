import type {
  BoatInfo,
  RentedFacility,
} from "$model/facilities/rented-facility";
import type { FacilityType } from "$model/facilities/facility-type";
import type { FacilityWithStatus } from "$model/facilities/facility-with-status";
import {
  getLocalTimeZone,
  parseAbsolute,
  parseDate,
} from "@internationalized/date";

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export interface RentFacilityRequest {
  memberId: number;
  facilityId: number;
  seasonId: number;
  price: number;
}

export interface SuggestedPriceResponse {
  suggestedPrice: number;
  basePrice: number;
  savingsAmount: number;
  hasSpecialPrice: boolean;
  applicableRules: number;
}

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
  seasonId: number,
): Promise<FacilityWithStatus[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1.0/facilities?facility_type_id=${facilityTypeId}&season=${seasonId}`,
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
    rentedByMemberId: facility.rentedByMemberId,
    rentedByMemberFirstName: facility.rentedByMemberFirstName,
    rentedByMemberLastName: facility.rentedByMemberLastName,
  }));

  return facilities;
}

/**
 * Fetch rented facilities for a specific member from the API
 */
export async function fetchRentedFacilities(
  memberId: number,
  season?: number,
): Promise<RentedFacility[]> {
  const url = new URL(`${API_BASE_URL}/api/v1.0/facilities/rented`);
  url.searchParams.set("member_id", memberId.toString());
  if (season) {
    url.searchParams.set("season", season.toString());
  }

  const response = await fetch(url.toString());

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
    rentedAt: parseDate(facility.rentedAt),
    expiresAt: parseDate(facility.expiresAt),
    price: facility.price,
    payment: facility.payment
      ? {
          id: facility.payment.id,
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

/**
 * Create a new facility rental via the API
 * @param request - The rental creation request data
 * @returns The created rented facility
 */
export async function rentFacility(
  request: RentFacilityRequest,
): Promise<RentedFacility> {
  const url = `${API_BASE_URL}/api/v1.0/facilities/rented`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    // Try to parse error message from response
    let errorMessage = `Failed to rent facility: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // If parsing fails, use the default message
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  const rentedFacility: RentedFacility = {
    id: data.id,
    facilityId: data.facilityId,
    facilityIdentifier: data.facilityIdentifier,
    facilityName: data.facilityName,
    facilityTypeDescription: data.facilityTypeDescription,
    rentedAt: parseDate(data.rentedAt),
    expiresAt: parseDate(data.expiresAt),
    price: data.price,
    payment: data.payment
      ? {
          id: data.payment.id,
          amount: data.payment.amount,
          currency: data.payment.currency,
          paidAt: parseAbsolute(data.payment.paidAt, getLocalTimeZone()),
          paymentMethod: data.payment.paymentMethod,
          transactionRef: data.payment.transactionRef,
        }
      : null,
    boatInfo: data.boatInfo
      ? {
          name: data.boatInfo.name,
          lengthMeters: data.boatInfo.lengthMeters,
          widthMeters: data.boatInfo.widthMeters,
        }
      : null,
  };

  return rentedFacility;
}

/**
 * Get suggested price for a facility type considering member's existing rentals and applicable discounts
 */
export async function getSuggestedPrice(
  facilityTypeId: number,
  memberId: number,
  seasonId: number,
): Promise<SuggestedPriceResponse> {
  const url = `${API_BASE_URL}/api/v1.0/facilities/suggested-price?facility_type_id=${facilityTypeId}&member_id=${memberId}&season=${seasonId}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to get suggested price: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
